const Invoice = require("../models/Invoice");
const ExportReceipt = require("../models/export/ExportReceipt");
const Product = require("../models/products/product");
const User = require("../models/User");
const mongoose = require("mongoose");
const socketService = require("../services/socketService");
const AuditService = require("../services/auditService");
const PDFDocument = require("pdfkit");

// Create invoice from export receipt (Staff only)
const createInvoiceFromExport = async (req, res, next) => {
  try {
    console.log("🚀 CREATE INVOICE FROM EXPORT CALLED!");
    console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));
    console.log("🔍 User:", req.user);

    const {
      exportReceiptId,
      paymentCondition = "net30",
      currency = "VND",
      note,
      vatRate = 10,
    } = req.body;

    if (!exportReceiptId) {
      return res
        .status(400)
        .json({ success: false, message: "Export receipt ID is required" });
    }

    // Validate payment condition
    const validPaymentConditions = ["cash", "net15", "net30", "net45", "net60"];
    if (!validPaymentConditions.includes(paymentCondition)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment condition. Must be one of: cash, net15, net30, net45, net60"
      });
    }

    // Validate currency
    const validCurrencies = ["VND", "USD", "EUR"];
    if (!validCurrencies.includes(currency)) {
      return res.status(400).json({
        success: false,
        message: "Invalid currency. Must be one of: VND, USD, EUR"
      });
    }

    // Validate VAT rate
    if (isNaN(vatRate) || vatRate < 0 || vatRate > 100) {
      return res.status(400).json({
        success: false,
        message: "VAT rate must be between 0 and 100"
      });
    }

    const user = await User.findById(req.user.sub).lean();
    if (!user || req.user.role !== "staff") {
      return res
        .status(403)
        .json({ success: false, message: "Only staff can create invoices" });
    }

    const warehouseId = user.staff?.warehouseId;
    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: "Staff must be assigned to a warehouse",
      });
    }

    console.log("🔍 Looking for export receipt:", exportReceiptId);
    const exportReceipt = await ExportReceipt.findById(exportReceiptId)
      .populate({
        path: "details.productId",
        select: "name sku finalPrice basePrice price priceMarkupPercent",
        model: "Product",
      })
      .lean();

    if (!exportReceipt) {
      console.log("❌ Export receipt not found:", exportReceiptId);
      return res
        .status(404)
        .json({ success: false, message: "Export receipt not found" });
    }

    console.log(
      "✅ Found export receipt:",
      exportReceipt.receiptNumber,
      "Status:",
      exportReceipt.status
    );

    if (exportReceipt.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Export receipt must be approved before creating invoice",
      });
    }

    if (String(exportReceipt.warehouseId) !== String(warehouseId)) {
      return res.status(403).json({
        success: false,
        message: "Export receipt does not belong to your warehouse",
      });
    }

    // Kiểm tra xem đã có invoice nào cho export receipt này chưa
    const existingInvoice = await Invoice.findOne({
      exportReceiptId: exportReceiptId,
      deletedAt: null,
    });
    
    if (existingInvoice) {
      // Nếu đã có invoice, trả về thông tin invoice hiện có thay vì lỗi
      return res.status(200).json({
        success: true,
        message: "Invoice already exists for this export receipt",
        invoice: existingInvoice,
        invoiceNumber: existingInvoice.invoiceNumber,
        isExisting: true,
      });
    }

    const invoiceNumber = await Invoice.generateInvoiceNumber();

    // Exchange rates (USD as base currency)
    const exchangeRates = {
      USD: 1,
      VND: 26363,
      EUR: 0.86,
    };
    const exchangeRate = Number(exchangeRates[currency] ?? 1);
    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid exchange rate for currency",
      });
    }

    // helpers
    const toNumber = (v) => {
      if (typeof v === "number") return v;
      if (typeof v === "string" && v.trim() !== "") {
        const n = Number(v);
        return Number.isFinite(n) ? n : NaN;
      }
      return NaN;
    };
    const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

    let totalAmount = 0;
    const invoiceDetails = [];

    if (
      !Array.isArray(exportReceipt.details) ||
      exportReceipt.details.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Export receipt has no details" });
    }

    // iterate details - **note**: declare vars inside loop to avoid ReferenceError
    // Trong hàm createInvoiceFromExport
    for (const [idx, detail] of exportReceipt.details.entries()) {
      const product = detail.productId;
      if (!product) {
        console.error(`Missing product at index ${idx}`, detail);
        return res.status(400).json({
          success: false,
          message: `Missing product information at index ${idx}`,
        });
      }

      // Tính giá theo thứ tự ưu tiên
      const unitPriceUSD = Number(
        product.finalPrice ?? product.basePrice ?? product.price ?? 0
      );

      // Log để debug
      console.log("Product price details:", {
        productId: product._id,
        finalPrice: product.finalPrice,
        basePrice: product.basePrice,
        price: product.price,
        calculatedPrice: unitPriceUSD,
      });

      if (!Number.isFinite(unitPriceUSD) || unitPriceUSD <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid price for product ${
            product.name || product._id
          } at index ${idx}`,
        });
      }

      const qty = Number(detail.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for product ${
            product.name || product._id
          } at index ${idx}`,
        });
      }

      // Chuyển đổi giá theo tỷ giá
      const unitPrice = round2(unitPriceUSD * exchangeRate);
      const totalPrice = round2(unitPrice * qty);

      invoiceDetails.push({
        productId: product._id,
        productName: product.name,
        quantity: qty,
        unitPrice,
        totalPrice,
      });

      totalAmount = round2(totalAmount + totalPrice);
    }

    const vatAmount = round2((totalAmount * vatRate) / 100);
    const finalAmount = round2(totalAmount + vatAmount);

    const issueDate = new Date();
    let daysToAdd = 30;
    switch (paymentCondition) {
      case "cash":
        daysToAdd = 0;
        break;
      case "net15":
        daysToAdd = 15;
        break;
      case "net30":
        daysToAdd = 30;
        break;
      case "net45":
        daysToAdd = 45;
        break;
      case "net60":
        daysToAdd = 60;
        break;
    }
    const dueDate = new Date(
      issueDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000
    );

    const invoice = new Invoice({
      invoiceNumber,
      exportReceiptId,
      customerName: exportReceipt.customerName,
      customerAddress: exportReceipt.customerAddress,
      customerPhone: exportReceipt.customerPhone,
      paymentCondition,
      currency,
      note: note?.trim() || "",
      warehouseId,
      createdByStaff: req.user.sub,
      details: invoiceDetails,
      totalAmount,
      vatRate,
      vatAmount,
      finalAmount,
      status: "pending_review",
      issueDate,
      dueDate,
    });

    try {
      await invoice.save();
    } catch (saveError) {
      // Xử lý lỗi duplicate key
      if (saveError.code === 11000 && saveError.keyPattern?.invoiceNumber) {
        console.log('Duplicate invoice number detected, generating new one...');
        
        // Tạo invoice number mới và thử lại
        const newInvoiceNumber = await Invoice.generateInvoiceNumber();
        invoice.invoiceNumber = newInvoiceNumber;
        
        try {
          await invoice.save();
        } catch (retryError) {
          console.error('Failed to save invoice after retry:', retryError);
          return res.status(500).json({
            success: false,
            message: "Failed to create invoice due to duplicate key error",
            error: retryError.message
          });
        }
      } else {
        throw saveError;
      }
    }

    await invoice.populate([
      { path: "warehouseId", select: "name location" },
      { path: "createdByStaff", select: "staff.fullName" },
      { path: "exportReceiptId", select: "receiptNumber customerName" },
      { path: "details.productId", select: "name sku" },
    ]);

    // Emit Socket.IO notification
    socketService.notifyInvoiceCreated(invoice);

    // Notify chart data update
    socketService.notifyChartDataUpdated('invoice', {
      invoiceId: invoice._id,
      action: 'created'
    });

    // Log audit trail
    try {
      await AuditService.logCreateInvoice(
        {
          id: user._id,
          email: user.staff?.email || user.manager?.email || user.admin?.email || user.accounter?.email || 'No email',
          name: user.staff?.fullName || user.manager?.fullName || user.admin?.fullName || user.accounter?.fullName || 'Unknown',
          role: user.role
        },
        invoice,
        'SUCCESS',
        null,
        {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          warehouseId: warehouseId,
          exportReceiptId: exportReceiptId
        }
      );
    } catch (auditError) {
      console.error('Failed to log audit trail:', auditError);
    }

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
    console.error("❌ Error creating invoice:", error);
    
    // Log audit trail for failed creation
    try {
      const user = await User.findById(req.user.sub);
      if (user) {
        await AuditService.logCreateInvoice(
          {
            id: user._id,
            email: user.email,
            name: user.staff?.fullName || 'Unknown',
            role: user.role
          },
          {
            _id: null,
            invoiceNumber: 'Failed',
            customerName: req.body.customerName || 'Unknown',
            totalAmount: 0,
            finalAmount: 0,
            status: 'failed'
          },
          'FAILED',
          error.message || 'Invoice creation failed',
          {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            warehouseId: user.staff?.warehouseId,
            exportReceiptId: req.body.exportReceiptId
          }
        );
      }
    } catch (auditError) {
      console.error('Failed to log audit trail for error:', auditError);
    }
    
    next(error);
  }
};

