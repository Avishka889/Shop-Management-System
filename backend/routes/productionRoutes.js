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
        const productionDate = new Date(date || new Date()).setHours(0, 0, 0, 0);
        await Notification.findOneAndUpdate(
            { date: productionDate, type: 'Missing Production', status: 'Pending' },
            { status: 'Completed' }
        );

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
        query.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    try {
        const productions = await Production.find(query).sort({ date: -1 });
        res.json(productions);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
