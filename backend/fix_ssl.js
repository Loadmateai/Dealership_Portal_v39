const selfsigned = require('selfsigned');
const fs = require('fs');

async function generateKeys() {
    const attrs = [{ name: 'commonName', value: '192.168.1.126' }]; // Your LAN IP

    console.log("⏳ Generating SSL keys (this might take a moment)...");

    // FIX: Added 'await' because version 5+ returns a Promise
    // We also removed '{ days: 365 }' because v5 defaults to 365 days automatically
    try {
        const pems = await selfsigned.generate(attrs, { days: 365 });

        fs.writeFileSync('server.key', pems.private);
        fs.writeFileSync('server.cert', pems.cert);

        console.log("✅ New SSL Keys Generated Successfully!");
        console.log("👉 You can now run: node server.js");
        
    } catch (err) {
        console.error("❌ Error generating keys:", err);
    }
}

generateKeys();