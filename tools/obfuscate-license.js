/**
 * Obfuscate License Manager
 * Mã hóa file license-manager.js để khó đọc
 * 
 * Cài đặt: npm install javascript-obfuscator
 * Chạy: node tools/obfuscate-license.js
 */

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Get paths relative to project root
const projectRoot = path.join(__dirname, '..');
const inputFile = path.join(projectRoot, 'core', 'license-manager.js');
const outputFile = path.join(projectRoot, 'core', 'license-manager.obfuscated.js');

// Read source code
const sourceCode = fs.readFileSync(inputFile, 'utf8');

// Obfuscate
const obfuscatedCode = JavaScriptObfuscator.obfuscate(sourceCode, {
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
}).getObfuscatedCode();

// Save obfuscated code
fs.writeFileSync(outputFile, obfuscatedCode, 'utf8');

