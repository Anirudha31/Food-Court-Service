const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Login user
router.post('/login', [
  body('college_id').notEmpty().withMessage('College ID is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { college_id, password } = req.body;

    // Find user by college ID
    const user = await User.findOne({ college_id });
    if (!user) {
      return res.status(401).json({ message: 'Invalid College ID' });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Verify password using the method defined in User.js model
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect Password' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user info (excluding password) and token
    res.json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
        college_id: user.college_id
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Profile and other routes...
router.get('/profile', authenticate, async (req, res) => {
  res.json({ message: 'Profile retrieved successfully', user: req.user });
});

module.exports = router;