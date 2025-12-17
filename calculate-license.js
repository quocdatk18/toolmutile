const crypto = require('crypto');

const SECRET_KEY = 'SECRET_test_final_45379_53242';
const customerName = 'test_final';
const machineId = '48b62c73fe0a524f';
const days = 7;
const now = Date.now();
const expiry = now + (days * 24 * 60 * 60 * 1000);

const licenseData = {
    username: customerName,
    machineId: machineId,
    expiry: expiry,
    created: now
};

const encoded = Buffer.from(JSON.stringify(licenseData)).toString('base64');
const signature = crypto.createHmac('sha256', SECRET_KEY).update(encoded).digest('hex');
const licenseKey = `${encoded}.${signature}`;

