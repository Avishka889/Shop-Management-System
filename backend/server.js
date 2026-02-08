const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const productionRoutes = require('./routes/productionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const salaryRoutes = require('./routes/salaryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const initCronJobs = require('./utils/cronJobs');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/productions', productionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);

// Initialize Cron Jobs
initCronJobs();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
