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
    if (!token) return false;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.isSuperAdmin === true;
  } catch (error) {
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

// Route guard cho super admin
export function requireSuperAdmin(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  if (!isAuthenticated()) {
    next('/login');
    return;
  }

  if (isSuperAdmin()) {
    next();
  } else {
    // Không có quyền, chuyển về trang phù hợp với role
    const role = getUserRole();
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
        next('/login');
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
