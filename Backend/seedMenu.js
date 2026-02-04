const mongoose = require('mongoose');
const Menu = require('./models/Menu');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("Connected to MongoDB Atlas...");
        
        // Clear old menu items
        await Menu.deleteMany({});
        console.log("Old menu cleared.");

        const menuItems = [
            {
                dish_name: "Masala Dosa",
                price: 50,
                available_quantity: 20,
                category: "breakfast",
                description: "Crispy dosa with potato filling and chutney."
            },
            {
                dish_name: "Chicken Biryani",
                price: 120,
                available_quantity: 15,
                category: "lunch",
                description: "Basmati rice with flavored chicken and spices."
            },
            {
                dish_name: "Paneer Butter Masala",
                price: 100,
                available_quantity: 10,
                category: "dinner",
                description: "Rich and creamy paneer curry."
            },
            {
                dish_name: "Iced Tea",
                price: 30,
                available_quantity: 50,
                category: "beverages",
                description: "Refreshing lemon flavored chilled tea."
            }
        ];

        await Menu.insertMany(menuItems);
        console.log("Successfully seeded 4 items into the Menu!");
        process.exit();
    })
    .catch(err => {
        console.error("Seeding error:", err);
        process.exit(1);
    });