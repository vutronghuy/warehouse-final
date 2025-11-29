/**
 * API v1 Routes
 * Centralized route registration for API version 1
 */

const express = require('express');
const router = express.Router();

// Import all route modules
const supplierRoute = require('../SupplierRoute');
const categoryRoute = require('../CategoryRoute');
const productRoute = require('../ProductRoute');
const warehouseRoute = require('../WarehouseRouteNew');
const userRoute = require('../UserRoute');
const authRoute = require('../authRoute');
const customerRoute = require('../CustomerRoute');
const exportRoute = require('../ExportRoute');
const importRoute = require('../ImportRoute');
const exportReceiptRoute = require('../ExportReceiptRoute');
const invoiceRoute = require('../InvoiceRoute');
const targetRoute = require('../TargetRoute');
const reportsRoute = require('../reports');
const auditRoute = require('../auditRoute');
const userRoleRoute = require('../userRoleRoute');
const chatRoute = require('../chatRoute');
const inventoryRoute = require('../inventoryRoute');

// Register all routes with /v1 prefix
router.use('/suppliers', supplierRoute);
router.use('/categories', categoryRoute);
router.use('/customers', customerRoute);
router.use('/products', productRoute);
router.use('/warehouses', warehouseRoute);
router.use('/users', userRoute);
router.use('/auth', authRoute);
router.use('/export-receipts', exportReceiptRoute);
router.use('/invoices', invoiceRoute);
router.use('/export', exportRoute);
router.use('/import', importRoute);
router.use('/targets', targetRoute);
router.use('/reports', reportsRoute);
router.use('/audit', auditRoute);
router.use('/user-roles', userRoleRoute);
router.use('/chat', chatRoute);
router.use('/inventory', inventoryRoute);

module.exports = router;

