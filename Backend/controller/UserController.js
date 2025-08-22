// controller/UserController.js
const User = require("../models/User");
const Warehouse = require("../models/warehouse/Warehouse");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Helper function to get warehouse ID from user data
const getWarehouseIdFromUser = (user) => {
  if (!user) return null;

  const role = user.role;
  if (role === "admin") return null; // Admin can manage multiple warehouses

  const roleData = user[role];
  if (roleData && roleData.warehouseId) {
    return roleData.warehouseId ? roleData.warehouseId.toString() : null;
  }
  return null;
};

// Helper function to update warehouse with user assignment
// Accepts an optional session for transactional updates
const updateWarehouseWithUser = async (
  userId,
  role,
  warehouseId,
  action = "add",
  session = null
) => {
  try {
    if (!warehouseId || !mongoose.Types.ObjectId.isValid(warehouseId)) {
      return;
    }

    // Prepare update operations
    let updateOps = {};

    switch (role) {
      case "manager":
        updateOps = action === "add" ? { $set: { managerId: userId } } : { $unset: { managerId: "" } };
        break;
      case "admin":
        updateOps = action === "add" ? { $set: { adminId: userId } } : { $unset: { adminId: "" } };
        break;
      case "accounter":
        updateOps = action === "add" ? { $set: { accounterId: userId } } : { $unset: { accounterId: "" } };
        break;
      case "staff":
        if (action === "add") updateOps = { $addToSet: { staffIds: userId } };
        else updateOps = { $pull: { staffIds: userId } };
        break;
      default:
        return;
    }

    // Use findByIdAndUpdate with session if provided
    await Warehouse.findByIdAndUpdate(
      warehouseId,
      updateOps,
      { session }
    ).exec();
  } catch (error) {
    // Only log non-sensitive details
    console.error("Error updating warehouse with user:", {
      userId,
      role,
      warehouseId,
      action,
      message: error.message,
    });
    throw error;
  }
};

exports.initSuperAdmin = async (req, res, next) => {
  try {
    const count = await User.countDocuments({ "admin.isSuperAdmin": true });
    if (count > 0)
      return res.status(409).json({ message: "Super-admin already exists." });

    const { username, password, fullName, email } = req.body;
    if (!username || !password || !fullName) {
      return res.status(400).json({ message: "username, password and fullName are required." });
    }

    const hashedPassword = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 10);
    const superAdmin = new User({
      role: "admin",
      admin: { username, password: hashedPassword, fullName, email, isSuperAdmin: true },
    });
    await superAdmin.save();

    const userObj = superAdmin.toObject();
    if (userObj.admin && userObj.admin.password) delete userObj.admin.password;

    res.status(201).json({ message: "Super-admin created.", user: userObj });
  } catch (err) {
    next(err);
  }
};

exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().lean();
    return res.json({ ok: true, users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};

exports.dashboard = async (req, res) => {
  return res.json({
    ok: true,
    data: { usersCount: await User.countDocuments() },
  });
};

exports.createUser = async (req, res, next) => {
  // Create user with transactional warehouse updates where appropriate
  try {
    // Masked logging (don't print passwords)
    console.log("Create user request role:", req.body.role, "username:", (req.body.admin?.username || req.body.manager?.username || req.body.staff?.username || req.body.accounter?.username || "n/a"));

    const { role, admin, manager, staff, accounter } = req.body;

    if (!role) {
      return res.status(400).json({ message: 'Field "role" is required.' });
    }

    let userData = { role };
    let username;
    let roleDataRaw;

    const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

    switch (role) {
      case "admin":
        if (!admin?.username || !admin?.password || !admin?.fullName) {
          return res.status(400).json({
            message: 'For role "admin", fields username, password và fullName are required.',
          });
        }
        if (admin.managedWarehouses && !Array.isArray(admin.managedWarehouses)) {
          return res.status(400).json({ message: "admin.managedWarehouses must be an array of warehouse IDs." });
        }
        userData.admin = { ...admin };
        userData.admin.password = await bcrypt.hash(admin.password, SALT_ROUNDS);
        username = admin.username;
        roleDataRaw = admin;
        break;

      case "manager":
        if (!manager?.username || !manager?.password || !manager?.fullName || !manager?.warehouseId) {
          return res.status(400).json({
            message: 'For role "manager", fields username, password, fullName và warehouseId are required.',
          });
        }
        userData.manager = { ...manager };
        userData.manager.password = await bcrypt.hash(manager.password, SALT_ROUNDS);
        username = manager.username;
        roleDataRaw = manager;
        break;

      case "staff":
        if (!staff?.username || !staff?.password || !staff?.fullName || !staff?.warehouseId) {
          return res.status(400).json({
            message: 'For role "staff", fields username, password, fullName và warehouseId are required.',
          });
        }
        userData.staff = { ...staff };
        userData.staff.password = await bcrypt.hash(staff.password, SALT_ROUNDS);
        username = staff.username;
        roleDataRaw = staff;
        break;

      case "accounter":
        if (!accounter?.username || !accounter?.password || !accounter?.fullName || !accounter?.warehouseId) {
          return res.status(400).json({
            message: 'For role "accounter", fields username, password, fullName và warehouseId are required.',
          });
        }
        userData.accounter = { ...accounter };
        userData.accounter.password = await bcrypt.hash(accounter.password, SALT_ROUNDS);
        username = accounter.username;
        roleDataRaw = accounter;
        break;

      default:
        return res.status(400).json({
          message: `"${role}" is not a valid role. Must be one of admin, manager, staff, accounter.`,
        });
    }

    // Pre-check username unique for same role
    const existQuery = { role };
    existQuery[`${role}.username`] = username;
    const exists = await User.findOne(existQuery).lean();
    if (exists) {
      return res.status(409).json({
        message: `Username "${username}" already exists for role "${role}".`,
        code: "USERNAME_EXISTS_IN_ROLE",
      });
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // create user inside session
      const createdArr = await User.create([userData], { session });
      const createdUser = createdArr[0];

      // Role-specific relational updates (users and warehouses) inside session
      if (role === "admin") {
        const whIds = Array.isArray(userData.admin.managedWarehouses)
          ? userData.admin.managedWarehouses.filter(Boolean)
          : [];

        if (whIds.length > 0) {
          // find existing managers/staff/accounters in those warehouses
          const mgrs = await User.find({
            role: "manager",
            "manager.warehouseId": { $in: whIds },
          })
            .select("_id")
            .session(session)
            .lean();

          const staffs = await User.find({
            role: "staff",
            "staff.warehouseId": { $in: whIds },
          })
            .select("_id")
            .session(session)
            .lean();

          const accounters = await User.find({
            role: "accounter",
            "accounter.warehouseId": { $in: whIds },
          })
            .select("_id")
            .session(session)
            .lean();

          const managerIds = mgrs.map((m) => m._id);
          const staffIds = staffs.map((s) => s._id);
          const accounterIds = accounters.map((a) => a._id);

          await User.updateOne(
            { _id: createdUser._id, role: "admin" },
            {
              $addToSet: {
                "admin.managedManagers": { $each: managerIds },
                "admin.managedStaff": { $each: staffIds },
                "admin.managedAccounters": { $each: accounterIds },
              },
            },
            { session }
          );
        }

        // Update warehouses to reference this admin (inside session)
        if (Array.isArray(userData.admin.managedWarehouses) && userData.admin.managedWarehouses.length > 0) {
          for (const warehouseId of userData.admin.managedWarehouses) {
            if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
              await session.abortTransaction();
              session.endSession();
              return res.status(400).json({ message: `Invalid warehouseId: ${warehouseId}` });
            }
            await updateWarehouseWithUser(createdUser._id, "admin", warehouseId, "add", session);
          }
        }
      }

      if (role === "manager") {
        // add to admins that manage this warehouse
        await User.updateMany(
          {
            role: "admin",
            "admin.managedWarehouses": userData.manager.warehouseId,
          },
          { $addToSet: { "admin.managedManagers": createdUser._id } },
          { session }
        );

        // update warehouse managerId
        await updateWarehouseWithUser(createdUser._id, "manager", userData.manager.warehouseId, "add", session);

        // add accounter to admin's managedAccounters if exists
        const accounter = await User.findOne({
          role: "accounter",
          "accounter.warehouseId": userData.manager.warehouseId,
        })
          .select("_id")
          .session(session)
          .lean();

        if (accounter) {
          await User.updateMany(
            { role: "admin", "admin.managedWarehouses": userData.manager.warehouseId },
            { $addToSet: { "admin.managedAccounters": accounter._id } },
            { session }
          );
        }
      }

      if (role === "staff") {
        // add to admins managing this warehouse
        await User.updateMany(
          {
            role: "admin",
            "admin.managedWarehouses": userData.staff.warehouseId,
          },
          { $addToSet: { "admin.managedStaff": createdUser._id } },
          { session }
        );

        // add to manager.staffIds if managerId present
        if (userData.staff.managerId) {
          await User.updateOne(
            { _id: userData.staff.managerId, role: "manager" },
            { $addToSet: { "manager.staffIds": createdUser._id } },
            { session }
          );
        }

        // update warehouse staffIds
        await updateWarehouseWithUser(createdUser._id, "staff", userData.staff.warehouseId, "add", session);

        // add accounter to admin managedAccounters if exists
        const accounter = await User.findOne({
          role: "accounter",
          "accounter.warehouseId": userData.staff.warehouseId,
        })
          .select("_id")
          .session(session)
          .lean();

        if (accounter) {
          await User.updateMany(
            { role: "admin", "admin.managedWarehouses": userData.staff.warehouseId },
            { $addToSet: { "admin.managedAccounters": accounter._id } },
            { session }
          );
        }
      }

      if (role === "accounter") {
        // update admins
        await User.updateMany(
          {
            role: "admin",
            "admin.managedWarehouses": userData.accounter.warehouseId,
          },
          { $addToSet: { "admin.managedAccounters": createdUser._id } },
          { session }
        );

        // update warehouse accounterId
        await updateWarehouseWithUser(createdUser._id, "accounter", userData.accounter.warehouseId, "add", session);
      }

      // commit transaction
      await session.commitTransaction();
      session.endSession();

      // Fetch created user and remove password
      const result = await User.findById(createdUser._id).lean();
      if (result[role]?.password) delete result[role].password;

      return res.status(201).json({ message: `${role[0].toUpperCase() + role.slice(1)} created successfully.`, user: result });
    } catch (innerErr) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      throw innerErr;
    }
  } catch (error) {
    console.error("Create user error:", error.message);
    // Robust duplicate key handling
    if (error.code === 11000) {
      const key = error.keyValue ? Object.keys(error.keyValue)[0] : null;
      return res.status(409).json({
        message: key ? `Duplicate value for ${key}` : "Duplicate key error",
        details: process.env.NODE_ENV === "development" ? error.keyValue : undefined,
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed.",
        errors: Object.keys(error.errors).map((k) => ({ field: k, message: error.errors[k].message })),
      });
    }
    next(error);
  }
};

