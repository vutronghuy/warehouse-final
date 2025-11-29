import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

// Kiểm tra xem user đã đăng nhập chưa
export function isAuthenticated(): boolean {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return !!token;
}

// Kiểm tra role của user
export function getUserRole(): string | null {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) return null;

    // Decode JWT token để lấy role (simple decode, không verify)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Kiểm tra xem user có phải super admin không
export function isSuperAdmin(): boolean {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.log('🔐 isSuperAdmin: No token found');
      return false;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check multiple ways: boolean true, string 'true', or number 1
    const isSuper = payload.isSuperAdmin === true ||
                    payload.isSuperAdmin === 'true' ||
                    payload.isSuperAdmin === 1 ||
                    String(payload.isSuperAdmin).toLowerCase() === 'true';

    console.log('🔐 isSuperAdmin check:', {
      isSuperAdmin: payload.isSuperAdmin,
      type: typeof payload.isSuperAdmin,
      result: isSuper,
      rawValue: payload.isSuperAdmin
    });
    return isSuper;
  } catch (error) {
    console.error('❌ Error in isSuperAdmin:', error);
    return false;
  }
}

// Route guard cho các trang yêu cầu đăng nhập
export function requireAuth(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  if (isAuthenticated()) {
    next(); // Cho phép truy cập
  } else {
    // Chuyển hướng về trang login
    next({
      path: '/login',
      query: { redirect: to.fullPath } // Lưu đường dẫn để redirect sau khi login
    });
  }
}

// Persistent logging helper
const persistentLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, message, data: data ? JSON.stringify(data) : null };
  try {
    const logs = JSON.parse(localStorage.getItem('router_logs') || '[]');
    logs.push(logEntry);
    // Keep only last 100 logs
    if (logs.length > 100) logs.shift();
    localStorage.setItem('router_logs', JSON.stringify(logs));
  } catch (e) {
    // Ignore storage errors
  }
  console.log(message, data || '');
};

// Route guard cho super admin
export function requireSuperAdmin(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  persistentLog('🔒 requireSuperAdmin guard triggered', { path: to.path, fullPath: to.fullPath });
  console.log('🔒 requireSuperAdmin guard triggered for:', to.path);

  const isAuth = isAuthenticated();
  persistentLog('🔐 isAuthenticated', { result: isAuth });
  console.log('🔐 isAuthenticated:', isAuth);

  if (!isAuth) {
    persistentLog('❌ Not authenticated, redirecting to login');
    console.log('❌ Not authenticated, redirecting to login');
    next({
      path: '/login',
      query: { redirect: to.fullPath } // Use 'redirect' to match Login.vue
    });
    return;
  }

  const isSuper = isSuperAdmin();
  const role = getUserRole();
  persistentLog('👤 Role check', { role, isSuperAdmin: isSuper });
  console.log('👤 Role:', role, 'isSuperAdmin:', isSuper);

  // Try to get token payload for debugging
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      persistentLog('📋 Token payload', payload);
      console.log('📋 Token payload:', {
        role: payload.role,
        isSuperAdmin: payload.isSuperAdmin,
        exp: payload.exp,
        iat: payload.iat
      });
    }
  } catch (error) {
    persistentLog('❌ Error decoding token', { error: error.message });
    console.error('❌ Error decoding token:', error);
  }

  if (isSuper) {
    persistentLog('✅ Super admin access granted');
    console.log('✅ Super admin access granted');
    next();
  } else {
    persistentLog('❌ Not super admin, redirecting based on role', { role });
    console.log('❌ Not super admin, redirecting based on role');
    // Không có quyền, chuyển về trang phù hợp với role
    switch (role) {
      case 'admin':
        next('/admin');
        break;
      case 'manager':
        next('/manager');
        break;
      case 'staff':
        next('/staff');
        break;
      case 'accounter':
        next('/accounter');
        break;
      default:
        next({
          path: '/login',
          query: { redirect: to.fullPath } // Use 'redirect' to match Login.vue
        });
    }
  }
}

// Route guard cho admin (bao gồm cả super admin)
export function requireAdmin(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  if (!isAuthenticated()) {
    next('/login');
    return;
  }

  const role = getUserRole();
  if (role === 'admin' || isSuperAdmin()) {
    next();
  } else {
    // Chuyển về trang phù hợp với role
    switch (role) {
      case 'manager':
        next('/manager');
        break;
      case 'staff':
        next('/staff');
        break;
      case 'accounter':
        next('/accounter');
        break;
      default:
        next('/login');
    }
  }
}

// Route guard cho role cụ thể
export function requireRole(allowedRoles: string[]) {
  return (
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ) => {
    if (!isAuthenticated()) {
      next('/login');
      return;
    }

    const role = getUserRole();
    if (role && allowedRoles.includes(role)) {
      next();
    } else {
      // Không có quyền, chuyển về trang mặc định của role
      switch (role) {
        case 'admin':
          next(isSuperAdmin() ? '/Superadmin' : '/admin');
          break;
        case 'manager':
          next('/manager');
          break;
        case 'staff':
          next('/staff');
          break;
        case 'accounter':
          next('/accounter');
          break;
        default:
          next('/login');
      }
    }
  };
}

// Route guard để ngăn user đã login truy cập trang login
export function redirectIfAuthenticated(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  if (isAuthenticated()) {
    // Đã đăng nhập, chuyển về trang phù hợp
    const role = getUserRole();
    switch (role) {
      case 'admin':
        next(isSuperAdmin() ? '/Superadmin' : '/admin');
        break;
      case 'manager':
        next('/manager');
        break;
      case 'staff':
        next('/staff');
        break;
      case 'accounter':
        next('/accounter');
        break;
      default:
        next('/');
    }
  } else {
    next(); // Chưa đăng nhập, cho phép truy cập trang login
  }
}
