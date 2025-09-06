// controller/ReportsController.js
const mongoose = require('mongoose');
const Product = require('../models/products/product'); 

const Invoice = require('../models/Invoice'); 


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
      { $unwind: { path: '$items', preserveNullAndEmptyArrays: false } },
      // lookup product document for each item.productId
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
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
          'items._quantity': { $ifNull: ['$items.quantity', 0] },
          'items._unitPrice': {
            $cond: [
              { $ifNull: ['$items.unitPrice', false] },
              '$items.unitPrice',
              { $ifNull: ['$items.price', 0] }
            ]
          },
          'items._basePrice': {
            $cond: [
              { $ifNull: ['$items.basePrice', false] },
              '$items.basePrice',
              { $ifNull: ['$product.basePrice', 0] }
            ]
          },
          'items._productName': { $ifNull: ['$product.name', null] },
          'items._productSku': { $ifNull: ['$product.sku', null] },
          'items._productStock': { $ifNull: ['$product.quantity', 0] },
          'items._productId': { $ifNull: ['$items.productId', null] }
        }
      },
      // project fields we need
      {
        $project: {
          invoiceId: '$_id',
          productId: '$items._productId',
          productName: '$items._productName',
          productSku: '$items._productSku',
          productStock: '$items._productStock',
          qty: '$items._quantity',
          revenue: { $multiply: ['$items._quantity', '$items._unitPrice'] },
          cost: { $multiply: ['$items._quantity', '$items._basePrice'] }
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
