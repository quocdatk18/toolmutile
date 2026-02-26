/**
 * Test Botion Solver - Local Image Matching
 */

const VIPAutomation = require('./vip-automation');
const fs = require('fs');
const path = require('path');

async function testBottionSolver() {
    console.log('🧪 Testing Botion Solver...\n');

    const automation = new VIPAutomation({}, {});

    // Test 1: Test with Sharp (if available)
    console.log('📝 Test 1: Image Matching with Sharp');
    try {
        const sharp = require('sharp');
        console.log('✅ Sharp is available');

        // Create a test image (you can replace with actual Botion screenshot)
        const testImagePath = path.join(__dirname, 'botion-test.png');

        if (fs.existsSync(testImagePath)) {
            const imageBuffer = fs.readFileSync(testImagePath);
            const result = await automation.analyzeBottionWithSharp(imageBuffer, sharp);

            if (result) {
                console.log(`✅ Result: ${result.percentage}% (Contrast: ${result.contrast.toFixed(2)})`);
            } else {
                console.log('❌ Analysis failed');
            }
        } else {
            console.log('⚠️ Test image not found: botion-test.png');
        }
    } catch (e) {
        console.log('⚠️ Sharp not available:', e.message);
    }

    // Test 2: Test basic analysis
    console.log('\n📝 Test 2: Basic Image Analysis');
    try {
        // Create a dummy PNG buffer for testing
        const dummyPNG = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x0D, // IHDR length
            0x49, 0x48, 0x44, 0x52, // IHDR
            0x00, 0x00, 0x01, 0x00, // width: 256
            0x00, 0x00, 0x00, 0x80, // height: 128
            0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc
            0x90, 0x77, 0x53, 0xDE  // CRC
        ]);

        const result = await automation.analyzeBottionBasic(dummyPNG);

        if (result) {
            console.log(`✅ Result: ${result.percentage}% (Method: ${result.method})`);
        } else {
            console.log('❌ Analysis failed');
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    // Test 3: Full Botion solver
    console.log('\n📝 Test 3: Full Botion Solver');
    try {
        const testImagePath = path.join(__dirname, 'botion-test.png');

        if (fs.existsSync(testImagePath)) {
            const imageBuffer = fs.readFileSync(testImagePath);
            const base64Image = imageBuffer.toString('base64');

            const result = await automation.solveBottionViaImageMatching(base64Image);

            if (result && result.success) {
                console.log(`✅ Botion solved: ${result.solution}% (Service: ${result.service})`);
            } else {
                console.log('❌ Solver failed');
            }
        } else {
            console.log('⚠️ Test image not found: botion-test.png');
            console.log('📝 To test, place a Botion captcha screenshot as botion-test.png');
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }

    console.log('\n✅ Test completed!');
}

testBottionSolver().catch(console.error);
