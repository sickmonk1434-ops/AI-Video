
const fetch = require('node-fetch'); // Needs node-fetch or use built-in fetch in newer node
// Using built-in fetch for Node 18+
async function run() {
    try {
        const response = await fetch('http://localhost:3000/api/generate-script', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ concept: 'Test concept for video' })
        });

        if (!response.ok) {
            console.log("Status:", response.status);
            const text = await response.text();
            console.log("Error Body:", text);
        } else {
            const data = await response.json();
            console.log("Success:", data);
        }
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

run();
