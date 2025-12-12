// Test NOHU Site Configs
console.log('🧪 Testing NOHU Site Configs...');

// Simulate the siteConfigs from NOHU optimized-automation.js
const nohuSiteConfigs = {
    'Go99': {
        type: 'nohu_mobile',
        registerUrl: 'https://m.ghhdj-567dhdhhmm.asia/Account/Register?f=3528698&app=1',
        loginUrl: 'https://m.ghhdj-567dhdhhmm.asia/?app=1'
    },
    'NOHU': {
        type: 'nohu_mobile',
        registerUrl: 'https://m.88111188.com/Account/Register?f=6344995&app=1',
        loginUrl: 'https://m.88111188.com/?app=1'
    },
    'TT88': {
        type: 'nohu_mobile',
        registerUrl: 'https://m.1bedd-fb89bj53gg9hjs0bka.club/Account/Register?f=3535864&app=1',
        loginUrl: 'https://m.1bedd-fb89bj53gg9hjs0bka.club/?app=1'
    },
    'MMOO': {
        type: 'nohu_mobile',
        registerUrl: 'https://m.0mmoo.com/Account/Register?f=394579&app=1',
        loginUrl: 'https://m.0mmoo.com/?app=1'
    },
    '789P': {
        type: 'nohu_mobile',
        registerUrl: 'https://m.jvdf76fd92jk87gfuj60o.xyz/Account/Register?f=784461&app=1',
        loginUrl: 'https://m.jvdf76fd92jk87gfuj60o.xyz/?app=1'
    },
    '33WIN': {
        type: 'nohu_mobile',
        registerUrl: 'https://m.336049.com/Account/Register?f=3115867&app=1',
        loginUrl: 'https://m.336049.com/?app=1'
    },
    '88VV': {
        type: 'nohu_mobile',
        registerUrl: 'https://m.88vv.my/Account/Register?f=1054152&app=1',
        loginUrl: 'https://m.88vv.my/?app=1'
    }
};

// Test sites from NOHU UI (như dashboard gửi)
const testNohuSitesFromUI = [
    { name: 'Go99' },
    { name: 'NOHU' },
    { name: 'TT88' },
    { name: 'MMOO' },
    { name: '789P' },
    { name: '33WIN' },
    { name: '88VV' },
    { name: 'INVALID_NOHU_SITE' } // Test invalid site
];

console.log('📋 Available NOHU Site Configs:', Object.keys(nohuSiteConfigs));
console.log('📤 Test NOHU Sites from UI:', testNohuSitesFromUI.map(s => s.name));

console.log('\n🔍 Testing NOHU Site Lookups:');
testNohuSitesFromUI.forEach(site => {
    const config = nohuSiteConfigs[site.name];
    if (config) {
        console.log(`✅ ${site.name}: Found config - ${config.type} - ${config.registerUrl}`);
    } else {
        console.log(`❌ ${site.name}: NO CONFIG FOUND`);
    }
});

console.log('\n🎯 NOHU Summary:');
const foundNohuSites = testNohuSitesFromUI.filter(site => nohuSiteConfigs[site.name]);
const missingNohuSites = testNohuSitesFromUI.filter(site => !nohuSiteConfigs[site.name]);

console.log(`✅ Found configs: ${foundNohuSites.length}/${testNohuSitesFromUI.length}`);
console.log(`❌ Missing configs: ${missingNohuSites.map(s => s.name).join(', ')}`);

// Test data format từ UI
console.log('\n📊 Data Format Test:');
console.log('NOHU UI sends:', JSON.stringify(testNohuSitesFromUI.slice(0, 3), null, 2));

// Simulate what happens in processSingleSite
console.log('\n🔧 Simulation Test:');
testNohuSitesFromUI.slice(0, 3).forEach(site => {
    console.log(`Processing site object:`, site);
    console.log(`Looking for config with key: "${site.name}"`);
    console.log(`Config found:`, !!nohuSiteConfigs[site.name]);
});

console.log('\n✅ NOHU Test completed!');