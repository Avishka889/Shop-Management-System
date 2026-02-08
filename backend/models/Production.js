const mongoose = require('mongoose');

const productionSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    quantity: { type: Number, required: true },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Production', productionSchema);
