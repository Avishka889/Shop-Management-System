const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    customerName: { type: String, required: true },
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
