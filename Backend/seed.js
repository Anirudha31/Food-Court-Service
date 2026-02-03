const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB Connected. Seeding data...');
        seedData();
    })
    .catch(err => {
        console.error(' MongoDB Connection Error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
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

        for (const data of usersData) {
            const newUser = new User(data);
            await newUser.save();
        }
        
        
        process.exit();
    } catch (error) {
        console.error('\n Seeding Error:', error.message);
        process.exit(1);
    }
};