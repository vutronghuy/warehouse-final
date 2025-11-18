const AuditLog = require('../models/AuditLog');

class AuditService {
  /**
   * Ghi audit log cho các hành động của staff (category = 'BUSINESS')
   * @param {Object} options - Các thông tin cần thiết
   * @param {string} options.action - Hành động (IMPORT_PRODUCT_EXCEL, CREATE_EXPORT_SLIP, UPDATE_INVOICE, etc.)
   * @param {Object} options.actor - Thông tin người thực hiện
   * @param {Object} options.target - Thông tin đối tượng bị tác động
   * @param {Object} options.before - Trạng thái trước khi thay đổi
   * @param {Object} options.after - Trạng thái sau khi thay đổi
   * @param {string} options.reason - Lý do thực hiện hành động
   * @param {string} options.outcome - Kết quả (SUCCESS/FAILED)
   * @param {string} options.error - Thông báo lỗi nếu có
   * @param {Object} options.meta - Thông tin bổ sung (IP, userAgent, warehouseId, etc.)
   */
  static async logStaffAction(options) {
    try {
      const auditLog = new AuditLog({
        category: 'BUSINESS',
        action: options.action,
        actor: {
          id: options.actor.id,
          email: options.actor.email,
          name: options.actor.name,
          role: options.actor.role || 'staff'
        },
        target: {
          type: options.target.type,
          id: options.target.id
        },
        before: options.before || null,
        after: options.after || null,
        reason: options.reason || null,
        outcome: options.outcome || 'SUCCESS',
        error: options.error || null,
        meta: options.meta || {},
        createdAt: new Date()
      });

      await auditLog.save();
      console.log(`📝 Audit log created: ${options.action} by ${options.actor.name}`);
      return auditLog;
    } catch (error) {
      console.error('❌ Error creating audit log:', error);
      // Không throw error để không ảnh hưởng đến business logic chính
    }
  }

  /**
   * Ghi audit log cho import sản phẩm từ Excel
   */
  static async logImportProductExcel(actor, importData, outcome = 'SUCCESS', error = null, meta = {}) {
    return this.logStaffAction({
      action: 'IMPORT_PRODUCT_EXCEL',
      actor,
      target: {
        type: 'Import',
        id: importData._id || importData.id
      },
      before: null,
      after: {
        fileName: importData.fileName,
        productCount: importData.importedProducts?.length || 0,
        successCount: importData.successCount || 0,
        errorCount: importData.errorCount || 0
      },
      reason: 'Import products from Excel file',
      outcome,
      error,
      meta
    });
  }

  /**
   * Ghi audit log cho tạo export slip
   */
  static async logCreateExportSlip(actor, exportData, outcome = 'SUCCESS', error = null, meta = {}) {
    return this.logStaffAction({
      action: 'CREATE_EXPORT_SLIP',
      actor,
      target: {
        type: 'ExportSlip',
        id: exportData._id || exportData.id
      },
      before: null,
      after: {
        receiptNumber: exportData.receiptNumber,
        customerName: exportData.customerName,
        customerPhone: exportData.customerPhone,
        totalAmount: exportData.totalAmount,
        itemCount: exportData.details?.length || 0,
        status: exportData.status
      },
      reason: 'Create new export slip for customer',
      outcome,
      error,
      meta
    });
  }

  /**
   * Ghi audit log cho cập nhật export slip
   */
  static async logUpdateExportSlip(actor, exportData, beforeData, outcome = 'SUCCESS', error = null, meta = {}) {
    return this.logStaffAction({
      action: 'UPDATE_EXPORT_SLIP',
      actor,
      target: {
        type: 'ExportSlip',
        id: exportData._id || exportData.id
      },
      before: {
        receiptNumber: beforeData.receiptNumber,
        customerName: beforeData.customerName,
        customerPhone: beforeData.customerPhone,
        totalAmount: beforeData.totalAmount,
        status: beforeData.status
      },
      after: {
        receiptNumber: exportData.receiptNumber,
        customerName: exportData.customerName,
        customerPhone: exportData.customerPhone,
        totalAmount: exportData.totalAmount,
        status: exportData.status
      },
      reason: 'Update export slip information',
      outcome,
      error,
      meta
    });
  }

