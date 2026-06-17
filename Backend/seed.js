require('dotenv').config();
const mongoose = require('mongoose');

const MenuItem = require('./models/Menu'); 
const User = require('./models/User'); 

// Define Menu Data 
const menuSeedData = [
    { dish_name: 'Classic Idli (3 pcs)', price: 30, available_quantity: 54, category: 'breakfast', image_url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&h=600&fit=crop', is_available: true },
    { dish_name: 'Puri Bhaji', price: 40, available_quantity: 10, category: 'breakfast', image_url: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=800&h=600&fit=crop', is_available: true },
    { dish_name: 'Chicken Biryani', price: 120, available_quantity: 193, category: 'lunch', image_url: 'https://static.vecteezy.com/system/resources/previews/067/013/099/non_2x/authentic-biryani-plated-neatly-with-high-definition-texture-photo.jpg', is_available: true },
    { dish_name: 'Veg Momos (6 pcs)', price: 60, available_quantity: 100, category: 'snacks', image_url: 'https://static.vecteezy.com/system/resources/previews/040/169/979/large_2x/tibetian-dumplings-momo-with-chicken-meat-or-vegetables-photo.jpg', is_available: true },
    { dish_name: 'Masala Dosa', price: 55, available_quantity: 99, category: 'lunch', image_url: 'https://static.vecteezy.com/system/resources/previews/015/933/659/large_2x/a-dosa-also-called-dosai-dosey-or-dosha-is-a-thin-pancake-in-south-indian-cuisine-free-photo.jpg', is_available: true },
    { dish_name: 'Plain Dosa', price: 30, available_quantity: 50, category: 'lunch', image_url: 'https://static.vecteezy.com/system/resources/previews/015/933/000/non_2x/a-dosa-also-called-dosai-dosey-or-dosha-is-a-thin-pancake-in-south-indian-cuisine-free-photo.jpg', is_available: true },
    { dish_name: 'Chili Chicken & Fried Rice Combo', price: 90, available_quantity: 200, category: 'lunch', image_url: 'https://i.pinimg.com/736x/0b/99/9a/0b999a0a46271b5fc79ae3d6122487e4.jpg', is_available: true },
    { dish_name: 'cold coffee', price: 60, available_quantity: 50, category: 'snacks', image_url: 'https://static.vecteezy.com/system/resources/previews/037/936/806/non_2x/ice-coffee-in-a-tall-glass-on-a-table-cold-summer-drink-in-coffee-shop-photo.jpg', is_available: true }
];

//  Define User Data (Admin, Staff, and user)
const userSeedData = [
    {
        name: "Admin",
        email: "admin@gmail.com",
        id: "admin1",
        password: "admin123",
        role: "admin",
        status: "active"
    },
    {
        name: "Staff",
        email: "staff@gmail.com",
        id: "staff1",
        password: "staff123", 
        role: "staff",
        status: "active"
    },
    {
        name: "User",
        email: "user@gmail.com",
        id: "user1",
        password: "user123", 
        role: "user",
        status: "active",
        wallet_balance: 500 // Gave the user some starting money!
    }
];

//  Database Connection and Seeding Logic
const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log(" Connected to MongoDB .");

        // Clear existing data so we don't get duplicates
        await MenuItem.deleteMany({});
        await User.deleteMany({});
        console.log("Cleared existing Menu and User collections .");

        // Insert Menu Items
        await MenuItem.insertMany(menuSeedData);
        console.log(" Real Menu items seeded .");

        for (const userData of userSeedData) {
            await User.create(userData);
        }
        
        console.log("Users created successfully:");
        console.log("   Admin Login: admin1 | Pass: admin123");
        console.log("   Staff Login: staff1 | Pass: staff123");
        console.log("   User Login: user1 | Pass: user123");

        console.log("Database seeding completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
};

seedDatabase();