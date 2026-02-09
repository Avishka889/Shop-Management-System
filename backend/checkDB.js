const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({});
        console.log('--- USERS LIST ---');
        users.forEach(u => {
            console.log(`ID: ${u._id}`);
            console.log(`Username: ${u.username}`);
            console.log(`Role: ${u.role}`);
            console.log('---');
        });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
