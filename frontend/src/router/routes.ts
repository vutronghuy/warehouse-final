import type { RouteRecordRaw } from 'vue-router';

import { RouteName } from '@/shared/constants';
// import Homepage from '@/modules/homepage/index.vue';
import NotFound from '@/modules/notFound/index.vue';
import Admin_Super from '@/modules/Admin/admin_super/SuperAdmin.vue';
import SuperAdminDashboard from '@/modules/Admin/admin_super/Dashboard.vue';
import SupplierTable from '@/modules/Admin/admin_super/Supplier/SupplierTable.vue';
import CategoryTable from '@/modules/Admin/admin_super/Category/CategoryTable.vue';
import CustomerTable from '@/modules/Admin/admin_super/Customer/CustomerTable.vue';
import TargetTable from '@/modules/Admin/admin_super/Target.vue';
import ProductTable from '@/modules/Admin/admin_super/Product/ProductTable.vue';
import WarehouseTable from '@/modules/Admin/admin_super/Warehouse/WarehouseTable.vue';
import Login from '@/modules/Auth/Login.vue';
import Admin from '@/modules/Admin/Admin/Admin.vue';
import Manager from '@/modules/User/managers/manager.vue';
import Accounter from '@/modules/User/accounters/accounterHeader.vue';
import Staff from '@/modules/User/staffs/staff.vue';
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
    path: '/Superadmin/categories',
    name: 'SuperAdminCategories',
    component: CategoryTable, // Trang CRUD categories
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireSuperAdmin,
  },
    {
    path: '/Superadmin/target',
    name: 'SuperAdminTarget',
    component: TargetTable, // Trang CRUD categories
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireSuperAdmin,
  },
  {
    path: '/Superadmin/customers',
    name: 'SuperAdminCustomers',
    component: CustomerTable, // Trang CRUD customers
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireSuperAdmin,
  },
  {
    path: '/Superadmin/products',
    name: 'SuperAdminProducts',
    component: () => import('../modules/Admin/admin_super/product/MinStockManager.vue'), // Min Stock Management
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireSuperAdmin,
  },
  {
    path: '/Superadmin/products/table',
    name: 'SuperAdminProductTable',
    component: ProductTable, // Product Table
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireSuperAdmin,
  },
  {
    path: '/Superadmin/warehouses',
    name: 'SuperAdminWarehouses',
    component: WarehouseTable, // Trang CRUD warehouses
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireSuperAdmin,
  },
  {
    path: '/Superadmin/inventory',
    name: 'SuperAdminInventory',
    component: () => {
      console.log('📦 Loading InventoryTable component...');
      try {
        return import('@/modules/Admin/admin_super/Inventory/InventoryTable.vue').then(module => {
          console.log('✅ InventoryTable component loaded successfully');
          return module;
        }).catch(error => {
          console.error('❌ Error loading InventoryTable component:', error);
          throw error;
        });
      } catch (error) {
        console.error('❌ Error in InventoryTable import:', error);
        throw error;
      }
    },
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireSuperAdmin,
  },
  {
    path: '/Superadmin/inventory/transactions',
    name: 'SuperAdminInventoryTransactions',
    component: () => {
      console.log('📦 Loading InventoryTransactionTable component...');
      try {
        return import('@/modules/Admin/admin_super/Inventory/InventoryTransactionTable.vue').then(module => {
          console.log('✅ InventoryTransactionTable component loaded successfully');
          return module;
        }).catch(error => {
          console.error('❌ Error loading InventoryTransactionTable component:', error);
          throw error;
        });
      } catch (error) {
        console.error('❌ Error in InventoryTransactionTable import:', error);
        throw error;
      }
    },
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
    path: '/admin/products',
    name: 'AdminProducts',
    component: () => import('../modules/Admin/Admin/ProductManagement.vue'), // Admin Product Management
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireAdmin,
  },
    {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../modules/Admin/Admin/AdminDashboard.vue'), // Admin Product Management
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireAdmin,
  },
  {
    path: '/admin/export-approval',
    name: 'AdminExportApproval',
    component: () => import('../modules/Admin/Admin/ExportApproval.vue'),
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireAdmin,
  },
  {
    path: '/manager',
    name: RouteName.MANAGER,
    component: Manager,
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireRole(['manager']), // Chỉ manager vào được
  },
  {
    path: '/manager/export-review',
    name: 'ManagerExportReview',
    component: () => import('../modules/User/managers/ExportReview.vue'),
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireRole(['manager']),
  },
  {
    path: '/manager/users',
    name: 'ManagerUsers',
    component: () => import('../modules/User/managers/ManagerUsers.vue'),
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireRole(['manager']),
  },
  {
    path: '/staff',
    name: RouteName.STAFF,
    component: Staff,
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireRole(['staff']), // Chỉ staff vào được
  },
  {
    path: '/accounter',
    name: RouteName.ACCOUNTER,
    component: Accounter,
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireRole(['accounter']), // Chỉ accounter vào được
  },
  {
    path: '/accounter/invoices-review',
    name: 'AccounterInvoicesReview',
    component: () => import('../modules/User/accounters/InvoiceReview.vue'),
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireRole(['accounter']),
  },
  {
    path: '/accounter/dashboard',
    name: 'AccounterDashboard',
    component: () => import('../modules/User/accounters/AccounterDashboardSimple.vue'),
    meta: { layout: 'defaultNoHeader' },
    beforeEnter: requireRole(['accounter']),
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
