const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now  
  }
});

module.exports = mongoose.model('Medicine', medicineSchema);
