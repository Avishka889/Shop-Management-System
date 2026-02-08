const express = require('express');
const router = express.Router();
const Salary = require('../models/Salary');
const { protect } = require('../middleware/authMiddleware');

// @desc    Add salary record
// @route   POST /api/salaries
router.post('/', protect, async (req, res) => {
    const { date, employeeName, amount } = req.body;
    try {
        const salary = await Salary.create({
            date: date || new Date(),
            employeeName,
            amount,
            supervisor: req.user._id
        });
        res.status(201).json(salary);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Get all salaries
// @route   GET /api/salaries
router.get('/', protect, async (req, res) => {
    try {
        const salaries = await Salary.find().sort({ date: -1 });
        res.json(salaries);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
