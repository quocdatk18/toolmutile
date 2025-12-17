/**
 * Test logic của fillInputAdvanced fix (không cần DOM)
 * Kiểm tra xem logic clear input có hoạt động đúng không
 */

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
        return true;
    }

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

        // Method 1: Clear using native setter (resets proxy)
        const nativeInputValueSetter = mockGetOwnPropertyDescriptor();

        if (nativeInputValueSetter) {
            // First clear to empty string to reset proxy
            nativeInputValueSetter.set.call(input, '');
        } else {
            input.value = '';
        }

        // Method 2: Trigger input event after clearing to notify frameworks
        input.dispatchEvent({ type: 'input', bubbles: true });
        await new Promise(resolve => setTimeout(resolve, 50));

        // Method 3: Now set the new value
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
    const input1 = new MockInput();
    input1.value = '';
    await fillInputAdvanced(input1, 'test123');
    const test1Pass = input1.value === 'test123';
    if (test1Pass) passedTests++;

    // Test 2: Fill when input already has value
    const input2 = new MockInput();
    input2.value = 'oldvalue';
    await fillInputAdvanced(input2, 'newvalue');
    const test2Pass = input2.value === 'newvalue';
    if (test2Pass) passedTests++;

    // Test 3: Fill empty string
    const input3 = new MockInput();
    input3.value = 'somevalue';
    await fillInputAdvanced(input3, '');
    const test3Pass = input3.value === '';
    if (test3Pass) passedTests++;

    // Test 4: Fill with same value (should skip)
    const input4 = new MockInput();
    input4.value = 'samevalue';
    const result = await fillInputAdvanced(input4, 'samevalue');
    const test4Pass = result === true && input4.value === 'samevalue';
    if (test4Pass) passedTests++;

    // Test 5: Simulate proxy issue scenario
    const input5 = new MockInput();

    let proxyValue = 'oldProxyValue';
    const proxyInput = new Proxy(input5, {
        get(target, prop) {
            if (prop === 'value') {
                return proxyValue;
            }
            return target[prop];
        },
        set(target, prop, value) {
            if (prop === 'value') {
                proxyValue = value;
                target._value = value;
            } else {
                target[prop] = value;
            }
            return true;
        }
    });

    await fillInputAdvanced(proxyInput, 'newProxyValue');
    const test5Pass = proxyInput.value === 'newProxyValue';
    if (test5Pass) passedTests++;

    console.log('🏁 All tests completed!');

    if (passedTests === totalTests) {
    } else {
        console.log('⚠️ Some tests failed. Please check the implementation.');
    }
}

// Run the tests
runTests().catch(console.error);