// Create invoice from export receipt (Force - Staff only)
const createInvoiceFromExportForce = async (req, res, next) => {
  try {
    console.log("🚀 CREATE INVOICE FROM EXPORT FORCE CALLED!");
    console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));

    const {
      exportReceiptId,
      paymentCondition = "net30",
      currency = "VND",
      note,
      vatRate = 10,
    } = req.body;

    if (!exportReceiptId) {
      return res
        .status(400)
        .json({ success: false, message: "Export receipt ID is required" });
    }

    const user = await User.findById(req.user.sub).lean();
    if (!user || req.user.role !== "staff") {
      return res
        .status(403)
        .json({ success: false, message: "Only staff can create invoices" });
    }

    const warehouseId = user.staff?.warehouseId;
    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: "Staff must be assigned to a warehouse",
      });
    }

    console.log("🔍 Looking for export receipt:", exportReceiptId);
    const exportReceipt = await ExportReceipt.findById(exportReceiptId)
      .populate({
        path: "details.productId",
        select: "name sku finalPrice basePrice price priceMarkupPercent",
        model: "Product",
      })
      .lean();

    if (!exportReceipt) {
      return res.status(404).json({
        success: false,
        message: "Export receipt not found",
      });
    }

    if (exportReceipt.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Export receipt must be approved to create invoice",
      });
    }

    if (exportReceipt.warehouseId.toString() !== warehouseId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Export receipt does not belong to your warehouse",
      });
    }

    // Không kiểm tra duplicate - tạo invoice mới bất chấp
    const invoiceNumber = await Invoice.generateInvoiceNumber();

    // Exchange rates (USD as base currency)
    const exchangeRates = {
      USD: 1,
      VND: 26363,
      EUR: 0.86,
      JPY: 110,
    };

    const baseCurrency = "USD";
    const targetCurrency = currency.toUpperCase();

    // Calculate dates
    const issueDate = new Date();
    let daysToAdd = 30;
    switch (paymentCondition) {
      case "cash":
        daysToAdd = 0;
        break;
      case "net15":
        daysToAdd = 15;
        break;
      case "net30":
        daysToAdd = 30;
        break;
      case "net45":
        daysToAdd = 45;
        break;
      case "net60":
        daysToAdd = 60;
        break;
    }
    const dueDate = new Date(
      issueDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000
    );

    const invoice = new Invoice({
      invoiceNumber,
      exportReceiptId,
      customerName: exportReceipt.customerName,
      customerAddress: exportReceipt.customerAddress,
      customerPhone: exportReceipt.customerPhone,
      paymentCondition,
      currency: targetCurrency,
      note,
      vatRate,
      issueDate,
      dueDate,
      warehouseId,
      createdByStaff: req.user.sub,
      status: "pending",
      items: [],
      totalAmount: 0,
      vatAmount: 0,
      grandTotal: 0,
    });

    // iterate details - **note**: declare vars inside loop to avoid ReferenceError
    for (const [idx, detail] of exportReceipt.details.entries()) {
      const product = detail.productId;
      if (!product) {
        console.warn(`⚠️ Product not found for detail ${idx}`);
        continue;
      }

      const basePrice = product.finalPrice || product.basePrice || product.price || 0;
      const quantity = detail.quantity || 0;
      const lineTotal = basePrice * quantity;

      // Convert to target currency
      const convertedPrice = basePrice * (exchangeRates[targetCurrency] / exchangeRates[baseCurrency]);
      const convertedLineTotal = convertedPrice * quantity;

      invoice.items.push({
        productId: product._id,
        productName: product.name,
        sku: product.sku,
        quantity,
        unitPrice: convertedPrice,
        lineTotal: convertedLineTotal,
      });

      invoice.totalAmount += convertedLineTotal;
    }

    // Calculate VAT and grand total
    invoice.vatAmount = (invoice.totalAmount * vatRate) / 100;
    invoice.grandTotal = invoice.totalAmount + invoice.vatAmount;

    try {
      await invoice.save();
    } catch (saveError) {
      // Xử lý lỗi duplicate key
      if (saveError.code === 11000 && saveError.keyPattern?.invoiceNumber) {
        console.log('Duplicate invoice number detected in force mode, generating new one...');
        
        // Tạo invoice number mới và thử lại
        const newInvoiceNumber = await Invoice.generateInvoiceNumber();
        invoice.invoiceNumber = newInvoiceNumber;
        
        try {
          await invoice.save();
        } catch (retryError) {
          console.error('Failed to save invoice after retry in force mode:', retryError);
          return res.status(500).json({
            success: false,
            message: "Failed to create invoice due to duplicate key error",
            error: retryError.message
          });
        }
      } else {
        throw saveError;
      }
    }

    // Populate the invoice with product details
    await invoice.populate([
      { path: "exportReceiptId", select: "receiptNumber customerName" },
      { path: "warehouseId", select: "name address" },
      { path: "createdByStaff", select: "username email" },
      { path: "items.productId", select: "name sku" },
    ]);

    // Emit Socket.IO notification
    socketService.notifyInvoiceCreated(invoice);

    // Notify chart data update
    socketService.notifyChartDataUpdated('invoice', {
      invoiceId: invoice._id,
      action: 'created'
    });

    res.status(201).json({
      success: true,
      message: "Invoice created successfully (force mode)",
      invoice,
    });
  } catch (error) {
    console.error("❌ Error creating invoice (force):", error);
    next(error);
  }
};

