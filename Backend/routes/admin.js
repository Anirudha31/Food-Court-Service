const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Double-check this path matches your folder structure
const Menu = require('../models/Menu'); // Assuming your menu model is named 'Menu'


// ==========================================
// 1. USER MANAGEMENT ROUTES
// ==========================================

// GET: Fetch all users for the Admin Table
router.get('/users', async (req, res) => {
    try {
        // .select('-password') ensures we NEVER send hashed passwords to the frontend
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (err) {
        console.error("Fetch Users Error:", err);
        res.status(500).json({ message: "Server error fetching users." });
    }
});

// POST: Add a new user manually from the Admin Panel
router.post('/users', async (req, res) => {
    try {
        const { name, college_id, email, password, role, phone, department } = req.body;
        
        // 1. Prevent duplicate accounts
        const existingUser = await User.findOne({ college_id });
        if (existingUser) {
            return res.status(400).json({ message: "This College ID is already registered!" });
        }

        // 2. Create the user 
        // We provide defaults for phone and department to prevent Mongoose validation crashes
        const newUser = new User({ 
            name, 
            college_id, 
            email, 
            password, // Your pre-save hook in the User model will hash this automatically
            role,
            phone: phone || "0000000000",       
            department: department || "Unassigned",  
            status: "active"
        });

        await newUser.save();
        
        res.status(201).json({ message: "User created successfully." });
    } catch (err) {
        console.error("User Creation Error:", err.message);
        // This sends the exact Mongoose error (like "password is too short") to the frontend toast
        res.status(400).json({ message: err.message }); 
    }
});

// DELETE: Remove a user permanently
router.delete('/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "User deleted successfully." });
    } catch (err) {
        console.error("Delete User Error:", err);
        res.status(500).json({ message: "Failed to delete user." });
    }
});


// ==========================================
// 2. MENU MANAGEMENT ROUTES
// ==========================================

// POST: Add a new dish to the menu
router.post('/menu', async (req, res) => {
    try {
        const { dish_name, price, category, image_url, available_quantity } = req.body;
        
        const newItem = new Menu({
            dish_name,
            price,
            category,
            image_url,
            available_quantity: available_quantity || 50
        });

        await newItem.save();
        res.status(201).json({ message: "Dish added successfully.", item: newItem });
    } catch (err) {
        console.error("Add Dish Error:", err.message);
        res.status(400).json({ message: "Failed to add dish." });
    }
});

// DELETE: Remove a dish from the menu
router.delete('/menu/:id', async (req, res) => {
    try {
        await Menu.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Dish deleted successfully." });
    } catch (err) {
        console.error("Delete Dish Error:", err);
        res.status(500).json({ message: "Failed to delete dish." });
    }
});

module.exports = router;