// controller/Get all users with authorization and filters
exports.getAllUsers = async (req, res, next) => {
  try {
    const { status, role } = req.query;

    let requester = req.requester || req.user || null;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    if (
      requester &&
      (requester.sub || requester.id) &&
      !requester.admin &&
      !requester.manager &&
      !requester.staff &&
      !requester.accounter
    ) {
      const requesterId = requester.sub || requester.id;
      const fullUser = await User.findById(requesterId).lean();
      if (!fullUser) return res.status(401).json({ message: "Unauthorized" });

      requester = {
        ...requester,
        ...fullUser,
        role: requester.role || fullUser.role,
        isSuperAdmin:
          requester.isSuperAdmin !== undefined
            ? requester.isSuperAdmin
            : fullUser.admin?.isSuperAdmin,
      };
    }

    let query = User.find();

    const isSuperAdmin =
      !!(requester?.admin && requester.admin.isSuperAdmin) || requester?.isSuperAdmin;

    if (isSuperAdmin) {
      query = query.or([{ role: { $ne: "admin" } }, { "admin.isSuperAdmin": { $ne: true } }]);
    } else if ((requester.role === "admin" || requester.roleKey === "admin") && (requester.admin || requester.roleKey === "admin")) {
      const managed = Array.isArray(requester.admin?.managedWarehouses)
        ? requester.admin.managedWarehouses.map(String)
        : [];

      if (managed.length === 0) {
        return res.json({ users: [], count: 0, filters: { status: status || "all", role: role || "all" } });
      }

      query = query.or([
        { role: "manager", "manager.warehouseId": { $in: managed } },
        { role: "staff", "staff.warehouseId": { $in: managed } },
        { role: "accounter", "accounter.warehouseId": { $in: managed } },
      ]);
    } else if (requester.role === "manager" && requester.manager?.warehouseId) {
      // Manager can only see users in their warehouse
      const warehouseId = requester.manager.warehouseId;
      query = query.or([
        { role: "staff", "staff.warehouseId": warehouseId },
        { role: "accounter", "accounter.warehouseId": warehouseId },
      ]);
    } else {
      return res.status(403).json({ message: "Forbidden: insufficient permissions." });
    }

    if (status && ["active", "inactive"].includes(status)) {
      // optionally filter by status at subdoc level; leaving for future enhancement
    }

    if (role && ["admin", "manager", "staff", "accounter"].includes(role)) {
      if (isSuperAdmin) {
        query = query.where("role").equals(role);
      } else if ((requester.role === "admin" || requester.roleKey === "admin") && (requester.admin || requester.roleKey === "admin")) {
        if (role === "manager" || role === "staff" || role === "accounter") {
          query = query.where("role").equals(role);
        } else {
          return res.status(403).json({ message: "Forbidden: insufficient permissions to list this role." });
        }
      } else if (requester.role === "manager" && requester.manager?.warehouseId) {
        // Manager can only filter staff and accounter roles
        if (role === "staff" || role === "accounter") {
          query = query.where("role").equals(role);
        } else {
          return res.status(403).json({ message: "Forbidden: insufficient permissions to list this role." });
        }
      } else {
        return res.status(403).json({ message: "Forbidden: insufficient permissions." });
      }
    }

    const users = await query.lean();

    const sanitized = users.map((u) => {
      const userCopy = { ...u };
      if (userCopy.admin?.password) delete userCopy.admin.password;
      if (userCopy.manager?.password) delete userCopy.manager.password;
      if (userCopy.staff?.password) delete userCopy.staff.password;
      if (userCopy.accounter?.password) delete userCopy.accounter.password;

      const activeRole = userCopy[userCopy.role];
      userCopy.userStatus = {
        status: activeRole?.status || "inactive",
        isActive: activeRole?.isActive || false,
        canLogin: (activeRole?.status === "active" && activeRole?.isActive) || false,
      };
      return userCopy;
    });

    // Set no-cache headers to prevent 304 Not Modified
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      users: sanitized,
      count: sanitized.length,
      filters: { status: status || "all", role: role || "all" },
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error.message);
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid user ID format." });

    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.admin?.password) delete user.admin.password;
    if (user.manager?.password) delete user.manager.password;
    if (user.staff?.password) delete user.staff.password;
    if (user.accounter?.password) delete user.accounter.password;

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  // Update user and update warehouses in same transaction when possible
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid user ID format." });

    const currentUser = await User.findById(id);
    if (!currentUser) return res.status(404).json({ message: "User not found." });

    const role = currentUser.role;
    const oldWarehouseId = getWarehouseIdFromUser(currentUser);

    // Disallow password updates via this endpoint
    if (updates[role]?.password) {
      return res.status(400).json({ message: "Password cannot be updated through edit user. Please use forgot password feature." });
    }
    if (updates[role]) delete updates[role].password;

    // If username changes, ensure uniqueness within role
    if (updates[role]?.username) {
      const existQuery = { _id: { $ne: id }, role };
      existQuery[`${role}.username`] = updates[role].username;
      const exists = await User.findOne(existQuery);
      if (exists) {
        return res.status(409).json({ message: `Username "${updates[role].username}" already exists for role "${role}".` });
      }
    }

    // Build update $set object for nested subdoc updates
    const setObj = {};
    Object.keys(updates).forEach((k) => {
      if (k === role && updates[k]) {
        Object.keys(updates[k]).forEach((subKey) => {
          setObj[`${k}.${subKey}`] = updates[k][subKey];
        });
      } else {
        setObj[k] = updates[k];
      }
    });

    // Start session to update user and warehouse atomically where possible
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Update user with validators
      const updated = await User.findByIdAndUpdate(id, { $set: setObj }, { new: true, runValidators: true, session }).lean();

      // Determine new warehouse id
      const newWarehouseId = getWarehouseIdFromUser(updated);

      // If role === admin handle managedWarehouses diff
      if (role === "admin") {
        const oldManaged = currentUser.admin?.managedWarehouses || [];
        const newManaged = updated.admin?.managedWarehouses || [];

        // Remove admin from warehouses no longer managed
        for (const warehouseId of oldManaged) {
          if (!newManaged.some((n) => String(n) === String(warehouseId))) {
            await updateWarehouseWithUser(updated._id, "admin", warehouseId, "remove", session);
          }
        }

        // Add admin to newly managed warehouses
        for (const warehouseId of newManaged) {
          if (!oldManaged.some((o) => String(o) === String(warehouseId))) {
            await updateWarehouseWithUser(updated._id, "admin", warehouseId, "add", session);
          }
        }
      } else {
        // For other roles handle warehouse id change
        if (oldWarehouseId !== newWarehouseId) {
          if (oldWarehouseId) {
            await updateWarehouseWithUser(updated._id, role, oldWarehouseId, "remove", session);
          }
          if (newWarehouseId) {
            await updateWarehouseWithUser(updated._id, role, newWarehouseId, "add", session);
          }
        } else if (newWarehouseId) {
          // If same warehouse, ensure user reference is up to date (set)
          await updateWarehouseWithUser(updated._id, role, newWarehouseId, "add", session);
        }
      }

      await session.commitTransaction();
      session.endSession();

      // sanitize password if present
      if (updated.admin?.password) delete updated.admin.password;
      if (updated.manager?.password) delete updated.manager.password;
      if (updated.staff?.password) delete updated.staff.password;
      if (updated.accounter?.password) delete updated.accounter.password;

      res.json({
        message: "User updated successfully.",
        user: updated,
        warehouseChanged: oldWarehouseId !== getWarehouseIdFromUser(updated),
        oldWarehouseId,
        newWarehouseId: getWarehouseIdFromUser(updated),
        refreshWarehouse: true,
      });
    } catch (innerErr) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      throw innerErr;
    }
  } catch (error) {
    if (error.code === 11000) {
      const key = error.keyValue ? Object.keys(error.keyValue)[0] : null;
      return res.status(409).json({ message: key ? `Duplicate value for ${key}` : "Duplicate key error." });
    }
    next(error);
  }
};

