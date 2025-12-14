// controllers/chatController.js
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const { generateFromGemini } = require('../utils/geminiClient');

// Load MCP config
const CONFIG_PATH = path.join(__dirname, '..', 'mcp.config.json');
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

function resolveConfigValue(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  const envPattern = /^process\.env\.([A-Z0-9_]+)$/i;
  const templatePattern = /^\$\{([A-Z0-9_]+)\}$/i;

  const envMatch = trimmed.match(envPattern);
  if (envMatch && process.env[envMatch[1]]) {
    return process.env[envMatch[1]];
  }

  const templateMatch = trimmed.match(templatePattern);
  if (templateMatch && process.env[templateMatch[1]]) {
    return process.env[templateMatch[1]];
  }

  return value;
}

const configUri = resolveConfigValue(config.connections?.default?.uri);
const configDbName = config.connections?.default?.database;

const URI = process.env.DB_URI || process.env.MONGO_URI || configUri;
const DB_NAME = process.env.DB_NAME || process.env.MONGO_DB || configDbName;

if (!URI) {
  console.error('❌ Missing MongoDB URI. Please set DB_URI or MONGO_URI in environment variables.');
}

if (!DB_NAME) {
  console.error('❌ Missing database name. Please set DB_NAME in environment variables or mcp.config.json.');
}

// Allowed collections
const allowedCollections = config.connections.default.collections || [];
const excludedCollections = config.options?.excludedCollections || [];
const validCollections = allowedCollections.filter(c => !excludedCollections.includes(c));
const MAX_COLLECTIONS = 5;
const SAFE_OPERATORS = new Set(['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$and', '$or']);
const USD_TO_VND_RATE = Number(process.env.USD_TO_VND_RATE) || 26401;
const FINANCE_KEYWORDS = [
  'revenue',
  'profit',
  'profit margin',
  'margin',
  'income',
  'accounter',
  'doanh thu',
  'lợi nhuận',
  'lãi',
  'doanh số'
];

const synonymMap = {
  products: ['product', 'products', 'item', 'items', 'sku'],
  invoices: ['invoice', 'invoices', 'bill', 'billing'],
  customers: ['customer', 'customers', 'client', 'clients'],
  suppliers: ['supplier', 'suppliers', 'vendor', 'vendors'],
  warehouses: ['warehouse', 'warehouses', 'storage'],
  categories: ['category', 'categories'],
  importreceipts: ['import receipt', 'import receipts', 'import'],
  exportreceipts: ['export receipt', 'export receipts', 'export'],
  targets: ['target', 'targets'],
  auditlogs: ['audit', 'logs', 'audit log'],
};

function detectCollectionFromQuestion(question) {
  const normalized = (question || '').toString().toLowerCase();
  if (!normalized) return null;

  for (const col of validCollections) {
    const lc = col.toLowerCase();
    if (normalized.includes(lc)) {
      return col;
    }
  }

  for (const [col, keywords] of Object.entries(synonymMap)) {
    if (!validCollections.includes(col)) continue;
    if (keywords.some((kw) => normalized.includes(kw))) {
      return col;
    }
  }

  return null;
}

