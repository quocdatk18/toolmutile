# Debug Session Tracking Issues

## 🔍 **Vấn đề phát hiện:**

### **Popup Error:**
```
"Thông Tin Tài Khoản - SkySoul72n"
"⚠️ Không tìm thấy thông tin"
"Không tìm thấy thông tin tài khoản cho session này"
```

## 🧪 **Root Cause Analysis:**

### **1. Session Metadata Missing:**
- Dashboard expect `metadata.json` file trong session folder
- File này được tạo bởi dashboard/server.js khi start automation
- Có thể file không được tạo hoặc username không match

### **2. Username Mismatch:**
- Popup show "SkySoul72n" 
- Có thể case sensitivity issue (SkySoul72n vs skysoul72n)
- Hoặc username trong metadata khác với username trong popup

### **3. Session ID Issues:**
- Dashboard group results by `${username}_${sessionId}`
- Nếu sessionId không match → không tìm thấy data

## 🔧 **Debug Steps Added:**

### **1. Enhanced Logging:**
```javascript
console.log(`📊 Profile data: username=${profileData.username}, fullname=${profileData.fullname}`);
console.log(`📊 Session ID: ${this.settings.sessionId || 'undefined'}`);
console.log(`📊 Username for dashboard: ${profileData.username}`);
```

### **2. Check Points:**
- ✅ Account info được save với username nào?
- ✅ Session ID có được pass đúng không?
- ✅ Metadata.json file có được tạo không?
- ✅ Username case có match không?

## 🎯 **Expected Debug Output:**

```
💾 Saving account info...
📊 Profile data: username=SkySoul72n, fullname=NGUYEN VAN TEST
📊 Site URL: https://m.88111188.com/?app=1&f=6344995
📊 Session ID: 2025-12-11T05-45-32
📊 Username for dashboard: SkySoul72n
✅ Account info saved to: accounts/SkySoul72n/m-88111188-com.txt
✅ Account JSON saved to: accounts/SkySoul72n/m-88111188-com.json
```

## 💡 **Possible Solutions:**

### **1. If Username Mismatch:**
- Ensure consistent username casing
- Check dashboard metadata.json file
- Verify username in popup matches saved data

### **2. If Session ID Missing:**
- Ensure sessionId is passed to complete-automation
- Check if settings.sessionId is defined
- Verify session folder structure

### **3. If Metadata Missing:**
- Check if dashboard creates metadata.json properly
- Verify session folder exists
- Ensure username folder structure is correct

## 🚀 **Next Steps:**

1. **Run automation and check debug logs**
2. **Verify session folder structure**: `screenshots/SkySoul72n/2025-12-11T05-45-32/`
3. **Check metadata.json content**
4. **Verify username consistency**
5. **Test popup with correct session data**

**Goal**: Fix session tracking so popup can find account info properly!