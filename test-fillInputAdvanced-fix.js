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
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        ).set;

        if (nativeInputValueSetter) {
            // First clear to empty string to reset proxy
            nativeInputValueSetter.call(input, '');
        } else {
            input.value = '';
        }

        // Method 2: Trigger input event after clearing to notify frameworks
        input.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 50));

        // Method 3: Now set the new value
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

    // Create test input element
    const testInput = document.createElement('input');
    testInput.type = 'text';
    testInput.placeholder = 'Test Input';
    testInput.name = 'testInput';
    document.body.appendChild(testInput);

    // Test 1: Normal fill
    testInput.value = '';
    await fillInputAdvanced(testInput, 'test123');

    // Test 2: Fill when input already has value (simulate user typed something)
    testInput.value = 'oldvalue';
    await fillInputAdvanced(testInput, 'newvalue');

    // Test 3: Fill empty string (simulate clearing)
    testInput.value = 'somevalue';
    await fillInputAdvanced(testInput, '');

    // Test 4: Fill with same value (should skip)
    testInput.value = 'samevalue';
    const result = await fillInputAdvanced(testInput, 'samevalue');

    // Test 5: Simulate proxy issue scenario

    // Create a proxy that retains old value (simulate the bug)
    let proxyValue = 'oldProxyValue';
    const proxyInput = new Proxy(testInput, {
        get(target, prop) {
            if (prop === 'value') {
                return proxyValue;
            }
            return target[prop];
        },
        set(target, prop, value) {
            if (prop === 'value') {
                proxyValue = value;
                target.value = value;
            } else {
                target[prop] = value;
            }
            return true;
        }
    });

    // Test the fix with proxy
    await fillInputAdvanced(proxyInput, 'newProxyValue');

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