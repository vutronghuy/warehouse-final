const Invoice = require('../models/Invoice');
const ExportReceipt = require('../models/export/ExportReceipt');
const Product = require('../models/products/product');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create invoice from export receipt (Staff only)
exports.createInvoiceFromExport = async (req, res, next) => {
  try {
    console.log('🚀 CREATE INVOICE FROM EXPORT CALLED!');
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 User:', req.user);

    const { 
      exportReceiptId, 
      paymentCondition = 'net30', 
      currency = 'VND', 
      note,
      vatRate = 10 
    } = req.body;

    // Validate required fields
    if (!exportReceiptId) {
      return res.status(400).json({
        success: false,
        message: 'Export receipt ID is required'
      });
    }

    // Get user info to determine warehouse
    const user = await User.findById(req.user.sub).lean();
    if (!user || req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Only staff can create invoices'
      });
    }

    const warehouseId = user.staff?.warehouseId;
    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: 'Staff must be assigned to a warehouse'
      });
    }

    // Find and validate export receipt
    console.log('🔍 Looking for export receipt:', exportReceiptId);
    const exportReceipt = await ExportReceipt.findById(exportReceiptId)
      .populate('details.productId', 'name sku finalPrice basePrice priceMarkupPercent')
      .lean();

    if (!exportReceipt) {
      console.log('❌ Export receipt not found:', exportReceiptId);
      return res.status(404).json({
        success: false,
        message: 'Export receipt not found'
      });
    }

    console.log('✅ Found export receipt:', exportReceipt.receiptNumber, 'Status:', exportReceipt.status);

    // Check if export receipt is approved
    if (exportReceipt.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Export receipt must be approved before creating invoice'
      });
    }

    // Check if export receipt belongs to same warehouse
    if (exportReceipt.warehouseId.toString() !== warehouseId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Export receipt does not belong to your warehouse'
      });
    }

    // Check if invoice already exists for this export receipt
    const existingInvoice = await Invoice.findOne({ 
      exportReceiptId: exportReceiptId,
      deletedAt: null 
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: 'Invoice already exists for this export receipt',
        invoiceNumber: existingInvoice.invoiceNumber
      });
    }

    // Generate invoice number
    const invoiceNumber = await Invoice.generateInvoiceNumber();

    // Exchange rates (USD as base currency)
    const exchangeRates = {
      USD: 1,
      VND: 26363, // 1 USD ≈ 26,363 VND
      EUR: 0.86   // 1 USD ≈ 0.86 EUR
    };

    // Get exchange rate for selected currency
    const exchangeRate = exchangeRates[currency] || 1;

    // Prepare invoice details from export receipt
    let totalAmount = 0;
    const invoiceDetails = [];

    for (const detail of exportReceipt.details) {
      const product = detail.productId;
      const unitPriceUSD = product.finalPrice; // Price in USD
      const unitPrice = unitPriceUSD * exchangeRate; // Convert to selected currency
      const totalPrice = unitPrice * detail.quantity;

      invoiceDetails.push({
        productId: product._id,
        productName: product.name,
        quantity: detail.quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice
      });

      totalAmount += totalPrice;
    }

    // Calculate VAT and final amount
    const vatAmount = (totalAmount * vatRate) / 100;
    const finalAmount = totalAmount + vatAmount;

    const issueDate = new Date();
let daysToAdd = 30; // default

switch (paymentCondition) {
  case 'cash':
    daysToAdd = 0;
    break;
  case 'net15':
    daysToAdd = 15;
    break;
  case 'net30':
    daysToAdd = 30;
    break;
  case 'net45':
    daysToAdd = 45;
    break;
  case 'net60':
    daysToAdd = 60;
    break;
}

const dueDate = new Date(issueDate.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    // Create invoice
  const invoice = new Invoice({
  invoiceNumber,
  exportReceiptId,
  customerName: exportReceipt.customerName,
  customerAddress: exportReceipt.customerAddress,
  customerPhone: exportReceipt.customerPhone,
  paymentCondition,
  currency,
  note: note?.trim() || '',
  warehouseId,
  createdByStaff: req.user.sub,
  details: invoiceDetails,
  totalAmount,
  vatRate,
  vatAmount,
  finalAmount,
  status: 'pending_review',
  issueDate, // Add this
  dueDate   // Add this
});

    await invoice.save();

    // Populate for response
    await invoice.populate([
      { path: 'warehouseId', select: 'name location' },
      { path: 'createdByStaff', select: 'staff.fullName' },
      { path: 'exportReceiptId', select: 'receiptNumber customerName' },
      { path: 'details.productId', select: 'name sku' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      invoice
    });
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    next(error);
  }
};

