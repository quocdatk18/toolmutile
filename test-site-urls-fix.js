/**
 * Test Site URLs Fix - Kiểm tra xem site URLs đã được fix chưa
 */

const AutoSequenceSafe = require('./tools/nohu-tool/auto-sequence-safe');

function testSiteUrlsMapping() {

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

    testSites.forEach((site, index) => {
        const urls = autoSequence.getSiteUrls(site.name);

        if (urls) {
            console.log(`   💳 Withdraw: ${urls.withdrawUrl}`);
            console.log(`   🎁 Promo: ${urls.promoUrl}`);
        } else {
        }
    });

    // Summary
    const validSites = testSites.filter(site => autoSequence.getSiteUrls(site.name) !== null);
    const knownSites = testSites.length - 1; // Exclude UnknownSite

    console.log(`   Success rate: ${((validSites.length - 1) / knownSites * 100).toFixed(1)}%`);

    if (validSites.length - 1 === knownSites) {
        console.log('🚀 Dashboard should now work without "undefined" errors');
    } else {
    }

    console.log('2. Check that navigation errors are fixed');
}

// Run test
if (require.main === module) {
    testSiteUrlsMapping();
}

module.exports = { testSiteUrlsMapping };