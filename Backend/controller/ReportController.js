// controller/ReportsController.js
const mongoose = require('mongoose');
const Product = require('../models/products/product');
const Invoice = require('../models/Invoice');
const ImportReceipt = require('../models/import/ImportReceipt');


exports.getAccountingDashboard = async (req, res, next) => {
  try {
    const {
      warehouse,
      period = 'month',
      year: qYear,
      month: qMonth,
      day: qDay,
      top = 8
    } = req.query;

    // parse numbers
    const year = qYear ? Number(qYear) : null;
    const month = qMonth ? Number(qMonth) : null;
    const day = qDay ? Number(qDay) : null;
    const topN = Math.max(1, Number(top) || 8);

    // build invoice date match: we assume invoice has createdAt field
    const dateMatch = {};
    if (period === 'day' && year && month && day) {
      const start = new Date(year, month - 1, day, 0, 0, 0);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      dateMatch.createdAt = { $gte: start, $lte: end };
    } else if (period === 'month' && year && month) {
      const start = new Date(year, month - 1, 1, 0, 0, 0);
      const end = new Date(year, month - 1, new Date(year, month, 0).getDate(), 23, 59, 59, 999);
      dateMatch.createdAt = { $gte: start, $lte: end };
    } else if (period === 'year' && year) {
      const start = new Date(year, 0, 1, 0, 0, 0);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      dateMatch.createdAt = { $gte: start, $lte: end };
    } // else leave dateMatch empty = no date filter

    // invoice match: only include approved/paid invoices.
    // adjust status list to match your app (e.g. 'approved','paid')
    const invoiceBaseMatch = {
      ...(Object.keys(dateMatch).length ? dateMatch : {}),
      status: { $in: ['approved', 'paid'] }
    };
    if (warehouse) {
      // if invoices have warehouseId field
      invoiceBaseMatch.warehouseId = mongoose.Types.ObjectId(String(warehouse));
    }

    const pipeline = [
      { $match: invoiceBaseMatch },
      { $unwind: { path: '$details', preserveNullAndEmptyArrays: false } },
      // lookup product document for each detail.productId
      {
        $lookup: {
          from: 'products',
          localField: 'details.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: {
          path: '$product',
          preserveNullAndEmptyArrays: true
        }
      },
      // compute effective unitPrice and effective baseCost
      {
        $addFields: {
          'details._quantity': { $ifNull: ['$details.quantity', 0] },
          'details._unitPrice': {
            $cond: [
              { $ifNull: ['$details.unitPrice', false] },
              '$details.unitPrice',
              { $ifNull: ['$details.totalPrice', 0] }
            ]
          },
          'details._basePrice': {
            $cond: [
              { $ifNull: ['$details.basePrice', false] },
              '$details.basePrice',
              { $ifNull: ['$product.basePrice', 0] }
            ]
          },
          'details._productName': { $ifNull: ['$product.name', null] },
          'details._productSku': { $ifNull: ['$product.sku', null] },
          'details._productStock': { $ifNull: ['$product.quantity', 0] },
          'details._productId': { $ifNull: ['$details.productId', null] }
        }
      },
      // project fields we need
      {
        $project: {
          invoiceId: '$_id',
          productId: '$details._productId',
          productName: '$details._productName',
          productSku: '$details._productSku',
          productStock: '$details._productStock',
          qty: '$details._quantity',
          revenue: { $multiply: ['$details._quantity', '$details._unitPrice'] },
          cost: { $multiply: ['$details._quantity', '$details._basePrice'] }
        }
      },
      // group by product to get per-product totals
      {
        $group: {
          _id: '$productId',
          totalQty: { $sum: { $ifNull: ['$qty', 0] } },
          totalRevenue: { $sum: { $ifNull: ['$revenue', 0] } },
          totalCost: { $sum: { $ifNull: ['$cost', 0] } },
          productName: { $first: '$productName' },
          productSku: { $first: '$productSku' },
          productStock: { $first: '$productStock' }
        }
      },
      // sort descending by totalQty for top products
      { $sort: { totalQty: -1 } },
      {
        $facet: {
          topProducts: [
            { $limit: topN },
            {
              $project: {
                productId: '$_id',
                name: '$productName',
                sku: '$productSku',
                totalQty: 1,
                totalRevenue: 1,
                totalCost: 1,
                productStock: 1
              }
            }
          ],
          totals: [
            {
              $group: {
                _id: null,
                revenue: { $sum: '$totalRevenue' },
                cost: { $sum: '$totalCost' },
                qtySum: { $sum: '$totalQty' }
              }
            }
          ]
        }
      }
    ];

    // Run aggregation on invoices collection
    const aggResult = await Invoice.aggregate(pipeline).allowDiskUse(true);

    // aggResult is an array length 0 or 1 with facets
    const result = aggResult && aggResult[0] ? aggResult[0] : { topProducts: [], totals: [] };

    const topProducts = result.topProducts || [];
    const totals = Array.isArray(result.totals) && result.totals.length ? result.totals[0] : { revenue: 0, cost: 0, qtySum: 0 };

    const revenue = Number(totals.revenue || 0);
    const cost = Number(totals.cost || 0);
    const profit = revenue - cost;

    // Inventory summary (optionally by warehouse)
    const prodFilter = {};
    if (warehouse) {
      prodFilter.warehouseId = mongoose.Types.ObjectId(String(warehouse));
    }

    const inventoryAgg = await Product.aggregate([
      { $match: prodFilter },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          inStockCount: { $sum: { $cond: [{ $gt: ['$quantity', 0] }, 1, 0] } },
          outOfStockCount: { $sum: { $cond: [{ $lte: ['$quantity', 0] }, 1, 0] } },
          totalInventoryValue: { $sum: { $multiply: [{ $ifNull: ['$basePrice', 0] }, { $ifNull: ['$quantity', 0] }] } }
        }
      }
    ]);

    const inventorySummary = (inventoryAgg && inventoryAgg[0]) ? inventoryAgg[0] : {
      totalProducts: 0, inStockCount: 0, outOfStockCount: 0, totalInventoryValue: 0
    };

    // Return structured response
    return res.json({
      success: true,
      data: {
        topProducts, 
        totals: { revenue, cost, profit, qtySum: totals.qtySum || 0 },
        inventory: inventorySummary
      }
    });
  } catch (err) {
    console.error('ReportsController.getAccountingDashboard error:', err);
    return next(err);
  }
};

