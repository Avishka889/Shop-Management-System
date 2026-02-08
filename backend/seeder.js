const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedUsers = async () => {
    try {
        console.log('--- Seeding Process Started ---');
        console.log('Connecting to:', process.env.MONGO_URI);

        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Drop the collection to clear all old indexes (like the unique email index)
        try {
            await mongoose.connection.db.dropCollection('users');
            console.log('✅ Dropped users collection (cleared old indexes)');
        } catch (e) {
            console.log('ℹ️ Collection not found or already dropped, skipping drop.');
        }

        console.log('Creating Owner user...');
        const owner = await User.create({
            name: 'Sachith (Owner)',
            username: 'owner',
            password: 'password123',
            role: 'owner',
            profilePicture: 'https://cdn-icons-png.flaticon.com/512/6833/6833605.png'
        });
        console.log('✅ Owner created:', owner.username);

        console.log('Creating Supervisor user...');
        const supervisor = await User.create({
            name: 'Amila (Supervisor)',
            username: 'supervisor',
            password: 'password123',
            role: 'supervisor',
            profilePicture: 'https://cdn-icons-png.flaticon.com/512/9131/9131529.png'
        });
        console.log('✅ Supervisor created:', supervisor.username);

        const Settings = require('./models/Settings');
        console.log('Creating Initial Settings...');
        await Settings.create({
            ownerSecretPassword: 'secretpassword',
            lowStockThreshold: 50,
            totalInventory: 0,
            totalProduction: 0
        });
        console.log('✅ Initial Settings created');

        console.log('--- 🚀 Seeding Successful! ---');
        console.log('Try logging in with:');
        console.log('User: owner / Pass: password123');
        console.log('User: supervisor / Pass: password123');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ SEED ERROR:', error.message);
        process.exit(1);
    }
};

seedUsers();
