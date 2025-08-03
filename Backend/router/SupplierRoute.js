const express = require('express');
const router = express.Router();

const supplierController = require('../controller/SupplierController')

router.post('/create', supplierController.createSupplier);

module.exports = router;