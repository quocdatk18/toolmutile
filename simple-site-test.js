// Simple Site Config Test

// Simulate the siteConfigs from optimized-automation.js
const siteConfigs = {
    // OKVIP Family
    'SHBET': {
        type: 'okvip',
        registerUrl: 'https://shbet800.com/m/register?f=123456&app=1',
        loginUrl: 'https://shbet800.com/?app=1'
    },
    'F8BET': {
        type: 'okvip',
        registerUrl: 'https://f88clbf-io.front.net/Account/Register?f=123456&app=1',
        loginUrl: 'https://f88clbf-io.front.net/?app=1'
    },
    'NEW88': {
        type: 'okvip',
        registerUrl: 'https://555win33.com/Account/Register?f=123456&app=1',
        loginUrl: 'https://555win33.com/?app=1'
    },
    'HI88': {
        type: 'okvip',
        registerUrl: 'https://sa2.xn--8866-um1g.com/Account/Register?f=123456&app=1',
        loginUrl: 'https://sa2.xn--8866-um1g.com/?app=1'
    },
    '789BET': {
        type: 'okvip',
        registerUrl: 'https://789513.com/Account/Register?f=456781&app=1',
        loginUrl: 'https://789513.com/?app=1'
    },
    'MB66': {
        type: 'okvip',
        registerUrl: 'https://ttkm-mb66okvip02.pages.dev/Account/Register?f=123456&app=1',
        loginUrl: 'https://ttkm-mb66okvip02.pages.dev/?app=1'
    },

    // ABCVIP Family
    'J88': {
        type: 'abcvip',
        registerUrl: 'https://j859.xyz/Account/Register?f=123456&app=1',
        loginUrl: 'https://j859.xyz/?app=1'
    },
    'U888': {
        type: 'abcvip',
        registerUrl: 'https://u888qj.link/Account/Register?f=889534&app=1',
        loginUrl: 'https://u888qj.link/?app=1'
    },
    'ABC8': {
        type: 'abcvip',
        registerUrl: 'https://abc29.ink/Account/Register?f=123456&app=1',
        loginUrl: 'https://abc29.ink/?app=1'
    },
    '88CLB': {
        type: 'abcvip',
        registerUrl: 'https://88clb2jt.buzz/Account/Register?f=456781&app=1',
        loginUrl: 'https://88clb2jt.buzz/?app=1'
    },

    // KJC Family
    'QQ88': {
        type: 'kjc',
        registerUrl: 'https://www.qq8886.com/Account/Register?f=123456&app=1',
        loginUrl: 'https://www.qq8886.com/?app=1'
    },
    'RR88': {
        type: 'kjc',
        registerUrl: 'https://www.rr3311.com/Account/Register?f=123456&app=1',
        loginUrl: 'https://www.rr3311.com/?app=1'
    },
    'XX88': {
        type: 'kjc',
        registerUrl: 'https://www.xx88.fun/Account/Register?f=123456&app=1',
        loginUrl: 'https://www.xx88.fun/?app=1'
    },
    'MM88': {
        type: 'kjc',
        registerUrl: 'https://www.2mm88.com/Account/Register?f=123456&app=1',
        loginUrl: 'https://www.2mm88.com/?app=1'
    },
    'X88': {
        type: 'kjc',
        registerUrl: 'https://www.x88004.com/Account/Register?f=123456&app=1',
        loginUrl: 'https://www.x88004.com/?app=1'
    },

    // 78WIN Family
    'JUN88': {
        type: '78win',
        registerUrl: 'https://tangqua88.co/Account/Register?f=123456&app=1',
        loginUrl: 'https://tangqua88.co/?app=1'
    },
    '78WIN': {
        type: '78win',
        registerUrl: 'https://78king88.com/Account/Register?f=123456&app=1',
        loginUrl: 'https://78king88.com/?app=1'
    }
};

// Test sites from UI (như dashboard gửi)
const testSitesFromUI = [
    { name: 'SHBET', category: 'okvip' },
    { name: 'F8BET', category: 'okvip' },
    { name: 'J88', category: 'abcvip' },
    { name: 'QQ88', category: 'kjc' },
    { name: 'JUN88', category: '78win' },
    { name: 'INVALID_SITE', category: 'test' } // Test invalid site
];

testSitesFromUI.forEach(site => {
    const config = siteConfigs[site.name];
    if (config) {
    } else {
    }
});

const foundSites = testSitesFromUI.filter(site => siteConfigs[site.name]);
const missingSites = testSitesFromUI.filter(site => !siteConfigs[site.name]);

if (missingSites.length > 0) {
}

console.log('\n✅ Test completed!');