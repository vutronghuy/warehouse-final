require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');
const socketService = require('./services/socketService');
// const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT || 3001; 


//Route:
const supplierRoute = require('./router/SupplierRoute');
const categoryRoute = require('./router/CategoryRoute');
const productRoute = require('./router/ProductRoute');
const warehouseRoute = require('./router/WarehouseRouteNew');
// const warehouseRoute = require('./router/warehouseRoute');
const userRoute = require('./router/UserRoute');
const authRoute = require('./router/authRoute');
const customerRoute = require('./router/CustomerRoute');
const exportRoute = require('./router/ExportRoute');
const importRoute = require('./router/ImportRoute');
const exportReceiptRoute = require('./router/ExportReceiptRoute');
const invoiceRoute = require('./router/InvoiceRoute');
const targetRoute = require('./router/TargetRoute');
const reportsRoute = require('./router/reports');
//connect to mongodb
const dbURI = process.env.DB_URI;
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Error connecting to MongoDB:', err));


app.use(express.json());
app.use(express.text()); // Thêm dòng này để parse text/plain
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:4173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl}`, {
    body: req.body,
    headers: req.headers.authorization ? 'Bearer ***' : 'No auth',
    timestamp: new Date().toISOString()
  });
  next();
});

//router
app.use('/api/suppliers', supplierRoute)
app.use('/api/categories', categoryRoute)
app.use('/api/customers', customerRoute)
app.use('/api/products', productRoute)
app.use('/api/warehouses', warehouseRoute)
app.use('/api/reports', reportsRoute)
// Debug middleware for /api/users
app.use('/api/users', (req, res, next) => {
  console.log(`🔍 API Users route hit: ${req.method} ${req.path}`);
  console.log('📝 Headers:', req.headers);
  next();
});

app.use('/api/users', userRoute)
app.use('/api/auth', authRoute)
app.use('/api/export-receipts', exportReceiptRoute)
app.use('/api/invoices', invoiceRoute)
app.use('/export', exportRoute)
app.use('/api/import', importRoute)
app.use('/api/targets', targetRoute)
app.get('/', (req, res) => {
  res.send('Backend Node.js is running!');
});

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

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Join room based on user role
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`👤 Client ${socket.id} joined room: ${room}`);
  });
  
  // Leave room
  socket.on('leave-room', (room) => {
    socket.leave(room);
    console.log(`👤 Client ${socket.id} left room: ${room}`);
  });
  
  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log('❌ Client disconnected:', socket.id, 'Reason:', reason);
  });
  
  // Handle errors
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
}