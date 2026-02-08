const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, owner } = require('../middleware/authMiddleware');

// @desc    Get system settings
// @route   GET /api/settings
router.get('/', protect, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // Initial settings if none exist
            settings = await Settings.create({
                ownerSecretPassword: 'admin',
                lowStockThreshold: 100,
                totalInventory: 0
            });
        }
        // Don't send the secret password to just anyone, even supervisor
        // But supervisor needs it for validation? Actually, the validation should happen on server.
        res.json({
            lowStockThreshold: settings.lowStockThreshold,
            totalInventory: settings.totalInventory
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Verify owner secret password
// @route   POST /api/settings/verify-secret
router.post('/verify-secret', protect, async (req, res) => {
    const { secretPassword } = req.body;
    try {
        const settings = await Settings.findOne();
        if (settings && settings.ownerSecretPassword === secretPassword) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false, message: 'Invalid secret password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update system settings (Owner only)
// @route   PUT /api/settings
router.put('/', protect, owner, async (req, res) => {
    const { ownerSecretPassword, lowStockThreshold } = req.body;
    try {
        let settings = await Settings.findOne();
        if (settings) {
            if (ownerSecretPassword) settings.ownerSecretPassword = ownerSecretPassword;
            if (lowStockThreshold !== undefined) settings.lowStockThreshold = lowStockThreshold;
            await settings.save();
            res.json(settings);
        } else {
            res.status(404).json({ message: 'Settings not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
