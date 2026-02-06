const express = require('express');
const router = express.Router();
const User = require('../models/User');

// DEBUG: Get all users (Remove this later)
router.get('/check-users', async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Don't show hashed passwords
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