function needsFinanceSummary(question) {
  const normalized = (question || '').toString().toLowerCase();
  if (!normalized) return false;
  return FINANCE_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function detectTimePeriod(question) {
  const normalized = (question || '').toString().toLowerCase();
  if (!normalized) return null;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Detect "this month" / "tháng này" / "current month"
  const thisMonthKeywords = [
    'this month',
    'tháng này',
    'current month',
    'tháng hiện tại',
    'month này'
  ];
  
  if (thisMonthKeywords.some(keyword => normalized.includes(keyword))) {
    return { year: currentYear, month: currentMonth };
  }

  // Detect "last month" / "tháng trước" / "previous month"
  const lastMonthKeywords = [
    'last month',
    'tháng trước',
    'previous month',
    'tháng vừa rồi'
  ];
  
  if (lastMonthKeywords.some(keyword => normalized.includes(keyword))) {
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    return { year: lastYear, month: lastMonth };
  }

  // Try to extract year and month from question (e.g., "revenue in 2024-01", "doanh thu tháng 1/2024")
  const yearMatch = normalized.match(/\b(20\d{2})\b/);
  const monthMatch = normalized.match(/\b(0?[1-9]|1[0-2])\b/);
  
  if (yearMatch && monthMatch) {
    const year = parseInt(yearMatch[1], 10);
    const month = parseInt(monthMatch[1], 10);
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  return null;
}

// Month name mapping (English and Vietnamese)
const monthNameMap = {
  'january': 1, 'jan': 1, 'tháng 1': 1, 'tháng một': 1,
  'february': 2, 'feb': 2, 'tháng 2': 2, 'tháng hai': 2,
  'march': 3, 'mar': 3, 'tháng 3': 3, 'tháng ba': 3,
  'april': 4, 'apr': 4, 'tháng 4': 4, 'tháng tư': 4, 'tháng bốn': 4,
  'may': 5, 'tháng 5': 5, 'tháng năm': 5,
  'june': 6, 'jun': 6, 'tháng 6': 6, 'tháng sáu': 6,
  'july': 7, 'jul': 7, 'tháng 7': 7, 'tháng bảy': 7,
  'august': 8, 'aug': 8, 'tháng 8': 8, 'tháng tám': 8,
  'september': 9, 'sep': 9, 'sept': 9, 'tháng 9': 9, 'tháng chín': 9,
  'october': 10, 'oct': 10, 'tháng 10': 10, 'tháng mười': 10,
  'november': 11, 'nov': 11, 'tháng 11': 11, 'tháng mười một': 11,
  'december': 12, 'dec': 12, 'tháng 12': 12, 'tháng mười hai': 12
};

// Detect month comparison in question - supports multiple months in same year or same month across different years
function detectMonthComparison(question) {
  const normalized = (question || '').toString().toLowerCase();
  if (!normalized) return null;

  // Check if question contains comparison keywords
  const comparisonKeywords = [
    'so sánh',
    'compare',
    'comparison',
    'và',
    'and',
    'vs',
    'versus',
    'between',
    'các tháng',
    'months'
  ];
  
  const hasComparison = comparisonKeywords.some(keyword => normalized.includes(keyword));
  if (!hasComparison) return null;

  const months = [];
  const years = [];

  // Extract years from question
  const yearMatches = normalized.match(/\b(20\d{2})\b/g);
  if (yearMatches) {
    yearMatches.forEach(y => {
      const year = parseInt(y, 10);
      if (year >= 2000 && year <= 2100 && !years.includes(year)) {
        years.push(year);
      }
    });
  }

  // First, try to extract month names (English and Vietnamese)
  for (const [name, num] of Object.entries(monthNameMap)) {
    const regex = new RegExp(`\\b${name}\\b`, 'gi');
    if (regex.test(normalized)) {
      if (!months.includes(num)) {
        months.push(num);
      }
    }
  }

  // Then, try to extract numeric months
  // Patterns: "tháng 11 và tháng 12", "month 11 and month 12", "tháng 11 vs tháng 12"
  const monthPatterns = [
    /tháng\s+(\d{1,2})/g,  // "tháng 11"
    /month\s+(\d{1,2})/gi,  // "month 11"
    /\b(\d{1,2})\s*\/\s*\d{4}/g,  // "11/2024"
  ];

  for (const pattern of monthPatterns) {
    let match;
    while ((match = pattern.exec(normalized)) !== null) {
      const month = parseInt(match[1], 10);
      if (month >= 1 && month <= 12 && !months.includes(month)) {
        months.push(month);
      }
    }
  }

  // Also try to extract standalone month numbers (1-12) near comparison keywords
  if (months.length < 2) {
    const standaloneMonths = normalized.match(/\b(1[0-2]|[1-9])\b/g);
    if (standaloneMonths) {
      standaloneMonths.forEach(m => {
        const month = parseInt(m, 10);
        if (month >= 1 && month <= 12 && !months.includes(month)) {
          months.push(month);
        }
      });
    }
  }

  // Extract default year (current year if not specified)
  const now = new Date();
  const currentYear = now.getFullYear();
  const defaultYear = years.length > 0 ? years[0] : currentYear;

  // Case 1: Multiple months in same year (e.g., "so sánh tháng 1, 2, 3 năm 2025")
  if (months.length >= 2 && years.length <= 1) {
    return {
      type: 'multiple_months_same_year',
      year: defaultYear,
      months: months.sort((a, b) => a - b) // Sort months
    };
  }

  // Case 2: Same month across different years (e.g., "so sánh tháng 11 năm 2024 và 2025")
  if (months.length === 1 && years.length >= 2) {
    return {
      type: 'same_month_different_years',
      month: months[0],
      years: years.sort((a, b) => a - b) // Sort years
    };
  }

  // Case 3: Multiple months and multiple years (e.g., "so sánh tháng 11 năm 2024 và tháng 12 năm 2025")
  // This is complex, we'll handle it as multiple comparisons
  if (months.length >= 2 && years.length >= 2) {
    // Try to match months with years if pattern is clear
    // For now, return first 2 months with their respective years if available
    return {
      type: 'multiple_months_years',
      comparisons: [
        { year: years[0] || defaultYear, month: months[0] },
        { year: years[1] || defaultYear, month: months[1] }
      ]
    };
  }

  // Case 4: Two months in same year (backward compatibility)
  if (months.length >= 2) {
    return {
      type: 'two_months_same_year',
      year: defaultYear,
      month1: months[0],
      month2: months[1]
    };
  }

  return null;
}

function sanitizeFilter(filter) {
  if (Array.isArray(filter)) {
    return filter.map((item) => (typeof item === 'object' ? sanitizeFilter(item) : item));
  }
  if (!filter || typeof filter !== 'object') return {};
  const sanitized = {};
  for (const [key, value] of Object.entries(filter)) {
    if (typeof key !== 'string') continue;
    if (key.startsWith('$')) {
      if (!SAFE_OPERATORS.has(key)) continue;
      sanitized[key] = sanitizeFilter(value);
      continue;
    }
    if (key.includes('\0')) continue;
    sanitized[key] = typeof value === 'object' && value !== null ? sanitizeFilter(value) : value;
  }
  return sanitized;
}

function formatDatasetsForContext(datasets) {
  if (!datasets.length) return '[]';
  return datasets
    .map(({ collection, documents }) => {
      if (collection === '__finance_summary') {
        return `Collection: finance_summary\n${JSON.stringify(documents[0] || {}, null, 2)}`;
      }
      if (collection === '__finance_comparison') {
        return `Collection: finance_comparison\n${JSON.stringify(documents[0] || {}, null, 2)}`;
      }
      if (!documents.length) {
        return `Collection: ${collection}\n[]`;
      }
      const serializedDocs = documents.map((doc) =>
        JSON.stringify(doc, (_, val) => (val && val._bsontype === 'ObjectID' && typeof val.toHexString === 'function' ? val.toHexString() : val), 2)
      );
      return `Collection: ${collection}\n${serializedDocs.join('\n')}`;
    })
    .join('\n\n');
}

function buildFallbackSummary(datasets) {
  const labelFields = ['name', 'title', 'productName', 'code', 'sku', 'reference'];
  const formatDocLabel = (doc) => {
    for (const field of labelFields) {
      if (doc && doc[field]) return String(doc[field]);
    }
    if (doc && doc._id) return String(doc._id);
    return '[No label]';
  };
  const formatCurrency = (value) => Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return datasets
    .map(({ collection, documents }) => {
      if (collection === '__finance_summary') {
        const summary = documents[0] || {};
        return [
          'Financial Summary (fallback)',
          `Total Revenue (VND): ${formatCurrency(summary.totalRevenueVND)}`,
          `Total Cost (VND): ${formatCurrency(summary.totalCostVND)}`,
          `Profit (VND): ${formatCurrency(summary.profitVND)}`,
          `Profit Margin: ${(summary.profitMargin || 0).toFixed(2)}`
        ].join('\n');
      }
      if (!documents.length) {
        return `No documents found in "${collection}".`;
      }
      const summaryList = documents.map((doc, idx) => `${idx + 1}. ${formatDocLabel(doc)}`).join('\n');
      return `Found ${documents.length} document(s) in "${collection}".\n${summaryList}`;
    })
    .join('\n\n');
}

function buildMonthRange(y, m) {
  const year = Number(y);
  const month = Number(m);
  if (!year || !month || month < 1 || month > 12) return null;
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

async function buildFinanceSummary(db, options = {}) {
  try {
    const { warehouseId, year, month } = options;

    const invoicesCollection = db.collection('invoices');
    const importCollection = db.collection('importreceipts');
    const baseInvoiceMatch = {
      status: { $in: ['approved', 'paid'] },
      deletedAt: { $in: [null] }
    };
    const baseImportMatch = { deletedAt: { $in: [null] } };

    // Optional warehouse filter
    if (warehouseId && ObjectId.isValid(String(warehouseId))) {
      const wid = new ObjectId(String(warehouseId));
      baseInvoiceMatch.warehouseId = wid;
      baseImportMatch.warehouseId = wid;
    }

    // Optional month filter for current period
    let currentRange = null;
    if (year && month) {
      currentRange = buildMonthRange(year, month);
    }

    let prevRange = null;
    if (currentRange) {
      const prevMonth = month === 1 ? 12 : Number(month) - 1;
      const prevYear = month === 1 ? Number(year) - 1 : Number(year);
      prevRange = buildMonthRange(prevYear, prevMonth);
    }

    const invoiceMatchAll = { ...baseInvoiceMatch };
    const invoiceMatchCurrent = currentRange
      ? { ...baseInvoiceMatch, createdAt: { $gte: currentRange.start, $lte: currentRange.end } }
      : null;
    const invoiceMatchPrev = prevRange
      ? { ...baseInvoiceMatch, createdAt: { $gte: prevRange.start, $lte: prevRange.end } }
      : null;

    const importMatchAll = { ...baseImportMatch };
    const importMatchCurrent = currentRange
      ? { ...baseImportMatch, createdAt: { $gte: currentRange.start, $lte: currentRange.end } }
      : null;

    const EUR_TO_VND_RATE = Number(process.env.EUR_TO_VND_RATE) || 28500;

    const [revenueAgg, costAgg, invoiceCount, importCount] = await Promise.all([
      invoicesCollection.aggregate([
        { $match: invoiceMatchAll },
        {
          $addFields: {
            finalAmountVND: {
              $cond: [
                { $eq: ['$currency', 'USD'] },
                { $multiply: [{ $ifNull: ['$finalAmount', 0] }, USD_TO_VND_RATE] },
                {
                  $cond: [
                    { $eq: ['$currency', 'EUR'] },
                    { $multiply: [{ $ifNull: ['$finalAmount', 0] }, EUR_TO_VND_RATE] },
                    { $ifNull: ['$finalAmount', 0] } // VND
                  ]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalAmountVND' }
          }
        }
      ]).toArray(),
      importCollection.aggregate([
        { $match: importMatchAll },
        { $unwind: '$details' },
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
      ]).toArray(),
      invoicesCollection.countDocuments(invoiceMatchAll),
      importCollection.countDocuments(importMatchAll)
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalCostUSD = costAgg[0]?.totalCostUSD || 0;
    const totalCostVND = totalCostUSD * USD_TO_VND_RATE;
    const profitVND = totalRevenue - totalCostVND;
    const profitMargin = totalRevenue > 0 ? profitVND / totalRevenue : 0;

    let revenueCurrent = null;
    let revenuePrev = null;

    if (invoiceMatchCurrent) {
      const curAgg = await invoicesCollection.aggregate([
        { $match: invoiceMatchCurrent },
        {
          $addFields: {
            finalAmountVND: {
              $cond: [
                { $eq: ['$currency', 'USD'] },
                { $multiply: [{ $ifNull: ['$finalAmount', 0] }, USD_TO_VND_RATE] },
                {
                  $cond: [
                    { $eq: ['$currency', 'EUR'] },
                    { $multiply: [{ $ifNull: ['$finalAmount', 0] }, EUR_TO_VND_RATE] },
                    { $ifNull: ['$finalAmount', 0] } // VND
                  ]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalAmountVND' }
          }
        }
      ]).toArray();
      revenueCurrent = curAgg[0]?.totalRevenue || 0;
    }

    if (invoiceMatchPrev) {
      const prevAgg = await invoicesCollection.aggregate([
        { $match: invoiceMatchPrev },
        {
          $addFields: {
            finalAmountVND: {
              $cond: [
                { $eq: ['$currency', 'USD'] },
                { $multiply: [{ $ifNull: ['$finalAmount', 0] }, USD_TO_VND_RATE] },
                {
                  $cond: [
                    { $eq: ['$currency', 'EUR'] },
                    { $multiply: [{ $ifNull: ['$finalAmount', 0] }, EUR_TO_VND_RATE] },
                    { $ifNull: ['$finalAmount', 0] } // VND
                  ]
                }
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$finalAmountVND' }
          }
        }
      ]).toArray();
      revenuePrev = prevAgg[0]?.totalRevenue || 0;
    }

    const diffValue = revenueCurrent !== null && revenuePrev !== null ? revenueCurrent - revenuePrev : null;
    const diffPercent =
      revenueCurrent !== null && revenuePrev !== null && revenuePrev !== 0
        ? (diffValue / revenuePrev)
        : null;

    return {
      totalRevenueVND: totalRevenue,
      totalCostUSD,
      usdToVndRate: USD_TO_VND_RATE,
      totalCostVND,
      profitVND,
      profitMargin,
      invoiceCount,
      importReceiptCount: importCount,
      revenueCurrent,
      revenuePrev,
      revenueDiffValue: diffValue,
      revenueDiffPercent: diffPercent,
      period: currentRange
        ? { year: Number(year), month: Number(month), prevYear: prevRange ? prevRange.start.getFullYear() : null, prevMonth: prevRange ? prevRange.start.getMonth() + 1 : null }
        : null,
      notes: 'Revenue = sum(invoice.finalAmount) for approved/paid; Cost = sum(import unitPrice*quantity, converted to VND); Profit = Revenue - Cost. Optional warehouse/month filters applied when provided.'
    };
  } catch (err) {
    console.error('Failed to build finance summary:', err.message);
    return null;
  }
}

let client;

async function initMongoClient() {
  if (!client) {
    client = new MongoClient(URI, { useUnifiedTopology: true });
    await client.connect();
    console.log('MongoDB connected');
  }
}

// Controller function -----
async function chatController(req, res) {
  try {
    await initMongoClient();
    const db = client.db(DB_NAME);

    const { question, collection, collections, limit, filters, warehouseId, year, month } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Missing question' });
    }

    const financeRequested = needsFinanceSummary(question);
    const requestedCollections = new Set();

    if (Array.isArray(collections)) {
      collections.forEach((col) => {
        if (typeof col === 'string' && validCollections.includes(col)) {
          requestedCollections.add(col);
        }
      });
    }

    if (collection && typeof collection === 'string' && validCollections.includes(collection)) {
      requestedCollections.add(collection);
    }

    if (!requestedCollections.size) {
      const detected = detectCollectionFromQuestion(question);
      if (detected) requestedCollections.add(detected);
    }

    const collectionsToQuery = Array.from(requestedCollections).slice(0, MAX_COLLECTIONS);

    if (!collectionsToQuery.length && !financeRequested) {
      return res.json({
        answer: 'I could not determine which collection to use. Please ask about a specific dataset (e.g., products, invoices, customers).'
      });
    }

    const safeLimit = Math.min(
      Math.max(parseInt(limit, 10) || config.options?.maxDocs || 5, 1),
      100
    );

    const filterConfig = filters && typeof filters === 'object' ? filters : {};
    const datasets = [];

    for (const col of collectionsToQuery) {
      const rawFilter = filterConfig[col];
      const sanitizedFilter = rawFilter ? sanitizeFilter(rawFilter) : {};
      const hasFilter = sanitizedFilter && Object.keys(sanitizedFilter).length > 0;

      let documents = [];
      try {
        if (hasFilter) {
          documents = await db.collection(col).find(sanitizedFilter).limit(safeLimit).toArray();
        } else {
          documents = await db.collection(col).find({ $text: { $search: question } }).limit(safeLimit).toArray();
        }
      } catch (err) {
        console.warn(`Query failed for collection "${col}", fallback to basic scan.`, err.message);
        const fallbackQuery = hasFilter ? sanitizedFilter : {};
        documents = await db.collection(col).find(fallbackQuery).limit(safeLimit).toArray();
      }

      datasets.push({ collection: col, documents });
    }

    if (financeRequested) {
      // Check if question asks for month comparison
      const monthComparison = detectMonthComparison(question);
      
      if (monthComparison) {
        let comparisonSummary = null;

        // Handle different comparison types
        if (monthComparison.type === 'multiple_months_same_year') {
          // Compare multiple months in the same year
          const summaries = [];
          for (const month of monthComparison.months) {
            const summary = await buildFinanceSummary(db, {
              warehouseId,
              year: monthComparison.year,
              month: month
            });
            if (summary) {
              const revenue = summary.revenueCurrent !== null && summary.revenueCurrent !== undefined 
                ? summary.revenueCurrent 
                : (summary.totalRevenueVND || 0);
              summaries.push({
                month: month,
                year: monthComparison.year,
                revenue: revenue,
                cost: summary.totalCostVND || 0,
                profit: summary.profitVND || 0,
                invoiceCount: summary.invoiceCount || 0
              });
            }
          }
          
          if (summaries.length >= 2) {
            // Find highest and lowest revenue
            const sortedByRevenue = [...summaries].sort((a, b) => b.revenue - a.revenue);
            comparisonSummary = {
              type: 'multiple_months_same_year',
              year: monthComparison.year,
              months: summaries,
              highest: sortedByRevenue[0],
              lowest: sortedByRevenue[sortedByRevenue.length - 1],
              totalRevenue: summaries.reduce((sum, s) => sum + s.revenue, 0),
              averageRevenue: summaries.reduce((sum, s) => sum + s.revenue, 0) / summaries.length
            };
          }
        } else if (monthComparison.type === 'same_month_different_years') {
          // Compare same month across different years
          const summaries = [];
          for (const year of monthComparison.years) {
            const summary = await buildFinanceSummary(db, {
              warehouseId,
              year: year,
              month: monthComparison.month
            });
            if (summary) {
              const revenue = summary.revenueCurrent !== null && summary.revenueCurrent !== undefined 
                ? summary.revenueCurrent 
                : (summary.totalRevenueVND || 0);
              summaries.push({
                month: monthComparison.month,
                year: year,
                revenue: revenue,
                cost: summary.totalCostVND || 0,
                profit: summary.profitVND || 0,
                invoiceCount: summary.invoiceCount || 0
              });
            }
          }
          
          if (summaries.length >= 2) {
            const sortedByRevenue = [...summaries].sort((a, b) => b.revenue - a.revenue);
            comparisonSummary = {
              type: 'same_month_different_years',
              month: monthComparison.month,
              years: summaries,
              highest: sortedByRevenue[0],
              lowest: sortedByRevenue[sortedByRevenue.length - 1],
              revenueDiff: summaries[summaries.length - 1].revenue - summaries[0].revenue,
              revenueDiffPercent: summaries[0].revenue > 0 
                ? ((summaries[summaries.length - 1].revenue - summaries[0].revenue) / summaries[0].revenue) * 100 
                : null
            };
          }
        } else if (monthComparison.type === 'multiple_months_years') {
          // Compare multiple months across different years
          const summaries = [];
          for (const comp of monthComparison.comparisons) {
            const summary = await buildFinanceSummary(db, {
              warehouseId,
              year: comp.year,
              month: comp.month
            });
            if (summary) {
              const revenue = summary.revenueCurrent !== null && summary.revenueCurrent !== undefined 
                ? summary.revenueCurrent 
                : (summary.totalRevenueVND || 0);
              summaries.push({
                month: comp.month,
                year: comp.year,
                revenue: revenue,
                cost: summary.totalCostVND || 0,
                profit: summary.profitVND || 0,
                invoiceCount: summary.invoiceCount || 0
              });
            }
          }
          
          if (summaries.length >= 2) {
            comparisonSummary = {
              type: 'multiple_months_years',
              periods: summaries,
              highest: summaries.reduce((max, s) => s.revenue > max.revenue ? s : max, summaries[0]),
              lowest: summaries.reduce((min, s) => s.revenue < min.revenue ? s : min, summaries[0])
            };
          }
        } else if (monthComparison.type === 'two_months_same_year' || (!monthComparison.type && monthComparison.month1 && monthComparison.month2)) {
          // Backward compatibility: two months in same year
          const summary1 = await buildFinanceSummary(db, {
            warehouseId,
            year: monthComparison.year,
            month: monthComparison.month1
          });
          
          const summary2 = await buildFinanceSummary(db, {
            warehouseId,
            year: monthComparison.year,
            month: monthComparison.month2
          });
          
          if (summary1 && summary2) {
            const revenue1 = summary1.revenueCurrent !== null && summary1.revenueCurrent !== undefined 
              ? summary1.revenueCurrent 
              : (summary1.totalRevenueVND || 0);
            const revenue2 = summary2.revenueCurrent !== null && summary2.revenueCurrent !== undefined 
              ? summary2.revenueCurrent 
              : (summary2.totalRevenueVND || 0);
            
            comparisonSummary = {
              type: 'two_months_same_year',
              month1: {
                month: monthComparison.month1,
                year: monthComparison.year,
                revenue: revenue1,
                cost: summary1.totalCostVND || 0,
                profit: summary1.profitVND || 0,
                invoiceCount: summary1.invoiceCount || 0
              },
              month2: {
                month: monthComparison.month2,
                year: monthComparison.year,
                revenue: revenue2,
                cost: summary2.totalCostVND || 0,
                profit: summary2.profitVND || 0,
                invoiceCount: summary2.invoiceCount || 0
              },
              comparison: {
                revenueDiff: revenue2 - revenue1,
                revenueDiffPercent: revenue1 > 0 ? ((revenue2 - revenue1) / revenue1) * 100 : null,
                profitDiff: (summary2.profitVND || 0) - (summary1.profitVND || 0)
              }
            };
          }
        }
        
        if (comparisonSummary) {
          datasets.push({ collection: '__finance_comparison', documents: [comparisonSummary] });
        } else {
          // Fallback: use single month if comparison fails
          const detectedPeriod = detectTimePeriod(question);
          if (detectedPeriod) {
            const financeSummary = await buildFinanceSummary(db, {
              warehouseId,
              year: detectedPeriod.year,
              month: detectedPeriod.month
            });
            if (financeSummary) {
              datasets.push({ collection: '__finance_summary', documents: [financeSummary] });
            }
          }
        }
      } else {
        // Auto-detect time period from question if not provided
        let finalYear = year;
        let finalMonth = month;
        
        if (!finalYear || !finalMonth) {
          const detectedPeriod = detectTimePeriod(question);
          if (detectedPeriod) {
            finalYear = detectedPeriod.year;
            finalMonth = detectedPeriod.month;
          }
        }
        
        const financeSummary = await buildFinanceSummary(db, { 
          warehouseId, 
          year: finalYear, 
          month: finalMonth 
        });
        if (financeSummary) {
          datasets.push({ collection: '__finance_summary', documents: [financeSummary] });
        }
      }
    }

    if (!datasets.length) {
      return res.json({ answer: 'No data available for the requested collections.' });
    }

    const context = formatDatasetsForContext(datasets);
    const hasComparison = datasets.some(d => d.collection === '__finance_comparison');
    const financeGuidance = financeRequested ? `
FINANCE DEFINITIONS:
- Revenue (doanh thu) = sum of invoice.finalAmount where status ∈ {"approved","paid"}.
- Cost = sum of import receipt detail unitPrice * quantity (USD) converted to VND at rate ${USD_TO_VND_RATE}.
- Profit = Revenue - Cost.
- Profit margin = Profit / Revenue.
${hasComparison ? `
COMPARISON DATA:
The data contains financial comparisons. The structure depends on the comparison type:

1. For "multiple_months_same_year" (comparing multiple months in same year):
   - type: "multiple_months_same_year"
   - year: The year being compared
   - months: Array of month data, each with: month (1-12), year, revenue (VND), cost (VND), profit (VND), invoiceCount
   - highest: The month with highest revenue
   - lowest: The month with lowest revenue
   - totalRevenue: Sum of all months' revenue
   - averageRevenue: Average revenue across all months

2. For "same_month_different_years" (comparing same month across years):
   - type: "same_month_different_years"
   - month: The month number (1-12)
   - years: Array of year data, each with: month, year, revenue (VND), cost (VND), profit (VND), invoiceCount
   - highest: The year with highest revenue for this month
   - lowest: The year with lowest revenue for this month
   - revenueDiff: Difference between last and first year
   - revenueDiffPercent: Percentage change

3. For "two_months_same_year" (comparing 2 months):
   - type: "two_months_same_year"
   - month1: First month data (month, year, revenue, cost, profit, invoiceCount)
   - month2: Second month data
   - comparison: Contains revenueDiff, revenueDiffPercent, profitDiff

IMPORTANT: When comparing, you MUST:
  1. Identify the comparison type from the data structure
  2. Clearly state which period(s) have higher/lower revenue
  3. State exact revenue amounts in VND for all periods
  4. Calculate and state differences and percentage changes
  5. For multiple months, identify the highest and lowest
  6. Answer in Vietnamese if the question is in Vietnamese, otherwise in English
` : ''}
` : '';
    const prompt = `
You are a data analysis assistant. Your job is to analyze ONLY the MongoDB data provided below 
and answer the QUESTION. You must reason based on numbers found in the data.

RULES:
- Do NOT invent data.
- If the question involves comparison (e.g., highest, lowest, top, so sánh), analyze the numeric fields.
- If a field is missing, ignore that document.
- Return a clear, human-friendly answer in Vietnamese if the question is in Vietnamese, otherwise in English.
- For comparison questions, clearly state which period/month has higher values and the differences.
- Also include the _id(s) of documents used for your conclusion if available.

${financeGuidance}

DATA (JSON documents):
${context}

QUESTION:
${question}

Now analyze the data and answer with reasoning.
`.trim();

    let aiText = '';
    try {
      const aiResponse = await generateFromGemini(prompt);
      aiText = aiResponse?.text?.trim();
    } catch (err) {
      console.error('Gemini analysis error:', err.message);
    }

    const fallbackAnswer = buildFallbackSummary(datasets);
    const answer = aiText || fallbackAnswer;

    res.json({ answer });

  } catch (err) {
    console.error('ChatController error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { chatController };
