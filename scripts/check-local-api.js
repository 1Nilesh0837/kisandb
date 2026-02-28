const axios = require('axios');

async function checkAPIs() {
    const baseUrl = 'http://localhost:3000';
    const endpoints = ['/api/data', '/api/crops', '/api/sales', '/api/test'];

    for (const endpoint of endpoints) {
        try {
            console.log(`Checking ${endpoint}...`);
            const res = await axios.get(`${baseUrl}${endpoint}`);
            console.log(`Status: ${res.status}`);
            console.log('Data:', JSON.stringify(res.data).substring(0, 100));
        } catch (err) {
            console.error(`Error checking ${endpoint}:`, err.message);
        }
    }
}

checkAPIs();