// Get invoices (filtered by user role and warehouse)
exports.getInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Get user info to determine warehouse access
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Build filter based on user role
    const filter = { deletedAt: null };

    if (req.user.role === 'staff' && user.staff?.warehouseId) {
      filter.warehouseId = user.staff.warehouseId;
      filter.createdByStaff = req.user.sub; // Staff can only see their own invoices
    } else if (req.user.role === 'accounter' && user.accounter?.warehouseId) {
      filter.warehouseId = user.accounter.warehouseId;
    } else if (req.user.role === 'manager' && user.manager?.warehouseId) {
      filter.warehouseId = user.manager.warehouseId;
    } else if (req.user.role === 'admin' && user.admin?.managedWarehouses) {
      filter.warehouseId = { $in: user.admin.managedWarehouses };
    } else if (req.user.isSuperAdmin) {
      // Super admin can see all
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Add status filter
    if (status) {
      filter.status = status;
    }

    // Add search filter
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await Invoice.find(filter)
      .populate('warehouseId', 'name location')
      .populate('createdByStaff', 'staff.fullName')
      .populate('accounterReview.reviewedBy', 'accounter.fullName')
      .populate('exportReceiptId', 'receiptNumber')
      .populate('details.productId', 'name sku finalPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    res.json({
      success: true,
      invoices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('❌ Error getting invoices:', error);
    next(error);
  }
};

// Get single invoice by ID
exports.getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    // Get full user info
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find invoice with full population
    const invoice = await Invoice.findById(id)
      .populate('warehouseId', 'name location')
      .populate('createdByStaff', 'staff.fullName staff.email')
      .populate('accounterReview.reviewedBy', 'accounter.fullName accounter.email')
      .populate('exportReceiptId', 'receiptNumber customerName customerPhone customerAddress')
      .populate('details.productId', 'name sku finalPrice basePrice priceMarkupPercent')
      .lean(); // Thêm lean() để tối ưu performance

    if (!invoice || invoice.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Kiểm tra quyền truy cập chi tiết hơn
    const canAccess = 
      user.isSuperAdmin || // Super admin có thể xem tất cả
      (user.role === 'admin' && user.admin?.managedWarehouses?.some(wid => wid.toString() === invoice.warehouseId._id.toString())) || // Admin quản lý warehouse 
      (user.role === 'accounter' && user.accounter?.warehouseId?.toString() === invoice.warehouseId._id.toString()) || // Accounter của warehouse
      (user.role === 'staff' && invoice.createdByStaff._id.toString() === req.user.sub); // Staff tạo invoice

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this invoice.'
      });
    }

    res.json({
      success: true,
      invoice
    });

  } catch (error) {
    console.error('Error getting invoice:', error);
    next(error);
  }
};
// Accounter review invoice
exports.reviewInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: 'approve' or 'reject'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      });
    }

    // Get user info
    const user = await User.findById(req.user.sub).lean();
    if (!user || req.user.role !== 'accounter') {
      return res.status(403).json({
        success: false,
        message: 'Only accounters can review invoices'
      });
    }

    const warehouseId = user.accounter?.warehouseId;
    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: 'Accounter must be assigned to a warehouse'
      });
    }

    // Find invoice
    const invoice = await Invoice.findById(id);
    if (!invoice || invoice.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if invoice belongs to same warehouse
    if (invoice.warehouseId.toString() !== warehouseId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Invoice does not belong to your warehouse'
      });
    }

    // Check if invoice is in correct status
    if (invoice.status !== 'pending_review') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is not in pending review status'
      });
    }

    // Update invoice
    invoice.accounterReview = {
      reviewedBy: req.user.sub,
      reviewedAt: new Date(),
      comment: comment?.trim() || ''
    };
    invoice.status = action === 'approve' ? 'approved' : 'rejected';
    invoice.updatedBy = req.user.sub;

    await invoice.save();

    // Populate for response
    await invoice.populate([
      { path: 'warehouseId', select: 'name location' },
      { path: 'createdByStaff', select: 'staff.fullName' },
      { path: 'accounterReview.reviewedBy', select: 'accounter.fullName' },
      { path: 'exportReceiptId', select: 'receiptNumber' }
    ]);

    res.json({
      success: true,
      message: `Invoice ${action}d successfully`,
      invoice
    });
  } catch (error) {
    console.error('❌ Error reviewing invoice:', error);
    next(error);
  }
};

