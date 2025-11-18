// Backend API endpoint để toggle user status
// Thêm vào UserController.js hoặc tạo route riêng

const User = require('../models/User');
const mongoose = require('mongoose');

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const requesterId = req.user?.id;

    // Validate input
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid user ID format." });
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'active' or 'inactive'." });
    }

    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check permissions (only super admin can toggle status)
    const requester = await User.findById(requesterId);
    if (!requester || !requester.admin?.isSuperAdmin) {
      return res.status(403).json({ message: "Forbidden: Only super admin can toggle user status." });
    }

    // Prevent deactivating self
    if (user._id.toString() === requesterId) {
      return res.status(400).json({ message: "Cannot deactivate your own account." });
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
      [`${role}.isActive`]: status === 'active'
    };

    // Add audit fields
    if (status === 'inactive') {
      updateData[`${role}.deactivatedBy`] = requesterId;
      updateData[`${role}.deactivatedAt`] = new Date();
      updateData[`${role}.deactivationReason`] = 'Account deactivated by super admin';
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
    if (status === 'inactive') {
      // TODO: Implement session/token invalidation
      // This could involve:
      // 1. Adding user to a blacklist in Redis
      // 2. Updating JWT secret for the user
      // 3. Sending socket event to force logout
      
      console.log(`User ${user._id} has been deactivated. All sessions should be invalidated.`);
      
      // Emit socket event to force logout
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${user._id}`).emit('force-logout', {
          message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ với quản trị viên.',
          reason: 'account_deactivated'
        });
      }
    }

    // Send email notification (optional)
    if (status === 'inactive') {
      // TODO: Send email notification to user
      console.log(`Email notification should be sent to user about account deactivation.`);
    }

    res.json({
      success: true,
      message: `User status updated to ${status} successfully.`,
      user: {
        id: updatedUser._id,
        role: updatedUser.role,
        status: status,
        username: updatedUser[role]?.username,
        fullName: updatedUser[role]?.fullName
      }
    });

  } catch (error) {
    console.error('Error toggling user status:', error);
    next(error);
  }
};

// Middleware để check user status trong authentication
exports.checkUserStatus = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    const role = user.role;
    const userStatus = user[role]?.status;
    const isActive = user[role]?.isActive;

    // Check if user is active
    if (userStatus !== 'active' || !isActive) {
      return res.status(403).json({ 
        message: "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ với quản trị viên.",
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    next();
  } catch (error) {
    console.error('Error checking user status:', error);
    next(error);
  }
};

