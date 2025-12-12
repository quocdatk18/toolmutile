/**
 * Test script để kiểm tra fix lỗi "Execution context was destroyed"
 * Chạy automation với 1 site để test
 */

const { AutoSequenceSafe } = require('./tools/nohu-tool/auto-sequence-safe');
const { NohuAutomation } = require('./tools/nohu-tool/complete-automation');

async function testBankFix() {
    console.log('🧪 Testing bank addition fix...');

    const profileId = '2281d164-c255-4955-8c50-90e6a81d1344'; // Profile từ log
    const testSites = ['88VV']; // Test với 1 site trước

    try {
        const automation = new NohuAutomation();
        const safeSequence = new AutoSequenceSafe(automation);

        console.log('🚀 Starting test automation...');
        const result = await safeSequence.runParallelSequences(profileId, testSites);

        console.log('📊 Test Results:');
        console.log(JSON.stringify(result, null, 2));

        // Kiểm tra kết quả
        if (result.success && result.results.length > 0) {
            const siteResult = result.results[0];
            console.log('\n✅ Test Summary:');
            console.log(`Register: ${siteResult.register?.success ? '✅' : '❌'}`);
            console.log(`Login: ${siteResult.login?.success ? '✅' : '❌'}`);
            console.log(`Add Bank: ${siteResult.addBank?.success ? '✅' : '❌'}`);
            console.log(`Check Promo: ${siteResult.checkPromo?.success ? '✅' : '❌'}`);

            if (siteResult.addBank?.success) {
                console.log('\n🎉 FIX THÀNH CÔNG! Bank addition đã hoạt động!');
            } else {
                console.log('\n⚠️ Bank addition vẫn còn lỗi:', siteResult.addBank?.error);
            }
        } else {
            console.log('\n❌ Test failed:', result.error);
        }

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

// Chỉ chạy nếu được gọi trực tiếp
if (require.main === module) {
    testBankFix();
}

module.exports = { testBankFix };