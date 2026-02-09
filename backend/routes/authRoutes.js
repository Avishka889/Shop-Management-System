const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Auth user & get token
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const isMatch = await user.matchPassword(password);

        if (isMatch) {
            res.json({
                _id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
                profilePicture: user.profilePicture,
                token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                    expiresIn: '30d',
                }),
            });
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Register a new user (For initial setup/testing)
// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, username, password, role } = req.body;

    try {
        const userExists = await User.findOne({ username });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            username,
            password,
            role
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                username: user.username,
                role: user.role,
                profilePicture: user.profilePicture,
                token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                    expiresIn: '30d',
                }),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

const { protect } = require('../middleware/authMiddleware');

// @desc    Update user profile (password only)
// @route   PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);



        if (user) {
            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                username: updatedUser.username,
                role: updatedUser.role,
                profilePicture: updatedUser.profilePicture,
                token: jwt.sign({ id: updatedUser._id }, process.env.JWT_SECRET, {
                    expiresIn: '30d',
                }),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }


});

module.exports = router;
