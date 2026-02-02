const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log(' MongoDB Connected. Seeding data...'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        await User.deleteMany({});
        console.log('Existing users cleared.');

        // 1. Create Admin
        const admin = new User({
            name: 'System Admin',
            college_id: 'admin1',
            email: 'admin@college.edu',
            password: 'admin123',
            role: 'admin',
            status: 'active',
            department: 'Administration'
        });
        await admin.save();
        console.log('Admin User Created: admin1 / admin123');

        // 2. Create Student
        const student = new User({
            name: 'Anirudha Khanrah',
            college_id: 'BWU/BTS/24/269',
            email: 'anirudha@college.edu',
            password: 'anirudha123',
            role: 'student',
            status: 'active',
            department: 'Computer Science'
        });
        await student.save();

        const student = new User({
            name: 'Rana Pratap Chaulya',
            college_id: 'BWU/BTS/24/279',
            email: 'rana@college.edu',
            password: 'ranapratap123',
            role: 'student',
            status: 'active',
            department: 'Computer Science'
        });
        await student.save();

        const student = new User({
            name: 'Sayak Dsa',
            college_id: 'BWU/BTS/24/299',
            email: 'sayak@college.edu',
            password: 'sayakdas123',
            role: 'student',
            status: 'active',
            department: 'Computer Science'
        });
        await student.save();

        // 3. Create Staff
        const staff = new User({
            name: 'Canteen Staff',
            college_id: 'STAFF1',
            email: 'staff@college.edu',
            password: 'staff123',
            role: 'staff',
            status: 'active',
            department: 'Canteen Operations'
        });
        await staff.save();
        console.log(' Staff User Created: STAFF1 / staff123');

        // 4. Create Professor
        const professor = new User({
            name: 'Dr. Sharma',
            college_id: 'PROF1',
            email: 'sharma@college.edu',
            password: 'prof123',
            role: 'professor',
            status: 'active',
            department: 'Physics'
        });
        await professor.save();
        console.log(' Professor User Created: PROF1 / prof123');

        console.log('\nSeeding Completed Successfully!');
        process.exit();

    } catch (error) {
        console.error('\n Seeding Error:', error.message); n
        if (error.errors) {
            console.error('Validation Details:', Object.keys(error.errors).map(key => ({
                field: key,
                message: error.errors[key].message
            })));
        }
        process.exit(1);
    }
};

seedData();