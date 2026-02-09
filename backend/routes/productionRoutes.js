const express = require('express');
const router = express.Router();
const Production = require('../models/Production');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// @desc    Add daily production
// @route   POST /api/productions
router.post('/', protect, async (req, res) => {
    const { date, quantity } = req.body;

    try {
        const production = await Production.create({
            date: date || new Date(),
            quantity,
            supervisor: req.user._id
        });

        // Update Total Inventory/Production in Settings
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({ ownerSecretPassword: 'admin' });
        }
        settings.totalInventory += Number(quantity);
        settings.totalProduction += Number(quantity);
        await settings.save();

        // If there was a missing data notification for this date, mark it completed
        const startOfDay = new Date(date || new Date()).setHours(0, 0, 0, 0);
        const endOfDay = new Date(date || new Date()).setHours(23, 59, 59, 999);

        await Notification.findOneAndUpdate(
            {
                date: { $gte: startOfDay, $lte: endOfDay },
                type: 'Missing Production',
                status: 'Pending'
            },
            { status: 'Completed' }
        );


        // If inventory is now above threshold, mark ALL pending Low Stock notifications as completed
        if (settings.totalInventory > settings.lowStockThreshold) {
            await Notification.updateMany(
                { type: 'Low Stock', status: 'Pending' },
                { status: 'Completed' }
            );
        }

        res.status(201).json(production);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get all productions (with optional date range)
// @route   GET /api/productions
router.get('/', protect, async (req, res) => {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date = {
            $gte: start,
            $lte: end
        };
    }


    try {
        const productions = await Production.find(query).populate('supervisor', 'name username').sort({ date: -1 });
        res.json(productions);

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get production by date
// @route   GET /api/productions/date/:date
router.get('/date/:date', protect, async (req, res) => {
    const { date } = req.params;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    try {
        const production = await Production.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });
        res.json(production);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Add or Update daily production with secret password
// @route   POST /api/productions/sync
router.post('/sync', protect, async (req, res) => {
    const { date, quantity, secretPassword } = req.body;

    try {
        // Verify secret password
        const settings = await Settings.findOne();
        if (!settings || settings.ownerSecretPassword !== secretPassword) {
            return res.status(401).json({ message: 'Invalid secret password' });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        let production = await Production.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        let qtyDifference = 0;
        if (production) {
            // Update existing
            qtyDifference = Number(quantity) - production.quantity;
            production.quantity = Number(quantity);
            await production.save();
        } else {
            // Create new
            qtyDifference = Number(quantity);
            production = await Production.create({
                date: new Date(date),
                quantity: Number(quantity),
                supervisor: req.user._id
            });
        }

        // Update Total Inventory/Production in Settings
        settings.totalInventory += qtyDifference;
        settings.totalProduction += qtyDifference;
        await settings.save();

        // Handle Notifications
        await Notification.findOneAndUpdate(
            {
                date: { $gte: startOfDay, $lte: endOfDay },
                type: 'Missing Production',
                status: 'Pending'
            },
            { status: 'Completed' }
        );

        if (settings.totalInventory > settings.lowStockThreshold) {
            await Notification.updateMany(
                { type: 'Low Stock', status: 'Pending' },
                { status: 'Completed' }
            );
        }

        // Create notification for Owner about this manual change
        const formattedDate = new Date(date).toLocaleDateString();
        const supervisorName = req.user.name;
        const syncMessage = qtyDifference !== Number(quantity)
            ? `Supervisor ${supervisorName} updated production for ${formattedDate} from ${Number(quantity) - qtyDifference} to ${quantity} units using secret password.`
            : `Supervisor ${supervisorName} added missing production for ${formattedDate} (${quantity} units) using secret password.`;

        await Notification.create({
            date: new Date(),
            type: 'Production Update',
            message: syncMessage,
            status: 'Pending' // Show as pending so owner sees it
        });


        res.json({ success: true, message: 'Daily production updated successfully', production });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
