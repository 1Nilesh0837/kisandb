const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;

async function run() {
    console.log('URI:', uri.replace(/:([^@]+)@/, ':****@')); // Mask password
    const client = new MongoClient(uri);

    try {
        console.log('Attempting connection...');
        await client.connect();
        console.log('Success!');
        const admin = client.db().admin();
        const info = await admin.serverStatus();
        console.log('Server Status OK');
    } catch (err) {
        console.error('CONNECTION ERROR:');
        console.error('Name:', err.name);
        console.error('Message:', err.message);
        console.error('Code:', err.code);
        if (err.message.includes('authentication failed')) {
            console.log('\nSUGGESTION: Please check if your IP address is whitelisted in MongoDB Atlas (Network Access).');
        }
    } finally {
        await client.close();
    }
}

run();
