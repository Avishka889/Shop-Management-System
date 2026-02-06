const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');
        const schema = new mongoose.Schema({ t: String });
        const Test = mongoose.model('Test', schema);
        await Test.create({ t: 'hello' });
        console.log('Write Success');
        await mongoose.connection.close();
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
};
test();
