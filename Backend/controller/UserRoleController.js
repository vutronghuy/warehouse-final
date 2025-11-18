// UserRoleController.js
require('dotenv').config();
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // Use TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false // Bỏ qua SSL certificate validation
  }
});

// Change user role (Super Admin only) — requires Super Admin password verification
exports.changeUserRole = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { userId, newRole, reason, superAdminPassword } = req.body;
    const superAdminId = req.user.sub;

    // Safe logging (no sensitive data)
    console.log('changeUserRole request:', {
      userId,
      newRole,
      reasonProvided: !!reason,
      superAdminId,
      callerRole: req.user.role,
      callerIsSuperAdmin: !!req.user.isSuperAdmin
    });

    // Validate required fields
    if (!userId || !newRole || !superAdminPassword) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'User ID, new role, and Super Admin password are required'
      });
    }

    // Validate role set
    const validRoles = ['staff', 'manager', 'accounter', 'admin'];
    if (!validRoles.includes(newRole)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid new role'
      });
    }

    // Find Super Admin user by role and isSuperAdmin flag
    const superAdminUser = await User.findOne({ 
      'admin.role': 'admin', 
      'admin.isSuperAdmin': true 
    }).session(session);
    
    console.log('Super Admin user query result:', {
      found: !!superAdminUser,
      id: superAdminUser?._id,
      username: superAdminUser?.admin?.username,
      role: superAdminUser?.admin?.role,
      isSuperAdmin: superAdminUser?.admin?.isSuperAdmin
    });
    
    if (!superAdminUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(500).json({
        success: false,
        message: 'Super Admin user not found'
      });
    }

    // Verify Super Admin password
    console.log('Password comparison:', {
      inputPassword: superAdminPassword,
      inputLength: superAdminPassword?.length || 0,
      storedHash: superAdminUser.admin?.password?.substring(0, 20) + '...',
      storedLength: superAdminUser.admin?.password?.length || 0
    });
    
    let isPasswordValid = false;
    
    // Check if stored password is hashed (starts with $2a$ or $2b$)
    if (superAdminUser.admin.password.startsWith('$2a$') || superAdminUser.admin.password.startsWith('$2b$')) {
      // Password is hashed, use bcrypt.compare
      isPasswordValid = await bcrypt.compare(superAdminPassword, superAdminUser.admin.password);
      console.log('Password validation result (hashed):', isPasswordValid);
    } else {
      // Password is plain text, compare directly
      isPasswordValid = superAdminPassword === superAdminUser.admin.password;
      console.log('Password validation result (plain text):', isPasswordValid);
    }
    
    if (!isPasswordValid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(401).json({
        success: false,
        message: 'Super Admin password is incorrect'
      });
    }

    // Fetch target user
    const targetUser = await User.findById(userId).session(session);
    if (!targetUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const oldRole = targetUser.role;
    if (oldRole === newRole) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'User already has this role'
      });
    }

    // Allowed role transitions
    const allowedTransitions = {
      'staff': ['manager', 'accounter', 'admin'],
      'manager': ['staff', 'accounter', 'admin'],
      'accounter': ['staff', 'manager', 'admin'],
      'admin': ['staff', 'manager', 'accounter']
    };

    if (!allowedTransitions[oldRole]?.includes(newRole)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Cannot change role from ${oldRole} to ${newRole}`
      });
    }

    // Helper getters: extract existing info from current role subdoc
    const getCurrentRoleData = () => {
      if (targetUser.admin) return targetUser.admin;
      if (targetUser.manager) return targetUser.manager;
      if (targetUser.staff) return targetUser.staff;
      if (targetUser.accounter) return targetUser.accounter;
      return null;
    };

    const currentRoleData = getCurrentRoleData();
    if (!currentRoleData) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'User role data not found'
      });
    }

    // Store old user data for audit
    const oldUserData = {
      role: targetUser.role,
      email: currentRoleData.email,
      name: currentRoleData.fullName,
      username: currentRoleData.username,
      status: currentRoleData.status || 'active',
      warehouseId: currentRoleData.warehouseId
    };

    // Clear old role subdocs reliably
    try {
      delete targetUser.admin;
      delete targetUser.manager;
      delete targetUser.staff;
      delete targetUser.accounter;
      targetUser.markModified && targetUser.markModified('admin');
      targetUser.markModified && targetUser.markModified('manager');
      targetUser.markModified && targetUser.markModified('staff');
      targetUser.markModified && targetUser.markModified('accounter');
    } catch (delErr) {
      console.warn('Warning while deleting old role subdocs:', delErr);
    }

    // Create new role subdoc with preserved data
    const preservedPassword = targetUser.password || currentRoleData.password || undefined;

    const newRoleData = {
      username: currentRoleData.username,
      password: preservedPassword,
      fullName: currentRoleData.fullName,
      email: currentRoleData.email,
      warehouseId: currentRoleData.warehouseId,
      role: newRole,
      status: currentRoleData.status || 'active',
      isActive: currentRoleData.isActive !== undefined ? currentRoleData.isActive : true
    };

    if (newRole === 'staff') {
      targetUser.staff = newRoleData;
    } else if (newRole === 'manager') {
      targetUser.manager = newRoleData;
    } else if (newRole === 'accounter') {
      targetUser.accounter = newRoleData;
    } else if (newRole === 'admin') {
      targetUser.admin = { ...newRoleData, isSuperAdmin: false };
    }

    // Update role field on root doc
    targetUser.role = newRole;

    // Save changes
    await targetUser.save({ session });

    // Create audit log (part of same transaction)
    try {
      await AuditLog.create([{
        category: 'SYSTEM',
        action: 'CHANGE_ROLE',
        actor: {
          id: superAdminUser._id,
          email: superAdminUser.admin?.email || null,
          name: superAdminUser.admin?.fullName || null,
          role: superAdminUser.admin?.role || 'admin'
        },
        target: {
          type: 'User',
          id: targetUser._id
        },
        before: {
          role: oldRole,
          email: oldUserData.email,
          name: oldUserData.name,
          status: oldUserData.status
        },
        after: {
          role: newRole,
          email: currentRoleData.email,
          name: currentRoleData.fullName,
          status: currentRoleData.status || 'active'
        },
        reason: reason || 'Role change by Super Admin',
        outcome: 'SUCCESS',
        error: null,
        meta: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fromRole: oldRole,
          toRole: newRole,
          reason
        },
        createdAt: new Date()
      }], { session });
    } catch (auditErr) {
      console.error('Failed to write audit log (but role change proceeded):', auditErr);
    }

    await session.commitTransaction();
    session.endSession();

    // Notify user by email (non-blocking for response)
    (async () => {
      try {
        const recipientEmail = currentRoleData.email;
        if (!recipientEmail) {
          console.warn('No recipient email found for user', targetUser._id);
          return;
        }

        const roleDescriptions = {
          'staff': 'Staff - Quản lý xuất nhập kho, tạo hóa đơn',
          'manager': 'Manager - Quản lý staff, xem báo cáo, quản lý xuất nhập kho',
          'accounter': 'Accounter - Duyệt hóa đơn, quản lý tài chính',
          'admin': 'Admin - Quản lý toàn bộ hệ thống, quản lý users, cấu hình hệ thống'
        };

        const mailOptions = {
          from: `"HinWarehouse System" <${process.env.SMTP_USER}>`,
          to: recipientEmail,
          subject: 'Thay đổi quyền truy cập - Warehouse Management System',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Thông báo thay đổi quyền truy cập</h2>
              <p>Xin chào <strong>${currentRoleData.fullName || 'Người dùng'}</strong>,</p>
              <p>Quyền truy cập của bạn đã được thay đổi bởi Super Admin:</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Quyền cũ:</strong> ${oldRole ? oldRole.toUpperCase() : 'UNKNOWN'}</p>
                <p><strong>Quyền mới:</strong> ${newRole.toUpperCase()}</p>
                <p><strong>Mô tả quyền mới:</strong> ${roleDescriptions[newRole]}</p>
              </div>
              <p><strong>Lưu ý quan trọng:</strong></p>
              <ul>
                <li>Tất cả thông tin tài khoản của bạn được giữ nguyên (username, mật khẩu, warehouse) nếu hệ thống lưu mật khẩu tập trung.</li>
                <li>Bạn có thể đăng nhập bình thường với thông tin cũ</li>
                <li>Giao diện sẽ thay đổi theo quyền mới của bạn</li>
                <li>Nếu có thắc mắc, vui lòng liên hệ Super Admin</li>
              </ul>
              <p>Thời gian thay đổi: ${new Date().toLocaleString('vi-VN')}</p>
              <p>Trân trọng,<br>Warehouse Management System</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log('Email notification sent to', recipientEmail);
      } catch (mailErr) {
        console.error('Failed to send notification email (non-blocking):', mailErr);
      }
    })();

    // Response
    res.json({
      success: true,
      message: 'User role changed successfully',
      data: {
        userId: targetUser._id,
        oldRole,
        newRole,
        userEmail: currentRoleData.email,
        userName: currentRoleData.fullName
      }
    });

  } catch (error) {
    // Attempt to record failed audit log (best-effort)
    try {
      const superAdmin = await User.findById(req.user.sub);
      await AuditLog.create({
        category: 'SYSTEM',
        action: 'CHANGE_ROLE',
        actor: {
          id: superAdmin?._id,
          email: superAdmin?.admin?.email || null,
          name: superAdmin?.admin?.fullName || null,
          role: superAdmin?.admin?.role || 'admin'
        },
        target: {
          type: 'User',
          id: req.body.userId
        },
        before: null,
        after: null,
        reason: req.body.reason || 'Role change attempt by Super Admin',
        outcome: 'FAILED',
        error: error.message,
        meta: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          fromRole: req.body.oldRole,
          toRole: req.body.newRole,
          reason: req.body.reason
        },
        createdAt: new Date()
      });
    } catch (auditError) {
      console.error('Failed to log failed audit trail (best-effort):', auditError);
    }

    try { await session.abortTransaction(); session.endSession(); } catch (e) {}
    console.error('❌ Error changing user role:', error);
    next(error);
  }
};

// Get available roles for role change
exports.getAvailableRoles = async (req, res, next) => {
  try {
    const { currentRole } = req.query;

    const roleTransitions = {
      'staff': [
        { value: 'manager', label: 'Manager', description: 'Quản lý staff, xem báo cáo, quản lý xuất nhập kho' },
        { value: 'accounter', label: 'Accounter', description: 'Duyệt hóa đơn, quản lý tài chính' },
        { value: 'admin', label: 'Admin', description: 'Quản lý toàn bộ hệ thống, quản lý users, cấu hình hệ thống' }
      ],
      'manager': [
        { value: 'staff', label: 'Staff', description: 'Quản lý xuất nhập kho, tạo hóa đơn' },
        { value: 'accounter', label: 'Accounter', description: 'Duyệt hóa đơn, quản lý tài chính' },
        { value: 'admin', label: 'Admin', description: 'Quản lý toàn bộ hệ thống, quản lý users, cấu hình hệ thống' }
      ],
      'accounter': [
        { value: 'staff', label: 'Staff', description: 'Quản lý xuất nhập kho, tạo hóa đơn' },
        { value: 'manager', label: 'Manager', description: 'Quản lý staff, xem báo cáo, quản lý xuất nhập kho' },
        { value: 'admin', label: 'Admin', description: 'Quản lý toàn bộ hệ thống, quản lý users, cấu hình hệ thống' }
      ],
      'admin': [
        { value: 'staff', label: 'Staff', description: 'Quản lý xuất nhập kho, tạo hóa đơn' },
        { value: 'manager', label: 'Manager', description: 'Quản lý staff, xem báo cáo, quản lý xuất nhập kho' },
        { value: 'accounter', label: 'Accounter', description: 'Duyệt hóa đơn, quản lý tài chính' }
      ]
    };

    if (currentRole && !Object.prototype.hasOwnProperty.call(roleTransitions, currentRole)) {
      return res.status(200).json({
        success: true,
        availableRoles: []
      });
    }

    const availableRoles = currentRole ? (roleTransitions[currentRole] || []) : [].concat(...Object.values(roleTransitions));

    res.json({
      success: true,
      availableRoles
    });
  } catch (error) {
    console.error('❌ Error getting available roles:', error);
    next(error);
  }
};

// Get role change history (Super Admin only)
exports.getRoleChangeHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { userId = null } = req.query;

    const query = {
      category: 'SYSTEM',
      action: 'CHANGE_ROLE'
    };

    if (userId) {
      query['target.id'] = userId;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      roleChangeHistory: logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('❌ Error getting role change history:', error);
    next(error);
  }
};
