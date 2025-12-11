/**
 * Script to create test folder structure with sample screenshots
 * Run: node create-test-structure.js
 */

const fs = require('fs');
const path = require('path');

// Create screenshots directory structure
const screenshotsDir = path.join(__dirname, 'screenshots');

// Test data
const testUsers = [
    {
        username: 'dat11111',
        sessions: [
            {
                sessionId: '2025-01-10T10-30-45',
                sites: ['go99', 'nohu', 'tt88']
            },
            {
                sessionId: '2025-01-10T14-20-30',
                sites: ['go99', 'nohu', 'tt88', 'mm99']
            },
            {
                sessionId: '2025-01-11T09-15-20',
                sites: ['go99', 'nohu']
            }
        ]
    },
    {
        username: 'test123',
        sessions: [
            {
                sessionId: '2025-01-10T11-45-00',
                sites: ['go99', 'nohu', 'tt88', 'mm99', '789p']
            }
        ]
    },
    {
        username: 'vip999',
        sessions: [
            {
                sessionId: '2025-01-09T16-30-15',
                sites: ['go99', 'nohu']
            },
            {
                sessionId: '2025-01-10T08-00-00',
                sites: ['go99', 'nohu', 'tt88']
            }
        ]
    }
];

console.log('🚀 Creating test folder structure...\n');

// Create base screenshots directory
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    console.log('📁 Created screenshots directory');
}

// Create dummy PNG file (1x1 transparent pixel)
const dummyPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);

// Create structure for each user
testUsers.forEach(user => {
    console.log(`\n👤 Creating structure for user: ${user.username}`);

    const userDir = path.join(screenshotsDir, user.username);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }

    user.sessions.forEach(session => {
        console.log(`   📅 Session: ${session.sessionId}`);

        const sessionDir = path.join(userDir, session.sessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        session.sites.forEach(site => {
            const filename = `${site}.png`;
            const filepath = path.join(sessionDir, filename);

            // Write dummy PNG file
            fs.writeFileSync(filepath, dummyPNG);
            console.log(`      ✅ Created: ${filename}`);
        });
    });
});

console.log('\n✅ Test structure created successfully!');
console.log('\n📊 Summary:');
console.log(`   Users: ${testUsers.length}`);
console.log(`   Total sessions: ${testUsers.reduce((sum, u) => sum + u.sessions.length, 0)}`);
console.log(`   Total screenshots: ${testUsers.reduce((sum, u) =>
    sum + u.sessions.reduce((s, sess) => s + sess.sites.length, 0), 0)}`);

console.log('\n🌐 Next steps:');
console.log('   1. Start dashboard: npm run dashboard');
console.log('   2. Open browser: http://localhost:3000');
console.log('   3. Go to NOHU Tool → Kết Quả Automation');
console.log('   4. You should see all test results!');
