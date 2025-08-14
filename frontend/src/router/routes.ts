import type { RouteRecordRaw } from 'vue-router';

import { RouteName } from '@/shared/constants';
// import Homepage from '@/modules/homepage/index.vue';
import NotFound from '@/modules/notFound/index.vue';
import Admin_Super from '@/modules/Admin/admin_super/SuperAdmin.vue';
import SuperAdminDashboard from '@/modules/Admin/admin_super/Dashboard.vue';
import SupplierTable from '@/modules/Admin/admin_super/Supplier/SupplierTable.vue';
import Login from '@/modules/Auth/Login.vue';
import Admin from '@/modules/Admin/Admin/Admin.vue';
import Manager from '@/modules/User/manager.vue';
import Accounter from '@/modules/User/accounter.vue';
import Staff from '@/modules/User/staff.vue';
import EnterEmail from '@/modules/Forgot/EnterEmail.vue';
import EnterOTP from '@/modules/Forgot/EnterOTP.vue';
import EnterNewPassword from '@/modules/Forgot/EnterNewPassword.vue';
import RouteProtectionTest from '@/components/RouteProtectionTest.vue';

// Import route guards
import {
  requireAuth,
  requireSuperAdmin,
  requireAdmin,
  requireRole,
  redirectIfAuthenticated
} from './guards';
const routes: RouteRecordRaw[] = [
  // Redirect root path to login
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/:pathMatch(.*)*',
    name: RouteName.NotFound,
    component: NotFound,
  },
  // {
  //   path: '',
  //   name: RouteName.HOMEPAGE,
  //   component: Homepage,
  //   meta: { layout: 'defaultNoHeader' },
  // },
  {
    path: '/Superadmin',
    name: RouteName.ADMIN_SUPER,
    component: SuperAdminDashboard, // Dashboard cho SuperAdmin
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireSuperAdmin, // Chỉ super admin mới vào được
  },
  {
    path: '/Superadmin/users',
    name: 'SuperAdminUsers',
    component: Admin_Super, // Trang CRUD users
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireSuperAdmin,
  },
  {
    path: '/Superadmin/suppliers',
    name: 'SuperAdminSuppliers',
    component: SupplierTable, // Trang CRUD suppliers
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireSuperAdmin,
  },
  {
    path: '/admin',
    name: RouteName.ADMIN,
    component: Admin,
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireAdmin, // Admin và super admin vào được
  },
  {
    path: '/manager',
    name: RouteName.MANAGER,
    component: Manager,
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireRole(['manager']), // Chỉ manager vào được
  },
  {
    path: '/staff',
    name: RouteName.STAFF,
    component: Staff,
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireRole(['staff']), // Chỉ staff vào được
  },
  {
    path: '/accouter',
    name: RouteName.ACCOUNTER,
    component: Accounter,
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireRole(['accounter']), // Chỉ accounter vào được
  },
  {
    path: '/login',
    name: RouteName.LOGIN,
    component: Login,
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: redirectIfAuthenticated, // Nếu đã login thì redirect về trang phù hợp
  },
  {
    path: '/forgot/email',
    name: 'ForgotEmail',
    component: EnterEmail,
    meta: { layout: 'defaultNoHeader' },
  },
  {
    path: '/forgot/otp',
    name: 'ForgotOTP',
    component: EnterOTP,
    meta: { layout: 'defaultNoHeader' },
  },
  {
    path: '/forgot/new-password',
    name: 'ForgotNewPassword',
    component: EnterNewPassword,
    meta: { layout: 'defaultNoHeader' },
  },
  {
    path: '/test-routes',
    name: 'RouteTest',
    component: RouteProtectionTest,
    meta: { layout: 'defaultNoHeader' },
  },
];

export default routes;