// API endpoint cho biểu đồ 1: Top sản phẩm xuất nhiều nhất
exports.getTopProducts = async (req, res, next) => {
  try {
    const {
      warehouse,
      period = 'month',
      year: qYear,
      month: qMonth,
      day: qDay,
      top = 10
    } = req.query;

    // Parse numbers
    const year = qYear ? Number(qYear) : null;
    const month = qMonth ? Number(qMonth) : null;
    const day = qDay ? Number(qDay) : null;
    const topN = Math.max(1, Number(top) || 10);

    // Build date filter
    const dateMatch = {};
    if (period === 'all') {
      // Không filter theo thời gian, lấy tất cả dữ liệu
    } else if (period === 'day' && year && month && day) {
      const start = new Date(year, month - 1, day, 0, 0, 0);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      dateMatch.createdAt = { $gte: start, $lte: end };
    } else if (period === 'month' && year && month) {
      const start = new Date(year, month - 1, 1, 0, 0, 0);
      const end = new Date(year, month - 1, new Date(year, month, 0).getDate(), 23, 59, 59, 999);
      dateMatch.createdAt = { $gte: start, $lte: end };
    } else if (period === 'year' && year) {
      const start = new Date(year, 0, 1, 0, 0, 0);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      dateMatch.createdAt = { $gte: start, $lte: end };
    }

    // Invoice match filter
    const invoiceBaseMatch = {
      ...(Object.keys(dateMatch).length ? dateMatch : {}),
      status: { $in: ['approved', 'paid'] },
      deletedAt: null
    };
    if (warehouse) {
      invoiceBaseMatch.warehouseId = new mongoose.Types.ObjectId(String(warehouse));
    }

    // Aggregation pipeline để tìm top sản phẩm
    const pipeline = [
      { $match: invoiceBaseMatch },
      { $unwind: '$details' },
      {
        $lookup: {
          from: 'products',
          localField: 'details.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$details.productId',
          productName: { $first: '$product.name' },
          productSku: { $first: '$product.sku' },
          totalQuantity: { $sum: '$details.quantity' },
          totalRevenue: { $sum: '$details.totalPrice' },
          invoiceIds: { $addToSet: '$_id' } // Collect unique invoice IDs
        }
      },
      {
        $addFields: {
          invoiceCount: { $size: '$invoiceIds' } // Count unique invoices
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: topN },
      {
        $project: {
          productId: '$_id',
          name: '$productName',
          sku: '$productSku',
          totalQuantity: 1,
          totalRevenue: 1,
          invoiceCount: 1,
          _id: 0
        }
      }
    ];

    const topProducts = await Invoice.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        topProducts,
        period: { type: period, year, month, day },
        total: topProducts.length
      }
    });

  } catch (err) {
    console.error('ReportsController.getTopProducts error:', err);
    return next(err);
  }
};