// Get invoices (filtered by user role and warehouse)
const getAllInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Get user info to determine warehouse access
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Build filter based on user role
    const filter = { deletedAt: null };

    if (req.user.role === "staff" && user.staff?.warehouseId) {
      filter.warehouseId = user.staff.warehouseId;
      filter.createdByStaff = req.user.sub; // Staff can only see their own invoices
    } else if (req.user.role === "accounter" && user.accounter?.warehouseId) {
      filter.warehouseId = user.accounter.warehouseId;
    } else if (req.user.role === "manager" && user.manager?.warehouseId) {
      filter.warehouseId = user.manager.warehouseId;
    } else if (req.user.role === "admin" && user.admin?.managedWarehouses) {
      filter.warehouseId = { $in: user.admin.managedWarehouses };
    } else if (req.user.isSuperAdmin) {
      // Super admin can see all
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Add status filter
    if (status) {
      filter.status = status;
      console.log('🔍 Filtering invoices by status:', status);
    }

    // Add search filter
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const invoices = await Invoice.find(filter)
      .populate("warehouseId", "name location")
      .populate("createdByStaff", "staff.fullName")
      .populate("accounterReview.reviewedBy", "accounter.fullName")
      .populate("exportReceiptId", "receiptNumber")
      .populate("details.productId", "name sku finalPrice")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Invoice.countDocuments(filter);

    // Debug logging
    console.log('📊 Invoice query results:', {
      filter,
      found: invoices.length,
      total,
      statuses: invoices.map(inv => ({ id: inv._id, status: inv.status, number: inv.invoiceNumber }))
    });

    res.json({
      success: true,
      invoices,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("❌ Error getting invoices:", error);
    next(error);
  }
};

const dashboard = async (req, res, next) => {
  try {
    const { period = 'month', year, month, day } = req.query;

    // Validate parameters
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Build date range filter
    let dateFilter = {};
    
    if (period === 'day') {
      const y = parseInt(year) || currentYear;
      const m = parseInt(month) || (now.getMonth() + 1);
      const d = parseInt(day) || now.getDate();

      dateFilter = {
        createdAt: {
          $gte: new Date(y, m - 1, d),
          $lt: new Date(y, m - 1, d + 1)
        }
      };
    } else if (period === 'month') {
      const y = parseInt(year) || currentYear;
      const m = parseInt(month) || (now.getMonth() + 1);

      dateFilter = {
        createdAt: {
          $gte: new Date(y, m - 1, 1),
          $lt: new Date(y, m, 1)
        }
      };
    } else if (period === 'year') {
      const y = parseInt(year) || currentYear;

      dateFilter = {
        createdAt: {
          $gte: new Date(y, 0, 1),
          $lt: new Date(y + 1, 0, 1)
        }
      };
    }

    // Get invoices within date range
    const invoices = await Invoice.find({
      ...dateFilter,
      status: 'approved',
      deletedAt: null
    }).lean();

    // Exchange rates for currency conversion
    const USD_TO_VND_RATE = Number(process.env.USD_TO_VND_RATE) || 26401;
    const EUR_TO_VND_RATE = Number(process.env.EUR_TO_VND_RATE) || 28500;
    
    // Calculate statistics (convert to VND)
    const revenue = invoices.reduce((sum, inv) => {
      const amount = inv.finalAmount || 0;
      const currency = inv.currency || 'VND';
      let amountVND = amount;
      if (currency === 'USD') {
        amountVND = amount * USD_TO_VND_RATE;
      } else if (currency === 'EUR') {
        amountVND = amount * EUR_TO_VND_RATE;
      }
      return sum + amountVND;
    }, 0);
    const invoicesCount = invoices.length;

    // Get monthly data for chart (with currency conversion support)
    
    const monthlySales = await Invoice.aggregate([
      {
        $match: {
          createdAt: dateFilter.createdAt,
          status: 'approved',
          deletedAt: null
        }
      },
      {
        $addFields: {
          finalAmountVND: {
            $cond: [
              { $eq: ['$currency', 'USD'] },
              { $multiply: [{ $ifNull: ['$finalAmount', 0] }, { $literal: USD_TO_VND_RATE }] },
              {
                $cond: [
                  { $eq: ['$currency', 'EUR'] },
                  { $multiply: [{ $ifNull: ['$finalAmount', 0] }, { $literal: EUR_TO_VND_RATE }] },
                  { $ifNull: ['$finalAmount', 0] } // VND
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          total: { $sum: '$finalAmountVND' },
          totalOriginal: { $sum: '$finalAmount' },
          currencies: { $addToSet: '$currency' }
        }
      },
      {
        $project: {
          month: '$_id',
          total: 1,
          totalOriginal: 1,
          currencies: 1,
          _id: 0
        }
      },
      { $sort: { month: 1 } }
    ]);

    res.json({
      success: true,
      invoicesCount,
      revenue,
      monthlySales,
      period: {
        type: period,
        year,
        month,
        day
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    next(error);
  }
};

// Get single invoice by ID
const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    // Get full user info
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find invoice with full population
    const invoice = await Invoice.findById(id)
      .populate("warehouseId", "name location")
      .populate("createdByStaff", "staff.fullName staff.email")
      .populate(
        "accounterReview.reviewedBy",
        "accounter.fullName accounter.email"
      )
      .populate(
        "exportReceiptId",
        "receiptNumber customerName customerPhone customerAddress"
      )
      .populate(
        "details.productId",
        "name sku finalPrice basePrice priceMarkupPercent"
      )
      .lean(); // Thêm lean() để tối ưu performance

    if (!invoice || invoice.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Kiểm tra quyền truy cập chi tiết hơn
    const canAccess =
      user.isSuperAdmin || // Super admin có thể xem tất cả
      (user.role === "admin" &&
        user.admin?.managedWarehouses?.some(
          (wid) => wid.toString() === invoice.warehouseId._id.toString()
        )) || // Admin quản lý warehouse
      (user.role === "accounter" &&
        user.accounter?.warehouseId?.toString() ===
          invoice.warehouseId._id.toString()) || // Accounter của warehouse
      (user.role === "staff" &&
        invoice.createdByStaff._id.toString() === req.user.sub); // Staff tạo invoice

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You do not have permission to view this invoice.",
      });
    }

    res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error("Error getting invoice:", error);
    next(error);
  }
};
// Accounter review invoice
const reviewInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: 'approve' or 'reject'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"',
      });
    }

    // Get user info
    const user = await User.findById(req.user.sub).lean();
    if (!user || req.user.role !== "accounter") {
      return res.status(403).json({
        success: false,
        message: "Only accounters can review invoices",
      });
    }

    const warehouseId = user.accounter?.warehouseId;
    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        message: "Accounter must be assigned to a warehouse",
      });
    }

    // Find invoice
    const invoice = await Invoice.findById(id);
    if (!invoice || invoice.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Check if invoice belongs to same warehouse
    if (invoice.warehouseId.toString() !== warehouseId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Invoice does not belong to your warehouse",
      });
    }

    // Check if invoice is in correct status
    if (invoice.status !== "pending_review") {
      return res.status(400).json({
        success: false,
        message: "Invoice is not in pending review status",
      });
    }

    // Update invoice
    invoice.accounterReview = {
      reviewedBy: req.user.sub,
      reviewedAt: new Date(),
      comment: comment?.trim() || "",
    };
    invoice.status = action === "approve" ? "approved" : "rejected";
    invoice.updatedBy = req.user.sub;

    await invoice.save();

    // Populate for response
    await invoice.populate([
      { path: "warehouseId", select: "name location" },
      { path: "createdByStaff", select: "staff.fullName" },
      { path: "accounterReview.reviewedBy", select: "accounter.fullName" },
      { path: "exportReceiptId", select: "receiptNumber" },
    ]);

    // Emit Socket.IO events for real-time updates
    try {
      const socketService = require('../services/socketService');
      
      if (action === 'approve') {
        // Notify invoice approved
        socketService.notifyInvoiceApproved(invoice);
        console.log('📢 Socket.IO: Invoice approved notification sent');
      } else {
        // Notify invoice rejected
        socketService.notifyInvoiceRejected(invoice);
        console.log('📢 Socket.IO: Invoice rejected notification sent');
      }
      
      // Notify chart data updated
      socketService.notifyChartDataUpdated('invoice', { 
        invoiceId: invoice._id, 
        action: action === 'approve' ? 'approved' : 'rejected' 
      });
      console.log('📊 Socket.IO: Chart data updated notification sent');
      
    } catch (socketError) {
      console.warn('⚠️ Socket.IO notification failed:', socketError.message);
    }

    res.json({
      success: true,
      message: `Invoice ${action}d successfully`,
      invoice,
    });
  } catch (error) {
    console.error("❌ Error reviewing invoice:", error);
    next(error);
  }
};

