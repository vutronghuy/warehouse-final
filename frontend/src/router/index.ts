import { createRouter, createWebHistory } from 'vue-router';

import routes from './routes';
import MainLayout from '@/shared/layout/MainLayout/index.vue';
import { authGuard } from '@/core';

// Function để redirect sau khi login thành công
export function redirectAfterLogin(router: any) {
  const redirectPath = new URLSearchParams(window.location.search).get('redirect');
  if (redirectPath) {
    router.push(redirectPath);
  } else {
    // Redirect về trang mặc định dựa trên role
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role;
        const isSuperAdmin = payload.isSuperAdmin;

        switch (role) {
          case 'admin':
            router.push(isSuperAdmin ? '/Superadmin' : '/admin');
            break;
          case 'manager':
            router.push('/manager');
            break;
          case 'staff':
            router.push('/staff');
            break;
          case 'accounter':
            router.push('/accouter');
            break;
          default:
            router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '',
      component: MainLayout,
      children: routes,
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const guard = await authGuard({ to });

  if (guard.canAccess) {
    return next();
  }

  return next(guard.redirectTo);
});

export default router;
