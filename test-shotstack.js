
const fetch = require('node-fetch'); // Assuming v2 or similar available, or use native fetch in node 18+
// In Node 18+ we can use global fetch

async function run() {
    const SHOTSTACK_ENV = 'stage';
    const SHOTSTACK_URL = `https://api.shotstack.io/edit/${SHOTSTACK_ENV}/render`;

    console.log(`Testing URL: ${SHOTSTACK_URL}`);

    try {
        const res = await fetch(SHOTSTACK_URL, {
            method: 'GET', // Just check if it exists (405 or 401 is better than 404)
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        // If it's 404, then the URL is wrong.
        // If it's 401 (Unauthorized) or 405 (Method Not Allowed), then the endpoint exists.

    } catch (e) {
        console.error(e);
    }
}

run();
