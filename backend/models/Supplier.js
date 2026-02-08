const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contact: { type: String, required: true },
    address: { type: String },
    items: [{ type: String }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
