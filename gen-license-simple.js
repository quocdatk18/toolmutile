const crypto = require('crypto');
const fs = require('fs');

const SECRET_KEY = 'SECRET_test_final_45379_53242';
const username = 'test_final';
const machineId = '48b62c73fe0a524f';
const days = 7;
const now = Date.now();
const expiry = now + (days * 24 * 60 * 60 * 1000);

const data = {
    username,
    machineId,
    expiry,
    created: now
};

const dataString = JSON.stringify(data);
const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(dataString)
    .digest('hex');

const key = Buffer.from(dataString).toString('base64') + '.' + signature;

console.log('\n========================================');
console.log('LICENSE KEY FOR test_final');
console.log('========================================\n');
console.log(key);
console.log('\n========================================\n');
console.log('Length:', key.length);
console.log('Has dot:', key.includes('.'));
console.log('Parts:', key.split('.').length);
console.log('\n');

// Save to file
fs.writeFileSync('LICENSE_KEY_CORRECT.txt', key, 'utf8');
console.log('✅ Saved to: LICENSE_KEY_CORRECT.txt\n');
console.log('Copy the key above (entire line) and paste into dashboard!\n');
