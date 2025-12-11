#!/usr/bin/env python3
"""
Fix V2 Design - Move form content to modal
"""

import re

# Read file
with open('dashboard/tools-ui/nohu-tool.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Backup
with open('dashboard/tools-ui/nohu-tool.html.backup-python', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Backup created")

# Extract form content (from line after results-full-width to before "<!-- Results Full Width -->")
# Pattern: Find content between first results-full-width and second "<!-- Results Full Width -->"
pattern = r'(<div class="results-full-width">)\s*<h3>🎯 Chọn Trang</h3>([\s\S]*?)<!-- End Left Column -->\s*<!-- Results Full Width -->'

match = re.search(pattern, content)
if not match:
    print("❌ Could not find form content")
    exit(1)

form_content = match.group(2).strip()
print(f"✅ Extracted {len(form_content)} characters of form content")

# Remove the misplaced form content
content = re.sub(pattern, r'\1\n\n    <!-- Results Full Width -->', content)
print("✅ Removed misplaced form content")

# Insert form content into modal-body-form
modal_body_pattern = r'(<div class="modal-body-form" id="modalBodyForm">)\s*<!-- Content will be moved here -->\s*(</div>)'

replacement = r'\1\n' + form_content + r'\n        \2'
content = re.sub(modal_body_pattern, replacement, content)
print("✅ Inserted form content into modal")

# Write back
with open('dashboard/tools-ui/nohu-tool.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ File updated successfully!")
print("\n🎉 V2 Design migration complete!")
print("   - Form content moved to modal")
print("   - Results section now clean")
print("   - Ready to test!")
