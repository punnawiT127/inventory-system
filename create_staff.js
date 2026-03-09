require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory-db';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to Database');

        // Check if Staff exists
        const staffExists = await User.findOne({ role: 'Staff' });
        if (staffExists) {
            console.log('Staff account already exists (username: ' + staffExists.username + '). Skipped creation.');
            process.exit(0);
        }

        // Create default Staff
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('staff123', saltRounds);

        const staff = new User({
            username: 'staff',
            password: hashedPassword,
            role: 'Staff'
        });

        await staff.save();
        console.log('SUCCESS: Default Staff account created!');
        console.log('Username: staff');
        console.log('Password: staff123');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error connecting to db:', err);
        process.exit(1);
    });
