# Hướng dẫn thêm API toggle user status

## 1. Thêm vào UserController.js

Thêm method `toggleUserStatus` vào file `Backend/controller/UserController.js`:

```javascript
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
```

## 2. Thêm route vào UserRoute.js

Thêm route vào file `Backend/router/UserRoute.js`:

```javascript
// Thêm import
const { toggleUserStatus } = require('../controller/UserController');

// Thêm route
router.put('/:id/toggle-status', authenticate, toggleUserStatus);
```

## 3. Thêm middleware check user status

Thêm middleware vào authentication để check user status:

```javascript
// Trong middleware/auth.js hoặc authenticate.js
const checkUserStatus = async (req, res, next) => {
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

// Sử dụng middleware này trong các route cần authentication
router.use(authenticate, checkUserStatus);
```

## 4. Frontend xử lý force logout

Thêm vào frontend để xử lý force logout event:

```javascript
// Trong main.ts hoặc App.vue
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

socket.on('force-logout', (data) => {
  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
  // Show notification
  toast.error(data.message);
  
  // Redirect to login
  router.push('/login');
});
```

## 5. Test API

Test API với Postman hoặc curl:

```bash
# Toggle user to inactive
PUT http://localhost:3001/api/users/{userId}/toggle-status
Headers: Authorization: Bearer {token}
Body: { "status": "inactive" }

# Toggle user to active
PUT http://localhost:3001/api/users/{userId}/toggle-status
Headers: Authorization: Bearer {token}
Body: { "status": "active" }
```

