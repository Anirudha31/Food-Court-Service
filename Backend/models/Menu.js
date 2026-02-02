const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  dish_name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  available_quantity: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    enum: ['breakfast', 'lunch', 'snacks', 'dinner', 'beverages'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  image_url: {
    type: String,
    trim: true
  },
  is_available: {
    type: Boolean,
    default: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
menuSchema.index({ dish_name: 1, date: 1 });
menuSchema.index({ category: 1, date: 1 });

module.exports = mongoose.model('Menu', menuSchema);
