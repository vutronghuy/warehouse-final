const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
exports.initSuperAdmin = async (req, res, next) => {
  try {
    const count = await User.countDocuments({ "admin.isSuperAdmin": true });
    if (count > 0)
      return res.status(409).json({ message: "Super-admin already exists." });
    const { username, password, fullName, email } = req.body;
    const superAdmin = new User({
      role: "admin",
      admin: { username, password, fullName, email, isSuperAdmin: true },
    });
    await superAdmin.save();
    const userObj = superAdmin.toObject();
    delete userObj.admin.password;
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
  // sample data; you can compute stats
  return res.json({
    ok: true,
    data: { usersCount: await User.countDocuments() },
  });
};
exports.createUser = async (req, res, next) => {
  try {
    const { role, admin, manager, staff, accounter } = req.body;

    // 1. Kiểm tra role
    if (!role) {
      return res.status(400).json({ message: 'Field "role" is required.' });
    }

    // 2. Validate sub-doc và lấy username
    let userData = { role };
    let username;
    let roleData;

    switch (role) {
      case "admin":
        // admin: không bắt buộc phải có warehouse khi tạo
        if (!admin?.username || !admin?.password || !admin?.fullName) {
          return res.status(400).json({
            message:
              'For role "admin", fields username, password và fullName are required.',
          });
        }
        // ensure managedWarehouses is an array if provided
        if (
          admin.managedWarehouses &&
          !Array.isArray(admin.managedWarehouses)
        ) {
          return res
            .status(400)
            .json({
              message:
                "admin.managedWarehouses must be an array of warehouse IDs.",
            });
        }

        // Hash password before saving
        const hashedAdminPassword = await bcrypt.hash(admin.password, 10);
        userData.admin = { ...admin, password: hashedAdminPassword };
        username = admin.username;
        roleData = admin;
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

        // Hash password before saving
        const hashedManagerPassword = await bcrypt.hash(manager.password, 10);
        userData.manager = { ...manager, password: hashedManagerPassword };
        username = manager.username;
        roleData = manager;
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

        // Hash password before saving
        const hashedStaffPassword = await bcrypt.hash(staff.password, 10);
        userData.staff = { ...staff, password: hashedStaffPassword };
        username = staff.username;
        roleData = staff;
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

        // Hash password before saving
        const hashedAccounterPassword = await bcrypt.hash(
          accounter.password,
          10
        );
        userData.accounter = {
          ...accounter,
          password: hashedAccounterPassword,
        };
        username = accounter.username;
        roleData = accounter;
        break;

      default:
        return res.status(400).json({
          message: `"${role}" is not a valid role. Must be one of admin, manager, staff, accounter.`,
        });
    }

    // 3. Pre–check trùng username trong cùng role
    const existQuery = { role };
    existQuery[`${role}.username`] = username;

    const exists = await User.findOne(existQuery).lean();
    if (exists) {
      return res.status(409).json({
        message: `Username "${username}" already exists for role "${role}".`,
        code: "USERNAME_EXISTS_IN_ROLE",
      });
    }

    // Start a session for transactional operations
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const commitAndEnd = async () => {
        await session.commitTransaction();
        session.endSession();
      };
      const abortAndEnd = async () => {
        await session.abortTransaction().catch(() => {});
        session.endSession();
      };

      // ----- admin branch -----
      if (role === "admin") {
        const createdArr = await User.create([userData], { session });
        const createdAdmin = createdArr[0];

        // If admin provided managedWarehouses, attach managers + staff that already exist in those warehouses
        const whIds = Array.isArray(userData.admin.managedWarehouses)
          ? userData.admin.managedWarehouses.filter(Boolean)
          : [];

        // validate ObjectId format for provided warehouse ids
        const invalidWh = whIds.find(
          (id) => !mongoose.Types.ObjectId.isValid(id)
        );
        if (invalidWh) {
          await abortAndEnd();
          return res
            .status(400)
            .json({ message: `Invalid warehouseId: ${invalidWh}` });
        }

        if (whIds.length > 0) {
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
            { _id: createdAdmin._id, role: "admin" },
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

        await commitAndEnd();

        const result = await User.findById(createdAdmin._id).lean();
        if (result.admin?.password) delete result.admin.password;

        return res.status(201).json({
          message: "Admin created successfully.",
          user: result,
        });
      }

      // ----- manager branch -----
      if (role === "manager") {
        if (!mongoose.Types.ObjectId.isValid(userData.manager.warehouseId)) {
          await abortAndEnd();
          return res.status(400).json({ message: "Invalid warehouseId." });
        }

        const createdArr = await User.create([userData], { session });
        const createdManager = createdArr[0];

        // Add manager to any admins that manage this warehouse
        await User.updateMany(
          {
            role: "admin",
            "admin.managedWarehouses": createdManager.manager.warehouseId,
          },
          { $addToSet: { "admin.managedManagers": createdManager._id } },
          { session }
        );

        // Add accounter of this warehouse to admin's managedAccounters if exists
        const accounter = await User.findOne({
          role: "accounter",
          "accounter.warehouseId": createdManager.manager.warehouseId,
        })
          .select("_id")
          .session(session)
          .lean();

        if (accounter) {
          await User.updateMany(
            {
              role: "admin",
              "admin.managedWarehouses": createdManager.manager.warehouseId,
            },
            { $addToSet: { "admin.managedAccounters": accounter._id } },
            { session }
          );
        }

        await commitAndEnd();

        const result = await User.findById(createdManager._id).lean();
        if (result.manager?.password) delete result.manager.password;

        return res.status(201).json({
          message: "Manager created successfully.",
          user: result,
        });
      }

      // ----- staff branch -----
      if (role === "staff") {
        if (!mongoose.Types.ObjectId.isValid(userData.staff.warehouseId)) {
          await abortAndEnd();
          return res.status(400).json({ message: "Invalid warehouseId." });
        }

        // If provided managerId -> validate existence, role and same warehouse
        if (userData.staff.managerId) {
          if (!mongoose.Types.ObjectId.isValid(userData.staff.managerId)) {
            await abortAndEnd();
            return res.status(400).json({ message: "Invalid managerId." });
          }
          const mgrDoc = await User.findById(userData.staff.managerId)
            .session(session)
            .lean();
          if (!mgrDoc) {
            await abortAndEnd();
            return res.status(400).json({ message: "managerId not found." });
          }
          if (mgrDoc.role !== "manager") {
            await abortAndEnd();
            return res
              .status(400)
              .json({
                message: 'managerId must refer to a user with role "manager".',
              });
          }
          if (
            !mgrDoc.manager?.warehouseId ||
            String(mgrDoc.manager.warehouseId) !==
              String(userData.staff.warehouseId)
          ) {
            await abortAndEnd();
            return res
              .status(400)
              .json({
                message: "Manager and staff must belong to the same warehouse.",
              });
          }
        }

        const createdArr = await User.create([userData], { session });
        const createdStaff = createdArr[0];

        // Add staff to admins that manage this warehouse
        await User.updateMany(
          {
            role: "admin",
            "admin.managedWarehouses": createdStaff.staff.warehouseId,
          },
          { $addToSet: { "admin.managedStaff": createdStaff._id } },
          { session }
        );

        // Add accounter of this warehouse to admin's managedAccounters if exists
        const accounter = await User.findOne({
          role: "accounter",
          "accounter.warehouseId": createdStaff.staff.warehouseId,
        })
          .select("_id")
          .session(session)
          .lean();

        if (accounter) {
          await User.updateMany(
            {
              role: "admin",
              "admin.managedWarehouses": createdStaff.staff.warehouseId,
            },
            { $addToSet: { "admin.managedAccounters": accounter._id } },
            { session }
          );
        }

        // If managerId present, add staffId into manager.staffIds
        if (createdStaff.staff.managerId) {
          await User.updateOne(
            { _id: createdStaff.staff.managerId, role: "manager" },
            { $addToSet: { "manager.staffIds": createdStaff._id } },
            { session }
          );
        }

        await commitAndEnd();

        const result = await User.findById(createdStaff._id).lean();
        if (result.staff?.password) delete result.staff.password;

        return res.status(201).json({
          message: "Staff created successfully.",
          user: result,
        });
      }

      // ----- accounter branch -----
      if (role === "accounter") {
        if (!mongoose.Types.ObjectId.isValid(userData.accounter.warehouseId)) {
          await abortAndEnd();
          return res.status(400).json({ message: "Invalid warehouseId." });
        }

        const createdArr = await User.create([userData], { session });
        const createdAccounter = createdArr[0];

        // Add accounter to any admins that manage this warehouse
        await User.updateMany(
          {
            role: "admin",
            "admin.managedWarehouses": createdAccounter.accounter.warehouseId,
          },
          { $addToSet: { "admin.managedAccounters": createdAccounter._id } },
          { session }
        );

        await commitAndEnd();

        const result = await User.findById(createdAccounter._id).lean();
        if (result.accounter?.password) delete result.accounter.password;

        return res.status(201).json({
          message: "Accounter created successfully.",
          user: result,
        });
      }

      // ----- default (other roles) -----
      const createdArr = await User.create([userData], { session });
      const created = createdArr[0];

      await commitAndEnd();

      const result = await User.findById(created._id).lean();
      if (result[role]?.password) delete result[role].password;

      return res.status(201).json({
        message: "User created successfully.",
        user: result,
      });
    } catch (innerErr) {
      await session.abortTransaction().catch(() => {});
      session.endSession();
      throw innerErr;
    }
  } catch (error) {
    console.error("Create user error:", error);

    // Duplicate key
    if (error.name === "MongoServerError" && error.code === 11000) {
      const duplicateField = error.message.match(
        /index: (\w+)_username_unique/
      );
      const roleFromError = duplicateField ? duplicateField[1] : "unknown";
      return res.status(409).json({
        message: `Username already exists for role "${roleFromError}".`,
        code: "DUPLICATE_KEY_ERROR",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    // Validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation failed.",
        errors: Object.keys(error.errors).map((key) => ({
          field: key,
          message: error.errors[key].message,
        })),
      });
    }

    next(error);
  }
};

// controller/UserController.js
exports.getAllUsers = async (req, res, next) => {
  try {
    const { status, role } = req.query;

    console.log('=== getAllUsers Debug ===');
    console.log('Query params:', { status, role });

    // ---- ensure authenticated (defensive) ----
    // req.user có thể được gán bởi middleware auth (decoded JWT).
    // Nếu req.user chỉ chứa payload nhỏ (ví dụ sub), load full user doc.
    let requester = req.requester || req.user || null;
    if (!requester) {
      console.log('No requester found');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    console.log('Requester:', {
      id: requester.sub || requester.id,
      role: requester.role,
      isSuperAdmin: requester.isSuperAdmin
    });

    // If requester contains only token payload (sub) rather than full user doc,
    // try to fetch full user from DB
    if (requester && (requester.sub || requester.id) && !requester.admin && !requester.manager && !requester.staff && !requester.accounter) {
      const requesterId = requester.sub || requester.id;
      const fullUser = await User.findById(requesterId).lean();
      if (!fullUser) return res.status(401).json({ message: 'Unauthorized' });

      // Merge JWT payload with full user data
      requester = {
        ...requester,
        ...fullUser,
        // Keep JWT payload properties that might be more up-to-date
        role: requester.role || fullUser.role,
        isSuperAdmin: requester.isSuperAdmin !== undefined ? requester.isSuperAdmin : fullUser.admin?.isSuperAdmin
      };

      console.log('Loaded full requester from DB:', {
        id: requester._id,
        role: requester.role,
        isSuperAdmin: requester.admin?.isSuperAdmin,
        managedWarehouses: requester.admin?.managedWarehouses?.length || 0
      });
    }

    // ---- build base query ----
    let query = User.find();
    
    // Super admin có thể xem tất cả user (trừ super admin khác)
    const isSuperAdmin = !!(requester?.admin && requester.admin.isSuperAdmin) || requester?.isSuperAdmin;
    console.log('Is super admin:', isSuperAdmin);

    if (isSuperAdmin) {
      console.log('Building query for super admin');
      // keep previous behavior to exclude super-admin from list
      query = query.or([
        { role: { $ne: 'admin' } },
        { 'admin.isSuperAdmin': { $ne: true } }
      ]);
    } else if ((requester.role === 'admin' || requester.roleKey === 'admin') && (requester.admin || requester.roleKey === 'admin')) {
      console.log('Building query for regular admin');
      // Admin thường chỉ có thể xem user mà họ quản lý
      const managed = Array.isArray(requester.admin?.managedWarehouses)
        ? requester.admin.managedWarehouses.map(String)
        : [];

      console.log('Managed warehouses:', managed);

      if (managed.length === 0) {
        console.log('Admin has no managed warehouses, returning empty list');
        // Nếu admin không quản lý warehouse nào, trả về danh sách rỗng
        return res.json({
          users: [],
          count: 0,
          filters: { status: status || 'all', role: role || 'all' }
        });
      }

      // Xem tất cả manager, staff, accounter thuộc warehouse mà admin quản lý
      query = query.or([
        { 
          role: 'manager', 
          'manager.warehouseId': { $in: managed } 
        },
        { 
          role: 'staff', 
          'staff.warehouseId': { $in: managed } 
        },
        { 
          role: 'accounter', 
          'accounter.warehouseId': { $in: managed } 
        }
      ]);
      console.log('Query built for admin:', query.getQuery());
    } else {
      console.log('User is not admin, denying access. Role:', requester.role, 'RoleKey:', requester.roleKey);
      // Non-admin users không được phép xem danh sách user
      return res.status(403).json({ message: 'Forbidden: insufficient permissions.' });
    }

    // ---- status filter (unchanged) ----
    if (status && ['active', 'inactive'].includes(status)) {
      if (typeof User.getUsersByStatus === 'function') {
        query = User.getUsersByStatus(status, query);
      } else {
        // simple status-based filter per subdoc could be added here if needed
      }
    }

    // ---- role filter with authorization logic ----
    if (role && ['admin', 'manager', 'staff', 'accounter'].includes(role)) {
      console.log('Applying role filter:', role);
      if (isSuperAdmin) {
        // Super-admin can filter any role freely
        query = query.where('role').equals(role);
      } else if ((requester.role === 'admin' || requester.roleKey === 'admin') && (requester.admin || requester.roleKey === 'admin')) {
        // Admin thường chỉ có thể filter role mà họ quản lý
        if (role === 'manager' || role === 'staff' || role === 'accounter') {
          query = query.where('role').equals(role);
          console.log('Role filter applied for admin');
        } else {
          console.log('Admin trying to filter admin role, denying');
          // admin that is not super-admin is not allowed to list other admins
          return res.status(403).json({ message: 'Forbidden: insufficient permissions to list this role.' });
        }
      } else {
        // Non-admin users are not allowed to use role filter
        return res.status(403).json({ message: 'Forbidden: insufficient permissions.' });
      }
    }

    // ---- execute ----
    console.log('Executing query...');
    const users = await query.lean();
    console.log('Found users:', users.length);

    // ---- sanitize passwords + build userStatus ----
    const sanitized = users.map(u => {
      const userCopy = { ...u };
      if (userCopy.admin?.password) delete userCopy.admin.password;
      if (userCopy.manager?.password) delete userCopy.manager.password;
      if (userCopy.staff?.password) delete userCopy.staff.password;
      if (userCopy.accounter?.password) delete userCopy.accounter.password;

      const activeRole = userCopy[userCopy.role];
      userCopy.userStatus = {
        status: activeRole?.status || 'inactive',
        isActive: activeRole?.isActive || false,
        canLogin: (activeRole?.status === 'active' && activeRole?.isActive) || false
      };
      return userCopy;
    });

    console.log('Returning sanitized users');
    res.json({
      users: sanitized,
      count: sanitized.length,
      filters: { status: status || 'all', role: role || 'all' }
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    next(error);
  }
};

// Get a single user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const user = await User.findById(id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Remove password
    const userCopy = { ...user };
    if (userCopy.admin?.password) delete userCopy.admin.password;
    if (userCopy.manager?.password) delete userCopy.manager.password;
    if (userCopy.staff?.password) delete userCopy.staff.password;
    if (userCopy.accounter?.password) delete userCopy.accounter.password;

    res.json({ user: userCopy });
  } catch (error) {
    next(error);
  }
};

// Update user by ID
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    // Tìm user hiện tại để biết role
    const currentUser = await User.findById(id);
    if (!currentUser) {
      return res.status(404).json({ message: "User not found." });
    }

    const role = currentUser.role;

    // SECURITY: Không cho phép update password qua edit user
    // Password chỉ có thể thay đổi qua forgot password flow
    if (updates[role]?.password) {
      return res.status(400).json({
        message: "Password cannot be updated through edit user. Please use forgot password feature.",
      });
    }

    // Đảm bảo không có password field trong updates
    if (updates[role]) {
      delete updates[role].password;
    }

    // Nếu update username, kiểm tra trùng trong cùng role
    if (updates[role]?.username) {
      const existQuery = {
        _id: { $ne: id },
        role: role,
      };
      existQuery[`${role}.username`] = updates[role].username;

      const exists = await User.findOne(existQuery);
      if (exists) {
        return res.status(409).json({
          message: `Username "${updates[role].username}" already exists for role "${role}".`,
        });
      }
    }

    // Use MongoDB updateOne directly to bypass all Mongoose validation
    const updateQuery = {};
    Object.keys(updates).forEach(key => {
      if (key === role && updates[key]) {
        // Update subdocument fields individually
        Object.keys(updates[key]).forEach(subKey => {
          updateQuery[`${key}.${subKey}`] = updates[key][subKey];
        });
      } else {
        updateQuery[key] = updates[key];
      }
    });

    // Direct MongoDB update - bypasses all Mongoose middleware and validation
    await User.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: updateQuery }
    );

    // Fetch updated user
    const user = await User.findById(id).lean();

    // Remove password
    const userCopy = { ...user };
    if (userCopy.admin?.password) delete userCopy.admin.password;
    if (userCopy.manager?.password) delete userCopy.manager.password;
    if (userCopy.staff?.password) delete userCopy.staff.password;
    if (userCopy.accounter?.password) delete userCopy.accounter.password;

    res.json({ message: "User updated successfully.", user: userCopy });
  } catch (error) {
    if (error.name === "MongoServerError" && error.code === 11000) {
      const duplicateField = error.message.match(
        /index: (\w+)_username_unique/
      );
      const roleFromError = duplicateField ? duplicateField[1] : "unknown";

      return res.status(409).json({
        message: `Username already exists for role "${roleFromError}".`,
      });
    }
    next(error);
  }
};

