// Mapping từ VietQR API bank name sang dropdown option text
const BANK_NAME_MAPPING = {
    // VietQR API name -> Dropdown option text
    'Vietcombank': 'VIETCOMBANK',
    'Techcombank': 'TECHCOMBANK',
    'BIDV': 'BIDV BANK',
    'VietinBank': 'VIETINBANK',
    'Agribank': 'AGRIBANK',
    'ACB': 'ACB BANK',
    'MB': 'MBBANK',
    'TPBank': 'TPBANK',
    'VPBank': 'VPBANK',
    'Sacombank': 'SACOMBANK',
    'HDBank': 'HD BANK',
    'VIB': 'VIB BANK',
    'SHB': 'SHB BANK',
    'Eximbank': 'EXIMBANK',
    'MSB': 'MSB BANK',
    'OCB': 'OCB BANK',
    'SeABank': 'SEABANK',
    'Nam A Bank': 'NAMA BANK',
    'PVcomBank': 'PVCOMBANK',
    'BacA Bank': 'BAC A BANK',
    'VietCapital Bank': 'VIET CAPITAL BANK (BVBANK)',
    'VietCapitalBank': 'VIET CAPITAL BANK (BVBANK)', // Variant without space
    'LienVietPostBank': 'LIENVIET BANK',
    'KienLongBank': 'KIENLONGBANK',
    'GPBank': 'GP BANK',
    'PGBank': 'PGBANK',
    'NCB': 'NCB',
    'SCB': 'SCB',
    'VietABank': 'VIETA BANK',
    'VietBank': 'VIETBANK',
    'ABBANK': 'ABBANK',
    'CBBANK': 'CB BANK',
    'COOPBANK': 'CO OPBANK',
    'OceanBank': 'OCB BANK', // OceanBank đã sáp nhập vào OCB
    'SGB': 'SAIGONBANK',
    'Shinhan': 'SHINHAN BANK VN',
    'HSBC': 'HSBC',
    'StandardChartered': 'SCB', // Standard Chartered
    'Citibank': 'CITI',
    'ANZ': 'ANZ BANK',
    'UOB': 'UOB',
    'HongLeong': 'HONGLEONG BANK',
    'PublicBank': 'PUBLICBANK',
    'CIMB': 'CIMB BANK',
    'KBank': 'KBANK',
    'Woori': 'WOORI BANK',
    'DBS': 'DBS',
    'BAO VIET BANK': 'BAO VIET BANK'
};

// Danh sách ngân hàng Việt Nam (legacy - giữ lại để tương thích)
const VIETNAM_BANKS = Object.keys(BANK_NAME_MAPPING);

/**
 * Map bank name từ VietQR API sang tên trong dropdown của trang web
 * @param {string} vietQRBankName - Tên bank từ VietQR API
 * @returns {string} - Tên bank trong dropdown, hoặc tên gốc nếu không tìm thấy mapping
 */
function mapBankName(vietQRBankName) {
    if (!vietQRBankName) return '';

    // Thử mapping trực tiếp
    if (BANK_NAME_MAPPING[vietQRBankName]) {
        return BANK_NAME_MAPPING[vietQRBankName];
    }

    // Thử tìm kiếm không phân biệt hoa thường
    const lowerInput = vietQRBankName.toLowerCase();
    for (const [key, value] of Object.entries(BANK_NAME_MAPPING)) {
        if (key.toLowerCase() === lowerInput) {
            return value;
        }
    }

    // Thử tìm kiếm partial match
    for (const [key, value] of Object.entries(BANK_NAME_MAPPING)) {
        if (key.toLowerCase().includes(lowerInput) || lowerInput.includes(key.toLowerCase())) {
            return value;
        }
    }

    console.warn(`⚠️ No mapping found for bank: ${vietQRBankName}`);
    return vietQRBankName; // Trả về tên gốc nếu không tìm thấy
}

/**
 * Tìm bank option trong dropdown dựa trên tên đã được map
 * @param {string} mappedBankName - Tên bank đã được map
 * @returns {Element|null} - Element của option, hoặc null nếu không tìm thấy
 */
function findBankOption(mappedBankName) {
    if (!mappedBankName) return null;

    // Tìm tất cả mat-option
    const options = document.querySelectorAll('mat-option .mat-option-text span');

    for (const option of options) {
        const optionText = option.textContent?.trim();
        if (optionText === mappedBankName) {
            return option.closest('mat-option');
        }
    }

    // Thử tìm kiếm không phân biệt hoa thường
    const lowerMapped = mappedBankName.toLowerCase();
    for (const option of options) {
        const optionText = option.textContent?.trim().toLowerCase();
        if (optionText === lowerMapped) {
            return option.closest('mat-option');
        }
    }

    console.warn(`⚠️ Bank option not found in dropdown: ${mappedBankName}`);
    return null;
}

// Export functions để sử dụng trong content script
if (typeof window !== 'undefined') {
    window.mapBankName = mapBankName;
    window.findBankOption = findBankOption;
    window.BANK_NAME_MAPPING = BANK_NAME_MAPPING;
}