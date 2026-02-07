/**
 * Test Botion Accuracy - Check if image analysis is correct
 */

const VIPAutomation = require('./vip-automation');
const fs = require('fs');
const path = require('path');

async function testBottionAccuracy() {
    console.log('🧪 Testing Botion Image Analysis Accuracy...\n');

    const automation = new VIPAutomation({}, {});

    // Test with actual Botion screenshot
    const testImagePath = path.join(__dirname, 'botion-test.png');

    if (!fs.existsSync(testImagePath)) {
        console.log('⚠️ Test image not found: botion-test.png');
        console.log('📝 To test, place a Botion captcha screenshot as botion-test.png');
        return;
    }

    try {
        const imageBuffer = fs.readFileSync(testImagePath);
        const base64Image = imageBuffer.toString('base64');

        console.log('📸 Testing with botion-test.png');
        console.log(`📊 Image size: ${imageBuffer.length} bytes\n`);

        // Test with Sharp (if available)
        try {
            const sharp = require('sharp');
            console.log('🔍 Testing with Sharp (brightness-edge hybrid method)...');

            const result = await automation.analyzeBottionWithTemplateMatching(imageBuffer, sharp);

            if (result) {
                console.log('✅ Analysis result:');
                console.log(`   Method: ${result.method}`);
                console.log(`   Puzzle X: ${result.puzzleX}px`);
                console.log(`   Gap X: ${result.gapX}px`);
                console.log(`   Distance: ${result.distance}px`);
                console.log(`   Max Distance: ${result.maxDistance}px`);
                console.log(`   Percentage: ${result.percentage}%`);
                console.log(`   Confidence: ${result.confidence?.toFixed(2)}`);
            } else {
                console.log('❌ Analysis failed');
            }
        } catch (e) {
            console.log('⚠️ Sharp not available, testing basic method...');

            const result = await automation.analyzeBottionBasic(imageBuffer);

            if (result) {
                console.log('✅ Analysis result:');
                console.log(`   Method: ${result.method}`);
                console.log(`   Puzzle X: ${result.puzzleX}px`);
                console.log(`   Gap X: ${result.gapX}px`);
                console.log(`   Percentage: ${result.percentage}%`);
            } else {
                console.log('❌ Analysis failed');
            }
        }

        console.log('\n📝 Tips for accurate analysis:');
        console.log('   1. Gap should be bright white (brightness > 200)');
        console.log('   2. Puzzle piece should be darker (brightness < 150)');
        console.log('   3. Percentage should be between 10-90%');
        console.log('   4. If percentage is random, image analysis needs improvement');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testBottionAccuracy().catch(console.error);
