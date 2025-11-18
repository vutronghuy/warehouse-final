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
        updateOps =
          action === "add"
            ? { $set: { managerId: userId } }
            : { $unset: { managerId: "" } };
        break;
      case "admin":
        updateOps =
          action === "add"
            ? { $set: { adminId: userId } }
            : { $unset: { adminId: "" } };
        break;
      case "accounter":
        updateOps =
          action === "add"
            ? { $set: { accounterId: userId } }
            : { $unset: { accounterId: "" } };
        break;
      case "staff":
        if (action === "add") updateOps = { $addToSet: { staffIds: userId } };
        else updateOps = { $pull: { staffIds: userId } };
        break;
      default:
        return;
    }

    // Use findByIdAndUpdate with session if provided
    await Warehouse.findByIdAndUpdate(warehouseId, updateOps, {
      session,
    }).exec();
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
      return res
        .status(400)
        .json({ message: "username, password and fullName are required." });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      Number(process.env.BCRYPT_SALT_ROUNDS) || 10
    );
    const superAdmin = new User({
      role: "admin",
      admin: {
        username,
        password: hashedPassword,
        fullName,
        email,
        isSuperAdmin: true,
      },
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
    console.log(
      "Create user request role:",
      req.body.role,
      "username:",
      req.body.admin?.username ||
        req.body.manager?.username ||
        req.body.staff?.username ||
        req.body.accounter?.username ||
        "n/a"
    );

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
            message:
              'For role "admin", fields username, password và fullName are required.',
          });
        }
        if (
          admin.managedWarehouses &&
          !Array.isArray(admin.managedWarehouses)
        ) {
          return res.status(400).json({
            message:
              "admin.managedWarehouses must be an array of warehouse IDs.",
          });
        }
        userData.admin = { ...admin };
        userData.admin.password = await bcrypt.hash(
          admin.password,
          SALT_ROUNDS
        );
        username = admin.username;
        roleDataRaw = admin;
        break;

      case "manager":
        if (
          !manager?.username ||
          !manager?.password ||
          !manager?.fullName ||
          !manager?.warehouseId
        ) {
          return res.status(400).json({
            message:
              'For role "manager", fields username, password, fullName và warehouseId are required.',
          });
        }
        userData.manager = { ...manager };
        userData.manager.password = await bcrypt.hash(
          manager.password,
          SALT_ROUNDS
        );
        username = manager.username;
        roleDataRaw = manager;
        break;

      case "staff":
        if (
          !staff?.username ||
          !staff?.password ||
          !staff?.fullName ||
          !staff?.warehouseId
        ) {
          return res.status(400).json({
            message:
              'For role "staff", fields username, password, fullName và warehouseId are required.',
          });
        }
        userData.staff = { ...staff };
        userData.staff.password = await bcrypt.hash(
          staff.password,
          SALT_ROUNDS
        );
        username = staff.username;
        roleDataRaw = staff;
        break;

      case "accounter":
        if (
          !accounter?.username ||
          !accounter?.password ||
          !accounter?.fullName ||
          !accounter?.warehouseId
        ) {
          return res.status(400).json({
            message:
              'For role "accounter", fields username, password, fullName và warehouseId are required.',
          });
        }
        userData.accounter = { ...accounter };
        userData.accounter.password = await bcrypt.hash(
          accounter.password,
          SALT_ROUNDS
        );
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
        if (
          Array.isArray(userData.admin.managedWarehouses) &&
          userData.admin.managedWarehouses.length > 0
        ) {
          for (const warehouseId of userData.admin.managedWarehouses) {
            if (!mongoose.Types.ObjectId.isValid(warehouseId)) {
              await session.abortTransaction();
              session.endSession();
              return res
                .status(400)
                .json({ message: `Invalid warehouseId: ${warehouseId}` });
            }
            await updateWarehouseWithUser(
              createdUser._id,
              "admin",
              warehouseId,
              "add",
              session
            );
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
        await updateWarehouseWithUser(
          createdUser._id,
          "manager",
          userData.manager.warehouseId,
          "add",
          session
        );

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
            {
              role: "admin",
              "admin.managedWarehouses": userData.manager.warehouseId,
            },
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
        await updateWarehouseWithUser(
          createdUser._id,
          "staff",
          userData.staff.warehouseId,
          "add",
          session
        );

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
            {
              role: "admin",
              "admin.managedWarehouses": userData.staff.warehouseId,
            },
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
        await updateWarehouseWithUser(
          createdUser._id,
          "accounter",
          userData.accounter.warehouseId,
          "add",
          session
        );
      }

      // commit transaction
      await session.commitTransaction();
      session.endSession();

      // Fetch created user and remove password
      const result = await User.findById(createdUser._id).lean();
      if (result[role]?.password) delete result[role].password;

      return res.status(201).json({
        message: `${
          role[0].toUpperCase() + role.slice(1)
        } created successfully.`,
        user: result,
      });
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
        details:
          process.env.NODE_ENV === "development" ? error.keyValue : undefined,
      });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed.",
        errors: Object.keys(error.errors).map((k) => ({
          field: k,
          message: error.errors[k].message,
        })),
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
      !!(requester?.admin && requester.admin.isSuperAdmin) ||
      requester?.isSuperAdmin;

    if (isSuperAdmin) {
      query = query.or([
        { role: { $ne: "admin" } },
        { "admin.isSuperAdmin": { $ne: true } },
      ]);
    } else if (
      (requester.role === "admin" || requester.roleKey === "admin") &&
      (requester.admin || requester.roleKey === "admin")
    ) {
      const managed = Array.isArray(requester.admin?.managedWarehouses)
        ? requester.admin.managedWarehouses.map(String)
        : [];

      if (managed.length === 0) {
        return res.json({
          users: [],
          count: 0,
          filters: { status: status || "all", role: role || "all" },
        });
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
      return res
        .status(403)
        .json({ message: "Forbidden: insufficient permissions." });
    }

    if (status && ["active", "inactive"].includes(status)) {
      // optionally filter by status at subdoc level; leaving for future enhancement
    }

    if (role && ["admin", "manager", "staff", "accounter"].includes(role)) {
      if (isSuperAdmin) {
        query = query.where("role").equals(role);
      } else if (
        (requester.role === "admin" || requester.roleKey === "admin") &&
        (requester.admin || requester.roleKey === "admin")
      ) {
        if (role === "manager" || role === "staff" || role === "accounter") {
          query = query.where("role").equals(role);
        } else {
          return res.status(403).json({
            message: "Forbidden: insufficient permissions to list this role.",
          });
        }
      } else if (
        requester.role === "manager" &&
        requester.manager?.warehouseId
      ) {
        // Manager can only filter staff and accounter roles
        if (role === "staff" || role === "accounter") {
          query = query.where("role").equals(role);
        } else {
          return res.status(403).json({
            message: "Forbidden: insufficient permissions to list this role.",
          });
        }
      } else {
        return res
          .status(403)
          .json({ message: "Forbidden: insufficient permissions." });
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
        canLogin:
          (activeRole?.status === "active" && activeRole?.isActive) || false,
      };
      return userCopy;
    });

    // Set no-cache headers to prevent 304 Not Modified
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
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
    if (!id.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).json({ message: "Invalid user ID format." });

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

    if (!id.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).json({ message: "Invalid user ID format." });

    const currentUser = await User.findById(id);
    if (!currentUser)
      return res.status(404).json({ message: "User not found." });

    const role = currentUser.role;
    const oldWarehouseId = getWarehouseIdFromUser(currentUser);

    // Disallow password updates via this endpoint
    if (updates[role]?.password) {
      return res.status(400).json({
        message:
          "Password cannot be updated through edit user. Please use forgot password feature.",
      });
    }
    if (updates[role]) delete updates[role].password;

    // If username changes, ensure uniqueness within role
    if (updates[role]?.username) {
      const existQuery = { _id: { $ne: id }, role };
      existQuery[`${role}.username`] = updates[role].username;
      const exists = await User.findOne(existQuery);
      if (exists) {
        return res.status(409).json({
          message: `Username "${updates[role].username}" already exists for role "${role}".`,
        });
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
      const updated = await User.findByIdAndUpdate(
        id,
        { $set: setObj },
        { new: true, runValidators: true, session }
      ).lean();

      // Determine new warehouse id
      const newWarehouseId = getWarehouseIdFromUser(updated);

      // If role === admin handle managedWarehouses diff
      if (role === "admin") {
        const oldManaged = currentUser.admin?.managedWarehouses || [];
        const newManaged = updated.admin?.managedWarehouses || [];

        // Remove admin from warehouses no longer managed
        for (const warehouseId of oldManaged) {
          if (!newManaged.some((n) => String(n) === String(warehouseId))) {
            await updateWarehouseWithUser(
              updated._id,
              "admin",
              warehouseId,
              "remove",
              session
            );
          }
        }

        // Add admin to newly managed warehouses
        for (const warehouseId of newManaged) {
          if (!oldManaged.some((o) => String(o) === String(warehouseId))) {
            await updateWarehouseWithUser(
              updated._id,
              "admin",
              warehouseId,
              "add",
              session
            );
          }
        }
      } else {
        // For other roles handle warehouse id change
        if (oldWarehouseId !== newWarehouseId) {
          if (oldWarehouseId) {
            await updateWarehouseWithUser(
              updated._id,
              role,
              oldWarehouseId,
              "remove",
              session
            );
          }
          if (newWarehouseId) {
            await updateWarehouseWithUser(
              updated._id,
              role,
              newWarehouseId,
              "add",
              session
            );
          }
        } else if (newWarehouseId) {
          // If same warehouse, ensure user reference is up to date (set)
          await updateWarehouseWithUser(
            updated._id,
            role,
            newWarehouseId,
            "add",
            session
          );
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
      return res.status(409).json({
        message: key ? `Duplicate value for ${key}` : "Duplicate key error.",
      });
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
      return res.status(400).json({
        message: "New password is required and must be at least 6 characters.",
      });
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const role = user.role;
    if (!user[role])
      return res.status(400).json({ message: "User role data not found." });

    const hashedPassword = await bcrypt.hash(
      newPassword,
      Number(process.env.BCRYPT_SALT_ROUNDS) || 10
    );

    await User.findByIdAndUpdate(id, {
      $set: {
        [`${role}.password`]: hashedPassword,
        [`${role}.lastPasswordChangeAt`]: new Date(),
        [`${role}.resetCount`]: (user[role].resetCount || 0) + 1,
        [`${role}.lastResetAt`]: new Date(),
      },
    });

    res.json({
      message: "Password reset successfully by admin.",
      resetAt: new Date(),
    });
  } catch (error) {
    console.error("Admin reset password error:", error.message);
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).json({ message: "Invalid user ID format." });

    const user = await User.findByIdAndDelete(id).lean();
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({
      message: "User deleted successfully.",
      deletedUser: {
        id: user._id,
        role: user.role,
        username: user[user.role]?.username,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminWarehouses = async (req, res, next) => {
  try {
    const adminId = req.user.sub;
    const admin = await User.findById(adminId).lean();
    if (!admin || !admin.admin)
      return res.status(403).json({ message: "Access denied. Admin only." });

    if (admin.admin.isSuperAdmin) {
      const warehouses = await Warehouse.find({ status: "active" })
        .populate("managerId", "manager.fullName")
        .populate("accounterId", "accounter.fullName")
        .lean();
      return res.json({
        warehouses,
        count: warehouses.length,
        isSuperAdmin: true,
      });
    }

    const managedWarehouses = admin.admin.managedWarehouses || [];
    if (managedWarehouses.length === 0)
      return res.json({ warehouses: [], count: 0, isSuperAdmin: false });

    const warehouses = await Warehouse.find({
      _id: { $in: managedWarehouses },
      status: "active",
    })
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
    if (!adminId || !warehouseId)
      return res
        .status(400)
        .json({ message: "adminId and warehouseId are required." });

    if (
      !mongoose.Types.ObjectId.isValid(adminId) ||
      !mongoose.Types.ObjectId.isValid(warehouseId)
    ) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    // Authorization: only super-admin should call this endpoint — minimal check
    const caller = req.user;
    if (!caller || !(caller.admin?.isSuperAdmin || caller.isSuperAdmin)) {
      return res.status(403).json({ message: "Forbidden. Super-admin only." });
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== "admin")
      return res.status(404).json({ message: "Admin not found." });

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse)
      return res.status(404).json({ message: "Warehouse not found." });

    if (!admin.admin.managedWarehouses) admin.admin.managedWarehouses = [];
    if (!admin.admin.managedWarehouses.includes(warehouseId)) {
      admin.admin.managedWarehouses.push(warehouseId);
      await admin.save();
    }

    warehouse.adminId = adminId;
    await warehouse.save();

    res.json({
      message: "Warehouse assigned to admin successfully.",
      admin: {
        id: admin._id,
        managedWarehouses: admin.admin.managedWarehouses,
      },
      warehouse: {
        id: warehouse._id,
        name: warehouse.name,
        adminId: warehouse.adminId,
      },
    });
  } catch (error) {
    console.error("Assign warehouse to admin error:", error.message);
    next(error);
  }
};

// Change user role (Super Admin only)
exports.changeUserRole = async (req, res, next) => {
  try {
    const { userId, newRole, reason, currentPassword } = req.body;
    const superAdminId = req.user.sub;

    // Validate input
    if (!userId || !newRole || !currentPassword) {
      return res.status(400).json({
        success: false,
        message: "User ID, new role, and current password are required",
      });
    }

    // Check if user is Super Admin
    const superAdmin = await User.findById(superAdminId);
    if (!superAdmin || !superAdmin.admin?.isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can change user roles",
      });
    }

    // Verify Super Admin's current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      superAdmin.admin.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid current password",
      });
    }

    // Validate new role
    const validRoles = ["admin", "manager", "staff", "accounter"];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Must be one of: admin, manager, staff, accounter",
      });
    }

    // Find target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldRole = targetUser.role;

    // Check if role is already the same
    if (oldRole === newRole) {
      return res.status(400).json({
        success: false,
        message: "User already has this role",
      });
    }

    // Get role descriptions for audit log
    const roleDescriptions = {
      admin: "Admin - Quản lý toàn bộ hệ thống, quản lý warehouse, xem báo cáo",
      manager: "Manager - Quản lý warehouse, xem báo cáo, quản lý staff",
      staff: "Staff - Tạo export receipts, invoices, import products",
      accounter:
        "Accounter - Review và approve invoices, xem báo cáo tài chính",
    };

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Store old data for audit
      const oldData = {
        role: oldRole,
        email: targetUser[oldRole]?.email,
        fullName: targetUser[oldRole]?.fullName,
        username: targetUser[oldRole]?.username,
      };

      // Remove user from old warehouse assignments
      const oldWarehouseId = getWarehouseIdFromUser(targetUser);
      if (oldWarehouseId) {
        await updateWarehouseWithUser(
          userId,
          oldRole,
          oldWarehouseId,
          "remove",
          session
        );
      }

      // Clear old role data
      targetUser[oldRole] = undefined;
      targetUser.role = newRole;

      // Set new role data (preserve basic info)
      const newRoleData = {
        username: oldData.username,
        password:
          targetUser[oldRole]?.password ||
          (await bcrypt.hash("password123", 10)), // Default password
        fullName: oldData.fullName,
        email: oldData.email,
        role: newRole,
        status: "active",
        isActive: true,
      };

      // Add warehouseId for roles that need it
      if (["manager", "staff", "accounter"].includes(newRole)) {
        newRoleData.warehouseId =
          oldWarehouseId || new mongoose.Types.ObjectId();
      }

      targetUser[newRole] = newRoleData;

      // Update warehouse assignments for new role
      if (newRoleData.warehouseId) {
        await updateWarehouseWithUser(
          userId,
          newRole,
          newRoleData.warehouseId,
          "add",
          session
        );
      }

      await targetUser.save({ session });

      // Log audit trail
      const AuditService = require("../services/auditService");
      try {
        await AuditService.logChangeRole(
          {
            id: superAdmin._id,
            email: superAdmin.admin?.email || "No email",
            name: superAdmin.admin?.fullName || "Unknown",
            role: superAdmin.role,
          },
          {
            id: targetUser._id,
            email: oldData.email,
            name: oldData.fullName,
            role: newRole,
          },
          oldRole,
          newRole,
          "SUCCESS",
          reason || "Role changed by Super Admin",
          {
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            reason: reason,
          }
        );
      } catch (auditError) {
        console.error("Failed to log audit trail:", auditError);
      }

      // Send email notification to user
      try {
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: oldData.email,
          subject: "Thay đổi quyền truy cập - Warehouse Management System",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Thông báo thay đổi quyền truy cập</h2>
              <p>Xin chào <strong>${oldData.fullName}</strong>,</p>
              <p>Quyền truy cập của bạn đã được thay đổi bởi Super Admin:</p>
              <ul>
                <li><strong>Quyền cũ:</strong> ${roleDescriptions[oldRole]}</li>
                <li><strong>Quyền mới:</strong> ${
                  roleDescriptions[newRole]
                }</li>
                <li><strong>Thời gian:</strong> ${new Date().toLocaleString(
                  "vi-VN"
                )}</li>
              </ul>
              <p><strong>Lưu ý quan trọng:</strong></p>
              <ul>
                <li>Bạn cần đăng nhập lại để có giao diện mới</li>
                <li>Mật khẩu mặc định là: <strong>password123</strong></li>
                <li>Vui lòng đổi mật khẩu sau khi đăng nhập</li>
              </ul>
              <p>Nếu bạn có thắc mắc, vui lòng liên hệ với Super Admin.</p>
              <p>Trân trọng,<br>Warehouse Management System</p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Email notification sent to user:", oldData.email);
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
      }

      await session.commitTransaction();

      res.json({
        success: true,
        message: "User role changed successfully",
        data: {
          userId: targetUser._id,
          oldRole: oldRole,
          newRole: newRole,
          userEmail: oldData.email,
          emailSent: true,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("Change user role error:", error.message);
    next(error);
  }
};

// Toggle user status (active/inactive)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const requesterId = req.user?.sub || req.user?.id;

    // Validate input
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    if (!["active", "inactive"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be 'active' or 'inactive'." });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check permissions (only super admin can toggle status)
    const requester = await User.findById(requesterId);
    if (!requester || !requester.admin || !requester.admin.isSuperAdmin) {
      return res.status(403).json({
        message: "Forbidden: Only super admin can toggle user status.",
      });
    }

    // Check if super admin is still active
    if (requester.admin.status !== "active" || !requester.admin.isActive) {
      return res.status(403).json({
        message:
          "Your super admin account has been deactivated. Access denied.",
      });
    }

    // Prevent deactivating self
    if (user._id.toString() === requesterId) {
      return res
        .status(400)
        .json({ message: "Cannot deactivate your own account." });
    }

    const role = user.role;
    const currentStatus = user[role]?.status;

    // If status is the same, no need to update
    if (currentStatus === status) {
      return res.status(400).json({ message: `User is already ${status}.` });
    }

    // Update user status
    const updateData = {
      [`${role}.status`]: status,
      [`${role}.isActive`]: status === "active",
    };

    // Add audit fields
    if (status === "inactive") {
      updateData[`${role}.deactivatedBy`] = requesterId;
      updateData[`${role}.deactivatedAt`] = new Date();
      updateData[`${role}.deactivationReason`] =
        "Account deactivated by super admin";
    } else {
      updateData[`${role}.reactivatedBy`] = requesterId;
      updateData[`${role}.reactivatedAt`] = new Date();
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // If deactivating, invalidate all user sessions/tokens
    if (status === "inactive") {
      console.log(
        `User ${user._id} has been deactivated. All sessions should be invalidated.`
      );

      // Special handling for super admin deactivation
      if (user.role === "admin" && user.admin?.isSuperAdmin) {
        console.log(
          "⚠️ Super admin is being deactivated - this will affect system access"
        );

        // Check if there are other active super admins
        const otherSuperAdmins = await User.find({
          _id: { $ne: user._id },
          "admin.isSuperAdmin": true,
          "admin.status": "active",
          "admin.isActive": true,
        });

        if (otherSuperAdmins.length === 0) {
          console.log("🚨 WARNING: This is the last active super admin!");
          // You might want to prevent this or send special notifications
        }
      }

      // Send email notification to user
      try {
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        const userEmail = user[role]?.email;
        const userName = user[role]?.fullName || user[role]?.username || "User";

        if (userEmail) {
          const mailOptions = {
            from: `"HinWarehouse System" <${
              process.env.EMAIL_FROM || process.env.SMTP_USER
            }>`,
            to: userEmail,
            subject: "Account Deactivated - HinWarehouse",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #dc2626; margin: 0; font-size: 24px;">⚠️ Account Deactivated</h1>
                    <p style="color: #666; margin: 5px 0 0 0;">HinWarehouse System</p>
                  </div>
          
                  <h2 style="color: #333; margin-bottom: 20px;">Important Notice</h2>
          
                  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                    Hello <strong>${userName}</strong>,
                  </p>
          
                  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                    Your account has been deactivated by the Super Admin. From now on, you will no longer be able to log in to the system.
                  </p>
          
                  <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #dc2626; margin: 0 0 10px 0;">🚫 Access Revoked</h3>
                    <ul style="color: #7f1d1d; margin: 0; padding-left: 20px;">
                      <li>Unable to log in to the system</li>
                      <li>All active sessions have been logged out</li>
                      <li>No longer able to access any system functions</li>
                    </ul>
                  </div>
          
                  <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #0369a1; margin: 0 0 10px 0;">📞 Contact Support</h3>
                    <p style="color: #0c4a6e; margin: 0;">
                      If you believe this is a mistake or need further assistance, please contact the Super Admin for support.
                    </p>
                  </div>
          
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">
                      <strong>📅 Time:</strong> ${new Date().toLocaleString(
                        "en-US"
                      )}<br>
                      <strong>👤 Performed by:</strong> Super Admin<br>
                      <strong>🔒 Reason:</strong> Account deactivated
                    </p>
                  </div>
          
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
                  <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                    This is an automated message from the HinWarehouse system.<br>
                    Please do not reply to this email.
                  </p>
                </div>
              </div>
            `,
          };

          await transporter.sendMail(mailOptions);
          console.log("✅ Email notification sent to user:", userEmail);
        } else {
          console.warn("⚠️ No email found for user:", user._id);
        }
      } catch (emailError) {
        console.error("❌ Failed to send email notification:", emailError);
        // Don't fail the main operation if email fails
      }

      // Emit socket event to force logout
      const io = req.app.get("io");
      if (io) {
        io.to(`user-${user._id}`).emit("force-logout", {
          message:
            "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ với quản trị viên.",
          reason: "account_deactivated",
        });
      }
    }

    // Send email notification for reactivation
    if (status === "active") {
      try {
        const nodemailer = require("nodemailer");
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp.gmail.com",
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        const userEmail = updatedUser[role]?.email;
        const userName =
          updatedUser[role]?.fullName || updatedUser[role]?.username || "User";

        if (userEmail) {
          const mailOptions = {
            from: `"HinWarehouse System" <${
              process.env.EMAIL_FROM || process.env.SMTP_USER
            }>`,
            to: userEmail,
            subject: "Your Account Has Been Reactivated - HinWarehouse",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #16a34a; margin: 0; font-size: 24px;">✅ Account Reactivated</h1>
                    <p style="color: #666; margin: 5px 0 0 0;">HinWarehouse System</p>
                  </div>
          
                  <h2 style="color: #333; margin-bottom: 20px;">Positive Notification</h2>
          
                  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                    Hello <strong>${userName}</strong>,
                  </p>
          
                  <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                    Your account has been reactivated by the Super Admin. You can now log in to the system as usual.
                  </p>
          
                  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #16a34a; margin: 0 0 10px 0;">🎉 Access Restored</h3>
                    <ul style="color: #166534; margin: 0; padding-left: 20px;">
                      <li>You can log in to the system</li>
                      <li>Full access according to your role permissions</li>
                      <li>All features are available as before</li>
                    </ul>
                  </div>
          
                  <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h3 style="color: #0369a1; margin: 0 0 10px 0;">🔐 Login Instructions</h3>
                    <p style="color: #0c4a6e; margin: 0;">
                      You can log in using your existing account credentials. If you encounter any issues, please contact the Super Admin for assistance.
                    </p>
                  </div>
          
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0;">
                    <p style="margin: 0; color: #6c757d; font-size: 14px;">
                      <strong>📅 Date & Time:</strong> ${new Date().toLocaleString(
                        "en-US"
                      )}<br>
                      <strong>👤 Performed by:</strong> Super Admin<br>
                      <strong>✅ Status:</strong> Account Reactivated
                    </p>
                  </div>
          
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
                  <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                    This is an automated email from the HinWarehouse System.<br>
                    Please do not reply to this message.
                  </p>
                </div>
              </div>
            `,
          };

          await transporter.sendMail(mailOptions);
          console.log("✅ Reactivation email sent to user:", userEmail);
        } else {
          console.warn("⚠️ No email found for user:", updatedUser._id);
        }
      } catch (emailError) {
        console.error("❌ Failed to send reactivation email:", emailError);
        // Don't fail the main operation if email fails
      }
    }

    res.json({
      success: true,
      message: `User status updated to ${status} successfully.`,
      user: {
        id: updatedUser._id,
        role: updatedUser.role,
        status: status,
        username: updatedUser[role]?.username,
        fullName: updatedUser[role]?.fullName,
      },
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    next(error);
  }
};

// Check current user permissions (for debugging)
exports.checkCurrentUserPermissions = async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "No user ID in token" });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const role = user.role;
    const roleData = user[role];

    res.json({
      success: true,
      user: {
        id: user._id,
        role: role,
        username: roleData?.username,
        fullName: roleData?.fullName,
        email: roleData?.email,
        isSuperAdmin: roleData?.isSuperAdmin,
        status: roleData?.status,
        isActive: roleData?.isActive,
      },
      permissions: {
        canToggleStatus:
          role === "admin" &&
          roleData?.isSuperAdmin &&
          roleData?.status === "active" &&
          roleData?.isActive,
        canManageUsers: role === "admin" && roleData?.isSuperAdmin,
        canAccessSuperAdmin: role === "admin" && roleData?.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error("Error checking user permissions:", error);
    next(error);
  }
};