  /**
   * Ghi audit log cho xóa export slip
   */
  static async logDeleteExportSlip(actor, exportData, outcome = 'SUCCESS', error = null, meta = {}) {
    return this.logStaffAction({
      action: 'DELETE_EXPORT_SLIP',
      actor,
      target: {
        type: 'ExportSlip',
        id: exportData._id || exportData.id
      },
      before: {
        receiptNumber: exportData.receiptNumber,
        customerName: exportData.customerName,
        status: exportData.status
      },
      after: null,
      reason: 'Delete export slip',
      outcome,
      error,
      meta
    });
  }

  /**
   * Ghi audit log cho tạo invoice
   */
  static async logCreateInvoice(actor, invoiceData, outcome = 'SUCCESS', error = null, meta = {}) {
    return this.logStaffAction({
      action: 'CREATE_INVOICE',
      actor,
      target: {
        type: 'Invoice',
        id: invoiceData._id || invoiceData.id
      },
      before: null,
      after: {
        invoiceNumber: invoiceData.invoiceNumber,
        customerName: invoiceData.customerName,
        customerPhone: invoiceData.customerPhone,
        totalAmount: invoiceData.totalAmount,
        finalAmount: invoiceData.finalAmount,
        currency: invoiceData.currency,
        status: invoiceData.status,
        exportReceiptId: invoiceData.exportReceiptId
      },
      reason: 'Create new invoice from export slip',
      outcome,
      error,
      meta
    });
  }

  /**
   * Ghi audit log cho cập nhật invoice
   */
  static async logUpdateInvoice(actor, invoiceData, beforeData, outcome = 'SUCCESS', error = null, meta = {}) {
    return this.logStaffAction({
      action: 'UPDATE_INVOICE',
      actor,
      target: {
        type: 'Invoice',
        id: invoiceData._id || invoiceData.id
      },
      before: {
        invoiceNumber: beforeData.invoiceNumber,
        customerName: beforeData.customerName,
        totalAmount: beforeData.totalAmount,
        finalAmount: beforeData.finalAmount,
        status: beforeData.status
      },
      after: {
        invoiceNumber: invoiceData.invoiceNumber,
        customerName: invoiceData.customerName,
        totalAmount: invoiceData.totalAmount,
        finalAmount: invoiceData.finalAmount,
        status: invoiceData.status
      },
      reason: 'Update invoice information',
      outcome,
      error,
      meta
    });
  }

  /**
   * Ghi audit log cho xóa invoice
   */
  static async logDeleteInvoice(actor, invoiceData, outcome = 'SUCCESS', error = null, meta = {}) {
    return this.logStaffAction({
      action: 'DELETE_INVOICE',
      actor,
      target: {
        type: 'Invoice',
        id: invoiceData._id || invoiceData.id
      },
      before: {
        invoiceNumber: invoiceData.invoiceNumber,
        customerName: invoiceData.customerName,
        status: invoiceData.status
      },
      after: null,
      reason: 'Delete invoice',
      outcome,
      error,
      meta
    });
  }

  /**
   * Lấy audit logs cho staff với phân trang và filter
   */
  static async getStaffAuditLogs(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        action = null,
        actorId = null,
        actorIds = null,
        targetType = null,
        startDate = null,
        endDate = null,
        outcome = null
      } = options;

      const query = { category: 'BUSINESS' };

      if (action) query.action = action;
      if (actorId) query['actor.id'] = actorId;
      if (actorIds && Array.isArray(actorIds)) query['actor.id'] = { $in: actorIds };
      if (targetType) query['target.type'] = targetType;
      if (outcome) query.outcome = outcome;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      
      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        AuditLog.countDocuments(query)
      ]);

      return {
        logs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      };
    } catch (error) {
      console.error('❌ Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Lấy thống kê audit logs
   */
  static async getAuditStats(options = {}) {
    try {
      const { startDate = null, endDate = null, actorId = null, actorIds = null } = options;

      const matchQuery = { category: 'BUSINESS' };
      if (actorId) matchQuery['actor.id'] = actorId;
      if (actorIds && Array.isArray(actorIds)) matchQuery['actor.id'] = { $in: actorIds };
      if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
        if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
      }

      const stats = await AuditLog.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            successCount: {
              $sum: { $cond: [{ $eq: ['$outcome', 'SUCCESS'] }, 1, 0] }
            },
            failedCount: {
              $sum: { $cond: [{ $eq: ['$outcome', 'FAILED'] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return stats;
    } catch (error) {
      console.error('❌ Error fetching audit stats:', error);
      throw error;
    }
  }
}

module.exports = AuditService;
