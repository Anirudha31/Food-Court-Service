require('dotenv').config();
const dns = require('dns');

// Force Node to use Google's Public DNS (Fixes the ECONNREFUSED error)
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 
const User = require('./models/User'); // Ensure this path matches your folder structure

// Safety check to ensure the environment variables are loaded
if (!process.env.MONGODB_URI) {
    console.error(' FATAL ERROR: MONGODB_URI is not defined in your .env file.');
    process.exit(1);
}

// Connect to MongoDB using the IPv4 fallback for stability
mongoose.connect(process.env.MONGODB_URI, { family: 4 })
    .then(() => {
        console.log('MongoDB Connected. Seeding user data...');
        seedData();
    })
    .catch(err => {
        console.error(' MongoDB Connection Error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        // Clear out old data to prevent duplicate entries
        await User.deleteMany({});
        console.log(' Existing users cleared.');

        const usersData = [
            {
                name: 'System Admin',
                college_id: 'admin1',
                email: 'admin@college.edu',
                password: 'admin123',
                role: 'admin',
                status: 'active',
                department: 'Administration'
            },
            {
                name: 'Anirudha Khanrah',
                college_id: 'BWU/BTS/24/269',
                email: 'anirudha@college.edu',
                password: 'anirudha123',
                role: 'student',
                status: 'active',
                department: 'Computer Science'
            },
            {
                name: 'Rana Pratap Chaulya',
                college_id: 'BWU/BTS/24/279',
                email: 'rana@college.edu',
                password: 'ranapratap123',
                role: 'student',
                status: 'active',
                department: 'Computer Science'
            },
            {
                name: 'Sayak Das',
                college_id: 'BWU/BTS/24/299',
                email: 'sayak@college.edu',
                password: 'sayakdas123',
                role: 'student',
                status: 'active',
                department: 'Computer Science'
            },
            {
                name: 'Canteen Staff',
                college_id: 'STAFF1',
                email: 'staff@college.edu',
                password: 'staff123',
                role: 'staff',
                status: 'active',
                department: 'Canteen Operations'
            },
            {
                name: 'Dr. Sharma',
                college_id: 'PROF1',
                email: 'sharma@college.edu',
                password: 'prof123',
                role: 'professor',
                status: 'active',
                department: 'Physics'
            }
        ];

        // Hash the passwords BEFORE inserting them into the database
        const hashedUsersData = usersData.map(user => {
            return {
                ...user,
                // Scramble the password using bcrypt with 10 salt rounds
                password: bcrypt.hashSync(user.password, 10) 
            };
        });

        // Insert the newly secured array
        await User.insertMany(hashedUsersData);
        console.log(' Users seeded successfully with encrypted passwords!');
        
        process.exit(0); // 0 means a clean, successful exit
    } catch (error) {
        console.error('\n Seeding Error:', error.message);
        process.exit(1); // 1 means exit with an error
    }
};