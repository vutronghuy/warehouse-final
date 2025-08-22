require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT; 


//Route:
const supplierRoute = require('./router/SupplierRoute');
const categoryRoute = require('./router/CategoryRoute');
const productRoute = require('./router/ProductRoute');
const warehouseRoute = require('./router/WarehouseRouteNew');
// const warehouseRoute = require('./router/warehouseRoute');
const userRoute = require('./router/UserRoute');
const authRoute = require('./router/authRoute');
const exportRoute = require('./router/ExportRoute');
const importRoute = require('./router/ImportRoute');
const exportReceiptRoute = require('./router/ExportReceiptRoute');
const invoiceRoute = require('./router/InvoiceRoute');
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
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'],
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
app.use('/api/products', productRoute)
app.use('/api/warehouses', warehouseRoute)

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
app.use('/import', importRoute)
app.get('/', (req, res) => {
  res.send('Backend Node.js is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API Base URL: http://localhost:${PORT}`);
});


module.exports = {
  app
}