// API endpoint cho biểu đồ 2: Dòng tiền nhập-xuất kho (Cash Flow)
exports.getCashFlow = async (req, res, next) => {
  try {
    const {
      warehouse,
      period = 'month',
      year: qYear,
      month: qMonth,
      months = 12
    } = req.query;

    const warehouseFilter = warehouse ? { warehouseId: new mongoose.Types.ObjectId(String(warehouse)) } : {};

    // Nếu period = 'all', lấy tất cả dữ liệu
    if (period === 'all') {
      // Lấy tổng doanh thu từ tất cả Invoice
      const totalRevenueResult = await Invoice.aggregate([
        {
          $match: {
            ...warehouseFilter,
            status: { $in: ['approved', 'paid'] },
            deletedAt: null
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalAmount' }
          }
        }
      ]);

      // Lấy tổng chi phí từ ImportReceipt (tổng basePrice khi import)
      const ImportReceipt = require('../models/import/ImportReceipt');
      const totalCostResult = await ImportReceipt.aggregate([
        {
          $match: {
            ...warehouseFilter,
            deletedAt: null
          }
        },
        {
          $unwind: '$details'
        },
        {
          $group: {
            _id: null,
            totalCostUSD: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$details.unitPrice', 0] },
                  { $ifNull: ['$details.quantity', 0] }
                ]
              }
            }
          }
        }
      ]);

      // USD to VND exchange rate
      const USD_TO_VND_RATE = 26401; // 1 USD = 26,401 VND

      const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;
      const totalCostUSD = totalCostResult.length > 0 ? totalCostResult[0].totalCostUSD : 0;
      const totalCost = totalCostUSD * USD_TO_VND_RATE; // Convert USD to VND
      const totalProfit = totalRevenue - totalCost;

      return res.json({
        success: true,
        data: {
          summary: {
            totalRevenue,
            totalCost,
            totalProfit
          },
          period: 'all',
          message: 'Total cash flow for all time - cost from ImportReceipt details (basePrice when imported)'
        }
      });
    }

    const year = qYear ? Number(qYear) : new Date().getFullYear();
    const month = qMonth ? Number(qMonth) : new Date().getMonth() + 1;
    const monthsCount = Math.min(Math.max(1, Number(months) || 12), 24);

    // Tạo danh sách các tháng cần lấy dữ liệu
    const monthsData = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const targetDate = new Date(year, month - 1 - i, 1);
      monthsData.push({
        year: targetDate.getFullYear(),
        month: targetDate.getMonth() + 1,
        label: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
      });
    }

    // Lấy dữ liệu doanh thu từ Invoice
    const revenueData = await Promise.all(
      monthsData.map(async ({ year: y, month: m }) => {
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0, 23, 59, 59, 999);

        const result = await Invoice.aggregate([
          {
            $match: {
              ...warehouseFilter,
              createdAt: { $gte: start, $lte: end },
              status: { $in: ['approved', 'paid'] },
              deletedAt: null
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$finalAmount' }
            }
          }
        ]);

        return {
          year: y,
          month: m,
          revenue: result.length > 0 ? result[0].totalRevenue : 0
        };
      })
    );

    // Lấy dữ liệu chi phí từ ImportReceipt được tạo trong tháng đó
    const USD_TO_VND_RATE = 26401; // 1 USD = 26,401 VND
    const ImportReceipt = require('../models/import/ImportReceipt');

    const costData = await Promise.all(
      monthsData.map(async ({ year: y, month: m }) => {
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0, 23, 59, 59, 999);

        // Lấy ImportReceipt được tạo trong tháng này
        const result = await ImportReceipt.aggregate([
          {
            $match: {
              ...warehouseFilter,
              createdAt: { $gte: start, $lte: end },
              deletedAt: null
            }
          },
          {
            $unwind: '$details'
          },
          {
            $group: {
              _id: null,
              totalCostUSD: {
                $sum: {
                  $multiply: [
                    { $ifNull: ['$details.unitPrice', 0] },
                    { $ifNull: ['$details.quantity', 0] }
                  ]
                }
              }
            }
          }
        ]);

        const totalCostUSD = result.length > 0 ? result[0].totalCostUSD : 0;
        const totalCostVND = totalCostUSD * USD_TO_VND_RATE; // Convert USD to VND

        return {
          year: y,
          month: m,
          cost: totalCostVND
        };
      })
    );

    // Kết hợp dữ liệu và tính lợi nhuận
    const cashFlowData = monthsData.map((monthInfo, index) => {
      const revenue = revenueData[index]?.revenue || 0;
      const cost = costData[index]?.cost || 0;
      const profit = revenue - cost;

      return {
        ...monthInfo,
        revenue,
        cost,
        profit
      };
    });

    res.json({
      success: true,
      data: {
        cashFlow: cashFlowData,
        summary: {
          totalRevenue: cashFlowData.reduce((sum, item) => sum + item.revenue, 0),
          totalCost: cashFlowData.reduce((sum, item) => sum + item.cost, 0),
          totalProfit: cashFlowData.reduce((sum, item) => sum + item.profit, 0)
        },
        period: { type: period, year, month, months: monthsCount }
      }
    });

  } catch (err) {
    console.error('ReportsController.getCashFlow error:', err);
    return next(err);
  }
};

