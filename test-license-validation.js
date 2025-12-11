const crypto = require('crypto');

const SECRET_KEY = 'SECRET_test_final_45379_53242';
const machineId = '48b62c73fe0a524f';

// Test 1: Generate like in generateKey()
console.log('\n========================================');
console.log('TEST 1: Generate License (OLD WAY)');
console.log('========================================\n');

const now1 = Date.now();
const expiry1 = now1 + (7 * 24 * 60 * 60 * 1000);

const data1 = {
    username: 'test_final',
    machineId: machineId,
    expiry: expiry1,
    created: now1
};

const dataString1 = JSON.stringify(data1);
const signature1 = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(dataString1)
    .digest('hex');

const key1 = Buffer.from(dataString1).toString('base64') + '.' + signature1;

console.log('Data:', data1);
console.log('Data String:', dataString1);
console.log('Signature:', signature1);
console.log('Key:', key1);

// Test 2: Validate the key
console.log('\n========================================');
console.log('TEST 2: Validate License');
console.log('========================================\n');

const parts = key1.split('.');
const [dataBase64, signature] = parts;

console.log('Parts:', parts.length);
console.log('Data Base64:', dataBase64.substring(0, 50) + '...');
console.log('Signature from key:', signature);

// Decode and verify
const dataString2 = Buffer.from(dataBase64, 'base64').toString('utf8');
console.log('Decoded data string:', dataString2);

const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(dataString2)
    .digest('hex');

console.log('Expected signature:', expectedSignature);
console.log('Match:', signature === expectedSignature);

// Test 3: Check if it's the encoding issue
console.log('\n========================================');
console.log('TEST 3: Check Encoding');
console.log('========================================\n');

const parsed = JSON.parse(dataString2);
console.log('Parsed data:', parsed);
console.log('Machine ID match:', parsed.machineId === machineId);
console.log('Username match:', parsed.username === 'test_final');

// Test 4: Try with the EXACT same data format as in generate-license.html
console.log('\n========================================');
console.log('TEST 4: HTML Generator Format');
console.log('========================================\n');

const now4 = Date.now();
const expiry4 = now4 + (7 * 24 * 60 * 60 * 1000);

const licenseData = {
    username: 'test_final',
    machineId: machineId,
    expiry: expiry4,
    created: now4
};

// This is how HTML generates it
const jsonStr = JSON.stringify(licenseData);
const encoded = Buffer.from(jsonStr).toString('base64');

// Node.js HMAC
const sig = crypto.createHmac('sha256', SECRET_KEY).update(encoded).digest('hex');
const licenseKey = encoded + '.' + sig;

console.log('HTML-style key:', licenseKey);

// Validate it
const [enc, sigFromKey] = licenseKey.split('.');
const decoded = Buffer.from(enc, 'base64').toString('utf8');
const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(decoded).digest('hex');

console.log('Signature match:', sigFromKey === expectedSig);

console.log('\n========================================');
console.log('CONCLUSION');
console.log('========================================\n');

if (signature === expectedSignature) {
    console.log('✅ License validation logic is CORRECT');
} else {
    console.log('❌ License validation logic has BUG');
}

console.log('\n');
