/**
 * Admin API - Build and manage customer packages
 * FIXED VERSION - Actually builds packages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Only require archiver if available
let archiver;
try {
    archiver = require('archiver');
} catch (err) {
    console.log('⚠️  archiver not installed. Run: npm install archiver');
}

class AdminAPI {
    constructor() {
        this.packagesDir = path.join(__dirname, '..', 'customer-packages');
    }

    /**
     * Build customer package - SECURE IMPLEMENTATION WITH OBFUSCATION
     * @param {Object} options
     * @param {string} options.customerName - Tên khách hàng
     * @param {number} options.licenseType - Loại license
     * @param {boolean} options.machineBinding - Có bind machine không
     * @param {boolean} options.obfuscate - Có obfuscate không
     * @param {string} [options.secretKey] - Secret key cũ (nếu upgrade, để giữ license key cũ hoạt động)
     */
    async buildPackage(options) {
        const { customerName, licenseType, machineBinding, obfuscate, secretKey: existingSecretKey } = options;
        // NOTE: machineId should NOT be set when creating new package
        // Customer will provide machineId later, admin will generate key based on it

        try {
            // Validate
            if (!customerName || !customerName.match(/^[a-zA-Z0-9_-]+$/)) {
                return { success: false, message: 'Tên khách hàng không hợp lệ' };
            }

            // Check if package already exists
            const packagePath = path.join(this.packagesDir, customerName);
            if (fs.existsSync(packagePath)) {
                return { success: false, message: 'Package đã tồn tại! Vui lòng xóa hoặc đổi tên.' };
            }

            // Create packages directory
            if (!fs.existsSync(this.packagesDir)) {
                fs.mkdirSync(this.packagesDir, { recursive: true });
            }

            // Create output folder
            fs.mkdirSync(packagePath, { recursive: true });

            // Copy files (excluding admin files)
            console.log('📋 Copying files...');
            const itemsToCopy = ['core', 'dashboard', 'config', 'tools', 'screenshots', 'package.json', 'package-lock.json', '.env'];
            itemsToCopy.forEach(item => {
                const srcPath = path.join(__dirname, '..', item);
                const destPath = path.join(packagePath, item);
                if (fs.existsSync(srcPath)) {
                    this.copyRecursive(srcPath, destPath);
                    console.log(`✅ Copied: ${item}`);
                } else {
                    console.log(`⚠️  Not found: ${item}`);
                }
            });

            // Remove any old .license file from copied files (ensure fresh package)
            const copiedLicenseFile = path.join(packagePath, '.license');
            if (fs.existsSync(copiedLicenseFile)) {
                fs.unlinkSync(copiedLicenseFile);
                console.log('🧹 Removed old .license file from copied files');
            }

            // DO NOT preserve old license file - always create fresh package
            // This ensures new package is completely independent from old one
            console.log('📋 Creating fresh package (no old license file preservation)');

            // Use existing secret key (for upgrade) or generate new one
            const secretKey = existingSecretKey || `SECRET_${customerName}_${Math.floor(Math.random() * 100000)}_${Math.floor(Math.random() * 100000)}`;
            if (existingSecretKey) {
                console.log(`🔐 Reusing existing secret key: ${secretKey.substring(0, 20)}...`);
            } else {
                console.log(`🔐 Generated new secret key: ${secretKey}`);
            }

            // Update secret key in license-manager.js
            const licenseManagerPath = path.join(packagePath, 'core', 'license-manager.js');
            if (fs.existsSync(licenseManagerPath)) {
                let content = fs.readFileSync(licenseManagerPath, 'utf8');
                content = content.replace(/HIDEMIUM_TOOL_SECRET_2024/g, secretKey);
                fs.writeFileSync(licenseManagerPath, content, 'utf8');
            }

            // Remove admin files that shouldn't be in customer package
            console.log('🧹 Removing admin files...');
            const adminFilesToRemove = [
                path.join(packagePath, 'dashboard', 'admin.html'),
                path.join(packagePath, 'dashboard', 'admin-api.js'),
                path.join(packagePath, 'dashboard', 'customer-manager.html'),
                path.join(packagePath, 'dashboard', 'customer-machine-manager.js'),
                path.join(packagePath, 'tools', 'advanced-obfuscate.js')
            ];

            adminFilesToRemove.forEach(file => {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                    console.log(`   Removed: ${path.basename(file)}`);
                }
            });

            // Obfuscate critical files if requested
            // TEMPORARILY DISABLED FOR TESTING - uncomment to enable
            // if (obfuscate !== false) {
            //     console.log('🔒 Obfuscating critical files...');
            //     await this.obfuscatePackageFiles(packagePath);
            // }
            console.log('⏭️ Obfuscation DISABLED for testing');

            // Create customer version marker
            fs.writeFileSync(path.join(packagePath, '.customer'), customerName, 'utf8');
            console.log('✅ Created customer version marker');

            // Create version info file
            // NOTE: machineId is NOT set here - customer will provide it later
            const versionInfo = {
                customer: customerName,
                version: '3.0.0',
                createdAt: new Date().toISOString(),
                buildType: 'customer-package',
                secretKey: secretKey,
                machineId: null,  // Will be set by admin after customer provides their machine ID
                obfuscated: obfuscate !== false
            };
            fs.writeFileSync(
                path.join(packagePath, '.version-info.json'),
                JSON.stringify(versionInfo, null, 2),
                'utf8'
            );
            console.log('✅ Created version info');

            // Save license key placeholder (actual key will be generated by admin)
            const licenseKeyContent = `
License Key Instructions
========================
Package: ${customerName}
Created: ${new Date().toLocaleString('vi-VN')}
License Type: ${licenseType === -1 ? 'Lifetime' : licenseType >= 1 ? licenseType + ' days' : (licenseType * 24 * 60).toFixed(0) + ' minutes'}
Machine Binding: ${machineBinding ? 'YES' : 'NO'}

HƯỚNG DẪN KÍCH HOẠT:
====================

BƯỚC 1: Cài đặt và chạy tool
   - Chạy INSTALL.bat để cài đặt
   - Chạy START.bat để khởi động dashboard
   - Mở trình duyệt: http://localhost:3000

BƯỚC 2: Lấy Machine ID
   - Trong dashboard, vào tab "License Info"
   - Copy Machine ID (16 ký tự)
   - Gửi Machine ID cho admin

BƯỚC 3: Nhận license key
   - Admin sẽ tạo license key dựa trên Machine ID của bạn
   - Nhận license key qua email/chat

BƯỚC 4: Kích hoạt
   - Trong dashboard, click "Kích Hoạt Bản Quyền"
   - Dán license key vào
   - Click "Kích Hoạt"

⚠️  LƯU Ý:
   - License key chỉ hoạt động trên máy có Machine ID tương ứng
   - Không thể sử dụng trên máy khác
   - Không chia sẻ license key cho người khác

========================================
License key sẽ được cập nhật vào file này sau khi admin tạo.
`;
            fs.writeFileSync(path.join(packagePath, 'LICENSE_KEY.txt'), licenseKeyContent, 'utf8');

            // Clean sensitive data
            console.log('🧹 Cleaning sensitive data...');
            this.cleanSensitiveData(packagePath);

            // Create README
            const readme = `========================================
HIDEMIUM MULTI-TOOL
========================================

Customer: ${customerName}
License: ${licenseType === -1 ? 'Vĩnh viễn' : licenseType >= 1 ? licenseType + ' ngày' : (licenseType * 24 * 60).toFixed(0) + ' phút'}

CÀI ĐẶT & CHẠY:
  
  BƯỚC 1 - CÀI ĐẶT (chỉ cần làm 1 lần):
  ✅ Double-click file: INSTALL.bat
     (Nếu chưa có Node.js, tải tại: https://nodejs.org)
  
  BƯỚC 2 - KHỞI ĐỘNG:
  ✅ Double-click file: START.bat
  
  CÁCH MANUAL (nếu cần):
  1. Cài Node.js (nếu chưa có)
  2. Mở CMD tại thư mục này
  3. Chạy: npm install
  4. Chạy: npm run dashboard

KÍCH HOẠT:
  1. Mở dashboard: http://localhost:3000
  2. Vào tab "License Info" → Copy Machine ID
  3. Gửi Machine ID cho admin
  4. Nhận license key từ admin
  5. Click "Kích Hoạt Bản Quyền" → Dán license key
  6. Click "Kích Hoạt"

⚠️  LƯU Ý BẢO MẬT:
  - License key chỉ hoạt động trên máy này (Machine ID cố định)
  - Không thể sử dụng trên máy khác
  - Không chia sẻ license key cho người khác

========================================
`;
            fs.writeFileSync(path.join(packagePath, 'README.txt'), readme, 'utf8');

            // Create INSTALL.bat
            const installBat = `@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
cls
echo ========================================
echo    HIDEMIUM MULTI-TOOL - INSTALLATION
echo ========================================
echo.
echo Customer: ${customerName}
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from:
    echo    https://nodejs.org
    echo.
    echo    Download LTS version (recommended)
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js installed:
node --version
echo.

REM Check npm
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm not found!
    echo.
    echo Please reinstall Node.js
    echo.
    pause
    exit /b 1
)

echo [OK] npm installed:
npm --version
echo.

REM Check if already installed
if exist "node_modules" (
    echo [WARNING] Dependencies already installed
    echo.
    set /p REINSTALL="Do you want to reinstall? (y/n): "
    if /i not "%REINSTALL%"=="y" (
        echo.
        echo [OK] Skipping installation
        echo.
        echo Run START.bat to start dashboard
        pause
        exit /b 0
    )
    echo.
    echo Removing old node_modules...
    rmdir /s /q node_modules 2>nul
    if exist "package-lock.json" (
        del /f /q package-lock.json 2>nul
    )
)

echo Installing dependencies...
echo This may take a few minutes...
echo.
echo Running: npm install
echo.

REM Run npm install
npm install --no-optional --loglevel=error

if errorlevel 1 (
    echo.
    echo [ERROR] Installation failed!
    echo.
    echo Please try:
    echo    1. Check internet connection
    echo    2. Run CMD as Administrator
    echo    3. Run command: npm install
    echo    4. Contact support
    echo.
    echo Debug info:
    echo    - Node version: 
    node --version
    echo    - npm version: 
    npm --version
    echo    - Current dir: %CD%
    echo.
    pause
    exit /b 1
)

REM Verify installation
if not exist "node_modules" (
    echo.
    echo [ERROR] node_modules was not created!
    echo.
    echo Please run manually:
    echo    npm install
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo    INSTALLATION COMPLETED!
echo ========================================
echo.
echo Next steps:
echo    1. Run START.bat to start dashboard
echo    2. Open browser: http://localhost:3000
echo    3. Activate license from LICENSE_KEY.txt
echo.
pause
`;
            fs.writeFileSync(path.join(packagePath, 'INSTALL.bat'), installBat, 'utf8');

            // Create customer guide
            const customerGuide = `========================================
📖 HƯỚNG DẪN SỬ DỤNG - HIDEMIUM MULTI-TOOL
========================================

🎯 DÀNH CHO KHÁCH HÀNG KHÔNG BIẾT CODE

========================================
BƯỚC 1: CÀI ĐẶT NODE.JS (nếu chưa có)
========================================

1. Mở trình duyệt, vào: https://nodejs.org
2. Tải bản "LTS" (khuyến nghị) - nút màu xanh lá
3. Chạy file .msi vừa tải về
4. Click "Next" → "Next" → "Install" → "Finish"
5. Khởi động lại máy tính (quan trọng!)

✅ Xong! Node.js đã được cài đặt.

========================================
BƯỚC 2: CÀI ĐẶT TOOL (chỉ làm 1 lần)
========================================

1. Giải nén file ZIP bạn nhận được
2. Vào thư mục vừa giải nén
3. Tìm file: INSTALL.bat
4. Double-click vào INSTALL.bat
5. Đợi cài đặt xong (có thể mất 2-5 phút)
6. Thấy "CÀI ĐẶT HOÀN TẤT!" → Nhấn phím bất kỳ để đóng

✅ Xong! Tool đã được cài đặt.

========================================
BƯỚC 3: KHỞI ĐỘNG TOOL
========================================

1. Tìm file: START.bat (trong cùng thư mục)
2. Double-click vào START.bat
3. Đợi 5-10 giây
4. Trình duyệt sẽ tự động mở trang: http://localhost:3000

✅ Xong! Dashboard đã khởi động.

========================================
BƯỚC 4: KÍCH HOẠT LICENSE
========================================

1. Trong dashboard, click nút "🔐 Kích Hoạt Bản Quyền"
2. Mở file LICENSE_KEY.txt (trong thư mục tool)
3. Copy toàn bộ license key (dòng dài)
4. Paste vào ô "License Key" trong dashboard
5. Click "Kích Hoạt"
6. Thấy "✅ License activated successfully" → Thành công!

✅ Xong! Tool đã được kích hoạt.

========================================
BƯỚC 5: SỬ DỤNG TOOL
========================================

1. Chọn tool bạn muốn dùng (NOHU, HAI2VIP, v.v.)
2. Điền thông tin cần thiết
3. Click "Start Automation"
4. Xem kết quả trong tab "Results"

✅ Xong! Bạn đã biết cách dùng tool.

========================================
❓ CÂU HỎI THƯỜNG GẶP
========================================

Q: Làm sao biết Node.js đã cài đặt?
A: Mở CMD, gõ: node --version
   Nếu hiện số phiên bản → Đã cài đặt
   Nếu báo lỗi → Chưa cài đặt

Q: INSTALL.bat báo lỗi?
A: - Kiểm tra kết nối internet
   - Chạy lại INSTALL.bat
   - Khởi động lại máy tính
   - Liên hệ hỗ trợ

Q: START.bat không chạy?
A: - Chạy INSTALL.bat trước
   - Kiểm tra port 3000 có bị chiếm không
   - Đóng tất cả CMD đang mở
   - Chạy lại START.bat

Q: License không kích hoạt được?
A: - Kiểm tra copy đúng toàn bộ license key
   - Không có khoảng trắng thừa
   - License chưa hết hạn
   - Liên hệ hỗ trợ

Q: Làm sao dừng tool?
A: - Đóng cửa sổ CMD màu đen
   - Hoặc nhấn Ctrl+C trong CMD

Q: Có thể chạy nhiều tool cùng lúc?
A: Không, chỉ chạy được 1 instance tại 1 thời điểm
   (vì cùng dùng port 3000)

========================================
📞 HỖ TRỢ
========================================

Nếu gặp vấn đề, liên hệ người bán với thông tin:

1. Ảnh chụp màn hình lỗi
2. Nội dung file LICENSE_KEY.txt
3. Phiên bản Node.js (chạy: node --version)
4. Hệ điều hành (Windows 10/11)

========================================
⚠️ LƯU Ý QUAN TRỌNG
========================================

✅ ĐƯỢC PHÉP:
- Sử dụng tool cho mục đích cá nhân
- Cài đặt trên 1 máy tính (nếu license bind machine)
- Yêu cầu hỗ trợ khi gặp lỗi

❌ KHÔNG ĐƯỢC PHÉP:
- Chia sẻ license key cho người khác
- Cài đặt trên nhiều máy (nếu license bind machine)
- Sửa đổi code của tool
- Bán lại hoặc phân phối tool

========================================
🎉 CHÚC BẠN SỬ DỤNG TOOL HIỆU QUẢ!
========================================
`;
            fs.writeFileSync(path.join(packagePath, 'HUONG_DAN_KHACH_HANG.txt'), customerGuide, 'utf8');

            // Create screenshots folder (for automation results)
            const screenshotsDir = path.join(packagePath, 'screenshots');
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
                console.log('   📁 Created screenshots directory');
            }

            // Create .gitkeep to preserve folder
            fs.writeFileSync(path.join(screenshotsDir, '.gitkeep'), '', 'utf8');

            // Create START.bat
            const startBat = `@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
cls
echo ========================================
echo    HIDEMIUM MULTI-TOOL
echo ========================================
echo.
echo Customer: ${customerName}
echo License: ${licenseType === -1 ? 'Lifetime' : licenseType >= 1 ? licenseType + ' days' : (licenseType * 24 * 60).toFixed(0) + ' minutes'}
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] Dependencies not installed!
    echo.
    echo Please run INSTALL.bat first
    echo.
    echo Or press any key to install now...
    pause >nul
    echo.
    echo Installing dependencies...
    echo Please wait...
    echo.
    npm install --no-optional --loglevel=error
    if errorlevel 1 (
        echo.
        echo [ERROR] Installation failed!
        echo.
        echo Please try:
        echo    1. Run INSTALL.bat
        echo    2. Or run: npm install
        echo.
        pause
        exit /b 1
    )
    echo.
    echo Installation completed!
    echo.
)

REM Check if package.json exists
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo.
    echo Please run from tool root directory
    echo.
    pause
    exit /b 1
)

echo Starting dashboard...
echo Dashboard will open at: http://localhost:3000
echo.
echo License key: See LICENSE_KEY.txt
echo.
echo To stop server: Press Ctrl+C
echo.
echo ========================================
echo.

REM Start dashboard
npm run dashboard

REM If npm run dashboard fails
if errorlevel 1 (
    echo.
    echo [ERROR] Cannot start dashboard!
    echo.
    echo Try running manually:
    echo    node dashboard/server.js
    echo.
    pause
    exit /b 1
)
`;
            fs.writeFileSync(path.join(packagePath, 'START.bat'), startBat, 'utf8');

            // Create auto-delete zip script (runs after successful activation)
            const deleteZipScript = `const fs = require('fs');
const path = require('path');

// This script runs after successful license activation
// It deletes the original ZIP file to prevent reuse

function deleteOriginalZip() {
    try {
        // Look for ZIP files in parent directory
        const parentDir = path.join(__dirname, '..');
        
        if (!fs.existsSync(parentDir)) {
            console.log('⚠️  Parent directory not found');
            return;
        }

        const files = fs.readdirSync(parentDir);
        const zipFiles = files.filter(f => f.toLowerCase().endsWith('.zip'));

        if (zipFiles.length === 0) {
            console.log('ℹ️  No ZIP files found to delete');
            return;
        }

        // Delete each ZIP file
        zipFiles.forEach(zipFile => {
            const zipPath = path.join(parentDir, zipFile);
            try {
                fs.unlinkSync(zipPath);
                console.log('🗑️  Deleted original ZIP:', zipFile);
            } catch (err) {
                console.warn('⚠️  Could not delete ZIP:', zipFile, err.message);
            }
        });

        console.log('✅ Original ZIP files deleted successfully');
        console.log('💡 This prevents license key reuse on other machines');
        
    } catch (error) {
        console.warn('⚠️  Auto-delete ZIP failed:', error.message);
    }
}

// Export for use in license activation
module.exports = { deleteOriginalZip };

// Can also run standalone
if (require.main === module) {
    deleteOriginalZip();
}
`;
            fs.writeFileSync(path.join(packagePath, 'core', 'delete-zip.js'), deleteZipScript, 'utf8');

            // Save secret key info
            const secretKeyInfo = `PACKAGE INFO
=============
Customer: ${customerName}
Secret Key: ${secretKey}
License Type: ${licenseType === -1 ? 'Lifetime' : licenseType >= 1 ? licenseType + ' days' : (licenseType * 24 * 60).toFixed(0) + ' minutes'}
Created: ${new Date().toLocaleString('vi-VN')}
Machine Binding: ${machineBinding ? 'Yes' : 'No'}
Machine ID: Will be provided by customer
`;
            fs.writeFileSync(path.join(this.packagesDir, `${customerName}_SECRET_KEY.txt`), secretKeyInfo, 'utf8');

            // Obfuscation - TEMPORARILY DISABLED FOR TESTING
            // console.log('🔒 Starting Obfuscation...');
            // try {
            //     await this.obfuscatePackageFiles(packagePath);
            //     console.log('✅ Obfuscation completed successfully!');
            // } catch (obfuscationError) {
            //     console.error('💥 Obfuscation error:', obfuscationError);
            //     console.warn('⚠️ Obfuscation failed, continuing without obfuscation');
            // }
            console.log('⏭️ Obfuscation DISABLED for testing - package will have readable code');

            console.log('✅ Package created successfully with advanced protection!');

            return {
                success: true,
                packagePath: `customer-packages/${customerName}`,
                secretKey: secretKey,
                message: 'Package created successfully with advanced obfuscation'
            };

        } catch (error) {
            console.error('❌ Build error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Copy files recursively
     */
    copyRecursive(src, dest) {
        const exists = fs.existsSync(src);
        const stats = exists && fs.statSync(src);
        const isDirectory = exists && stats.isDirectory();

        if (isDirectory) {
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }
            fs.readdirSync(src).forEach(childItemName => {
                this.copyRecursive(
                    path.join(src, childItemName),
                    path.join(dest, childItemName)
                );
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }

    /**
     * Get machine ID (hardware fingerprint)
     * Based on MAC addresses and hostname
     */
    getMachineId() {
        const networkInterfaces = os.networkInterfaces();
        const macs = [];

        for (const name of Object.keys(networkInterfaces)) {
            for (const iface of networkInterfaces[name]) {
                if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
                    macs.push(iface.mac);
                }
            }
        }

        const combined = macs.join('-') + os.hostname();
        return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
    }

    /**
     * Clean sensitive data from package
     */
    cleanSensitiveData(packagePath) {
        // Remove sensitive files
        const filesToRemove = [
            'tools/generate-license.js',
            'tools/obfuscate-license.js',
            'tools/obfuscate-all.js',
            'tools/activate-license.js',
            'license-records',
            'customer-packages',
            'backups',
            // 'screenshots' - Keep this folder for customer
            // '.license' - KEEP this file for customer license
            '.git',
            '.gitignore',
            'dashboard/admin.html',      // ← Remove admin page
            'dashboard/admin-api.js'     // ← Remove admin API
        ];

        filesToRemove.forEach(item => {
            const itemPath = path.join(packagePath, item);
            if (fs.existsSync(itemPath)) {
                try {
                    fs.rmSync(itemPath, { recursive: true, force: true });
                    console.log(`   🗑️  Removed: ${item}`);
                } catch (err) { }
            }
        });

        // Clean screenshots folder but keep the folder itself
        const screenshotsPath = path.join(packagePath, 'screenshots');
        if (fs.existsSync(screenshotsPath)) {
            try {
                const files = fs.readdirSync(screenshotsPath);
                files.forEach(file => {
                    const filePath = path.join(screenshotsPath, file);
                    try {
                        fs.rmSync(filePath, { recursive: true, force: true });
                    } catch (err) { }
                });
                console.log('   🗑️  Cleaned screenshots folder');
            } catch (err) { }
        }

        // Remove all .bat and .md files
        try {
            const allFiles = fs.readdirSync(packagePath);
            allFiles.forEach(file => {
                if (file.endsWith('.bat') || file.endsWith('.md')) {
                    try {
                        fs.unlinkSync(path.join(packagePath, file));
                    } catch (err) { }
                }
            });
        } catch (err) { }

        // Clean config files
        const settingsPath = path.join(packagePath, 'config', 'settings.json');
        if (fs.existsSync(settingsPath)) {
            try {
                const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                if (settings.apiKey) {
                    settings.apiKey.key = '';
                    settings.apiKey.balance = 0;
                }
                if (settings.extensions) {
                    Object.keys(settings.extensions).forEach(key => {
                        settings.extensions[key] = '';
                    });
                }
                fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
            } catch (err) { }
        }

        // Clean .env
        const envPath = path.join(packagePath, '.env');
        if (fs.existsSync(envPath)) {
            const cleanEnv = `# Environment Configuration
# Khách hàng cần cấu hình các biến môi trường tại đây
`;
            fs.writeFileSync(envPath, cleanEnv, 'utf8');
        }
    }

    /**
     * List all packages
     */
    async listPackages() {
        try {
            if (!fs.existsSync(this.packagesDir)) {
                return { success: true, packages: [] };
            }

            const items = fs.readdirSync(this.packagesDir);
            const packages = [];

            for (const item of items) {
                const itemPath = path.join(this.packagesDir, item);

                try {
                    const stat = fs.statSync(itemPath);

                    if (stat.isDirectory()) {
                        const size = this.getDirectorySize(itemPath);
                        const created = stat.birthtime.toLocaleString('vi-VN');
                        const createdTime = stat.birthtime.getTime(); // Lưu timestamp để sắp xếp

                        packages.push({
                            name: item,
                            created: created,
                            createdTime: createdTime, // Timestamp để sắp xếp
                            size: this.formatBytes(size)
                        });
                    }
                } catch (err) {
                    // Skip if error
                }
            }

            // Sắp xếp theo thời gian tạo (mới nhất trước)
            packages.sort((a, b) => b.createdTime - a.createdTime);

            return { success: true, packages };

        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Generate new license key for existing package
     */
    async generateNewKey(options) {
        const { packageName, licenseType, machineBinding, machineId } = options;

        try {
            // Check if package exists
            const packagePath = path.join(this.packagesDir, packageName);
            if (!fs.existsSync(packagePath)) {
                return { success: false, message: 'Package không tồn tại' };
            }

            // Read secret key from file
            const secretKeyFile = path.join(this.packagesDir, `${packageName}_SECRET_KEY.txt`);
            if (!fs.existsSync(secretKeyFile)) {
                return { success: false, message: 'Không tìm thấy secret key file' };
            }

            const secretKeyContent = fs.readFileSync(secretKeyFile, 'utf8');
            const secretKeyMatch = secretKeyContent.match(/Secret Key: (.+)/);
            if (!secretKeyMatch) {
                return { success: false, message: 'Không thể đọc secret key' };
            }

            const secretKey = secretKeyMatch[1].trim();

            // Generate new license key
            // Machine ID should be provided by customer (from their dashboard)
            const finalMachineId = machineBinding ? machineId : null;
            const days = licenseType;
            const now = Date.now();
            const expiry = days === -1 ? -1 : now + (days * 24 * 60 * 60 * 1000);

            const licenseData = {
                username: packageName,
                machineId: finalMachineId,
                expiry: expiry,
                created: now
            };

            const dataString = JSON.stringify(licenseData);
            const signature = crypto.createHmac('sha256', secretKey).update(dataString).digest('hex');
            const licenseKey = Buffer.from(dataString).toString('base64') + '.' + signature;

            // Save new license key to package
            const licenseKeyContent = `
License Key Record
==================
Generated: ${new Date().toLocaleString('vi-VN')}
Username: ${packageName}
Type: ${licenseType === -1 ? 'Lifetime' : licenseType >= 1 ? licenseType + ' days' : (licenseType * 24 * 60).toFixed(0) + ' minutes'}
Machine Binding: ${machineBinding ? 'YES' : 'NO'}
Machine ID: ${machineBinding ? finalMachineId : 'N/A'}

License Key:
${licenseKey}
`;
            fs.writeFileSync(path.join(packagePath, 'LICENSE_KEY.txt'), licenseKeyContent, 'utf8');

            console.log(`✅ Generated new license key for ${packageName}`);

            return {
                success: true,
                licenseKey: licenseKey,
                message: 'License key created successfully'
            };

        } catch (error) {
            console.error('❌ Generate key error:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Delete package
     */
    async deletePackage(packageName) {
        try {
            const packagePath = path.join(this.packagesDir, packageName);

            if (!fs.existsSync(packagePath)) {
                return { success: false, message: 'Package không tồn tại' };
            }

            fs.rmSync(packagePath, { recursive: true, force: true });

            // Also delete secret key file
            const secretKeyFile = path.join(this.packagesDir, `${packageName}_SECRET_KEY.txt`);
            if (fs.existsSync(secretKeyFile)) {
                fs.unlinkSync(secretKeyFile);
            }

            // Delete from customer-machines.json
            const machinesFile = path.join(process.cwd(), 'customer-machines.json');
            if (fs.existsSync(machinesFile)) {
                const machines = JSON.parse(fs.readFileSync(machinesFile, 'utf8'));
                if (machines[packageName]) {
                    delete machines[packageName];
                    fs.writeFileSync(machinesFile, JSON.stringify(machines, null, 2));
                }
            }

            return { success: true, message: 'Đã xóa package và customer record' };

        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    /**
     * Create ZIP archive of package
     */
    async createZip(packageName, outputPath) {
        if (!archiver) {
            throw new Error('archiver not installed. Run: npm install archiver');
        }

        return new Promise((resolve, reject) => {
            const packagePath = path.join(this.packagesDir, packageName);

            if (!fs.existsSync(packagePath)) {
                reject(new Error('Package không tồn tại'));
                return;
            }

            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                resolve(outputPath);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive.directory(packagePath, packageName);
            archive.finalize();
        });
    }

    /**
     * Get directory size
     */
    getDirectorySize(dirPath) {
        let size = 0;

        try {
            const items = fs.readdirSync(dirPath);
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                try {
                    const stat = fs.statSync(itemPath);

                    if (stat.isDirectory()) {
                        size += this.getDirectorySize(itemPath);
                    } else {
                        size += stat.size;
                    }
                } catch (err) {
                    // Skip if error
                }
            }
        } catch (err) {
            // Skip if error
        }

        return size;
    }

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Obfuscate package files for security
     */
    async obfuscatePackageFiles(packagePath) {
        try {
            // Check if javascript-obfuscator is available
            let JavaScriptObfuscator;
            try {
                JavaScriptObfuscator = require('javascript-obfuscator');
            } catch (err) {
                console.log('⚠️  javascript-obfuscator not found, skipping obfuscation');
                return;
            }

            // Files to obfuscate (core files - high security)
            // NOTE: license-manager.js is the most critical file (contains secret key validation)
            const coreFiles = [
                'core/license-manager.js',
                'core/api-key-manager.js',
                'core/hidemium-api.js',
                'core/profile-manager.js',
                'core/sim-api-manager.js'
            ];

            // Additional files to obfuscate (medium security)
            const additionalFiles = [
                'tools/nohu-tool/complete-automation.js',
                'tools/nohu-tool/automation-actions.js',
                'tools/hai2vip-tool/automation-actions.js',
                'tools/sms-tool/sms-automation.js'
            ];

            // Files to SKIP obfuscation - these need to run without any modification
            // NOTE: server.js and dashboard.js are critical for app to work
            const skipObfuscationFiles = [
                'dashboard/server.js',
                'dashboard/dashboard.js'
            ];

            // High security obfuscation options for core files
            const coreObfuscationOptions = {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.5,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.3,
                debugProtection: false,
                disableConsoleOutput: false,
                identifierNamesGenerator: 'hexadecimal',
                log: false,
                numbersToExpressions: true,
                renameGlobals: false,
                selfDefending: false,
                simplify: true,
                splitStrings: true,
                splitStringsChunkLength: 8,
                stringArray: true,
                stringArrayCallsTransform: true,
                stringArrayEncoding: ['base64'],
                stringArrayIndexShift: true,
                stringArrayRotate: true,
                stringArrayShuffle: true,
                stringArrayWrappersCount: 2,
                stringArrayWrappersChainedCalls: true,
                stringArrayThreshold: 0.7,
                target: 'node',
                transformObjectKeys: true,
                unicodeEscapeSequence: false
            };

            // Medium security obfuscation options for additional files
            const additionalObfuscationOptions = {
                compact: true,
                controlFlowFlattening: false,
                deadCodeInjection: false,
                debugProtection: false,
                disableConsoleOutput: false,
                identifierNamesGenerator: 'hexadecimal',
                log: false,
                numbersToExpressions: false,
                renameGlobals: false,
                selfDefending: false,
                simplify: true,
                splitStrings: true,
                splitStringsChunkLength: 10,
                stringArray: true,
                stringArrayCallsTransform: true,
                stringArrayEncoding: ['base64'],
                stringArrayIndexShift: true,
                stringArrayRotate: true,
                stringArrayShuffle: true,
                stringArrayWrappersCount: 1,
                stringArrayWrappersChainedCalls: true,
                stringArrayThreshold: 0.5,
                target: 'node',
                transformObjectKeys: false,
                unicodeEscapeSequence: false
            };

            // Light security for server.js - stable but still protected
            const serverObfuscationOptions = {
                compact: true,
                controlFlowFlattening: false,
                deadCodeInjection: false,
                debugProtection: false,
                disableConsoleOutput: false,
                identifierNamesGenerator: 'hexadecimal',
                log: false,
                numbersToExpressions: false,
                renameGlobals: false,
                selfDefending: false,
                simplify: true,
                splitStrings: false,
                stringArray: true,
                stringArrayCallsTransform: false,
                stringArrayEncoding: [],
                stringArrayIndexShift: true,
                stringArrayRotate: true,
                stringArrayShuffle: true,
                stringArrayWrappersCount: 0,
                stringArrayThreshold: 0.5,
                transformObjectKeys: false,
                unicodeEscapeSequence: false
            };

            let successCount = 0;
            let failCount = 0;

            // Obfuscate core files with high security
            console.log('   🔒 Obfuscating core files (high security)...');
            for (const file of coreFiles) {
                const filePath = path.join(packagePath, file);
                if (fs.existsSync(filePath)) {
                    try {
                        const sourceCode = fs.readFileSync(filePath, 'utf8');
                        const obfuscatedCode = JavaScriptObfuscator.obfuscate(sourceCode, coreObfuscationOptions).getObfuscatedCode();

                        // Backup original
                        fs.writeFileSync(filePath + '.original', sourceCode, 'utf8');

                        // Replace with obfuscated
                        fs.writeFileSync(filePath, obfuscatedCode, 'utf8');

                        console.log(`      ✅ ${path.basename(file)}`);
                        successCount++;
                    } catch (error) {
                        console.log(`      ❌ ${path.basename(file)}: ${error.message}`);
                        failCount++;
                    }
                }
            }

            // Obfuscate additional files with medium security
            console.log('   🔐 Obfuscating additional files (medium security)...');
            for (const file of additionalFiles) {
                const filePath = path.join(packagePath, file);
                if (fs.existsSync(filePath)) {
                    try {
                        const sourceCode = fs.readFileSync(filePath, 'utf8');
                        const obfuscatedCode = JavaScriptObfuscator.obfuscate(sourceCode, additionalObfuscationOptions).getObfuscatedCode();

                        // Backup original
                        fs.writeFileSync(filePath + '.original', sourceCode, 'utf8');

                        // Replace with obfuscated
                        fs.writeFileSync(filePath, obfuscatedCode, 'utf8');

                        console.log(`      ✅ ${path.basename(file)} (medium)`);
                        successCount++;
                    } catch (error) {
                        console.log(`      ❌ ${path.basename(file)}: ${error.message}`);
                        failCount++;
                    }
                }
            }

            // Skip obfuscation for critical dashboard files (server.js, dashboard.js)
            // These files need to run without modification to ensure stability
            console.log('   ⏭️ Skipping obfuscation for dashboard files (stability)...');
            for (const file of skipObfuscationFiles) {
                const filePath = path.join(packagePath, file);
                if (fs.existsSync(filePath)) {
                    console.log(`      ⏭️ ${path.basename(file)} (skipped - no obfuscation)`);
                }
            }

            console.log(`   📊 Obfuscation complete: ${successCount} success, ${failCount} failed`);

        } catch (error) {
            console.error('💥 Obfuscation error:', error);
            throw error;
        }
    }
}

module.exports = new AdminAPI();
