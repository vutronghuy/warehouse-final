require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const socketService = require('./services/socketService');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3003;

// ---------------- Access Control via mcp.config.json ----------------
const MCP_CONFIG_PATH = './mcp.config.json';
let allowedCollections = new Set();
let excludedCollections = new Set(['users', 'sessions', 'tokens', 'auth', 'system.profile', 'system.indexes']);

function loadMcpAccessConfig() {
  try {
    if (fs.existsSync(MCP_CONFIG_PATH)) {
      const raw = fs.readFileSync(MCP_CONFIG_PATH, { encoding: 'utf8' });
      const cfg = JSON.parse(raw);
      const fromCfg = (cfg?.connections?.default?.collections) || [];
      const excluded = (cfg?.options?.excludedCollections) || [];
      // Merge excluded with our static blacklist
      excludedCollections = new Set([...excludedCollections, ...excluded]);
      // Compute whitelist by removing excluded
      const wl = fromCfg.filter(n => !excludedCollections.has(n));
      allowedCollections = new Set(wl);
      console.log('✅ Loaded access config from mcp.config.json', {
        allowedCount: allowedCollections.size,
        excludedCount: excludedCollections.size
      });
    } else {
      console.warn('ℹ️ mcp.config.json not found. Falling back to empty whitelist.');
      allowedCollections = new Set();
    }
  } catch (e) {
    console.error('⚠️ Failed to load mcp.config.json. Falling back to empty whitelist.', e.message);
    allowedCollections = new Set();
  }
}

loadMcpAccessConfig();


// CORS options
const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'If-None-Match',
    'Last-Modified'
  ]
};

// Routes (existing)
const supplierRoute = require('./router/SupplierRoute');
const categoryRoute = require('./router/CategoryRoute');
const productRoute = require('./router/ProductRoute');
const warehouseRoute = require('./router/WarehouseRouteNew');
const userRoute = require('./router/UserRoute');
const authRoute = require('./router/authRoute');
const customerRoute = require('./router/CustomerRoute');
const exportRoute = require('./router/ExportRoute');
const importRoute = require('./router/ImportRoute');
const exportReceiptRoute = require('./router/ExportReceiptRoute');
const invoiceRoute = require('./router/InvoiceRoute');
const targetRoute = require('./router/TargetRoute');
const reportsRoute = require('./router/reports');
const auditRoute = require('./router/auditRoute');
const userRoleRoute = require('./router/userRoleRoute');
const chatRoute = require('./router/chatRoute');

// connect to mongodb (existing)
const dbURI = process.env.DB_URI || process.env.MONGO_URI;
mongoose.connect(dbURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl}`, {
    body: req.body,
    headers: req.headers && req.headers.authorization ? 'Bearer ***' : 'No auth',
    timestamp: new Date().toISOString()
  });
  next();
});

// existing routers
app.use('/api/suppliers', supplierRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/customers', customerRoute);
app.use('/api/products', productRoute);
app.use('/api/warehouses', warehouseRoute);
app.use('/api/reports', reportsRoute);

// Debug middleware for /api/users
app.use('/api/users', (req, res, next) => {
  console.log(`🔍 API Users route hit: ${req.method} ${req.path}`);
  console.log('📝 Headers:', req.headers);
  next();
});

app.use('/api/users', userRoute);
app.use('/api/auth', authRoute);
app.use('/api/export-receipts', exportReceiptRoute);
app.use('/api/invoices', invoiceRoute);
app.use('/export', exportRoute);
app.use('/api/import', importRoute);
app.use('/api/targets', targetRoute);
app.use('/api/audit', auditRoute);
app.use('/api/user-roles', userRoleRoute);
app.use('/chat', chatRoute);

app.get('/', (req, res) => {
  res.send('Backend Node.js is running!');
});

// ---------------- Admin endpoints ----------------
app.post('/admin/autodiscover', (req, res) => {
  const ADMIN_KEY = process.env.ADMIN_KEY;
  if (ADMIN_KEY) {
    const sent = req.headers['x-admin-key'] || req.body?.adminKey;
    if (!sent || sent !== ADMIN_KEY) {
      return res.status(403).json({ error: 'Forbidden: missing admin key' });
    }
  }

  const cmd = 'node chatbot/mcp-autodiscover.js';
  exec(cmd, { env: process.env, timeout: 60_000 }, (error, stdout, stderr) => {
    if (error) {
      console.error('autodiscover error:', error, stderr);
      return res.status(500).json({ ok: false, error: String(error), stderr });
    }
    console.log('autodiscover stdout:', stdout);
    return res.json({ ok: true, output: stdout });
  });
});

app.get('/admin/config', (req, res) => {
  const configPath = './mcp.config.json';
  if (!fs.existsSync(configPath)) {
    return res.status(404).json({ error: 'mcp.config.json not found' });
  }
  try {
    const raw = fs.readFileSync(configPath, { encoding: 'utf8' });
    const obj = JSON.parse(raw);
    return res.json({ ok: true, config: obj });
  } catch (err) {
    console.error('Failed to read mcp.config.json', err);
    return res.status(500).json({ error: 'Failed to parse mcp.config.json' });
  }
});
// ---------------- End admin endpoints ----------------

// Tạo HTTP server
const server = createServer(app);

// Tạo Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket']
});

// Socket.IO event handlers (existing)
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`👤 Client ${socket.id} joined room: ${room}`);
  });

  socket.on('leave-room', (room) => {
    socket.leave(room);
    console.log(`👤 Client ${socket.id} left room: ${room}`);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
  });

  socket.on('error', (error) => {
    console.error('🚨 Socket error:', error);
  });
});

// Make io available globally
app.set('io', io);

// Initialize socket service
socketService.setIO(io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API Base URL: http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO server ready for connections`);
});

module.exports = {
  app,
  io
};
