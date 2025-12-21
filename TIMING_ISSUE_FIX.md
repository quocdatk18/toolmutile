# Fix: Sequential Execution - Timing Issue Between Verify Button and Audio Captcha

## Problem
After clicking TAIAPP promo, the code was running steps in parallel instead of sequentially:
1. Click "Xác thực tại đây" button
2. **IMMEDIATELY** try to find and click "Tạo Audio Captcha" (without waiting for modal to render)
3. Result: Modal not fully rendered yet, button not found, audio never captured

**Evidence from logs:**
- `✅ Verify button clicked after 500ms` (button clicked)
- `⚠️ No audio URL captured after 3 seconds` (audio URL never captured)
- Button "Tạo Audio Captcha" exists in DOM but was never clicked

## Root Cause
In `clickVerifyButton()` function (line 3989):
```javascript
// OLD CODE - Only 300ms delay
await new Promise(resolve => setTimeout(resolve, 300));
await findAndClickCreateAudioButton();
```

The 300ms delay was insufficient for the modal to fully render, especially on slower sites or networks.

## Solution

### 1. Enhanced `clickVerifyButton()` Function
Added explicit wait for modal to be fully rendered before clicking "Tạo Audio Captcha":

```javascript
// CRITICAL FIX: Wait for modal to fully render before clicking "Tạo Audio Captcha"
console.log('⏳ Waiting for captcha modal to render...');

let modalReady = false;
let waitAttempts = 0;
const maxWaitAttempts = 20; // 20 * 500ms = 10 seconds max

while (!modalReady && waitAttempts < maxWaitAttempts) {
  waitAttempts++;
  
  // Check if modal elements are visible
  const modalCheck = await new Promise(resolve => {
    setTimeout(() => {
      const modal = document.querySelector('.modal, .dialog, [role="dialog"], .captcha-modal, .modal-content');
      // Check if "Tạo Audio Captcha" button exists and is visible
      let hasCreateAudioBtn = false;
      // ... search for button ...
      resolve({
        hasModal: !!modal,
        hasCreateAudioBtn: hasCreateAudioBtn
      });
    }, 0);
  });
  
  if (modalCheck.hasModal && modalCheck.hasCreateAudioBtn) {
    console.log(`✅ Modal ready after ${waitAttempts * 500}ms`);
    modalReady = true;
    break;
  }
  
  console.log(`⏳ [${waitAttempts}/${maxWaitAttempts}] Modal not ready yet, waiting...`);
  await new Promise(resolve => setTimeout(resolve, 500));
}
```

**Key improvements:**
- Waits up to 10 seconds for modal to render (20 attempts × 500ms)
- Checks for both modal container AND "Tạo Audio Captcha" button visibility
- Logs progress so user can see what's happening
- Proceeds anyway if timeout (fallback behavior)

### 2. Enhanced `findAndClickCreateAudioButton()` Function
Added wait for button to be visible before searching:

```javascript
// CRITICAL: Wait for button to be visible before searching
console.log('⏳ Waiting for "Tạo Audio Captcha" button to appear...');
let buttonFound = false;
let waitAttempts = 0;
const maxWaitAttempts = 20; // 20 * 500ms = 10 seconds max

while (!buttonFound && waitAttempts < maxWaitAttempts) {
  waitAttempts++;
  
  const allElements = [...document.querySelectorAll('button'), ...];
  
  // Check if any element contains "tạo audio" text and is visible
  for (let el of allElements) {
    const text = el.textContent.trim().toLowerCase();
    if (text.includes('tạo audio') || text.includes('tao audio')) {
      if (el.offsetParent !== null && el.clientHeight > 0 && el.clientWidth > 0) {
        buttonFound = true;
        console.log(`✅ Button found after ${waitAttempts * 500}ms`);
        break;
      }
    }
  }
  
  if (!buttonFound) {
    console.log(`⏳ [${waitAttempts}/${maxWaitAttempts}] Button not visible yet, waiting...`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
```

**Key improvements:**
- Waits up to 10 seconds for button to be visible
- Checks visibility using `offsetParent !== null && clientHeight > 0 && clientWidth > 0`
- Logs progress for debugging
- Proceeds with search if timeout

## Expected Flow (After Fix)

1. ✅ Click TAIAPP promo
2. ✅ Click "Xác thực tại đây" button
3. ⏳ **WAIT** for modal to render (up to 10 seconds)
4. ✅ Click "Tạo Audio Captcha" button
5. ⏳ **WAIT** for audio to load (up to 10 seconds)
6. ✅ Capture audio URL
7. ✅ Solve captcha
8. ✅ Click "Nhận Khuyến Mãi"

## Testing
To verify the fix works:
1. Run checkPromo on NOHU sites
2. Watch the logs for:
   - `⏳ Waiting for captcha modal to render...`
   - `✅ Modal ready after XXXms`
   - `⏳ Waiting for "Tạo Audio Captcha" button to appear...`
   - `✅ Button found after XXXms`
3. Audio should be captured and solved successfully

## Additional Fix: Button Search Methods

After the initial fix, discovered that the search methods were failing to find the button due to special character handling issues. Updated the search methods to:

1. **Method 1**: Search for "audio" + "captcha" keywords (simple, reliable)
2. **Method 2**: Search for Vietnamese "tạo" or "tao" + "audio" keywords
3. **Method 3**: Search by class name containing "audio"
4. **Method 4**: Search for button with "audio-captcha" class
5. **Method 5**: Direct selector for "Tạo Audio Captcha" button with manual text search

This ensures the button is found regardless of how it's named or styled.

## Files Modified
- `tools/nohu-tool/extension/content.js`
  - `clickVerifyButton()` function (line ~3958) - Added modal wait logic
  - `findAndClickCreateAudioButton()` function (line ~4005) - Added button visibility wait + improved search methods
