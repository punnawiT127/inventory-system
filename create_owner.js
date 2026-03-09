require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/inventory-db';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to Database');

        // Check if Owner exists
        const ownerExists = await User.findOne({ role: 'Owner' });
        if (ownerExists) {
            console.log('Owner account already exists (username: ' + ownerExists.username + '). Skipped creation.');
            process.exit(0);
        }

        // Create default Owner
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash('admin123', saltRounds);

        const owner = new User({
            username: 'admin',
            password: hashedPassword,
            role: 'Owner'
        });

        await owner.save();
        console.log('SUCCESS: Default Owner account created!');
        console.log('Username: admin');
        console.log('Password: admin123');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error connecting to db:', err);
        process.exit(1);
    });
