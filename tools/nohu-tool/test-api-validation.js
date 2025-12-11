/**
 * Test API Key Validation
 * Run this to test API key validation before automation
 */

const ApiKeyValidator = require('./validate-api-key');

async function testValidation() {
    console.log('🧪 Testing API Key Validation\n');

    const validator = new ApiKeyValidator();

    // Test 1: Check if API key exists in config
    console.log('Test 1: Check API key in config');
    try {
        const hasKey = validator.hasApiKey();
        console.log(`  Result: ${hasKey ? '✅ API key found' : '❌ No API key'}\n`);
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}\n`);
    }

    // Test 2: Load API key from config
    console.log('Test 2: Load API key from config');
    try {
        const apiKeyConfig = validator.loadApiKey();
        console.log(`  Service: ${apiKeyConfig.service}`);
        console.log(`  Key: ${apiKeyConfig.key ? apiKeyConfig.key.substring(0, 10) + '...' : '(empty)'}`);
        console.log(`  Balance: $${apiKeyConfig.balance}\n`);
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}\n`);
    }

    // Test 3: Format validation
    console.log('Test 3: Format validation');
    const testKeys = [
        { key: '', expected: false, desc: 'Empty key' },
        { key: '123', expected: false, desc: 'Too short' },
        { key: 'abc@#$%', expected: false, desc: 'Invalid characters' },
        { key: 'validkey1234567890', expected: true, desc: 'Valid format' }
    ];

    for (const test of testKeys) {
        const result = validator.validateFormat(test.key);
        const status = result.valid === test.expected ? '✅' : '❌';
        console.log(`  ${status} ${test.desc}: ${result.valid ? 'Valid' : result.error}`);
    }
    console.log();

    // Test 4: Full validation (with network call)
    console.log('Test 4: Full validation (checking balance)');
    try {
        const result = await validator.validate();

        if (result.valid) {
            console.log(`  ✅ API key is valid`);
            console.log(`  Balance: $${result.balance.toFixed(2)}`);

            if (result.balance < 1) {
                console.log(`  ⚠️  Warning: Balance is low!`);
            }
        } else {
            console.log(`  ❌ API key is invalid: ${result.error}`);
            console.log(`  Failed at: ${result.step}`);
        }
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }

    console.log('\n✅ Test completed');
}

// Run test
testValidation().catch(console.error);
