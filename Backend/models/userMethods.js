// userMethods.js
const bcrypt = require('bcryptjs');
module.exports = function applyUserMethods(schema) {
  
  schema.pre('save', async function(next) {
    // ensure only the subdoc for this.role remains
    const validRoles = ['admin', 'manager', 'staff', 'accounter'];
    validRoles.forEach(roleKey => {
      if (roleKey !== this.role) {
        this[roleKey] = undefined;
      }
    });

    // Hash password for active role if needed
    const active = this[this.role];
    if (active && active.password) {
      // If password doesn't look like bcrypt hash, hash it
      if (typeof active.password === 'string' && !active.password.startsWith('$2')) {
        const hashed = await bcrypt.hash(active.password, 10);
        active.password = hashed;
      }
    }

    next();
  });
    schema.statics.hashPassword = async function(plain) {
    if (!plain) return plain;
    if (typeof plain === 'string' && plain.startsWith('$2')) return plain;
    return await bcrypt.hash(plain, 10);
  };

  // === STATIC METHODS ===
  schema.statics.ensureIndexes = async function() {
    try {
      // Xóa các indexes cũ (trừ _id)
      const existingIndexes = await this.collection.getIndexes();
      const indexNames = Object.keys(existingIndexes).filter(name => name !== '_id_');
      
      if (indexNames.length > 0) {
        await Promise.all(indexNames.map(name => {
          try {
            return this.collection.dropIndex(name);
          } catch (err) {
            console.warn(`Could not drop index ${name}:`, err.message);
            return Promise.resolve();
          }
        }));
      }

      // Tạo partial unique indexes mới (đơn giản hóa partialFilterExpression)
      await Promise.all([
        this.collection.createIndex(
          { 'admin.username': 1 },
          { 
            unique: true, 
            partialFilterExpression: { 
              role: 'admin',
              'admin.username': { $exists: true }
            },
            name: 'admin_username_unique'
          }
        ),
        this.collection.createIndex(
          { 'manager.username': 1 },
          { 
            unique: true, 
            partialFilterExpression: { 
              role: 'manager',
              'manager.username': { $exists: true }
            },
            name: 'manager_username_unique'
          }
        ),
        this.collection.createIndex(
          { 'staff.username': 1 },
          { 
            unique: true, 
            partialFilterExpression: { 
              role: 'staff',
              'staff.username': { $exists: true }
            },
            name: 'staff_username_unique'
          }
        ),
        this.collection.createIndex(
          { 'accounter.username': 1 },
          { 
            unique: true, 
            partialFilterExpression: { 
              role: 'accounter',
              'accounter.username': { $exists: true }
            },
            name: 'accounter_username_unique'
          }
        )
      ]);
      
      console.log('✅ User indexes created successfully!');
    } catch (error) {
      console.error('❌ Error creating User indexes:', error);
      throw error;
    }
  };

  // === INSTANCE METHODS ===
  schema.methods.getActiveRole = function() {
    return this[this.role];
  };

  schema.methods.getEmail = function() {
    const activeRole = this.getActiveRole();
    return activeRole ? activeRole.email : null;
  };

  schema.methods.getFullName = function() {
    const activeRole = this.getActiveRole();
    return activeRole ? activeRole.fullName : null;
  };

  schema.methods.getUsername = function() {
    const activeRole = this.getActiveRole();
    return activeRole ? activeRole.username : null;
  };

  schema.methods.getStatus = function() {
    const activeRole = this.getActiveRole();
    return activeRole ? activeRole.status : 'inactive';
  };

  schema.methods.isActive = function() {
    const activeRole = this.getActiveRole();
    return activeRole ? (activeRole.status === 'active' && activeRole.isActive) : false;
  };

  schema.methods.canResetPassword = function() {
    const activeRole = this.getActiveRole();
    if (!activeRole) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (activeRole.lastResetAt && activeRole.lastResetAt >= today) {
      return activeRole.resetCount < 3;
    }
    return true;
  };

  schema.methods.setResetToken = function(token, expiresIn = 24) {
    const activeRole = this.getActiveRole();
    if (!activeRole) return false;
    
    activeRole.resetToken = token;
    activeRole.resetTokenExpires = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
    
    return this.save();
  };

  schema.methods.clearResetToken = function() {
    const activeRole = this.getActiveRole();
    if (!activeRole) return false;
    
    activeRole.resetToken = undefined;
    activeRole.resetTokenExpires = undefined;
    activeRole.resetRequestId = undefined;
    
    return this.save();
  };

  schema.methods.incrementResetCount = function() {
    const activeRole = this.getActiveRole();
    if (!activeRole) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!activeRole.lastResetAt || activeRole.lastResetAt < today) {
      activeRole.resetCount = 1;
    } else {
      activeRole.resetCount = (activeRole.resetCount || 0) + 1;
    }
    
    activeRole.lastResetAt = new Date();
    return this.save();
  };

  schema.methods.updatePassword = function(newPassword) {
    const activeRole = this.getActiveRole();
    if (!activeRole) return false;
    
    activeRole.password = newPassword; // Remember to hash this in production
    activeRole.lastPasswordChangeAt = new Date();
    activeRole.mustChangePassword = false;
    
    // Clear reset tokens
    activeRole.resetToken = undefined;
    activeRole.resetTokenExpires = undefined;
    activeRole.resetRequestId = undefined;
    
    return this.save();
  };

  schema.methods.setWarehouse = function(warehouseId) {
    const activeRole = this.getActiveRole();
    if (!activeRole) return false;
    
    // Only manager, staff, and accounter have warehouseId
    if (this.role === 'manager' || this.role === 'staff' || this.role === 'accounter') {
      activeRole.warehouseId = warehouseId;
      return this.save();
    }
    
    return false;
  };

  schema.methods.toSafeObject = function() {
    const obj = this.toObject();
    
    // Remove password from the active role
    if (obj[this.role] && obj[this.role].password) {
      delete obj[this.role].password;
    }
    
    // Remove resetToken (sensitive info)
    if (obj[this.role] && obj[this.role].resetToken) {
      delete obj[this.role].resetToken;
    }
    
    return obj;
  };

  // Validation method
  schema.methods.validateRole = function() {
    const validRoles = ['admin', 'manager', 'staff', 'accounter'];
    if (!validRoles.includes(this.role)) {
      throw new Error(`Invalid role: ${this.role}`);
    }
    
    const activeRole = this.getActiveRole();
    if (!activeRole) {
      throw new Error(`Missing data for role: ${this.role}`);
    }
    
    // Role-specific validations
    if ((this.role === 'manager' || this.role === 'staff' || this.role === 'accounter') && !activeRole.warehouseId) {
      throw new Error(`${this.role} must have warehouseId`);
    }
    
    return true;
  };
};