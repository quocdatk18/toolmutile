/**
 * Obfuscate All Critical Files
 * Mã hóa tất cả các file quan trọng để bảo vệ code
 */

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Files to obfuscate
const filesToObfuscate = [
    'core/license-manager.js',
    'core/api-key-manager.js',
    'core/hidemium-api.js',
    'core/profile-manager.js',
    'core/sim-api-manager.js',
    'dashboard/server.js'
];

// Obfuscation options
const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false,
    debugProtectionInterval: 0,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
};

console.log('🔒 Obfuscating critical files...\n');

const projectRoot = path.join(__dirname, '..');
let successCount = 0;
let failCount = 0;

filesToObfuscate.forEach(file => {
    try {
        const inputFile = path.join(projectRoot, file);
        const outputFile = path.join(projectRoot, file.replace('.js', '.obfuscated.js'));

        console.log(`📝 Processing: ${file}`);

        // Read source code
        const sourceCode = fs.readFileSync(inputFile, 'utf8');

        // Obfuscate
        const obfuscatedCode = JavaScriptObfuscator.obfuscate(sourceCode, obfuscationOptions).getObfuscatedCode();

        // Save obfuscated code
        fs.writeFileSync(outputFile, obfuscatedCode, 'utf8');

        const originalSize = fs.statSync(inputFile).size;
        const obfuscatedSize = fs.statSync(outputFile).size;

        console.log(`   ✅ Created: ${file.replace('.js', '.obfuscated.js')}`);
        console.log(`   📊 Size: ${originalSize} → ${obfuscatedSize} bytes\n`);

        successCount++;
    } catch (error) {
        console.log(`   ❌ Failed: ${error.message}\n`);
        failCount++;
    }
});

console.log('========================================');
console.log(`✅ Success: ${successCount} files`);
console.log(`❌ Failed: ${failCount} files`);
console.log('========================================\n');

if (successCount > 0) {
    console.log('📝 Obfuscated files created with .obfuscated.js extension');
    console.log('🔧 Use BUILD_CUSTOMER_PACKAGE_OBFUSCATED.bat to build package\n');
}
