
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Read .env.local to get key
function getEnv(key) {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
        return match ? match[1].trim() : null;
    }
    return null;
}

async function run() {
    const SHOTSTACK_API_KEY = getEnv('SHOTSTACK_API_KEY');
    const SHOTSTACK_ENV = 'stage';
    const SHOTSTACK_URL = `https://api.shotstack.io/edit/${SHOTSTACK_ENV}/render`;

    console.log(`Testing URL: ${SHOTSTACK_URL}`);

    if (!SHOTSTACK_API_KEY) {
        console.error("Missing SHOTSTACK_API_KEY in .env.local");
        return;
    }

    const payload = {
        "timeline": {
            "tracks": [
                {
                    "clips": [
                        {
                            "asset": {
                                "type": "image",
                                "src": "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/images/falcon.jpg"
                            },
                            "start": 0,
                            "length": 5,
                            "fit": "crop",
                            "scale": 1,
                            "effect": "zoomIn",
                            "transition": { "in": "fade", "out": "fade" }
                        }
                    ]
                },
                {
                    "clips": [
                        {
                            "asset": {
                                "type": "audio",
                                "src": "https://shotstack-assets.s3-ap-southeast-2.amazonaws.com/audio/gangsta.mp3"
                            },
                            "start": 0
                        }
                    ]
                }
            ]
        },
        "output": {
            "format": "mp4",
            "resolution": "sd"
        }
    };

    console.log("Sending payload...");

    try {
        const res = await fetch(SHOTSTACK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': SHOTSTACK_API_KEY
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status: ${res.status} ${res.statusText}`);
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));

    } catch (e) {
        console.error(e);
    }
}

run();
