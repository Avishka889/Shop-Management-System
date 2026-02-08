const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    ownerSecretPassword: { type: String, required: true },
    lowStockThreshold: { type: Number, default: 100 },
    totalInventory: { type: Number, default: 0 },
    totalProduction: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
