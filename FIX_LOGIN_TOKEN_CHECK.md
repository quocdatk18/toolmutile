# Fix: Login Token Check Logic

## 🐛 Vấn Đề
- Tool NOHU redirect sang rút tiền khi chưa đăng nhập được
- Không check token ở link đăng nhập, chỉ check ở link đăng ký
- Logic flow không verify login status trước khi thực hiện các action tiếp theo

## 🔍 Nguyên Nhân
1. **Thiếu check login status**: Không có function kiểm tra đã login hay chưa
2. **Login flow không check**: `runLogin()` luôn thực hiện login action mà không check đã login
3. **Withdraw redirect không check**: Luôn redirect to withdraw sau login mà không verify login success
4. **Add bank không check**: Thực hiện add bank mà không check login status

## ✅ Giải Pháp

### 1. Thêm Function Check Login Status
```javascript
async checkLoginStatus(page) {
    const loginStatus = await page.evaluate(() => {
        // Check cookies for auth tokens
        const cookies = document.cookie;
        const tokenCookies = ['_pat', 'token', 'auth_token', 'access_token', 'session', 'auth', 'jwt'];
        
        let hasToken = false;
        for (const name of tokenCookies) {
            if (cookies.includes(`${name}=`)) {
                const match = cookies.match(new RegExp(`${name}=([^;]+)`));
                if (match && match[1] && match[1] !== 'null' && match[1].length > 5) {
                    hasToken = true;
                    break;
                }
            }
        }
        
        // Check localStorage for tokens
        const localStorageTokens = ['token', 'auth', 'access_token', 'authToken', 'userToken'];
        let hasLocalToken = false;
        for (const name of localStorageTokens) {
            const value = localStorage.getItem(name);
            if (value && value !== 'null' && value.length > 5) {
                hasLocalToken = true;
                break;
            }
        }
        
        // Check URL patterns
        const currentUrl = window.location.href;
        const loggedInPatterns = ['/dashboard', '/profile', '/account', '/member', '/user', '/home'];
        const isOnLoggedInPage = loggedInPatterns.some(pattern => currentUrl.includes(pattern));
        
        const loginPatterns = ['/login', '/dang-nhap', '/signin', '/auth'];
        const isOnLoginPage = loginPatterns.some(pattern => currentUrl.includes(pattern));
        
        return {
            hasToken,
            hasLocalToken,
            isOnLoggedInPage,
            isOnLoginPage,
            isLoggedIn: (hasToken || hasLocalToken || isOnLoggedInPage) && !isOnLoginPage
        };
    });
    
    return loginStatus;
}
```

### 2. Sửa Login Flow
```javascript
async runLogin(browserOrContext, url, profileData) {
    // Check if already logged in
    const loginStatus = await this.checkLoginStatus(page);
    
    if (loginStatus.isLoggedIn) {
        console.log('✅ Already logged in, skipping login process');
        return {
            success: true,
            message: 'Already logged in',
            hasToken: loginStatus.hasToken || loginStatus.hasLocalToken,
            result: { submitted: true, alreadyLoggedIn: true }
        };
    }
    
    console.log('🔐 Not logged in, proceeding with login...');
    // ... continue with login process
}
```

### 3. Sửa Withdraw Redirect Logic
```javascript
// Auto-redirect to withdraw page if withdrawUrl provided
if (withdrawUrl && profileData.bankName && profileData.accountNumber) {
    // Check login status before redirecting to withdraw
    const loginStatus = await this.checkLoginStatus(page);
    
    if (!loginStatus.isLoggedIn) {
        console.log('❌ Not logged in, cannot redirect to withdraw page');
        result.autoWithdraw = { success: false, error: 'Not logged in for withdraw' };
        result.message = 'Registration and login successful, but not logged in for withdraw';
        return result;
    }
    
    console.log('✅ Logged in confirmed, proceeding to withdraw page');
    // ... continue with withdraw redirect
}
```

### 4. Sửa Add Bank Logic
```javascript
async runAddBank(browser, url, bankInfo) {
    // Check if logged in before adding bank
    const loginStatus = await this.checkLoginStatus(page);
    
    if (!loginStatus.isLoggedIn) {
        console.log('❌ Not logged in, cannot add bank');
        return { 
            success: false, 
            message: 'Not logged in - please login first before adding bank',
            needLogin: true 
        };
    }
    
    console.log('✅ Logged in confirmed, proceeding to add bank');
    // ... continue with add bank
}
```

## 🎯 Kết Quả

### Before Fix:
```
Registration → Auto-login → Always redirect to withdraw (❌ không check login)
Login → Always perform login action (❌ không check đã login)
Add Bank → Always perform action (❌ không check login)
```

### After Fix:
```
Registration → Auto-login → Check login status → Redirect to withdraw (✅)
Login → Check if already logged in → Skip if logged in (✅)
Add Bank → Check login status → Require login first (✅)
```

## 📊 Login Status Check Criteria

Function `checkLoginStatus()` kiểm tra:

1. **Cookies**: `_pat`, `token`, `auth_token`, `access_token`, `session`, `auth`, `jwt`
2. **LocalStorage**: `token`, `auth`, `access_token`, `authToken`, `userToken`
3. **URL Patterns**: 
   - Logged in: `/dashboard`, `/profile`, `/account`, `/member`, `/user`, `/home`
   - Login page: `/login`, `/dang-nhap`, `/signin`, `/auth`
4. **Logic**: `isLoggedIn = (hasToken || hasLocalToken || isOnLoggedInPage) && !isOnLoginPage`

## 🔧 Flow Improvements

1. ✅ **Smart Login**: Skip login nếu đã logged in
2. ✅ **Verified Withdraw**: Chỉ redirect withdraw khi đã login
3. ✅ **Protected Add Bank**: Require login trước khi add bank
4. ✅ **Better Error Messages**: Thông báo rõ ràng khi chưa login
5. ✅ **Recovery Logic**: Check login status sau context destroyed

## 📝 Test Cases

1. **Already Logged In**: Tool detect và skip login process
2. **Not Logged In**: Tool thực hiện login trước khi continue
3. **Login Failed**: Tool không redirect to withdraw
4. **Add Bank Without Login**: Tool yêu cầu login trước
5. **Context Destroyed**: Tool verify login status sau recovery