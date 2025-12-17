const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Read secret key from file
const secretKeyFile = 'customer-packages/test_final_SECRET_KEY.txt';
const content = fs.readFileSync(secretKeyFile, 'utf8');
const secretKeyMatch = content.match(/Secret Key: (.+)/);
const SECRET_KEY = secretKeyMatch[1].trim();

// License data
const customerName = 'test_final';
const machineId = '48b62c73fe0a524f'; // From secret key file
const days = 7;
const now = Date.now();
const expiry = now + (days * 24 * 60 * 60 * 1000);

const licenseData = {
    username: customerName,
    machineId: machineId,
    expiry: expiry,
    created: now
};

// Encode
const encoded = Buffer.from(JSON.stringify(licenseData)).toString('base64');

// Sign with correct secret key
const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(encoded)
    .digest('hex');

const licenseKey = `${encoded}.${signature}`;

');

// Save to package
const licenseKeyContent = `
License Key Record
==================
Generated: ${new Date().toLocaleString()}
Username: ${customerName}
Type: ${days} days
Machine Binding: YES
Machine ID: ${machineId}

License Key:
${licenseKey}
`;

fs.writeFileSync(
    path.join('customer-packages/test_final', 'LICENSE_KEY.txt'),
    licenseKeyContent,
    'utf8'
);