// Update invoice (Staff only, before review)
exports.updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentCondition, currency, note, vatRate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    // Get user info
    const user = await User.findById(req.user.sub).lean();
    if (!user || req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Only staff can update invoices'
      });
    }

    // Find invoice
    const invoice = await Invoice.findById(id);
    if (!invoice || invoice.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if user created this invoice
    if (invoice.createdByStaff.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'You can only update invoices you created'
      });
    }

    // Check if invoice can be updated
    if (invoice.status !== 'draft' && invoice.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Invoice cannot be updated in current status'
      });
    }

    // Exchange rates (USD as base currency)
    const exchangeRates = {
      USD: 1,
      VND: 26363, // 1 USD ≈ 26,363 VND
      EUR: 0.86   // 1 USD ≈ 0.86 EUR
    };

    // Check if currency is changing and recalculate prices
    const oldCurrency = invoice.currency;
    const newCurrency = currency || oldCurrency;
    const currencyChanged = oldCurrency !== newCurrency;

    if (currencyChanged) {
      // Convert prices from old currency back to USD, then to new currency
      const oldRate = exchangeRates[oldCurrency] || 1;
      const newRate = exchangeRates[newCurrency] || 1;

      // Recalculate invoice details
      let newTotalAmount = 0;
      const updatedDetails = invoice.details.map(detail => {
        // Convert unit price back to USD, then to new currency
        const unitPriceUSD = detail.unitPrice / oldRate;
        const newUnitPrice = unitPriceUSD * newRate;
        const newTotalPrice = newUnitPrice * detail.quantity;

        newTotalAmount += newTotalPrice;

        return {
          ...detail.toObject(),
          unitPrice: newUnitPrice,
          totalPrice: newTotalPrice
        };
      });

      // Update invoice details and amounts
      invoice.details = updatedDetails;
      invoice.totalAmount = newTotalAmount;

      // Recalculate VAT and final amount with new VAT rate if provided
      const currentVatRate = vatRate !== undefined ? vatRate : invoice.vatRate;
      invoice.vatAmount = (newTotalAmount * currentVatRate) / 100;
      invoice.finalAmount = newTotalAmount + invoice.vatAmount;
    } else if (vatRate !== undefined && vatRate !== invoice.vatRate) {
      // Only VAT rate changed, recalculate VAT amounts
      invoice.vatAmount = (invoice.totalAmount * vatRate) / 100;
      invoice.finalAmount = invoice.totalAmount + invoice.vatAmount;
    }

    // Update other fields
    if (paymentCondition) invoice.paymentCondition = paymentCondition;
    if (currency) invoice.currency = currency;
    if (note !== undefined) invoice.note = note?.trim() || '';
    if (vatRate !== undefined) invoice.vatRate = vatRate;

    invoice.updatedBy = req.user.sub;

    // If updating from rejected to pending review
    if (invoice.status === 'rejected') {
      invoice.status = 'pending_review';
      invoice.accounterReview = {}; // Clear previous review
    }

    await invoice.save();

    // Populate for response
    await invoice.populate([
      { path: 'warehouseId', select: 'name location' },
      { path: 'createdByStaff', select: 'staff.fullName' },
      { path: 'exportReceiptId', select: 'receiptNumber' }
    ]);

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice
    });
  } catch (error) {
    console.error('❌ Error updating invoice:', error);
    next(error);
  }
};

// Delete invoice (Staff only, before review)
exports.deleteInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid invoice ID'
      });
    }

    // Get user info
    const user = await User.findById(req.user.sub).lean();
    if (!user || req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Only staff can delete invoices'
      });
    }

    // Find invoice
    const invoice = await Invoice.findById(id);
    if (!invoice || invoice.deletedAt) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if user created this invoice
    if (invoice.createdByStaff.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete invoices you created'
      });
    }

    // Check if invoice can be deleted
    if (invoice.status !== 'draft' && invoice.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Invoice cannot be deleted in current status'
      });
    }

    // Soft delete
    invoice.deletedAt = new Date();
    invoice.updatedBy = req.user.sub;
    await invoice.save();

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting invoice:', error);
    next(error);
  }
};
