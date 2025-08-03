require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000; 


//Route:
const supplierRoute = require('./router/SupplierRoute');

//connect to mongodb
const dbURI = process.env.DB_URI;
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Error connecting to MongoDB:', err));


app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

//router
app.use('/supplier', supplierRoute)
app.get('/', (req, res) => {
  res.send('Backend Node.js is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


module.exports = {
  app
}