const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

const Settings = require('../models/Settings');

// @desc    Get all notifications
// @route   GET /api/notifications
router.get('/', protect, async (req, res) => {
    try {
        const settings = await Settings.findOne();

        // Self-healing: If inventory is now above threshold, mark ALL pending Low Stock notifications as completed
        if (settings && settings.totalInventory > settings.lowStockThreshold) {
            await Notification.updateMany(
                { type: 'Low Stock', status: 'Pending' },
                { status: 'Completed' }
            );
        }

        const notifications = await Notification.find().sort({ date: -1 });
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Mark notification as completed (optional, usually automatic)
// @route   PUT /api/notifications/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (notification) {
            notification.status = 'Completed';
            await notification.save();
            res.json(notification);
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
