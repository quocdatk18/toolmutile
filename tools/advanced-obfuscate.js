/**
 * Advanced Obfuscation System
 * Obfuscate toàn bộ code JavaScript với whitelist cho files cần thiết
 */

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

class AdvancedObfuscator {
    constructor() {
        this.projectRoot = path.join(__dirname, '..');
        this.successCount = 0;
        this.failCount = 0;
        this.skippedCount = 0;

        // Files/folders to EXCLUDE from customer packages (will be deleted)
        this.excludeFromCustomer = [
            // Development and build files
            'node_modules/**',
            '.git/**',
            'customer-packages/**',
            'temp/**',
            'screenshots/**',
            'license-records/**',
            'backups/**',
            'obfuscated-project/**',

            // Sensitive files
            '.license',
            '.env',
            'exclude-list.txt',
            'customer-machines.json',

            // All batch files (build scripts)
            '*.bat',

            // All markdown documentation
            '*.md',

            // Test files
            '**/test-*.js',
            '**/debug-*.js',
            '**/*test*.js',
            '**/*debug*.js',
            'tools/*/test*.js',
            'tools/*/debug*.js',

            // License and obfuscation tools
            'tools/generate-license*.js',
            'tools/obfuscate-*.js',
            'tools/advanced-obfuscate.js',
            'tools/activate-license.js',
            'quick-test-license.js',
            'test-license*.js',

            // Build and utility scripts
            'build-test-*.js',
            'create-test-*.js',
            'fix-*.js',
            'migrate-*.js',
            'clean-sensitive-data.js',

            // Unused HTML/CSS files
            'dash

        // High security obfuscation for critical files
        this.highSecurityOptions = {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 1.0,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.6,
                debugProtection: true,
                debugProtectionInterval: 2000,
                disableConsoleOutput: true,
                domainLock: [],
                identifierNamesGenerator: 'mangled-shuffled',
                identifiersPrefix: '',
                inputFileName: '',
                log: false,
                numbersToExpressions: true,
                optionsPreset: 'high-obfuscation',
                renameGlobals: true,
                renameProperties: false,
                reservedNames: [],
                reservedStrings: [],
                seed: 0,
                selfDefending: true,
                simplify: true,
                sourceMap: false,
                sourceMapBaseUrl: '',
                sourceMapFileName: '',
                sourceMapMode: 'separate',
                splitStrings: true,
                splitStringsChunkLength: 5,
                stringArray: true,
                stringArrayCallsTransform: true,
                stringArrayCallsTransformThreshold: 0.8,
                stringArrayEncoding: ['base64', 'rc4'],
                stringArrayIndexesType: ['hexadecimal-number'],
                stringArrayIndexShift: true,
                stringArrayRotate: true,
                stringArrayShuffle: true,
                stringArrayWrappersCount: 5,
                stringArrayWrappersChainedCalls: true,
                stringArrayWrappersParametersMaxCount: 5,
                stringArrayWrappersType: 'function',
                stringArrayThreshold: 1.0,
                target: 'node',
                transformObjectKeys: true,
                unicodeEscapeSequence: false
            };

            // Medium security for regular files
            this.mediumSecurityOptions = {
                compact: true,
                controlFlowFlattening: true,
                controlFlowFlatteningThreshold: 0.5,
                deadCodeInjection: true,
                deadCodeInjectionThreshold: 0.3,
                debugProtection: false,
                disableConsoleOutput: false,
                identifierNamesGenerator: 'hexadecimal',
                numbersToExpressions: true,
                renameGlobals: false,
                selfDefending: true,
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
                transformObjectKeys: true
            };

            // Critical files that need maximum protection
            this.criticalFiles = [
                'core/license-manager.js',
                'core/api-key-manager.js',
                'core/hidemium-api.js',
                'core/profile-manager.js',
                'core/sim-api-manager.js',
                'dashboard/server.js',
                'tools/*/auto-sequence.js',
                'tools/*/complete-automation.js',
                'tools/*/automation*.js',
                'tools/*/freelxb*.js'
            ];
    }

    /**
     * Check if file should be skipped (whitelist)
     */
    shouldSkipFile(filePath) {
        const relativePath = path.relative(this.projectRoot, filePath);

        return this.whitelist.some(pattern => {
            if (pattern.includes('*')) {
                // Use glob pattern matching
                return require('minimatch')(relativePath, pattern);
            } else {
                // Exact match or starts with
                return relativePath === pattern || relativePath.startsWith(pattern);
            }
        });
    }

    /**
     * Check if file is critical (needs high security)
     */
    isCriticalFile(filePath) {
        const relativePath = path.relative(this.projectRoot, filePath);

        return this.criticalFiles.some(pattern => {
            if (pattern.includes('*')) {
                return require('minimatch')(relativePath, pattern);
            } else {
                return relativePath === pattern;
            }
        });
    }

    /**
     * Find all JavaScript files
     */
    findJavaScriptFiles() {
        const jsFiles = glob.sync('**/*.js', {
            cwd: this.projectRoot,
            absolute: true,
            ignore: [
                'node_modules/**',
                '**/*.obfuscated.js',
                '**/*.min.js'
            ]
        });

        return jsFiles;
    }

    /**
     * Obfuscate single file
     */
    obfuscateFile(inputFile, outputFile, options, securityLevel) {
        try {

            // Read source code
            const sourceCode = fs.readFileSync(inputFile, 'utf8');

            // Skip empty files
            if (sourceCode.trim().length === 0) {
                this.skippedCount++;
                return;
            }

            // Obfuscate
            const obfuscatedCode = JavaScriptObfuscator.obfuscate(sourceCode, options).getObfuscatedCode();

            // Ensure output directory exists
            const outputDir = path.dirname(outputFile);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Save obfuscated code
            fs.writeFileSync(outputFile, obfuscatedCode, 'utf8');

            const originalSize = fs.statSync(inputFile).size;
            const obfuscatedSize = fs.statSync(outputFile).size;
            const compressionRatio = ((obfuscatedSize / originalSize) * 100).toFixed(1);

            this.successCount++;
        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            this.failCount++;
        }
    }

    /**
     * Create obfuscated version of entire project
     */
    async obfuscateProject() {
        this.whitelist.forEach(pattern => {
        });

        const jsFiles = this.findJavaScriptFiles();
        const obfuscatedDir = path.join(this.projectRoot, 'obfuscated-project');

        // Clean obfuscated directory
        if (fs.existsSync(obfuscatedDir)) {
            fs.rmSync(obfuscatedDir, { recursive: true, force: true });
        }
        fs.mkdirSync(obfuscatedDir, { recursive: true });

        for (const inputFile of jsFiles) {
            const relativePath = path.relative(this.projectRoot, inputFile);
            const outputFile = path.join(obfuscatedDir, relativePath);

            // Check if file should be skipped
            if (this.shouldSkipFile(inputFile)) {

                // Copy original file to maintain structure
                const outputDir = path.dirname(outputFile);
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir, { recursive: true });
                }
                fs.copyFileSync(inputFile, outputFile);

                this.skippedCount++;
                continue;
            }

            // Determine security level and options
            let options, securityLevel;
            if (this.isCriticalFile(inputFile)) {
                options = this.highSecurityOptions;
                securityLevel = 'HIGH';
            } else {
                options = this.mediumSecurityOptions;
                securityLevel = 'MEDIUM';
            }

            this.obfuscateFile(inputFile, outputFile, options, securityLevel);
        }

