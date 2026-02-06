const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const fs = require('fs');

dotenv.config();

const seedUsers = async () => {
    let log = '';
    const logger = (msg) => {
        console.log(msg);
        log += msg + '\n';
        fs.writeFileSync('seeder_debug.log', log);
    };

    try {
        logger('Seeding started...');
        await mongoose.connect(process.env.MONGO_URI);
        logger('Connected to DB');

        try {
            await mongoose.connection.db.dropCollection('users');
            logger('Dropped users collection');
        } catch (e) {
            logger('Collection drop skipped');
        }

        logger('Creating Owner...');
        try {
            const u = new User({
                name: 'Owner User',
                username: 'owner',
                password: 'password123',
                role: 'owner'
            });
            await u.save();
            logger('Owner created!');
        } catch (err) {
            logger('FAILED TO CREATE OWNER: ' + err.message);
            if (err.errors) {
                logger('Validation errors: ' + JSON.stringify(err.errors));
            }
        }

        await mongoose.connection.close();
        logger('Done');
        process.exit(0);
    } catch (error) {
        logger('CRITICAL ERROR: ' + error.message);
        process.exit(1);
    }
};

seedUsers();
