const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined");
    process.exit(1);
}

// Define Schema (Simplified for script)
const PriceSchema = new mongoose.Schema({
    crop: String,
    date: Date,
    minPrice: Number,
    maxPrice: Number,
    modalPrice: Number,
    mandi: String,
    state: String,
});

const Price = mongoose.models.Price || mongoose.model('Price', PriceSchema, 'prices');

async function seedPrices() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB Atlas");

        // Clear existing prices
        await Price.deleteMany({ crop: "Wheat" });
        await Price.deleteMany({ crop: "Gehu" });

        const crops = ["Wheat", "Rice"];
        const mandiData = {
            "Wheat": { base: 2100, trend: 5, variance: 15, mandi: "Azadpur", state: "Delhi" },
            "Rice": { base: 2800, trend: -3, variance: 20, mandi: "Karnal", state: "Haryana" }
        };

        const seedData = [];
        const today = new Date();

        // Create 30 days of historical data
        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);

            for (const cropName of crops) {
                const config = mandiData[cropName];
                // Calculate a trending price with some randomness
                // Trend is linear increase/decrease over 30 days
                const trendEffect = (30 - i) * config.trend;
                const randomness = (Math.random() - 0.5) * config.variance * 2;
                const modalPrice = Math.round(config.base + trendEffect + randomness);

                seedData.push({
                    crop: cropName,
                    date: date,
                    minPrice: modalPrice - 100,
                    maxPrice: modalPrice + 100,
                    modalPrice: modalPrice,
                    mandi: config.mandi,
                    state: config.state
                });
            }
        }

        await Price.insertMany(seedData);
        console.log(`Successfully seeded ${seedData.length} price records!`);

        process.exit(0);
    } catch (error) {
        console.error("Error seeding prices:", error);
        process.exit(1);
    }
}

seedPrices();
