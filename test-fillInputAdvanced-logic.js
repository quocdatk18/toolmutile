/**
 * Test logic của fillInputAdvanced fix (không cần DOM)
 * Kiểm tra xem logic clear input có hoạt động đúng không
 */

console.log('🧪 Testing fillInputAdvanced fix logic...\n');

// Simulate HTMLInputElement behavior
class MockInput {
    constructor() {
        this._value = '';
        this.placeholder = 'Mock Input';
        this.name = 'mockInput';
        this.events = [];
    }

    get value() {
        return this._value;
    }

    set value(val) {
        this._value = val;
    }

    focus() {
        this.events.push('focus');
    }

    click() {
        this.events.push('click');
    }

    dispatchEvent(event) {
        this.events.push(event.type);
    }
}

// Mock native setter
const mockNativeInputValueSetter = {
    call: (input, value) => {
        console.log(`   📝 Native setter called with: "${value}"`);
        input._value = value;
    }
};

// Mock window object
const mockWindow = {
    HTMLInputElement: {
        prototype: {}
    }
};

// Mock Object.getOwnPropertyDescriptor
function mockGetOwnPropertyDescriptor() {
    return {
        set: mockNativeInputValueSetter
    };
}

// Simulate the fixed fillInputAdvanced function
async function fillInputAdvanced(input, value, fastMode = false, noFocus = false) {
    if (!input) {
        console.warn('⚠️ Input is null');
        return false;
    }

    if (input.value === value.toString()) {
        console.log('✅ Input already has correct value, skipping:', input.placeholder || input.name);
        return true;
    }

    console.log('⚡ Setting value directly:', input.placeholder || input.name, '→', value);
    if (noFocus) {
        console.log('⚠️ NO FOCUS mode - will not focus/click input (for captcha)');
    }

    try {
        // Only focus/click if noFocus is false
        if (!noFocus) {
            input.focus();
            input.click();
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // CRITICAL FIX: Always clear input first to reset proxy state
        console.log('🔄 Clearing input to reset proxy state...');

        // Method 1: Clear using native setter (resets proxy)
        const nativeInputValueSetter = mockGetOwnPropertyDescriptor();

        if (nativeInputValueSetter) {
            // First clear to empty string to reset proxy
            nativeInputValueSetter.set.call(input, '');
            console.log('   ✅ Cleared using native setter');
        } else {
            input.value = '';
            console.log('   ✅ Cleared using direct assignment');
        }

        // Method 2: Trigger input event after clearing to notify frameworks
        input.dispatchEvent({ type: 'input', bubbles: true });
        await new Promise(resolve => setTimeout(resolve, 50));

        // Method 3: Now set the new value
        console.log('📝 Setting new value:', value);
        if (nativeInputValueSetter) {
            nativeInputValueSetter.set.call(input, value.toString());
        } else {
            input.value = value.toString();
        }

        // Trigger all necessary events for Angular/React/Vue frameworks
        input.dispatchEvent({ type: 'input', bubbles: true });
        input.dispatchEvent({ type: 'change', bubbles: true });
        input.dispatchEvent({ type: 'blur', bubbles: true });

        // Verify the value was set correctly
        const finalValue = input.value;
        console.log('✅ Value set successfully:', finalValue);

        if (finalValue !== value.toString()) {
            console.warn('⚠️ Warning: Final value differs from expected!');
            console.warn('   Expected:', value.toString());
            console.warn('   Actual:', finalValue);
        }

        return true;
    } catch (e) {
        console.error('❌ Error in fillInputAdvanced:', e);
        return false;
    }
}

// Run tests
async function runTests() {
    let passedTests = 0;
    let totalTests = 5;

    // Test 1: Normal fill
    console.log('📋 Test 1: Normal fill');
    const input1 = new MockInput();
    input1.value = '';
    await fillInputAdvanced(input1, 'test123');
    const test1Pass = input1.value === 'test123';
    console.log('Result:', test1Pass ? '✅ PASS' : '❌ FAIL');
    console.log('Events triggered:', input1.events);
    if (test1Pass) passedTests++;
    console.log('');

    // Test 2: Fill when input already has value
    console.log('📋 Test 2: Fill when input has existing value');
    const input2 = new MockInput();
    input2.value = 'oldvalue';
    await fillInputAdvanced(input2, 'newvalue');
    const test2Pass = input2.value === 'newvalue';
    console.log('Result:', test2Pass ? '✅ PASS' : '❌ FAIL');
    if (test2Pass) passedTests++;
    console.log('');

    // Test 3: Fill empty string
    console.log('📋 Test 3: Fill empty string');
    const input3 = new MockInput();
    input3.value = 'somevalue';
    await fillInputAdvanced(input3, '');
    const test3Pass = input3.value === '';
    console.log('Result:', test3Pass ? '✅ PASS' : '❌ FAIL');
    if (test3Pass) passedTests++;
    console.log('');

    // Test 4: Fill with same value (should skip)
    console.log('📋 Test 4: Fill with same value (should skip)');
    const input4 = new MockInput();
    input4.value = 'samevalue';
    const result = await fillInputAdvanced(input4, 'samevalue');
    const test4Pass = result === true && input4.value === 'samevalue';
    console.log('Result:', test4Pass ? '✅ PASS' : '❌ FAIL');
    if (test4Pass) passedTests++;
    console.log('');

    // Test 5: Simulate proxy issue scenario
    console.log('📋 Test 5: Simulate proxy issue scenario');
    const input5 = new MockInput();

    let proxyValue = 'oldProxyValue';
    const proxyInput = new Proxy(input5, {
        get(target, prop) {
            if (prop === 'value') {
                console.log('   🔍 Proxy getter called, returning:', proxyValue);
                return proxyValue;
            }
            return target[prop];
        },
        set(target, prop, value) {
            if (prop === 'value') {
                console.log('   📝 Proxy setter called with:', value);
                proxyValue = value;
                target._value = value;
            } else {
                target[prop] = value;
            }
            return true;
        }
    });

    console.log('   Initial proxy value:', proxyInput.value);
    await fillInputAdvanced(proxyInput, 'newProxyValue');
    console.log('   Final proxy value:', proxyInput.value);
    const test5Pass = proxyInput.value === 'newProxyValue';
    console.log('Result:', test5Pass ? '✅ PASS' : '❌ FAIL');
    if (test5Pass) passedTests++;
    console.log('');

    console.log('🏁 All tests completed!');
    console.log(`📊 Results: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
        console.log('🎉 ALL TESTS PASSED! Fix is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Please check the implementation.');
    }
}

// Run the tests
runTests().catch(console.error);