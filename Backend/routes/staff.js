const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All staff routes require authentication and staff role
router.use(authenticate);
router.use(authorize('staff', 'admin'));

// Get today's orders for staff dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      order_date: { $gte: today, $lt: tomorrow }
    })
    .sort({ order_date: -1 })
    .populate('user_id', 'name college_id email');

    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.order_status === 'pending').length,
      confirmed: orders.filter(o => o.order_status === 'confirmed').length,
      preparing: orders.filter(o => o.order_status === 'preparing').length,
      ready: orders.filter(o => o.order_status === 'ready').length,
      served: orders.filter(o => o.order_status === 'served').length,
      cancelled: orders.filter(o => o.order_status === 'cancelled').length,
      totalRevenue: orders
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + o.total_amount, 0)
    };

    res.json({
      message: 'Staff dashboard data retrieved successfully',
      stats,
      orders
    });
  } catch (error) {
    console.error('Staff dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

// Verify QR code and get order details
router.post('/verify-qr', [
  body('qr_data').notEmpty().withMessage('QR data is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { qr_data } = req.body;

    let qrContent;
    try {
      qrContent = JSON.parse(qr_data);
    } catch (parseError) {
      return res.status(400).json({ message: 'Invalid QR code format' });
    }

    const { order_id } = qrContent;

    // Get order details
    const order = await Order.findOne({ order_id })
      .populate('user_id', 'name college_id email role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get payment details
    const payment = await Payment.findOne({ order_id });

    // Verify QR data matches order
    const isValidQR = 
      qrContent.payer_name === order.user_id.name &&
      qrContent.college_id === order.user_id.college_id &&
      qrContent.amount === order.total_amount &&
      qrContent.payment_status === 'PAID' &&
      order.payment_status === 'paid';

    if (!isValidQR) {
      return res.status(400).json({ message: 'QR code verification failed' });
    }

    res.json({
      message: 'QR code verified successfully',
      order,
      payment,
      qr_data: qrContent
    });
  } catch (error) {
    console.error('Verify QR code error:', error);
    res.status(500).json({ message: 'Server error while verifying QR code' });
  }
});

// Confirm order after QR verification
router.patch('/:order_id/confirm', [
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { order_id } = req.params;
    const { notes } = req.body;

    const order = await Order.findOne({ order_id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Order is not paid' });
    }

    if (order.order_status === 'served') {
      return res.status(400).json({ message: 'Order is already served' });
    }

    // Update order status
    order.order_status = 'confirmed';
    if (notes) {
      order.notes = notes;
    }
    await order.save();

    res.json({
      message: 'Order confirmed successfully',
      order
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ message: 'Server error while confirming order' });
  }
});

// Mark order as served
router.patch('/:order_id/serve', async (req, res) => {
  try {
    const { order_id } = req.params;

    const order = await Order.findOne({ order_id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.order_status === 'served') {
      return res.status(400).json({ message: 'Order is already served' });
    }

    if (order.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Order is not paid' });
    }

    // Update order status
    order.order_status = 'served';
    order.served_date = new Date();
    await order.save();

    res.json({
      message: 'Order marked as served successfully',
      order
    });
  } catch (error) {
    console.error('Serve order error:', error);
    res.status(500).json({ message: 'Server error while serving order' });
  }
});

// Get order details by order ID
router.get('/order/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params;

    const order = await Order.findOne({ order_id })
      .populate('user_id', 'name college_id email role');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const payment = await Payment.findOne({ order_id });

    res.json({
      message: 'Order details retrieved successfully',
      order,
      payment
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error while fetching order details' });
  }
});

// Get pending orders
router.get('/orders/pending', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      order_date: { $gte: today, $lt: tomorrow },
      payment_status: 'paid',
      order_status: { $in: ['confirmed', 'preparing', 'ready'] }
    })
    .sort({ order_date: -1 })
    .populate('user_id', 'name college_id email');

    res.json({
      message: 'Pending orders retrieved successfully',
      orders
    });
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ message: 'Server error while fetching pending orders' });
  }
});

// Get served orders for today
router.get('/orders/served', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const orders = await Order.find({
      order_date: { $gte: today, $lt: tomorrow },
      order_status: 'served'
    })
    .sort({ served_date: -1 })
    .populate('user_id', 'name college_id email');

    res.json({
      message: 'Served orders retrieved successfully',
      orders
    });
  } catch (error) {
    console.error('Get served orders error:', error);
    res.status(500).json({ message: 'Server error while fetching served orders' });
  }
});

// Get daily summary
router.get('/summary', async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      order_date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('user_id', 'name college_id email role');

    const summary = {
      date: targetDate,
      totalOrders: orders.length,
      paidOrders: orders.filter(o => o.payment_status === 'paid').length,
      servedOrders: orders.filter(o => o.order_status === 'served').length,
      totalRevenue: orders
        .filter(o => o.payment_status === 'paid')
        .reduce((sum, o) => sum + o.total_amount, 0),
      ordersByStatus: {
        pending: orders.filter(o => o.order_status === 'pending').length,
        confirmed: orders.filter(o => o.order_status === 'confirmed').length,
        preparing: orders.filter(o => o.order_status === 'preparing').length,
        ready: orders.filter(o => o.order_status === 'ready').length,
        served: orders.filter(o => o.order_status === 'served').length,
        cancelled: orders.filter(o => o.order_status === 'cancelled').length
      },
      topItems: {}
    };

    // Calculate top selling items
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!summary.topItems[item.dish_name]) {
          summary.topItems[item.dish_name] = { quantity: 0, revenue: 0 };
        }
        summary.topItems[item.dish_name].quantity += item.quantity;
        summary.topItems[item.dish_name].revenue += item.subtotal;
      });
    });

    // Sort top items by quantity
    summary.topItems = Object.entries(summary.topItems)
      .sort(([,a], [,b]) => b.quantity - a.quantity)
      .slice(0, 10)
      .reduce((obj, [name, data]) => {
        obj[name] = data;
        return obj;
      }, {});

    res.json({
      message: 'Daily summary retrieved successfully',
      summary
    });
  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(500).json({ message: 'Server error while fetching daily summary' });
  }
});

module.exports = router;
