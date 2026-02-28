
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

async function test() {
    console.log('Testing connection to:', uri.split('@')[1]); // Log host part only for safety
    try {
        await mongoose.connect(uri);
        console.log('Connected successfully');

        // Check collections
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        // Check crops
        const Crop = mongoose.models.Crop || mongoose.model("Crop", new mongoose.Schema({}), "crops");
        const count = await Crop.countDocuments();
        console.log('Crop count:', count);

        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
}

test();
