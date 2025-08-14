const express = require('express');
const router = express.Router();

const warehouseController = require('../controller/WarehouseController');

router.post('/create', warehouseController.createWarehouse);
router.get('/:id', warehouseController.getWarehouseById);
router.get('/', warehouseController.getAllWarehouses);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);
module.exports = router;