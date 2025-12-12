/**
 * Test Site URLs Fix - Kiểm tra xem site URLs đã được fix chưa
 */

const AutoSequenceSafe = require('./tools/nohu-tool/auto-sequence-safe');

function testSiteUrlsMapping() {
    console.log('🧪 Testing Site URLs Mapping...\n');

    const autoSequence = new AutoSequenceSafe({}, {});

    // Test sites from dashboard
    const testSites = [
        { name: 'Go99' },
        { name: 'NOHU' },
        { name: 'TT88' },
        { name: 'MMOO' },
        { name: '789P' },
        { name: '33WIN' },
        { name: '88VV' },
        { name: 'UnknownSite' } // Should return null
    ];

    console.log('📋 Testing site URL mapping:');
    console.log('================================\n');

    testSites.forEach((site, index) => {
        const urls = autoSequence.getSiteUrls(site.name);

        console.log(`${index + 1}. ${site.name}:`);

        if (urls) {
            console.log(`   ✅ URLs found`);
            console.log(`   📍 Register: ${urls.registerUrl}`);
            console.log(`   🔐 Login: ${urls.loginUrl}`);
            console.log(`   💳 Withdraw: ${urls.withdrawUrl}`);
            console.log(`   🎁 Promo: ${urls.promoUrl}`);
        } else {
            console.log(`   ❌ No URLs found (expected for unknown sites)`);
        }
        console.log('');
    });

    // Summary
    const validSites = testSites.filter(site => autoSequence.getSiteUrls(site.name) !== null);
    const knownSites = testSites.length - 1; // Exclude UnknownSite

    console.log('📊 Summary:');
    console.log(`   Known sites: ${knownSites}`);
    console.log(`   Valid mappings: ${validSites.length - 1}`); // Exclude UnknownSite from valid count
    console.log(`   Success rate: ${((validSites.length - 1) / knownSites * 100).toFixed(1)}%`);

    if (validSites.length - 1 === knownSites) {
        console.log('\n🎉 All known sites have valid URL mappings!');
        console.log('✅ Site URLs fix is working correctly');
        console.log('🚀 Dashboard should now work without "undefined" errors');
    } else {
        console.log('\n⚠️ Some sites are missing URL mappings');
        console.log('❌ Need to add more site configurations');
    }

    console.log('\n📝 Next steps:');
    console.log('1. Run dashboard again to test');
    console.log('2. Check that navigation errors are fixed');
    console.log('3. Verify that registerUrl is no longer undefined');
}

// Run test
if (require.main === module) {
    testSiteUrlsMapping();
}

module.exports = { testSiteUrlsMapping };