        // Copy non-JS files
        await this.copyNonJSFiles(obfuscatedDir);

        this.printSummary(obfuscatedDir);
    }

    /**
     * Copy non-JavaScript files to maintain project structure
     */
    async copyNonJSFiles(obfuscatedDir) {

        const allFiles = glob.sync('**/*', {
            cwd: this.projectRoot,
            absolute: true,
            nodir: true,
            ignore: [
                'node_modules/**',
                '.git/**',
                'obfuscated-project/**',
                '**/*.js'
            ]
        });

        let copiedCount = 0;
        for (const inputFile of allFiles) {
            const relativePath = path.relative(this.projectRoot, inputFile);
            const outputFile = path.join(obfuscatedDir, relativePath);

            // Ensure output directory exists
            const outputDir = path.dirname(outputFile);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Copy file
            fs.copyFileSync(inputFile, outputFile);
            copiedCount++;
        }

    }

    /**
     * Print summary
     */
    printSummary(obfuscatedDir) {
        console.log(`✅ Obfuscated: ${this.successCount} files`);
        console.log(`❌ Failed: ${this.failCount} files`);

        if (this.successCount > 0) {
            console.log('🎉 Project successfully obfuscated!');

        }
    }

    /**
     * Obfuscate specific files only
     */
    async obfuscateSpecificFiles(filePatterns) {

        for (const pattern of filePatterns) {
            const files = glob.sync(pattern, {
                cwd: this.projectRoot,
                absolute: true
            });

            for (const inputFile of files) {
                if (!fs.existsSync(inputFile)) {
                    continue;
                }

                const outputFile = inputFile.replace('.js', '.obfuscated.js');
                const options = this.isCriticalFile(inputFile) ?
                    this.highSecurityOptions : this.mediumSecurityOptions;
                const securityLevel = this.isCriticalFile(inputFile) ? 'HIGH' : 'MEDIUM';

                this.obfuscateFile(inputFile, outputFile, options, securityLevel);
            }
        }

        this.printSummary('current directory (*.obfuscated.js files)');
    }
}

// CLI Usage
if (require.main === module) {
    const obfuscator = new AdvancedObfuscator();

    const args = process.argv.slice(2);

    if (args.length === 0) {
        // Obfuscate entire project
        obfuscator.obfuscateProject();
    } else if (args[0] === '--files') {
        // Obfuscate specific files
        const filePatterns = args.slice(1);
        obfuscator.obfuscateSpecificFiles(filePatterns);
    } else {
    }
}

module.exports = AdvancedObfuscator;