// Update invoice (Staff only, before review)
const updateInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentCondition, currency, note, vatRate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    // Get user info
    const user = await User.findById(req.user.sub).lean();
    if (!user || req.user.role !== "staff") {
      return res.status(403).json({
        success: false,
        message: "Only staff can update invoices",
      });
    }

    // Find invoice
    const invoice = await Invoice.findById(id);
    if (!invoice || invoice.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Store old data for audit logging
    const oldData = {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      totalAmount: invoice.totalAmount,
      finalAmount: invoice.finalAmount,
      vatRate: invoice.vatRate,
      vatAmount: invoice.vatAmount,
      paymentCondition: invoice.paymentCondition,
      currency: invoice.currency,
      status: invoice.status,
      note: invoice.note
    };

    // Check if user created this invoice
    if (invoice.createdByStaff.toString() !== req.user.sub) {
      return res.status(403).json({
        success: false,
        message: "You can only update invoices you created",
      });
    }

    // Check if invoice can be updated
    if (invoice.status !== "draft" && invoice.status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Invoice cannot be updated in current status",
      });
    }

    // Exchange rates (USD as base currency)
    const exchangeRates = {
      USD: 1,
      VND: 26363, // 1 USD ≈ 26,363 VND
      EUR: 0.86, // 1 USD ≈ 0.86 EUR
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
      const updatedDetails = invoice.details.map((detail) => {
        // Convert unit price back to USD, then to new currency
        const unitPriceUSD = detail.unitPrice / oldRate;
        const newUnitPrice = unitPriceUSD * newRate;
        const newTotalPrice = newUnitPrice * detail.quantity;

        newTotalAmount += newTotalPrice;

        return {
          ...detail.toObject(),
          unitPrice: newUnitPrice,
          totalPrice: newTotalPrice,
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
    if (note !== undefined) invoice.note = note?.trim() || "";
    if (vatRate !== undefined) invoice.vatRate = vatRate;

    invoice.updatedBy = req.user.sub;

    // If updating from rejected to pending review
    if (invoice.status === "rejected") {
      invoice.status = "pending_review";
      invoice.accounterReview = {}; // Clear previous review
    }

    await invoice.save();

    // Populate for response
    await invoice.populate([
      { path: "warehouseId", select: "name location" },
      { path: "createdByStaff", select: "staff.fullName" },
      { path: "exportReceiptId", select: "receiptNumber" },
    ]);

    // Log audit trail
    try {
      await AuditService.logUpdateInvoice(
        {
          id: user._id,
          email: user.staff?.email || user.manager?.email || user.admin?.email || user.accounter?.email || 'No email',
          name: user.staff?.fullName || user.manager?.fullName || user.admin?.fullName || user.accounter?.fullName || 'Unknown',
          role: user.role
        },
        invoice,
        oldData,
        'SUCCESS',
        null,
        {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          warehouseId: invoice.warehouseId
        }
      );
    } catch (auditError) {
      console.error('Failed to log audit trail:', auditError);
    }

    res.json({
      success: true,
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    console.error("❌ Error updating invoice:", error);
    next(error);
  }
};

// Get total revenue from invoices (optionally scoped by warehouse)
const getTotalRevenue = async (req, res, next) => {
  try {
    const { warehouse: warehouseQuery } = req.query || {};
    let effectiveWarehouse = warehouseQuery || req.user?.warehouseId || null;

    // Ensure staff/manager/accounter only see their warehouse data
    if (!effectiveWarehouse && ['staff', 'manager', 'accounter'].includes(req.user.role)) {
      const userDoc = await User.findById(req.user.sub)
        .select('staff.warehouseId manager.warehouseId accounter.warehouseId')
        .lean();
      const roleData = userDoc ? userDoc[req.user.role] : null;
      effectiveWarehouse = roleData?.warehouseId ? roleData.warehouseId.toString() : null;

      if (!effectiveWarehouse) {
        return res.status(403).json({
          success: false,
          message: 'Warehouse assignment is required for this role.'
        });
      }
    }

    const matchStage = {
      status: { $in: ['approved', 'paid'] },
      deletedAt: null
    };

    if (effectiveWarehouse) {
      if (!mongoose.Types.ObjectId.isValid(effectiveWarehouse)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid warehouse id.'
        });
      }
      matchStage.warehouseId = new mongoose.Types.ObjectId(String(effectiveWarehouse));
    }

    // Exchange rates
    const USD_TO_VND_RATE = Number(process.env.USD_TO_VND_RATE) || 26401;
    const EUR_TO_VND_RATE = Number(process.env.EUR_TO_VND_RATE) || 28500;

    const result = await Invoice.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          finalAmountVND: {
            $cond: [
              { $eq: ['$currency', 'USD'] },
              { $multiply: ['$finalAmount', USD_TO_VND_RATE] },
              {
                $cond: [
                  { $eq: ['$currency', 'EUR'] },
                  { $multiply: ['$finalAmount', EUR_TO_VND_RATE] },
                  '$finalAmount' // VND
                ]
              }
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmountVND' },
          totalInvoices: { $sum: 1 }
        }
      }
    ]);

    const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;
    const totalInvoices = result.length > 0 ? result[0].totalInvoices : 0;

    res.json({
      success: true,
      totalRevenue,
      totalInvoices,
      message: 'Total revenue calculated successfully'
    });
  } catch (error) {
    console.error('Get total revenue error:', error);
    next(error);
  }
};