// Admin reset password for another user (separate from edit)
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
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const role = user.role;
    if (!user[role]) {
      return res.status(400).json({ message: "User role data not found." });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password directly using $set to bypass validation
    await User.findByIdAndUpdate(id, {
      $set: {
        [`${role}.password`]: hashedPassword,
        [`${role}.lastPasswordChangeAt`]: new Date(),
        [`${role}.resetCount`]: (user[role].resetCount || 0) + 1,
        [`${role}.lastResetAt`]: new Date(),
      }
    });

    res.json({
      message: "Password reset successfully by admin.",
      resetAt: new Date()
    });

  } catch (error) {
    console.error('Admin reset password error:', error);
    next(error);
  }
};

// Delete user by ID
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    const user = await User.findByIdAndDelete(id).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

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

// Get warehouses managed by admin
exports.getAdminWarehouses = async (req, res, next) => {
  try {
    const adminId = req.user.sub;

    // Kiểm tra xem user có phải là admin không
    const admin = await User.findById(adminId).lean();
    if (!admin || !admin.admin) {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    // Nếu là super admin, trả về tất cả warehouse
    if (admin.admin.isSuperAdmin) {
      const Warehouse = require('../models/warehouse/Warehouse');
      const warehouses = await Warehouse.find({ status: 'active' })
        .populate('managerId', 'manager.fullName')
        .populate('accounterId', 'accounter.fullName')
        .lean();

      return res.json({ 
        warehouses,
        count: warehouses.length,
        isSuperAdmin: true
      });
    }

    // Admin thường chỉ có thể xem warehouse mình quản lý
    const managedWarehouses = admin.admin.managedWarehouses || [];
    
    if (managedWarehouses.length === 0) {
      return res.json({ 
        warehouses: [],
        count: 0,
        isSuperAdmin: false
      });
    }

    const Warehouse = require('../models/warehouse/Warehouse');
    const warehouses = await Warehouse.find({
      _id: { $in: managedWarehouses },
      status: 'active'
    })
      .populate('managerId', 'manager.fullName')
      .populate('accounterId', 'accounter.fullName')
      .lean();

    res.json({ 
      warehouses,
      count: warehouses.length,
      isSuperAdmin: false
    });

  } catch (error) {
    console.error('Get admin warehouses error:', error);
    next(error);
  }
};

// Get current user info (for debugging)
exports.getCurrentUserInfo = async (req, res, next) => {
  try {
    const userId = req.user.sub;
    
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Remove sensitive information
    const userCopy = { ...user };
    if (userCopy.admin?.password) delete userCopy.admin.password;
    if (userCopy.manager?.password) delete userCopy.manager.password;
    if (userCopy.staff?.password) delete userCopy.staff.password;
    if (userCopy.accounter?.password) delete userCopy.accounter.password;

    res.json({ 
      user: userCopy,
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
        managedAccounters: user.admin?.managedAccounters || []
      }
    });
  } catch (error) {
    console.error('Get current user info error:', error);
    next(error);
  }
};