// Admin reset password for another user (separate endpoint)
exports.adminResetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password is required and must be at least 6 characters." });
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const role = user.role;
    if (!user[role]) return res.status(400).json({ message: "User role data not found." });

    const hashedPassword = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_SALT_ROUNDS) || 10);

    await User.findByIdAndUpdate(id, {
      $set: {
        [`${role}.password`]: hashedPassword,
        [`${role}.lastPasswordChangeAt`]: new Date(),
        [`${role}.resetCount`]: (user[role].resetCount || 0) + 1,
        [`${role}.lastResetAt`]: new Date(),
      },
    });

    res.json({ message: "Password reset successfully by admin.", resetAt: new Date() });
  } catch (error) {
    console.error("Admin reset password error:", error.message);
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) return res.status(400).json({ message: "Invalid user ID format." });

    const user = await User.findByIdAndDelete(id).lean();
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({ message: "User deleted successfully.", deletedUser: { id: user._id, role: user.role, username: user[user.role]?.username } });
  } catch (error) {
    next(error);
  }
};

exports.getAdminWarehouses = async (req, res, next) => {
  try {
    const adminId = req.user.sub;
    const admin = await User.findById(adminId).lean();
    if (!admin || !admin.admin) return res.status(403).json({ message: "Access denied. Admin only." });

    if (admin.admin.isSuperAdmin) {
      const warehouses = await Warehouse.find({ status: "active" })
        .populate("managerId", "manager.fullName")
        .populate("accounterId", "accounter.fullName")
        .lean();
      return res.json({ warehouses, count: warehouses.length, isSuperAdmin: true });
    }

    const managedWarehouses = admin.admin.managedWarehouses || [];
    if (managedWarehouses.length === 0) return res.json({ warehouses: [], count: 0, isSuperAdmin: false });

    const warehouses = await Warehouse.find({ _id: { $in: managedWarehouses }, status: "active" })
      .populate("managerId", "manager.fullName")
      .populate("accounterId", "accounter.fullName")
      .lean();

    res.json({ warehouses, count: warehouses.length, isSuperAdmin: false });
  } catch (error) {
    console.error("Get admin warehouses error:", error.message);
    next(error);
  }
};

