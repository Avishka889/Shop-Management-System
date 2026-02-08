const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { protect } = require('../middleware/authMiddleware');

// @desc    Add supplier
// @route   POST /api/suppliers
router.post('/', protect, async (req, res) => {
    const { name, contact, address, items } = req.body;
    try {
        const supplier = await Supplier.create({ name, contact, address, items });
        res.status(201).json(supplier);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get all suppliers
// @route   GET /api/suppliers
router.get('/', protect, async (req, res) => {
    try {
        const suppliers = await Supplier.find().sort({ createdAt: -1 });
        res.json(suppliers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
