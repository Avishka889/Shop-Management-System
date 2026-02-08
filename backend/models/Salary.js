const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    employeeName: { type: String, required: true },
    amount: { type: Number, required: true },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Salary', salarySchema);
