const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

async function run() {
    const client = new MongoClient(uri);

    try {
        console.log('Connecting to Atlas...');
        await client.connect();
        console.log('Successfully connected to Atlas!');

        const db = client.db('kisandb');
        const collections = await db.listCollections().toArray();
        console.log('Collections in kisandb:', collections.map(c => c.name));

    } catch (err) {
        console.error('Error Details:', err);
    } finally {
        await client.close();
    }
}

run();
