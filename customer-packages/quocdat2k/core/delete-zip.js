const fs = require('fs');
const path = require('path');

// This script runs after successful license activation
// It deletes the original ZIP file to prevent reuse

function deleteOriginalZip() {
    try {
        // Look for ZIP files in parent directory
        const parentDir = path.join(__dirname, '..');
        
        if (!fs.existsSync(parentDir)) {
            return;
        }

        const files = fs.readdirSync(parentDir);
        const zipFiles = files.filter(f => f.toLowerCase().endsWith('.zip'));

        if (zipFiles.length === 0) {
            
            return;
        }

        // Delete each ZIP file
        zipFiles.forEach(zipFile => {
            const zipPath = path.join(parentDir, zipFile);
            try {
                fs.unlinkSync(zipPath);
                
            } catch (err) {
                console.warn('⚠️  Could not delete ZIP:', zipFile, err.message);
            }
        });

        console.log('✅ Original ZIP files deleted successfully');
        
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
