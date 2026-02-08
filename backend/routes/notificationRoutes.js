const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all notifications
// @route   GET /api/notifications
router.get('/', protect, async (req, res) => {
    try {
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