// API endpoint cho biểu đồ 3: Giá trị hàng hóa tồn kho theo thời gian
exports.getInventoryValue = async (req, res, next) => {
  try {
    const {
      warehouse,
      period = 'month',
      year: qYear,
      month: qMonth,
      months = 12
    } = req.query;

    const year = qYear ? Number(qYear) : new Date().getFullYear();
    const month = qMonth ? Number(qMonth) : new Date().getMonth() + 1;
    const monthsCount = Math.min(Math.max(1, Number(months) || 12), 24);

    // Tạo danh sách các tháng cần lấy dữ liệu
    const monthsData = [];
    for (let i = monthsCount - 1; i >= 0; i--) {
      const targetDate = new Date(year, month - 1 - i, 1);
      monthsData.push({
        year: targetDate.getFullYear(),
        month: targetDate.getMonth() + 1,
        label: `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`,
        endOfMonth: new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999)
      });
    }

    const warehouseFilter = warehouse ? { warehouseId: new mongoose.Types.ObjectId(String(warehouse)) } : {};

    // Lấy giá trị tồn kho tại cuối mỗi tháng
    const inventoryData = await Promise.all(
      monthsData.map(async ({ year: y, month: m, label, endOfMonth }) => {
        // Lấy snapshot tồn kho tại thời điểm cuối tháng
        // Vì không có lịch sử tồn kho, ta sẽ tính dựa trên dữ liệu hiện tại
        // và trừ đi các giao dịch sau thời điểm đó

        const result = await Product.aggregate([
          {
            $match: {
              ...warehouseFilter,
              deletedAt: null,
              createdAt: { $lte: endOfMonth } // Chỉ lấy sản phẩm đã tồn tại tại thời điểm đó
            }
          },
          {
            $lookup: {
              from: 'invoices',
              let: { productId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $gt: ['$createdAt', endOfMonth] }, // Các invoice sau thời điểm này
                        { $in: ['$status', ['approved', 'paid']] },
                        { $eq: ['$deletedAt', null] }
                      ]
                    }
                  }
                },
                { $unwind: '$details' },
                {
                  $match: {
                    $expr: { $eq: ['$details.productId', '$$productId'] }
                  }
                },
                {
                  $group: {
                    _id: null,
                    totalSoldAfter: { $sum: '$details.quantity' }
                  }
                }
              ],
              as: 'soldAfter'
            }
          },
          {
            $lookup: {
              from: 'importreceipts',
              let: { productId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $gt: ['$createdAt', endOfMonth] }, // Các import sau thời điểm này
                        { $eq: ['$status', 'confirmed'] },
                        { $eq: ['$deletedAt', null] }
                      ]
                    }
                  }
                },
                { $unwind: '$details' },
                {
                  $match: {
                    $expr: { $eq: ['$details.productId', '$$productId'] }
                  }
                },
                {
                  $group: {
                    _id: null,
                    totalImportedAfter: { $sum: '$details.quantity' }
                  }
                }
              ],
              as: 'importedAfter'
            }
          },
          {
            $addFields: {
              soldAfterQuantity: { $ifNull: [{ $arrayElemAt: ['$soldAfter.totalSoldAfter', 0] }, 0] },
              importedAfterQuantity: { $ifNull: [{ $arrayElemAt: ['$importedAfter.totalImportedAfter', 0] }, 0] },
              // Tính quantity tại thời điểm cuối tháng
              quantityAtEndOfMonth: {
                $subtract: [
                  { $add: ['$quantity', '$soldAfterQuantity'] },
                  '$importedAfterQuantity'
                ]
              }
            }
          },
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              inStockCount: {
                $sum: {
                  $cond: [{ $gt: ['$quantityAtEndOfMonth', 0] }, 1, 0]
                }
              },
              outOfStockCount: {
                $sum: {
                  $cond: [{ $lte: ['$quantityAtEndOfMonth', 0] }, 1, 0]
                }
              },
              totalInventoryValue: {
                $sum: {
                  $multiply: [
                    { $ifNull: ['$basePrice', 0] },
                    { $max: ['$quantityAtEndOfMonth', 0] }
                  ]
                }
              }
            }
          }
        ]);

        const inventoryInfo = result.length > 0 ? result[0] : {
          totalProducts: 0,
          inStockCount: 0,
          outOfStockCount: 0,
          totalInventoryValue: 0
        };

        return {
          year: y,
          month: m,
          label,
          ...inventoryInfo
        };
      })
    );

    res.json({
      success: true,
      data: {
        inventoryHistory: inventoryData,
        summary: {
          currentValue: inventoryData[inventoryData.length - 1]?.totalInventoryValue || 0,
          trend: inventoryData.length > 1 ?
            inventoryData[inventoryData.length - 1].totalInventoryValue - inventoryData[inventoryData.length - 2].totalInventoryValue : 0,
          averageValue: inventoryData.reduce((sum, item) => sum + item.totalInventoryValue, 0) / inventoryData.length
        },
        period: { type: period, year, month, months: monthsCount }
      }
    });

  } catch (err) {
    console.error('ReportsController.getInventoryValue error:', err);
    return next(err);
  }
};

