/**
 * Test script để kiểm tra fix cho fillInputAdvanced function
 * Vấn đề: Khi user xóa input, proxy vẫn giữ giá trị cũ
 * Fix: Clear input trước khi set giá trị mới để reset proxy state
 */

// Simulate the fillInputAdvanced function (copy from content.js)
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
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        ).set;

        if (nativeInputValueSetter) {
            // First clear to empty string to reset proxy
            nativeInputValueSetter.call(input, '');
            console.log('   ✅ Cleared using native setter');
        } else {
            input.value = '';
            console.log('   ✅ Cleared using direct assignment');
        }

        // Method 2: Trigger input event after clearing to notify frameworks
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 50));

        // Method 3: Now set the new value
        console.log('📝 Setting new value:', value);
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, value.toString());
        } else {
            input.value = value.toString();
        }

        // Trigger all necessary events for Angular/React/Vue frameworks
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));

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

// Test scenarios
async function runTests() {
    console.log('🧪 Testing fillInputAdvanced fix...\n');

    // Create test input element
    const testInput = document.createElement('input');
    testInput.type = 'text';
    testInput.placeholder = 'Test Input';
    testInput.name = 'testInput';
    document.body.appendChild(testInput);

    // Test 1: Normal fill
    console.log('📋 Test 1: Normal fill');
    testInput.value = '';
    await fillInputAdvanced(testInput, 'test123');
    console.log('Result:', testInput.value === 'test123' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Test 2: Fill when input already has value (simulate user typed something)
    console.log('📋 Test 2: Fill when input has existing value');
    testInput.value = 'oldvalue';
    await fillInputAdvanced(testInput, 'newvalue');
    console.log('Result:', testInput.value === 'newvalue' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Test 3: Fill empty string (simulate clearing)
    console.log('📋 Test 3: Fill empty string');
    testInput.value = 'somevalue';
    await fillInputAdvanced(testInput, '');
    console.log('Result:', testInput.value === '' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Test 4: Fill with same value (should skip)
    console.log('📋 Test 4: Fill with same value (should skip)');
    testInput.value = 'samevalue';
    const result = await fillInputAdvanced(testInput, 'samevalue');
    console.log('Result:', result === true && testInput.value === 'samevalue' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Test 5: Simulate proxy issue scenario
    console.log('📋 Test 5: Simulate proxy issue scenario');

    // Create a proxy that retains old value (simulate the bug)
    let proxyValue = 'oldProxyValue';
    const proxyInput = new Proxy(testInput, {
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
                target.value = value;
            } else {
                target[prop] = value;
            }
            return true;
        }
    });

    // Test the fix with proxy
    console.log('   Initial proxy value:', proxyInput.value);
    await fillInputAdvanced(proxyInput, 'newProxyValue');
    console.log('   Final proxy value:', proxyInput.value);
    console.log('Result:', proxyInput.value === 'newProxyValue' ? '✅ PASS' : '❌ FAIL');
    console.log('');

    // Cleanup
    document.body.removeChild(testInput);

    console.log('🏁 All tests completed!');
}

// Run tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests);
} else {
    runTests();
}