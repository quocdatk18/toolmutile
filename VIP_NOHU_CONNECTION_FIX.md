# Fix: VIP Running Causes Nohu CheckPromo "Connection closed" Error

## Problem
When VIP tool runs on one profile (e.g., admin3), it causes Nohu checkPromo on a different profile (e.g., checkm) to fail with "Connection closed" error.

## Root Cause
- **VIP creates many pages rapidly** from the main browser instance
- **This exhausts Hidemium's resources** or causes connection pool issues
- **Nohu's checkPromo connection gets disrupted** because Hidemium can't handle concurrent resource demands

## Solution Implemented

### 1. VIP Tool - Add Delays Between Page Creation
**File**: `tools/vip-tool/vip-automation.js`

#### Sequential Mode
- Added 1-second delay between processing each site
- Prevents rapid page creation that exhausts Hidemium resources

```javascript
// Add delay between sites to reduce resource contention with other tools
if (siteName !== sites[sites.length - 1]) {
    console.log(`⏳ Waiting 1 second before next site (to avoid Hidemium resource exhaustion)...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
}
```

#### Parallel Mode
- Added 2-second delay between batches
- Allows batch to complete before starting next batch
- Reduces peak resource usage

```javascript
// Add delay between batches to avoid overwhelming Hidemium
if (i + parallelCount < sites.length) {
    console.log(`⏳ Waiting 2 seconds before next batch (to avoid Hidemium resource exhaustion)...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
}
```

### 2. Nohu Tool - Add Connection Retry Logic
**File**: `tools/nohu-tool/complete-automation.js`

#### Page Creation Retry
- Retries up to 3 times if page creation fails with "Connection closed"
- Waits 2 seconds between retries
- Returns graceful error if all retries fail

```javascript
while (!promoPage && pageCreateRetries < maxPageCreateRetries) {
    try {
        pageCreateRetries++;
        promoPage = await promoContext.newPage();
        console.log('    ✅ Page created successfully');
    } catch (error) {
        if (error.message.includes('Connection closed') || error.message.includes('Target closed')) {
            if (pageCreateRetries < maxPageCreateRetries) {
                console.log(`    ⏳ Waiting 2 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
}
```

#### Navigation Retry
- Retries up to 2 times if navigation fails with "Connection closed"
- Waits 2 seconds between retries
- Distinguishes between connection errors and other errors

```javascript
while (!navigationSuccess && navRetries < maxNavRetries) {
    try {
        navRetries++;
        await promoPage.goto(promoUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        navigationSuccess = true;
    } catch (navError) {
        if (navError.message.includes('Connection closed') || navError.message.includes('Target closed')) {
            // Retry connection errors
        } else {
            // Handle other errors normally
        }
    }
}
```

## Benefits
1. **VIP doesn't overwhelm Hidemium** - Delays prevent resource exhaustion
2. **Nohu checkPromo is resilient** - Retries handle temporary connection issues
3. **Both tools can run concurrently** - On different profiles without interference
4. **Graceful error handling** - Clear error messages when connection fails

## Testing
Run VIP on admin3 profile while running Nohu checkPromo on checkm profile:
- VIP should complete successfully
- Nohu checkPromo should NOT fail with "Connection closed"
- Both tools should show proper status updates

## Notes
- Delays are conservative (1-2 seconds) to balance speed vs. stability
- Retry logic only applies to connection errors, not other failures
- Both tools still run independently on their own profiles