// Delete invoice (Staff only)
const deleteInvoice = async (req, res, next) => {
  try {
    console.log('🗑️ DELETE INVOICE CALLED!');
    console.log('🔍 Invoice ID:', req.params.id);
    console.log('🔍 User:', req.user);

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Invoice ID is required'
      });
    }

    const user = await User.findById(req.user.sub).lean();
    if (!user || req.user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Only staff can delete invoices'
      });
    }

    // Find the invoice
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Check if invoice belongs to the same warehouse
    const warehouseId = user.staff?.warehouseId;
    if (invoice.warehouseId.toString() !== warehouseId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete invoices from your warehouse'
      });
    }

    // Check if invoice can be deleted (only pending invoices)
    if (invoice.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending invoices can be deleted'
      });
    }

    // Store data before deletion for audit logging
    const deletedData = {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      totalAmount: invoice.totalAmount,
      finalAmount: invoice.finalAmount,
      vatRate: invoice.vatRate,
      vatAmount: invoice.vatAmount,
      paymentCondition: invoice.paymentCondition,
      currency: invoice.currency,
      status: invoice.status,
      note: invoice.note
    };

    // Soft delete the invoice
    invoice.deletedAt = new Date();
    await invoice.save();

    console.log('✅ Invoice deleted successfully:', invoice._id);

    // Log audit trail
    try {
      await AuditService.logDeleteInvoice(
        {
          id: user._id,
          email: user.staff?.email || user.manager?.email || user.admin?.email || user.accounter?.email || 'No email',
          name: user.staff?.fullName || user.manager?.fullName || user.admin?.fullName || user.accounter?.fullName || 'Unknown',
          role: user.role
        },
        deletedData,
        'SUCCESS',
        null,
        {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          warehouseId: invoice.warehouseId
        }
      );
    } catch (auditError) {
      console.error('Failed to log audit trail:', auditError);
    }

    // Send notification to accounters about invoice deletion
    socketService.notifyInvoiceDeleted(invoice);

    // Notify chart data update
    socketService.notifyChartDataUpdated('invoice', {
      invoiceId: invoice._id,
      action: 'deleted'
    });

    res.json({
      success: true,
      message: 'Invoice deleted successfully',
      invoice: {
        id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        deletedAt: invoice.deletedAt
      }
    });

  } catch (error) {
    console.error('Delete invoice error:', error);
    next(error);
  }
};

