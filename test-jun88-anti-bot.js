/**
 * Test JUN88 Anti-bot measures
 * Kiểm tra xem form filling có chậm đủ không
 */

const puppeteer = require('puppeteer');
const VIPAutomation = require('./tools/vip-tool/vip-automation');

async function testJUN88AntiBotMeasures() {
    console.log('🤖 Testing JUN88 Anti-bot Measures\n');

    const browser = await puppeteer.launch({
        headless: false, // ← Quan trọng: không dùng headless
        args: [
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-popup-blocking',
            '--disable-translate',
            '--disable-extensions'
        ]
    });

    try {
        const page = await browser.newPage();

        // Set viewport
        await page.setViewport({ width: 1280, height: 720 });

        // Random user-agent
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ];
        const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
        await page.setUserAgent(randomUA);

        console.log(`📱 User-Agent: ${randomUA}\n`);

        // Test data
        const profileData = {
            username: 'testuser' + Date.now(),
            password: 'Test@12345',
            fullname: 'Test User',
            email: 'test@example.com',
            phone: '0912345678'
        };

        // Jun88 test URL
        const testUrl = 'https://sasa2.xn--8866-um1g.com/signup';

        console.log(`🌐 Navigating to: ${testUrl}`);
        await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));

        console.log('\n📝 Starting form filling with anti-bot measures...\n');

        // Simulate form filling with delays
        const startTime = Date.now();

        // Field 1: Username
        console.log('⏱️  [1] Filling username...');
        await page.focus('input[id="playerid"]');
        await new Promise(r => setTimeout(r, 300));
        await page.type('input[id="playerid"]', profileData.username, { delay: 150 });
        await new Promise(r => setTimeout(r, 800));
        console.log(`✅ Username filled (${profileData.username})`);

        // Field 2: Password
        console.log('⏱️  [2] Filling password...');
        await page.focus('input[id="password"]');
        await new Promise(r => setTimeout(r, 300));
        await page.type('input[id="password"]', profileData.password, { delay: 150 });
        await new Promise(r => setTimeout(r, 800));
        console.log(`✅ Password filled`);

        // Field 3: Name
        console.log('⏱️  [3] Filling name...');
        await page.focus('input[id="firstname"]');
        await new Promise(r => setTimeout(r, 300));
        await page.type('input[id="firstname"]', profileData.fullname, { delay: 100 });
        await new Promise(r => setTimeout(r, 800));
        console.log(`✅ Name filled (${profileData.fullname})`);

        // Field 4: Email
        console.log('⏱️  [4] Filling email...');
        await page.focus('input[id="email"]');
        await new Promise(r => setTimeout(r, 300));
        await page.type('input[id="email"]', profileData.email, { delay: 100 });
        await new Promise(r => setTimeout(r, 800));
        console.log(`✅ Email filled (${profileData.email})`);

        // Field 5: Mobile
        console.log('⏱️  [5] Filling mobile...');
        let phone = profileData.phone;
        if (phone.startsWith('0')) {
            phone = phone.substring(1);
        }
        await page.focus('input[id="mobile"]');
        await new Promise(r => setTimeout(r, 300));
        await page.type('input[id="mobile"]', phone, { delay: 150 });
        await new Promise(r => setTimeout(r, 800));
        console.log(`✅ Mobile filled (${phone})`);

        // Field 6: Agree checkbox
        console.log('⏱️  [6] Checking agree checkbox...');
        await page.hover('input[id="agree"]');
        await new Promise(r => setTimeout(r, 200));
        await page.click('input[id="agree"]');
        await new Promise(r => setTimeout(r, 500));
        console.log(`✅ Agree checkbox checked`);

        const formFillTime = Date.now() - startTime;
        console.log(`\n⏱️  Total form filling time: ${Math.round(formFillTime / 1000)}s\n`);

        // Scroll simulation
        console.log('📜 Simulating page scroll...');
        await page.evaluate(() => {
            window.scrollBy(0, 200);
        });
        await new Promise(r => setTimeout(r, 1000));

        await page.evaluate(() => {
            window.scrollBy(0, -200);
        });
        await new Promise(r => setTimeout(r, 1000));

        // Wait before submit
        const delayBeforeSubmit = 8000 + Math.random() * 17000; // 8-25s
        console.log(`⏳ Waiting ${Math.round(delayBeforeSubmit / 1000)}s before submit (anti-bot delay)...\n`);
        await new Promise(r => setTimeout(r, delayBeforeSubmit));

        // Check form values
        console.log('🔍 Verifying form values before submit:');
        const formValues = await page.evaluate(() => {
            return {
                playerid: document.querySelector('input[id="playerid"]')?.value,
                password: document.querySelector('input[id="password"]')?.value,
                firstname: document.querySelector('input[id="firstname"]')?.value,
                email: document.querySelector('input[id="email"]')?.value,
                mobile: document.querySelector('input[id="mobile"]')?.value,
                agree: document.querySelector('input[id="agree"]')?.checked
            };
        });

        console.log('Form values:', formValues);
        console.log('\n✅ Anti-bot test completed!');
        console.log('📝 Now you can manually solve captcha and submit the form');
        console.log('⏳ Keeping browser open for 5 minutes...\n');

        // Keep browser open for 5 minutes
        await new Promise(r => setTimeout(r, 300000));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

testJUN88AntiBotMeasures().catch(console.error);
