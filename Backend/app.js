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
const warehouseRoute = require('./router/warehouseRoute');
const userRoute = require('./router/UserRoute');
const authRoute = require('./router/authRoute');
const exportRoute = require('./router/ExportRoute');
const importRoute = require('./router/ImportRoute');
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
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

//router
app.use('/api/suppliers', supplierRoute)
app.use('/warehouse', warehouseRoute)
app.use('/user', userRoute)
app.use('/api/auth', authRoute)
app.use('/export', exportRoute)
app.use('/import', importRoute)
app.get('/', (req, res) => {
  res.send('Backend Node.js is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


module.exports = {
  app
}