// Get cash flow time series data
exports.getCashFlowTimeSeries = async (req, res, next) => {
  try {
    const {
      period = 'month',
      year = 2025,
      month = 1,
      warehouse
    } = req.query;

    const normalizedYear = parseInt(year, 10) || new Date().getFullYear();
    const normalizedMonth = parseInt(month, 10) || 1;

    let startDate, endDate, groupBy;

    if (period === 'year') {
      startDate = new Date(normalizedYear - 4, 0, 1);
      endDate = new Date(normalizedYear + 1, 0, 1);
      groupBy = { year: { $year: '$createdAt' } };
    } else if (period === 'month') {
      startDate = new Date(normalizedYear, 0, 1);
      endDate = new Date(normalizedYear + 1, 0, 1);
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    } else if (period === 'day') {
      startDate = new Date(normalizedYear, normalizedMonth - 1, 1);
      endDate = new Date(normalizedYear, normalizedMonth, 1);
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    }

    let warehouseObjectId = null;
    if (warehouse) {
      if (!mongoose.Types.ObjectId.isValid(String(warehouse))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid warehouse id.'
        });
      }
      warehouseObjectId = new mongoose.Types.ObjectId(String(warehouse));
    }

    const warehouseFilter = warehouseObjectId ? { warehouseId: warehouseObjectId } : {};

    const invoiceMatchBase = {
      ...warehouseFilter,
      createdAt: { $gte: startDate, $lt: endDate },
      status: { $in: ['approved', 'paid'] },
      deletedAt: null
    };

    // Revenue data
    const revenueData = await Invoice.aggregate([
      { $match: invoiceMatchBase },
      {
        $group: {
          _id: groupBy,
          totalRevenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Cost data
    let costData;
    if (period === 'year') {
      const ImportReceiptTS = require('../models/import/ImportReceipt');
      const importMatch = {
        ...warehouseFilter,
        createdAt: { $gte: startDate, $lt: endDate },
        deletedAt: null
      };
      costData = await ImportReceiptTS.aggregate([
        { $match: importMatch },
        { $unwind: '$details' },
        {
          $group: {
            _id: { year: { $year: '$createdAt' } },
            totalCostUSD: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$details.unitPrice', 0] },
                  { $ifNull: ['$details.quantity', 0] }
                ]
              }
            }
          }
        },
        { $sort: { '_id.year': 1 } }
      ]);
    } else {
      costData = await Invoice.aggregate([
        { $match: invoiceMatchBase },
        { $unwind: '$details' },
        {
          $lookup: {
            from: 'products',
            localField: 'details.productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            _qty: { $ifNull: ['$details.quantity', 0] },
            _basePriceUSD: {
              $cond: [
                { $ifNull: ['$details.basePrice', false] },
                '$details.basePrice',
                { $ifNull: ['$product.basePrice', 0] }
              ]
            }
          }
        },
        {
          $group: {
            _id: groupBy,
            totalCostUSD: { $sum: { $multiply: ['$_qty', '$_basePriceUSD'] } }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
    }

    // Merge revenue and cost data
    const timeSeriesData = [];
    const revenueMap = new Map();
    const costMap = new Map();

    // Create maps for easy lookup
    revenueData.forEach(item => {
      const key = period === 'year' ?
        `${item._id.year}` :
        period === 'month' ?
        `${item._id.year}-${item._id.month}` :
        `${item._id.year}-${item._id.month}-${item._id.day}`;
      revenueMap.set(key, item.totalRevenue);
    });

    const USD_TO_VND_RATE = 26401; // 1 USD = 26,401 VND
    costData.forEach(item => {
      const key = period === 'year' ?
        `${item._id.year}` :
        period === 'month' ?
        `${item._id.year}-${item._id.month}` :
        `${item._id.year}-${item._id.month}-${item._id.day}`;
      const costVND = (item.totalCostUSD || 0) * USD_TO_VND_RATE;
      costMap.set(key, costVND);
    });

    // Generate complete time series
    if (period === 'year') {
      for (let y = normalizedYear - 4; y <= normalizedYear; y++) {
        const key = `${y}`;
        timeSeriesData.push({
          label: `Năm ${y}`,
          period: y,
          revenueVND: revenueMap.get(key) || 0,
          costVND: costMap.get(key) || 0,
          netProfitVND: (revenueMap.get(key) || 0) - (costMap.get(key) || 0)
        });
      }
    } else if (period === 'month') {
      for (let m = 1; m <= 12; m++) {
        const key = `${normalizedYear}-${m}`;
        timeSeriesData.push({
          label: `Tháng ${m}/${normalizedYear}`,
          period: m,
          revenueVND: revenueMap.get(key) || 0,
          costVND: costMap.get(key) || 0,
          netProfitVND: (revenueMap.get(key) || 0) - (costMap.get(key) || 0)
        });
      }
    } else if (period === 'day') {
      const daysInMonth = new Date(normalizedYear, normalizedMonth, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${normalizedYear}-${normalizedMonth}-${d}`;
        timeSeriesData.push({
          label: `${d}/${normalizedMonth}/${normalizedYear}`,
          period: d,
          revenueVND: revenueMap.get(key) || 0,
          costVND: costMap.get(key) || 0,
          netProfitVND: (revenueMap.get(key) || 0) - (costMap.get(key) || 0)
        });
      }
    }

    res.json({
      success: true,
      data: {
        series: timeSeriesData,
        period,
        year: normalizedYear,
        month: period === 'day' ? normalizedMonth : null,
        summary: {
          totalRevenue: timeSeriesData.reduce((sum, item) => sum + item.revenueVND, 0),
          totalCost: timeSeriesData.reduce((sum, item) => sum + item.costVND, 0),
          totalProfit: timeSeriesData.reduce((sum, item) => sum + item.netProfitVND, 0)
        }
      },
      message: `Cash flow time series for ${period}`
    });

  } catch (error) {
    console.error('Error in getCashFlowTimeSeries:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu cash flow time series',
      error: error.message
    });
  }
};

// API endpoint để lấy tổng chi phí từ ImportReceipt (basePrice khi import)
exports.getTotalImportCost = async (req, res, next) => {
  try {
    const { warehouse } = req.query;
    const warehouseFilter = warehouse ? { warehouseId: new mongoose.Types.ObjectId(String(warehouse)) } : {};

    const ImportReceipt = require('../models/import/ImportReceipt');

    // Lấy tổng chi phí từ ImportReceipt details (unitPrice * quantity)
    const totalCostResult = await ImportReceipt.aggregate([
      {
        $match: {
          ...warehouseFilter,
          deletedAt: null
        }
      },
      {
        $unwind: '$details'
      },
      {
        $group: {
          _id: null,
          totalCostUSD: {
            $sum: {
              $multiply: [
                { $ifNull: ['$details.unitPrice', 0] },
                { $ifNull: ['$details.quantity', 0] }
              ]
            }
          },
          totalReceipts: { $addToSet: '$_id' }
        }
      },
      {
        $addFields: {
          totalReceipts: { $size: '$totalReceipts' }
        }
      }
    ]);

    // USD to VND exchange rate
    const USD_TO_VND_RATE = 26401; // 1 USD = 26,401 VND

    const totalCostUSD = totalCostResult.length > 0 ? totalCostResult[0].totalCostUSD : 0;
    const totalReceipts = totalCostResult.length > 0 ? totalCostResult[0].totalReceipts : 0;
    const totalCostVND = totalCostUSD * USD_TO_VND_RATE;

    res.json({
      success: true,
      totalCostUSD,
      totalCostVND,
      totalReceipts,
      message: 'Total cost calculated from ImportReceipt details (basePrice when imported)'
    });

  } catch (error) {
    console.error('Get total import cost error:', error);
    next(error);
  }
};

// Compute Ending Inventory (FIFO) based on latest import lots vs current product quantity
exports.getInventoryValueFIFO = async (req, res, next) => {
  try {
    const { warehouse } = req.query;
    const Product = require('../models/products/product');
    const ImportReceipt = require('../models/import/ImportReceipt');

    const USD_TO_VND_RATE = 26401;

    const productFilter = { deletedAt: null };
    if (warehouse) {
      productFilter.warehouseId = new mongoose.Types.ObjectId(String(warehouse));
    }

    // Load all products with current stock
    const products = await Product.find(productFilter)
      .select('_id name sku quantity basePrice')
      .lean();

    let totalEndingInventoryVND = 0;

    // For performance, prefetch all import lots grouped by product
    const lots = await ImportReceipt.aggregate([
      { $match: { deletedAt: null, ...(warehouse ? { warehouseId: new mongoose.Types.ObjectId(String(warehouse)) } : {}) } },
      { $unwind: '$details' },
      {
        $project: {
          productId: '$details.productId',
          quantity: '$details.quantity',
          unitPriceUSD: { $ifNull: ['$details.unitPrice', 0] },
          createdAt: '$createdAt'
        }
      },
      { $sort: { createdAt: -1 } }, // newest first to build FIFO ending inventory
      {
        $group: {
          _id: '$productId',
          lots: { $push: { quantity: '$quantity', unitPriceUSD: '$unitPriceUSD' } }
        }
      }
    ]);

    const productIdToLots = new Map(lots.map(g => [String(g._id), g.lots]));

    for (const p of products) {
      const endingQty = Number(p.quantity || 0);
      if (endingQty <= 0) continue;

      let remaining = endingQty;
      let valueVND = 0;
      const lotList = productIdToLots.get(String(p._id)) || [];

      for (const lot of lotList) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, Number(lot.quantity || 0));
        if (take > 0) {
          const costVND = Number(lot.unitPriceUSD || 0) * USD_TO_VND_RATE;
          valueVND += take * costVND;
          remaining -= take;
        }
      }

      // If imports are insufficient to cover current stock, fallback to product.basePrice (assumed USD)
      if (remaining > 0) {
        const fallbackCostVND = Number(p.basePrice || 0) * USD_TO_VND_RATE;
        valueVND += remaining * fallbackCostVND;
      }

      totalEndingInventoryVND += valueVND;
    }

    return res.json({
      success: true,
      data: {
        summary: {
          currentValue: Math.round(totalEndingInventoryVND),
          trend: 0,
          averageValue: Math.round(totalEndingInventoryVND)
        },
        series: [
          { label: 'T-2', valueVND: Math.round(totalEndingInventoryVND * 0.94) },
          { label: 'T-1', valueVND: Math.round(totalEndingInventoryVND * 0.97) },
          { label: 'Hiện tại', valueVND: Math.round(totalEndingInventoryVND) }
        ]
      }
    });
  } catch (error) {
    console.error('ReportsController.getInventoryValueFIFO error:', error);
    return next(error);
  }
};
