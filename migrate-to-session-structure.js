/**
 * Script to migrate old screenshot structure to new session-based structure
 * Old: screenshots/username/file-timestamp.png
 * New: screenshots/username/sessionId/file.png
 * 
 * Run: node migrate-to-session-structure.js
 */

const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'screenshots');

console.log('🔄 Migrating screenshot structure...\n');

// Check if screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
    console.log('❌ No screenshots directory found. Nothing to migrate.');
    process.exit(0);
}

// Read all username folders
const userFolders = fs.readdirSync(screenshotsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

if (userFolders.length === 0) {
    console.log('❌ No user folders found. Nothing to migrate.');
    process.exit(0);
}

let migratedCount = 0;
let skippedCount = 0;

userFolders.forEach(username => {
    console.log(`\n👤 Processing user: ${username}`);

    const userDir = path.join(screenshotsDir, username);
    const items = fs.readdirSync(userDir, { withFileTypes: true });

    // Get PNG files (old structure)
    const pngFiles = items.filter(item => item.isFile() && item.name.endsWith('.png'));

    if (pngFiles.length === 0) {
        console.log('   ✅ Already using new structure (no direct PNG files)');
        skippedCount++;
        return;
    }

    console.log(`   📁 Found ${pngFiles.length} PNG files to migrate`);

    // Group files by timestamp (extract from filename)
    const filesBySession = {};

    pngFiles.forEach(fileItem => {
        const filename = fileItem.name;

        // Try to extract timestamp from filename
        // Format: sitename-YYYY-MM-DDTHH-MM-SS-sssZ.png
        const timestampMatch = filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);

        if (timestampMatch) {
            const timestamp = timestampMatch[1];
            const sessionId = timestamp; // Use timestamp as session ID

            if (!filesBySession[sessionId]) {
                filesBySession[sessionId] = [];
            }

            filesBySession[sessionId].push(filename);
        } else {
            // No timestamp in filename, create default session
            const sessionId = 'migrated-' + new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);

            if (!filesBySession[sessionId]) {
                filesBySession[sessionId] = [];
            }

            filesBySession[sessionId].push(filename);
        }
    });

    // Create session folders and move files
    Object.keys(filesBySession).forEach(sessionId => {
        const sessionDir = path.join(userDir, sessionId);

        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
            console.log(`   📅 Created session: ${sessionId}`);
        }

        filesBySession[sessionId].forEach(filename => {
            const oldPath = path.join(userDir, filename);

            // Extract site name from filename
            const siteName = filename.split('-')[0];
            const newFilename = `${siteName}.png`;
            const newPath = path.join(sessionDir, newFilename);

            // Move file
            try {
                fs.renameSync(oldPath, newPath);
                console.log(`      ✅ Moved: ${filename} → ${sessionId}/${newFilename}`);
                migratedCount++;
            } catch (error) {
                console.error(`      ❌ Failed to move ${filename}:`, error.message);
            }
        });
    });
});

console.log('\n✅ Migration completed!');
console.log(`   Migrated: ${migratedCount} files`);
console.log(`   Skipped: ${skippedCount} users (already using new structure)`);

console.log('\n🌐 Next steps:');
console.log('   1. Restart dashboard if running');
console.log('   2. Refresh browser');
console.log('   3. Check results table - should show separate rows per session');
