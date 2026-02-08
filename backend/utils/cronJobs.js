const cron = require('node-cron');
const Production = require('../models/Production');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

const initCronJobs = () => {
    // Schedule check for 6:00 PM daily
    // * * * * * = Minute, Hour, Day of Month, Month, Day of Week
    // '0 18 * * *' = 18:00 every day
    // For testing/demo, you might use '*/5 * * * *' (every 5 mins) or just run it once
    cron.schedule('0 18 * * *', async () => {
        console.log('Running Daily Data Entry Check...');
        const todayAtZero = new Date().setHours(0, 0, 0, 0);
        const todayEnd = new Date().setHours(23, 59, 59, 999);

        // Check Daily Production
        const productionToday = await Production.findOne({
            date: { $gte: todayAtZero, $lte: todayEnd }
        });

        if (!productionToday) {
            await Notification.create({
                date: todayAtZero,
                type: 'Missing Production',
                message: 'Daily Production Not Entered',
                status: 'Pending'
            });
        }

        // Check Orders
        const orderToday = await Order.findOne({
            date: { $gte: todayAtZero, $lte: todayEnd }
        });

        if (!orderToday) {
            await Notification.create({
                date: todayAtZero,
                type: 'Missing Order',
                message: 'No Orders Entered Today',
                status: 'Pending'
            });
        }
    });
};

module.exports = initCronJobs;
