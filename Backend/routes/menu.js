const express = require('express');
const { body, validationResult } = require('express-validator');
const Menu = require('../models/Menu');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

//Global Canteen Status (Defaults to Open when server starts)
let isCanteenOpen = true;

//Check if Canteen is Open
router.get('/status', (req, res) => {
  res.json({ isOpen: isCanteenOpen });
});

//Toggle Canteen Status (Admin)
router.post('/status/toggle', authenticate, authorize('admin'), (req, res) => {
  isCanteenOpen = !isCanteenOpen;
  res.json({ isOpen: isCanteenOpen, message: `Canteen is now ${isCanteenOpen ? 'OPEN' : 'CLOSED'}` });
});

// Get today's menu (public)
router.get('/today', async (req, res) => {
  try {
    // Just fetch everything that is marked as available!
    const menu = await Menu.find({ is_available: true }).sort({ category: 1, dish_name: 1 });

    const groupedMenu = menu.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({ message: 'Menu retrieved successfully', menu: groupedMenu });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching menu' });
  }
});

// Get menu by date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const menu = await Menu.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      is_available: true
    }).sort({ category: 1, dish_name: 1 });

    const groupedMenu = menu.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({
      message: 'Menu retrieved successfully',
      menu: groupedMenu,
      date: targetDate
    });
  } catch (error) {
    console.error('Get menu by date error:', error);
    res.status(500).json({ message: 'Server error while fetching menu' });
  }
});

// Add menu item (admin/staff only)
router.post('/', authenticate, authorize('admin', 'staff'), [
  body('dish_name').notEmpty().withMessage('Dish name is required'),
  body('price').isNumeric(),
  body('available_quantity').isInt({ min: 0 }),
  body('category').isIn(['breakfast', 'lunch', 'snacks', 'dinner', 'beverages'])
], async (req, res) => {
  try {
    const { dish_name, price, available_quantity, category, description, image_url } = req.body;

    // Just check if the dish name exists AT ALL
    const existingDish = await Menu.findOne({ dish_name });
    if (existingDish) {
      return res.status(400).json({ message: 'Dish already exists in the permanent menu' });
    }

    const menuItem = new Menu({ dish_name, price, available_quantity, category, description, image_url });
    await menuItem.save();

    res.status(201).json({ message: 'Menu item added successfully', menuItem });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update menu item (admin/staff only)
router.put('/:id', authenticate, authorize('admin', 'staff'), [
  body('dish_name').optional().notEmpty().withMessage('Dish name cannot be empty'),
  body('price').optional().isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('available_quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
  body('category').optional().isIn(['breakfast', 'lunch', 'snacks', 'dinner', 'beverages']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;

    const menuItem = await Menu.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({
      message: 'Menu item updated successfully',
      menuItem
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error while updating menu item' });
  }
});

// Delete menu item (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await Menu.findByIdAndDelete(id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json({
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error while deleting menu item' });
  }
});

// Toggle menu item availability (admin/staff only)
router.patch('/:id/toggle', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await Menu.findById(id);

    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menuItem.is_available = !menuItem.is_available;
    await menuItem.save();

    res.json({
      message: `Menu item ${menuItem.is_available ? 'enabled' : 'disabled'} successfully`,
      menuItem
    });
  } catch (error) {
    console.error('Toggle menu item error:', error);
    res.status(500).json({ message: 'Server error while toggling menu item' });
  }
});

// Get all menu items for management (admin/staff only)
router.get('/manage/all', authenticate, authorize('admin', 'staff'), async (req, res) => {
  try {
    const { page = 1, limit = 50, category, date } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};

    // Only apply category filter if it's actually provided
    if (category) filter.category = category;

    // Fixed Date Logic: Only filter by date if the user sends one
    if (date && date !== 'undefined' && date !== '') {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.date = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    // Fetch items with the flexible filter
    const menuItems = await Menu.find(filter)
      .sort({ createdAt: -1 }) // Show newest items first
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Menu.countDocuments(filter);

    res.json({
      message: 'Menu items retrieved successfully',
      menuItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get all menu items error:', error);
    res.status(500).json({ message: 'Server error while fetching menu items' });
  }
});
module.exports = router;
