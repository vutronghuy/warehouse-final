/**
 * Service để tự động tạo InventoryTransaction khi có thay đổi tồn kho
 */

const InventoryTransaction = require('../models/inventory/InventoryTransaction');
const Inventory = require('../models/warehouse/Inventory');
const Product = require('../models/products/product');

/**
 * Tạo transaction log khi có thay đổi tồn kho
 * @param {Object} params
 * @param {ObjectId} params.productId - Product ID
 * @param {ObjectId} params.warehouseId - Warehouse ID
 * @param {String} params.transactionType - import, export, adjustment, reservation, release
 * @param {Number} params.quantityChange - Số lượng thay đổi (+ hoặc -)
 * @param {String} params.referenceId - ID của ImportReceipt, ExportReceipt, etc.
 * @param {ObjectId} params.createdBy - User ID
 * @param {String} params.batchNumber - Batch number (optional)
 * @param {String} params.notes - Notes (optional)
 */
async function createInventoryTransaction(params) {
  try {
    const {
      productId,
      warehouseId,
      transactionType,
      quantityChange,
      referenceId,
      createdBy,
      batchNumber,
      notes
    } = params;

    // Validation
    if (!productId || !warehouseId || !transactionType || quantityChange === undefined || !createdBy) {
      console.error('❌ Missing required parameters for inventory transaction');
      return null;
    }

    // Lấy quantity hiện tại từ Inventory hoặc Product
    let quantityBefore = 0;
    
    // Thử lấy từ Inventory model trước
    const inventory = await Inventory.findOne({ productId, warehouseId }).lean();
    if (inventory) {
      quantityBefore = inventory.quantity || 0;
    } else {
      // Fallback: lấy từ Product model
      const product = await Product.findOne({ _id: productId, warehouseId }).lean();
      if (product) {
        quantityBefore = product.quantity || 0;
      }
    }

    const quantityAfter = Math.max(0, quantityBefore + quantityChange);

    // Tạo transaction
    const transaction = await InventoryTransaction.create({
      productId,
      warehouseId,
      transactionType,
      referenceId: referenceId || `AUTO-${Date.now()}`,
      quantityChange,
      quantityBefore,
      quantityAfter,
      batchNumber: batchNumber || '',
      notes: notes || '',
      createdBy
    });

    console.log(`✅ Inventory transaction created: ${transactionType} - ${quantityChange > 0 ? '+' : ''}${quantityChange} (${quantityBefore} → ${quantityAfter})`);
    
    return transaction;
  } catch (error) {
    console.error('❌ Error creating inventory transaction:', error);
    // Không throw error để không ảnh hưởng đến flow chính
    return null;
  }
}

/**
 * Tạo transaction khi import được approve
 */
async function logImportTransaction(importReceipt, createdBy) {
  try {
    if (!importReceipt || !importReceipt.details || importReceipt.details.length === 0) {
      return;
    }

    const transactions = [];

    for (const detail of importReceipt.details) {
      const transaction = await createInventoryTransaction({
        productId: detail.productId,
        warehouseId: importReceipt.warehouseId,
        transactionType: 'import',
        quantityChange: detail.quantity || 0,
        referenceId: importReceipt._id?.toString() || importReceipt.receiptNumber,
        createdBy,
        batchNumber: detail.batchNumber,
        notes: `Import from receipt ${importReceipt.receiptNumber}`
      });

      if (transaction) {
        transactions.push(transaction);
      }
    }

    return transactions;
  } catch (error) {
    console.error('❌ Error logging import transaction:', error);
    return [];
  }
}

/**
 * Tạo transaction khi export được approve
 */
async function logExportTransaction(exportReceipt, createdBy) {
  try {
    if (!exportReceipt || !exportReceipt.details || exportReceipt.details.length === 0) {
      return;
    }

    const transactions = [];

    for (const detail of exportReceipt.details) {
      const transaction = await createInventoryTransaction({
        productId: detail.productId,
        warehouseId: exportReceipt.warehouseId,
        transactionType: 'export',
        quantityChange: -(detail.quantity || 0), // Negative for export
        referenceId: exportReceipt._id?.toString() || exportReceipt.receiptNumber,
        createdBy,
        notes: `Export from receipt ${exportReceipt.receiptNumber}`
      });

      if (transaction) {
        transactions.push(transaction);
      }
    }

    return transactions;
  } catch (error) {
    console.error('❌ Error logging export transaction:', error);
    return [];
  }
}

/**
 * Tạo transaction khi export được tạo (reservation)
 */
async function logExportReservation(exportReceipt, createdBy) {
  try {
    if (!exportReceipt || !exportReceipt.details || exportReceipt.details.length === 0) {
      return;
    }

    const transactions = [];

    for (const detail of exportReceipt.details) {
      const transaction = await createInventoryTransaction({
        productId: detail.productId,
        warehouseId: exportReceipt.warehouseId,
        transactionType: 'reservation',
        quantityChange: -(detail.quantity || 0), // Negative for reservation
        referenceId: exportReceipt._id?.toString() || exportReceipt.receiptNumber,
        createdBy,
        notes: `Reserve for export receipt ${exportReceipt.receiptNumber}`
      });

      if (transaction) {
        transactions.push(transaction);
      }
    }

    return transactions;
  } catch (error) {
    console.error('❌ Error logging export reservation:', error);
    return [];
  }
}

/**
 * Tạo transaction khi export bị reject (release reservation)
 */
async function logExportRelease(exportReceipt, createdBy) {
  try {
    if (!exportReceipt || !exportReceipt.details || exportReceipt.details.length === 0) {
      return;
    }

    const transactions = [];

    for (const detail of exportReceipt.details) {
      const transaction = await createInventoryTransaction({
        productId: detail.productId,
        warehouseId: exportReceipt.warehouseId,
        transactionType: 'release',
        quantityChange: detail.quantity || 0, // Positive for release
        referenceId: exportReceipt._id?.toString() || exportReceipt.receiptNumber,
        createdBy,
        notes: `Release reservation for rejected export receipt ${exportReceipt.receiptNumber}`
      });

      if (transaction) {
        transactions.push(transaction);
      }
    }

    return transactions;
  } catch (error) {
    console.error('❌ Error logging export release:', error);
    return [];
  }
}

/**
 * Tạo transaction khi điều chỉnh tồn kho thủ công
 */
async function logAdjustment(productId, warehouseId, oldQuantity, newQuantity, createdBy, notes) {
  try {
    const quantityChange = newQuantity - oldQuantity;

    const transaction = await createInventoryTransaction({
      productId,
      warehouseId,
      transactionType: 'adjustment',
      quantityChange,
      referenceId: `ADJUST-${Date.now()}`,
      createdBy,
      notes: notes || 'Manual adjustment'
    });

    return transaction;
  } catch (error) {
    console.error('❌ Error logging adjustment:', error);
    return null;
  }
}

module.exports = {
  createInventoryTransaction,
  logImportTransaction,
  logExportTransaction,
  logExportReservation,
  logExportRelease,
  logAdjustment
};

