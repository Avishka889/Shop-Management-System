const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    type: {
        type: String,
        enum: ['Missing Production', 'Missing Order', 'Low Stock', 'Production Update'],
        required: true
    },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ['Pending', 'Completed'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
