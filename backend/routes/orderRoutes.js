const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// @desc    Add customer order
// @route   POST /api/orders
router.post('/', protect, async (req, res) => {
    const { date, customerName, quantity, amount } = req.body;

    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({ ownerSecretPassword: 'admin' });
        }

        // Prevent new orders if stock becomes negative
        if (settings.totalInventory < quantity) {
            return res.status(400).json({ message: 'Insufficient inventory stock' });
        }

        const order = await Order.create({
            date: date || new Date(),
            customerName,
            quantity,
            amount,
            supervisor: req.user._id
        });

        // Deduct from Total Inventory
        settings.totalInventory -= Number(quantity);
        await settings.save();

        // Check for Low Stock Warning
        if (settings.totalInventory <= settings.lowStockThreshold) {
            // Create notification if not already existing today
            const today = new Date().setHours(0, 0, 0, 0);
            const existingLowStock = await Notification.findOne({
                type: 'Low Stock',
                date: today,
                status: 'Pending'
            });

            if (!existingLowStock) {
                await Notification.create({
                    date: today,
                    type: 'Low Stock',
                    message: `Low Stock Warning – Production Required (Current: ${settings.totalInventory})`,
                    status: 'Pending'
                });
            }
        }

        // If there was a missing order notification for this date, mark it completed
        const orderDate = new Date(date || new Date()).setHours(0, 0, 0, 0);
        await Notification.findOneAndUpdate(
            { date: orderDate, type: 'Missing Order', status: 'Pending' },
            { status: 'Completed' }
        );

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error' });
    }
});

// @desc    Get all orders (with optional date range)
// @route   GET /api/orders
router.get('/', protect, async (req, res) => {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
        query.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    try {
        const orders = await Order.find(query).sort({ date: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