exports.getCurrentUserInfo = async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.admin?.password) delete user.admin.password;
    if (user.manager?.password) delete user.manager.password;
    if (user.staff?.password) delete user.staff.password;
    if (user.accounter?.password) delete user.accounter.password;

    res.json({
      user,
      debug: {
        role: user.role,
        hasAdmin: !!user.admin,
        hasManager: !!user.manager,
        hasStaff: !!user.staff,
        hasAccounter: !!user.accounter,
        isSuperAdmin: user.admin?.isSuperAdmin,
        managedWarehouses: user.admin?.managedWarehouses || [],
        managedManagers: user.admin?.managedManagers || [],
        managedStaff: user.admin?.managedStaff || [],
        managedAccounters: user.admin?.managedAccounters || [],
      },
    });
  } catch (error) {
    console.error("Get current user info error:", error.message);
    next(error);
  }
};

exports.assignWarehouseToAdmin = async (req, res, next) => {
  try {
    const { adminId, warehouseId } = req.body;
    if (!adminId || !warehouseId) return res.status(400).json({ message: "adminId and warehouseId are required." });

    if (!mongoose.Types.ObjectId.isValid(adminId) || !mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    // Authorization: only super-admin should call this endpoint — minimal check
    const caller = req.user;
    if (!caller || !(caller.admin?.isSuperAdmin || caller.isSuperAdmin)) {
      return res.status(403).json({ message: "Forbidden. Super-admin only." });
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin") return res.status(404).json({ message: "Admin not found." });

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found." });

    if (!admin.admin.managedWarehouses) admin.admin.managedWarehouses = [];
    if (!admin.admin.managedWarehouses.includes(warehouseId)) {
      admin.admin.managedWarehouses.push(warehouseId);
      await admin.save();
    }

    warehouse.adminId = adminId;
    await warehouse.save();

    res.json({
      message: "Warehouse assigned to admin successfully.",
      admin: { id: admin._id, managedWarehouses: admin.admin.managedWarehouses },
      warehouse: { id: warehouse._id, name: warehouse.name, adminId: warehouse.adminId },
    });
  } catch (error) {
    console.error("Assign warehouse to admin error:", error.message);
    next(error);
  }
};
