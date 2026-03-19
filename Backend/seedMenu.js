require('dotenv').config();
const dns = require('dns');

// Force Node to use Google's Public DNS to bypass the network block
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const Menu = require('./models/Menu'); // Adjust the path if your model is named differently

if (!process.env.MONGODB_URI) {
    console.error(' FATAL ERROR: MONGODB_URI is not defined.');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI, { family: 4 })
    .then(() => {
        console.log('MongoDB Connected. Seeding menu data...');
        seedMenu();
    })
    .catch(err => {
        console.error(' MongoDB Connection Error:', err);
        process.exit(1);
    });

const seedMenu = async () => {
    try {
        // Clear existing menu items before seeding
        await Menu.deleteMany({});
        console.log(' Existing menu cleared.');

        const menuData = [
            // BREAKFAST
            {
                dish_name: 'Masala Dosa',
                price: 60,
                available_quantity: 40,
                category: 'breakfast',
                description: 'Crispy rice crepe filled with spiced potato curry.',
                image_url: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b1?w=600&q=80',
                is_available: true
            },
            {
                dish_name: 'Aloo Paratha',
                price: 40,
                available_quantity: 50,
                category: 'breakfast',
                description: 'Whole wheat flatbread stuffed with a spicy potato mixture.',
                image_url: 'https://images.unsplash.com/photo-1626779833896-733c5e8de955?w=600&q=80',
                is_available: true
            },
            
            // LUNCH
            {
                dish_name: 'Special Veg Thali',
                price: 120,
                available_quantity: 30,
                category: 'lunch',
                description: 'Complete meal with rice, dal, 2 rotis, paneer sabzi, and mixed veg.',
                image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
                is_available: true
            },
            {
                dish_name: 'Chicken Biryani',
                price: 150,
                available_quantity: 25,
                category: 'lunch',
                description: 'Aromatic basmati rice cooked with tender chicken pieces.',
                image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
                is_available: true
            },

            // SNACKS (Drinks moved here)
            {
                dish_name: 'Crispy Veg Samosa (2 pcs)',
                price: 30,
                available_quantity: 100,
                category: 'snacks',
                description: 'Deep-fried pastry filled with spiced potatoes and peas.',
                image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=80',
                is_available: true
            },
            {
                dish_name: 'Adrak Masala Chai',
                price: 15,
                available_quantity: 150,
                category: 'snacks', 
                description: 'Strong ginger tea to keep you awake during lectures.',
                image_url: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=600&q=80',
                is_available: true
            },

            // DINNER
            {
                dish_name: 'Paneer Butter Masala with Naan',
                price: 130,
                available_quantity: 40,
                category: 'dinner',
                description: 'Rich tomato gravy with soft paneer cubes, served with 2 butter naan.',
                image_url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc0?w=600&q=80',
                is_available: true
            },
            {
                dish_name: 'Egg Fried Rice',
                price: 90,
                available_quantity: 35,
                category: 'dinner',
                description: 'Wok-tossed rice with scrambled eggs, carrots, and spring onions.',
                image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
                is_available: true
            }
        ];

        // Insert all menu items at once
        await Menu.insertMany(menuData);
        console.log(' Menu items seeded successfully!');
        
        process.exit();
    } catch (error) {
        console.error('\n Seeding Error:', error.message);
        process.exit(1);
    }
};