// Assign warehouse to admin (super admin only)
exports.assignWarehouseToAdmin = async (req, res, next) => {
  try {
    const { adminId, warehouseId } = req.body;

    if (!adminId || !warehouseId) {
      return res.status(400).json({ message: "adminId and warehouseId are required." });
    }

    if (!mongoose.Types.ObjectId.isValid(adminId) || !mongoose.Types.ObjectId.isValid(warehouseId)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    // Kiểm tra xem admin có tồn tại không
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: "Admin not found." });
    }

    // Kiểm tra xem warehouse có tồn tại không
    const Warehouse = require('../models/warehouse/Warehouse');
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found." });
    }

    // Gán warehouse cho admin
    if (!admin.admin.managedWarehouses) {
      admin.admin.managedWarehouses = [];
    }

    if (!admin.admin.managedWarehouses.includes(warehouseId)) {
      admin.admin.managedWarehouses.push(warehouseId);
      await admin.save();
    }

    // Cập nhật warehouse để tham chiếu đến admin
    warehouse.adminId = adminId;
    await warehouse.save();

    res.json({ 
      message: "Warehouse assigned to admin successfully.",
      admin: {
        id: admin._id,
        managedWarehouses: admin.admin.managedWarehouses
      },
      warehouse: {
        id: warehouse._id,
        name: warehouse.name,
        adminId: warehouse.adminId
      }
    });

  } catch (error) {
    console.error('Assign warehouse to admin error:', error);
    next(error);
  }
};
