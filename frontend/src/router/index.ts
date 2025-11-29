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

// Persistent logging to localStorage
const persistentLog = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, message, data };
  try {
    const logs = JSON.parse(localStorage.getItem('router_logs') || '[]');
    logs.push(logEntry);
    // Keep only last 50 logs
    if (logs.length > 50) logs.shift();
    localStorage.setItem('router_logs', JSON.stringify(logs));
  } catch (e) {
    // Ignore storage errors
  }
  console.log(message, data || '');
};

router.beforeEach(async (to, from, next) => {
  const logMsg = `🚦 Router beforeEach: ${to.path} from: ${from.path}`;
  persistentLog(logMsg);
  console.log(logMsg);

  const guard = await authGuard({ to });
  persistentLog('🛡️ authGuard result:', guard);
  console.log('🛡️ authGuard result:', guard);

  if (guard.canAccess) {
    persistentLog('✅ authGuard allows access, continuing to route guard');
    console.log('✅ authGuard allows access, continuing to route guard');
    return next();
  }

  persistentLog('❌ authGuard blocks access, redirecting to:', guard.redirectTo);
  console.log('❌ authGuard blocks access, redirecting to:', guard.redirectTo);
  return next(guard.redirectTo);
});

router.afterEach((to, from) => {
  const logMsg = `✅ Router afterEach - Navigation completed to: ${to.path}`;
  persistentLog(logMsg);
  console.log(logMsg);
});

router.onError((error) => {
  persistentLog('❌ Router error:', error);
  console.error('❌ Router error:', error);
  console.error('Error stack:', error?.stack);
});

export default router;