// Export invoice as PDF
const exportInvoiceAsPDF = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid invoice ID",
      });
    }

    // Get user info
    const user = await User.findById(req.user.sub).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Find invoice with full population
    const invoice = await Invoice.findById(id)
      .populate("warehouseId", "name location")
      .populate("createdByStaff", "staff.fullName staff.email")
      .populate(
        "accounterReview.reviewedBy",
        "accounter.fullName accounter.email"
      )
      .populate(
        "exportReceiptId",
        "receiptNumber customerName customerPhone customerAddress"
      )
      .populate(
        "details.productId",
        "name sku finalPrice basePrice priceMarkupPercent"
      )
      .lean();

    if (!invoice || invoice.deletedAt) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Check access permissions
    const warehouseId = invoice.warehouseId?._id || invoice.warehouseId;
    const createdByStaffId = invoice.createdByStaff?._id || invoice.createdByStaff;
    
    const canAccess =
      user.isSuperAdmin ||
      (user.role === "admin" &&
        user.admin?.managedWarehouses?.some(
          (wid) => wid.toString() === warehouseId.toString()
        )) ||
      (user.role === "accounter" &&
        user.accounter?.warehouseId?.toString() === warehouseId.toString()) ||
      (user.role === "staff" &&
        createdByStaffId.toString() === req.user.sub);

    if (!canAccess) {
      console.log('PDF Export Access Denied:', {
        userId: req.user.sub,
        userRole: user.role,
        invoiceId: invoice._id,
        invoiceWarehouse: warehouseId,
        createdBy: createdByStaffId
      });
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not have permission to export this invoice.",
      });
    }

    console.log('Starting PDF generation for invoice:', invoice.invoiceNumber);

    // Set response headers BEFORE creating PDF
    const fileName = `Invoice-${invoice.invoiceNumber || invoice._id}.pdf`;
    // Clean filename to avoid issues
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${cleanFileName}"`
    );

    // Create PDF document
    const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });

    // Handle PDF errors
    doc.on('error', (err) => {
      console.error('PDF generation error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error generating PDF'
        });
      }
    });

    // Handle response errors
    res.on('error', (err) => {
      console.error('Response error:', err);
      if (doc && !doc.destroyed) {
        doc.destroy();
      }
    });

    // Pipe PDF to response
    doc.pipe(res);

    // Helper function to format currency
    const formatCurrency = (amount, currency = 'VND') => {
      const num = Number(amount || 0);
      if (currency === 'VND') {
        return new Intl.NumberFormat('vi-VN').format(num) + ' ₫';
      } else if (currency === 'USD') {
        return '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
      } else if (currency === 'EUR') {
        return '€' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
      }
      return new Intl.NumberFormat('vi-VN').format(num) + ' ' + currency;
    };

    // Helper function to format date
    const formatDate = (date) => {
      if (!date) return 'N/A';
      const d = new Date(date);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    // Helper function to format and clean address
    const formatAddress = (address) => {
      if (!address) return 'N/A';
      
      try {
        // Basic Vietnamese to English address translation mapping
        const addressMap = {
          'phường': 'Ward',
          'quận': 'District',
          'huyện': 'District',
          'thành phố': 'City',
          'tỉnh': 'Province',
          'đường': 'Street',
          'phố': 'Street',
          'số': 'No.',
          'ngõ': 'Alley',
          'ngách': 'Lane',
          'hà nội': 'Hanoi',
          'hồ chí minh': 'Ho Chi Minh City',
          'đà nẵng': 'Da Nang',
          'hải phòng': 'Hai Phong',
          'cần thơ': 'Can Tho'
        };
        
        let cleanedAddress = String(address)
          .normalize('NFD') // Normalize to decomposed form
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
          .toLowerCase();
        
        // Replace Vietnamese terms with English
        Object.keys(addressMap).forEach(vnTerm => {
          const regex = new RegExp(vnTerm, 'gi');
          cleanedAddress = cleanedAddress.replace(regex, addressMap[vnTerm]);
        });
        
        // Clean up special characters but keep common ones
        cleanedAddress = cleanedAddress
          .replace(/[^\w\s\.,\-/]/g, ' ') // Remove special characters except common ones
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .trim();
        
        // Capitalize first letter of each word
        cleanedAddress = cleanedAddress
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
        
        return cleanedAddress || 'N/A';
      } catch (error) {
        console.error('Error formatting address:', error);
        // Fallback: just clean the address
        return String(address)
          .replace(/[^\w\s\.,\-/]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim() || 'N/A';
      }
    };

    // Header with improved styling
    const headerY = 50;
    const headerHeight = 60;
    
    // Header background box
    doc.rect(50, headerY, 500, headerHeight)
      .fillAndStroke([59, 130, 246], [37, 99, 235]); // Blue background with darker border
    
    // Title
    doc.fontSize(28).font('Helvetica-Bold').fillColor('white');
    doc.text('SALES INVOICE', 50, headerY + 10, { align: 'center', width: 500 });
    
    // Invoice number
    doc.fontSize(12).font('Helvetica');
    doc.text(`Invoice ${invoice.invoiceNumber}`, 50, headerY + 35, { align: 'center', width: 500 });
    
    // Status badge with rounded rectangle effect
    const statusMap = {
      draft: { text: 'Draft', color: [107, 114, 128], bgColor: [243, 244, 246] },
      pending_review: { text: 'Pending Review', color: [234, 179, 8], bgColor: [254, 243, 199] },
      approved: { text: 'Approved', color: [34, 197, 94], bgColor: [220, 252, 231] },
      rejected: { text: 'Rejected', color: [239, 68, 68], bgColor: [254, 226, 226] },
      paid: { text: 'Paid', color: [59, 130, 246], bgColor: [219, 234, 254] }
    };
    const statusInfo = statusMap[invoice.status] || { text: invoice.status, color: [107, 114, 128], bgColor: [243, 244, 246] };
    
    const statusBoxWidth = 100;
    const statusBoxHeight = 20;
    const statusBoxX = (550 - statusBoxWidth) / 2;
    const statusBoxY = headerY + headerHeight + 10;
    
    // Status badge background
    doc.rect(statusBoxX, statusBoxY, statusBoxWidth, statusBoxHeight)
      .fillAndStroke(statusInfo.bgColor, statusInfo.color);
    
    doc.fontSize(9).font('Helvetica-Bold').fillColor(statusInfo.color);
    doc.text(`Status: ${statusInfo.text}`, statusBoxX, statusBoxY + 5, { align: 'center', width: statusBoxWidth });
    doc.fillColor('black');

    // Two column layout: Customer Information (left) and Invoice Meta (right)
    let yPos = statusBoxY + statusBoxHeight + 30;
    
    // Section headers background
    doc.rect(50, yPos - 5, 240, 20).fill([243, 244, 246]);
    doc.rect(300, yPos - 5, 250, 20).fill([243, 244, 246]);
    
    // Left column: Customer Information
    doc.fontSize(12).font('Helvetica-Bold').fillColor([31, 41, 55]);
    doc.text('Customer Information', 50, yPos);
    yPos += 25;
    
    // Customer info box - calculate height based on address length
    const customerBoxY = yPos;
    const formattedAddress = formatAddress(invoice.customerAddress);
    const addressLines = doc.heightOfString(formattedAddress, { width: 230 }) / 12; // Approximate line height
    const customerBoxHeight = Math.max(70, 45 + (Math.ceil(addressLines) * 12));
    
    doc.rect(50, customerBoxY - 3, 240, customerBoxHeight).fillAndStroke([255, 255, 255], [229, 231, 235]);
    
    doc.fontSize(10).font('Helvetica').fillColor('black');
    doc.text(`Name: ${invoice.customerName || '-'}`, 55, customerBoxY);
    yPos = customerBoxY + 15;
    doc.text(`Phone: ${invoice.customerPhone || '-'}`, 55, yPos);
    yPos += 15;
    
    // Address with proper formatting and line breaks
    doc.text('Address:', 55, yPos);
    yPos += 12;
    doc.fontSize(9);
    const addressText = formattedAddress;
    doc.text(addressText, 55, yPos, { 
      width: 230,
      align: 'left',
      lineGap: 2
    });
    doc.fontSize(10); // Reset font size

    // Right column: Invoice Meta
    yPos = customerBoxY;
    doc.fontSize(12).font('Helvetica-Bold').fillColor([31, 41, 55]);
    doc.text('Invoice Details', 300, yPos - 25);
    
    // Invoice details box
    doc.rect(300, yPos - 3, 250, 60).fillAndStroke([255, 255, 255], [229, 231, 235]);
    
    doc.fontSize(10).font('Helvetica').fillColor('black');
    
    const paymentConditionMap = {
      cash: 'Cash',
      net15: 'Net 15',
      net30: 'Net 30',
      net45: 'Net 45',
      net60: 'Net 60'
    };
    doc.text(`Payment: ${paymentConditionMap[invoice.paymentCondition] || invoice.paymentCondition}`, 305, yPos);
    yPos += 15;
    doc.text(`Currency: ${invoice.currency || '-'}`, 305, yPos);
    yPos += 15;
    doc.text(`VAT: ${invoice.vatRate != null ? invoice.vatRate + '%' : '-'}`, 305, yPos);
    yPos += 15;
    doc.text(`Due date: ${formatDate(invoice.dueDate) || '-'}`, 305, yPos);

    // Table header with improved styling - adjust based on customer box height
    yPos = customerBoxY + customerBoxHeight + 15;
    
    // Table header background with darker color
    doc.rect(50, yPos - 5, 500, 22).fillAndStroke([37, 99, 235], [29, 78, 216]);
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('white');
    doc.text('#', 55, yPos);
    doc.text('Description', 80, yPos);
    doc.text('Quantity', 320, yPos);
    doc.text('Unit Price', 380, yPos, { width: 90, align: 'right' });
    doc.text('Total', 480, yPos, { width: 70, align: 'right' });
    doc.fillColor('black');

    // Table rows with improved styling
    yPos += 27;
    doc.font('Helvetica');
    if (invoice.details && invoice.details.length > 0) {
      invoice.details.forEach((detail, index) => {
        if (yPos > 650) {
          doc.addPage();
          yPos = 50;
        }

        // Alternate row background with better contrast
        const rowBgColor = index % 2 === 0 ? [255, 255, 255] : [249, 250, 251];
        doc.rect(50, yPos - 3, 500, 20).fillAndStroke(rowBgColor, [229, 231, 235]);

        doc.fontSize(9).fillColor('black');
        doc.text(String(index + 1), 55, yPos + 2);
        
        // Product name with better formatting
        const productName = detail.productName || detail.product?.name || 'N/A';
        doc.text(productName, 80, yPos + 2, { width: 230 });
        
        doc.text(String(detail.quantity || 0), 320, yPos + 2);
        doc.font('Helvetica');
        const unitPriceText = formatCurrency(detail.unitPrice || 0, invoice.currency);
        doc.text(unitPriceText, 380, yPos + 2, { width: 90, align: 'right' });
        doc.font('Helvetica-Bold');
        const totalPriceText = formatCurrency(detail.totalPrice || 0, invoice.currency);
        doc.text(totalPriceText, 480, yPos + 2, { width: 70, align: 'right' });
        doc.font('Helvetica');
        
        yPos += 22;
      });
    } else {
      doc.rect(50, yPos - 3, 500, 20).fillAndStroke([255, 255, 255], [229, 231, 235]);
      doc.fontSize(9).fillColor([107, 114, 128]).text('No products', 55, yPos + 2);
      yPos += 22;
    }

    // Summary section - Left aligned box with improved styling and wider width
    yPos = Math.max(yPos + 20, 600);
    const summaryBoxX = 50; // Moved to left side
    const summaryBoxY = yPos - 10;
    const summaryBoxWidth = 300; // Increased width to show full amounts
    const summaryBoxHeight = 90;
    
    // Draw summary box with better styling
    doc.rect(summaryBoxX, summaryBoxY, summaryBoxWidth, summaryBoxHeight)
      .fillAndStroke([249, 250, 251], [37, 99, 235]);
    
    // Summary header
    doc.fontSize(11).font('Helvetica-Bold').fillColor([31, 41, 55]);
    doc.text('Summary', summaryBoxX + 10, summaryBoxY + 8);
    
    // Divider line
    doc.moveTo(summaryBoxX + 10, summaryBoxY + 22)
      .lineTo(summaryBoxX + summaryBoxWidth - 10, summaryBoxY + 22)
      .stroke([229, 231, 235]);
    
    yPos = summaryBoxY + 30;
    doc.fontSize(10).font('Helvetica').fillColor('black');
    doc.text('Subtotal', summaryBoxX + 10, yPos);
    const subtotalText = formatCurrency(invoice.totalAmount || 0, invoice.currency || 'VND');
    doc.text(subtotalText, summaryBoxX + summaryBoxWidth - 10, yPos, { width: 150, align: 'right' });
    yPos += 18;

    doc.text(`VAT (${invoice.vatRate || 0}%)`, summaryBoxX + 10, yPos);
    const vatText = formatCurrency(invoice.vatAmount || 0, invoice.currency || 'VND');
    doc.text(vatText, summaryBoxX + summaryBoxWidth - 10, yPos, { width: 150, align: 'right' });
    
    // Divider before total
    yPos += 15;
    doc.moveTo(summaryBoxX + 10, yPos)
      .lineTo(summaryBoxX + summaryBoxWidth - 10, yPos)
      .stroke([229, 231, 235]);
    
    yPos += 12;
    doc.font('Helvetica-Bold').fontSize(13).fillColor([37, 99, 235]);
    doc.text('Total:', summaryBoxX + 10, yPos);
    const totalText = formatCurrency(invoice.finalAmount || 0, invoice.currency || 'VND');
    doc.text(totalText, summaryBoxX + summaryBoxWidth - 10, yPos, { width: 150, align: 'right' });
    doc.fillColor('black');

    // Notes section with improved styling
    if (invoice.note) {
      yPos = summaryBoxY + summaryBoxHeight + 20;
      // Draw note box with better styling
      const noteBoxHeight = Math.max(50, Math.ceil(doc.heightOfString(invoice.note, { width: 500 }) / 9) * 12 + 30);
      doc.rect(50, yPos - 5, 500, noteBoxHeight)
        .fillAndStroke([255, 248, 220], [251, 191, 36]);
      doc.fontSize(11).font('Helvetica-Bold').fillColor([217, 119, 6]);
      doc.text('Note', 55, yPos);
      yPos += 18;
      doc.fontSize(9).font('Helvetica').fillColor('black');
      doc.text(invoice.note, 55, yPos, { width: 490 });
    }

    // Footer with improved styling
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 40;
    
    // Footer line
    doc.moveTo(50, footerY - 10)
      .lineTo(550, footerY - 10)
      .stroke([229, 231, 235]);
    
    doc.fontSize(8).font('Helvetica').fillColor([107, 114, 128]);
    doc.text(
      `Xuất ngày: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`,
      50,
      footerY,
      { align: 'center', width: 500 }
    );
    doc.fillColor('black');

    // Finalize PDF - ensure it's properly closed
    doc.end();

    // Handle response end
    res.on('finish', () => {
      console.log('PDF sent successfully for invoice:', invoice.invoiceNumber);
    });

    // Handle PDF stream end
    doc.on('end', () => {
      console.log('PDF generation completed for invoice:', invoice.invoiceNumber);
    });

  } catch (error) {
    console.error("Error exporting invoice as PDF:", error);
    // If headers not sent, send error response
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Error generating PDF: " + (error.message || "Unknown error")
      });
    }
    // If headers already sent, just log the error
    next(error);
  }
};

module.exports = {
  createInvoiceFromExport,
  createInvoiceFromExportForce,
  getAllInvoices,
  getInvoiceById,
  reviewInvoice,
  updateInvoice,
  deleteInvoice,
  dashboard,
  getTotalRevenue,
  exportInvoiceAsPDF
};
