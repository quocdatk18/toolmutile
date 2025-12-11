# 🔍 Debug Hidemium Connection

## 🎯 Current Issue

Dashboard shows "Hidemium Offline" even after fixes.

## ✅ What We Fixed

1. ✅ Changed API URL to `127.0.0.1:2222`
2. ✅ Fixed API endpoints
3. ✅ Simplified `checkHidemiumConnection()` to call directly

## 🔍 Debug Steps

### Step 1: Check Hidemium is Running

Open browser and test:
```
http://127.0.0.1:2222/profiles
```

**Expected:** JSON response with profiles list

**If fails:** Hidemium is not running or Local API is disabled

### Step 2: Check Dashboard Server Console

Look at the terminal where you ran `npm run dashboard`.

When you refresh the browser, you should see:
```
GET /api/hidemium/status
```

**If you see error:** Check the error message

### Step 3: Check Browser Console

1. Open dashboard: http://localhost:3000
2. Press F12
3. Go to Console tab
4. Refresh page (F5)

**Look for:**
- ✅ "Hidemium is running and connected"
- ❌ "Hidemium connection error: ..."

### Step 4: Check Network Tab

1. Press F12
2. Go to Network tab
3. Refresh page (F5)
4. Look for request to `/api/hidemium/status`

**Click on it and check:**
- Status: Should be 200
- Response: Should be `{"success": true, "connected": true}`

## 🐛 Common Issues

### Issue 1: Hidemium Not Running

**Symptom:** `http://127.0.0.1:2222/profiles` returns error

**Solution:**
1. Open Hidemium Browser
2. Wait for it to fully load
3. Test URL again

### Issue 2: Wrong Port

**Symptom:** Connection timeout

**Solution:**
Check Hidemium is using port 2222:
```bash
netstat -ano | findstr :2222
```

If not found, Hidemium might be using different port.

### Issue 3: CORS Error

**Symptom:** Browser console shows CORS error

**Solution:**
Server already has CORS enabled. Check server.js has:
```javascript
app.use(cors());
```

### Issue 4: Server Not Restarted

**Symptom:** Old code still running

**Solution:**
1. Stop server (Ctrl+C)
2. Start again: `npm run dashboard`
3. Hard refresh browser (Ctrl+Shift+R)

## 🧪 Manual Test

### Test 1: Direct API Call

Open browser console (F12) and run:
```javascript
fetch('http://localhost:3000/api/hidemium/status')
  .then(r => r.json())
  .then(d => console.log('Response:', d))
  .catch(e => console.error('Error:', e))
```

**Expected:**
```json
{
  "success": true,
  "connected": true
}
```

### Test 2: Direct Hidemium Call

```javascript
fetch('http://127.0.0.1:2222/profiles')
  .then(r => r.json())
  .then(d => console.log('Profiles:', d))
  .catch(e => console.error('Error:', e))
```

**Expected:** Array of profiles

## 📝 Checklist

- [ ] Hidemium is running
- [ ] `http://127.0.0.1:2222/profiles` returns JSON
- [ ] Dashboard server is running on port 3000
- [ ] Server console shows no errors
- [ ] Browser console shows no errors
- [ ] Network tab shows 200 response
- [ ] Response JSON is correct

## 🔧 If Still Not Working

### Check Server Code

File: `dashboard/server.js`

Line ~40:
```javascript
app.get('/api/hidemium/status', async (req, res) => {
    try {
        const axios = require('axios');
        const response = await axios.get('http://127.0.0.1:2222/profiles', {
            timeout: 2000
        });

        console.log('✅ Hidemium responded:', response.status); // ADD THIS

        res.json({
            success: true,
            connected: true
        });
    } catch (error) {
        console.error('❌ Hidemium error:', error.message); // ADD THIS
        
        res.json({
            success: false,
            connected: false,
            error: error.message
        });
    }
});
```

### Add More Logging

File: `dashboard/dashboard.js`

```javascript
async function checkHidemiumConnection() {
    console.log('🔍 Checking Hidemium connection...'); // ADD THIS
    
    const statusBadge = document.getElementById('hidemiumStatus');
    const statusIcon = statusBadge.querySelector('.status-icon');
    const statusText = statusBadge.querySelector('.status-text');

    try {
        const response = await fetch('http://localhost:3000/api/hidemium/status');
        console.log('📡 Response status:', response.status); // ADD THIS
        
        const data = await response.json();
        console.log('📦 Response data:', data); // ADD THIS

        if (data.connected) {
            statusIcon.textContent = '✅';
            statusText.textContent = 'Hidemium Connected';
            statusBadge.classList.add('status-connected');
            statusBadge.classList.remove('status-error');
            console.log('✅ Hidemium is running and connected');
        } else {
            throw new Error('Hidemium not responding');
        }
    } catch (error) {
        console.error('❌ Hidemium connection error:', error); // ALREADY ADDED
        statusIcon.textContent = '⚠️';
        statusText.textContent = 'Hidemium Offline';
        statusBadge.classList.add('status-error');
        statusBadge.classList.remove('status-connected');
        showToast('warning', 'Hidemium Offline', 'Vui lòng mở Hidemium và bật Local API');
    }
}
```

## 📊 Expected Console Output

### Server Console:
```
✅ Hidemium responded: 200
```

### Browser Console:
```
🔍 Checking Hidemium connection...
📡 Response status: 200
📦 Response data: {success: true, connected: true}
✅ Hidemium is running and connected
```

---

**Next:** Follow debug steps and report what you see!
