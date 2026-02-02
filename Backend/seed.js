const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB Connected. Seeding data...');
        seedData();
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        await User.deleteMany({});
        console.log('Existing users cleared.');

        const users = [
            // 1. Admin
            {
                name: 'System Admin',
                college_id: 'admin1',
                email: 'admin@college.edu',
                password: 'admin123',
                role: 'admin',
                status: 'active',
                department: 'Administration'
            },
            // 2. Students
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
            // 3. Staff
            {
                name: 'Canteen Staff',
                college_id: 'STAFF1',
                email: 'staff@college.edu',
                password: 'staff123',
                role: 'staff',
                status: 'active',
                department: 'Canteen Operations'
            },
            // 4. Professor
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

        await User.insertMany(users);
        
        console.log('Successfully seeded ' + users.length + ' users!');
        console.log('Admin: admin1 / admin123');
        console.log('Student: BWU/BTS/24/269 / anirudha123');
        
        process.exit();
    } catch (error) {
        console.error('\n❌ Seeding Error:', error.message);
        if (error.errors) {
            console.error('Validation Details:', Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            })));
        }
        process.exit(1);
    }
};