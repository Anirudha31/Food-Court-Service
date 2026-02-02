const mongoose = require('mongoose');
const User = require('./models/User'); // Ensure this path matches your folder structure
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log(' MongoDB Connected. Seeding data...'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

const seedData = async () => {
    try {
        // Clear existing users to prevent "Duplicate Key" errors
        await User.deleteMany({});
        console.log('Existing users cleared.');

        // 1. Create Admin
        const admin = new User({
            name: 'System Admin',
            college_id: 'admin1',
            email: 'admin@college.edu',
            password: 'admin123', // Minimum 6 characters
            role: 'admin',
            status: 'active',
            department: 'Administration'
        });
        await admin.save();
        console.log('Admin User Created: admin1 / admin123');

        // 2. Create Student
        const student = new User({
            name: 'Rahul Student',
            college_id: 'STU1',
            email: 'rahul@college.edu',
            password: 'student123', // Fixed: was "pass" (too short)
            role: 'student',
            status: 'active',
            department: 'Computer Science'
        });
        await student.save();
        console.log('Student User Created: STU1 / student123');

        // 3. Create Staff
        const staff = new User({
            name: 'Canteen Staff',
            college_id: 'STAFF1',
            email: 'staff@college.edu',
            password: 'staff123', // Fixed: was "pass" (too short)
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
            password: 'prof123', // Fixed: was "pass" (too short)
            role: 'professor',
            status: 'active',
            department: 'Physics'
        });
        await professor.save();
        console.log(' Professor User Created: PROF1 / prof123');

        console.log('\nSeeding Completed Successfully!');
        process.exit();

    } catch (error) {
        console.error('\n Seeding Error:', error.message);
        // This shows exactly which field failed validation
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