/**
 * Customer Machine Manager - Quản lý Machine ID của từng khách hàng
 * Lưu trữ Machine ID lần đầu và cho phép tạo license key dễ dàng
 */

const fs = require('fs');
const path = require('path');

class CustomerMachineManager {
    constructor() {
        this.dataFile = path.join(__dirname, '..', 'customer-machines.json');
        this.customers = this.loadCustomers();
    }

    /**
     * Load danh sách customers từ file
     */
    loadCustomers() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = fs.readFileSync(this.dataFile, 'utf8');
                const customers = JSON.parse(data);

                // Migration: Fix missing machineIdLocked field
                Object.keys(customers).forEach(customerName => {
                    const customer = customers[customerName];

                    // If machineIdLocked is undefined, set it based on Machine ID
                    if (customer.machineIdLocked === undefined) {
                        const isPlaceholder = customer.machineId === 'PLACEHOLDER_MACHINE_ID';
                        customer.machineIdLocked = !isPlaceholder; // Lock if not placeholder

                        if (!isPlaceholder && !customer.machineIdSetAt) {
                            customer.machineIdSetAt = customer.updatedAt || customer.createdAt;
                        }

                    }
                });

                // Save migrated data
                this.customers = customers;
                this.saveCustomers();

                return customers;
            }
            return {};
        } catch (error) {
            console.error('Error loading customers:', error);
            return {};
        }
    }

    /**
     * Save danh sách customers vào file
     */
    saveCustomers() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.customers, null, 2), 'utf8');
            return true;
        } catch (error) {
            console.error('Error saving customers:', error);
            return false;
        }
    }

    /**
     * Thêm hoặc cập nhật customer
     */
    addOrUpdateCustomer(customerName, machineId, notes = '', displayName = '') {
        const now = new Date().toISOString();

        if (this.customers[customerName]) {
            // Update existing customer
            const existingCustomer = this.customers[customerName];

            // Check if Machine ID is locked (not placeholder, not empty, and already set)
            const isPlaceholder = existingCustomer.machineId === 'PLACEHOLDER_MACHINE_ID' || existingCustomer.machineId === '';
            const isMachineIdLocked = !isPlaceholder && existingCustomer.machineIdLocked;

            if (isMachineIdLocked && machineId !== existingCustomer.machineId) {
                throw new Error('Machine ID đã được khóa và không thể thay đổi. Liên hệ admin nếu cần thiết.');
            }

            // Update machine ID and lock it if it's being set for the first time (from placeholder or empty)
            if (isPlaceholder && machineId !== 'PLACEHOLDER_MACHINE_ID' && machineId !== '') {
                this.customers[customerName].machineId = machineId;
                this.customers[customerName].machineIdLocked = true;
                this.customers[customerName].machineIdSetAt = now;
            } else if (!isMachineIdLocked) {
                // Allow update if not locked yet
                this.customers[customerName].machineId = machineId;
                if (machineId !== 'PLACEHOLDER_MACHINE_ID' && machineId !== '') {
                    this.customers[customerName].machineIdLocked = true;
                    this.customers[customerName].machineIdSetAt = now;
                }
            }

            this.customers[customerName].notes = notes;
            if (displayName) {
                this.customers[customerName].displayName = displayName.trim();
            }
            this.customers[customerName].updatedAt = now;
            this.customers[customerName].updateCount = (this.customers[customerName].updateCount || 0) + 1;
        } else {
            // Add new customer
            const isRealMachineId = machineId !== 'PLACEHOLDER_MACHINE_ID' && machineId !== '';
            this.customers[customerName] = {
                customerName,
                machineId,
                notes,
                displayName: displayName ? displayName.trim() : '',
                createdAt: now,
                updatedAt: now,
                updateCount: 0,
                licenseHistory: [],
                machineIdLocked: isRealMachineId,
                machineIdSetAt: isRealMachineId ? now : null
            };
        }

        this.saveCustomers();
        return this.customers[customerName];
    }

    /**
     * Lấy thông tin customer
     */
    getCustomer(customerName) {
        return this.customers[customerName] || null;
    }

    /**
     * Lấy Machine ID của customer
     */
    getMachineId(customerName) {
        const customer = this.getCustomer(customerName);
        return customer ? customer.machineId : null;
    }

    /**
     * Lấy danh sách tất cả customers
     */
    getAllCustomers() {
        const customers = Object.values(this.customers);

        // Lấy thời gian tạo từ package folder
        const packagesDir = path.join(__dirname, '..', 'customer-packages');

        customers.forEach(customer => {
            try {
                const packagePath = path.join(packagesDir, customer.customerName);
                if (fs.existsSync(packagePath)) {
                    const stat = fs.statSync(packagePath);
                    // Dùng birthtime nếu có, nếu không dùng mtime
                    const createdTime = stat.birthtime && stat.birthtime.getTime() > 0
                        ? stat.birthtime.getTime()
                        : stat.mtime.getTime();
                    customer.packageCreatedTime = createdTime;
                } else {
                    // Nếu package không tồn tại, dùng createdAt từ JSON
                    customer.packageCreatedTime = new Date(customer.createdAt).getTime();
                }
            } catch (err) {
                // Nếu có lỗi, dùng createdAt từ JSON
                customer.packageCreatedTime = new Date(customer.createdAt).getTime();
            }
        });

        // Sắp xếp theo thời gian tạo package (mới nhất trước)
        return customers.sort((a, b) => b.packageCreatedTime - a.packageCreatedTime);
    }

    /**
     * Cập nhật Display Name của customer
     */
    updateCustomerDisplayName(customerName, displayName) {
        const customer = this.getCustomer(customerName);
        if (!customer) {
            throw new Error('Customer not found');
        }

        customer.displayName = displayName.trim();
        customer.updatedAt = new Date().toISOString();
        this.saveCustomers();
        return customer;
    }

    /**
     * Xóa customer
     */
    removeCustomer(customerName) {
        if (this.customers[customerName]) {
            delete this.customers[customerName];
            this.saveCustomers();
            return true;
        }
        return false;
    }

    /**
     * Unlock Machine ID (chỉ dành cho admin trong trường hợp đặc biệt)
     */
    unlockMachineId(customerName, adminReason = '') {
        const customer = this.getCustomer(customerName);
        if (!customer) return false;

        customer.machineIdLocked = false;
        customer.machineIdUnlockedAt = new Date().toISOString();
        customer.unlockReason = adminReason;

        this.saveCustomers();
        return true;
    }

    /**
     * Check if Machine ID is locked
     */
    isMachineIdLocked(customerName) {
        const customer = this.getCustomer(customerName);
        if (!customer) return false;

        const isPlaceholder = customer.machineId === 'PLACEHOLDER_MACHINE_ID';
        return !isPlaceholder && customer.machineIdLocked;
    }

    /**
     * Thêm license key vào lịch sử
     */
    addLicenseToHistory(customerName, licenseKey, expiryDays, notes = '') {
        const customer = this.getCustomer(customerName);
        if (!customer) return false;

        const licenseRecord = {
            licenseKey,
            expiryDays,
            notes,
            createdAt: new Date().toISOString(),
            isActive: true
        };

        // Khởi tạo licenseHistory nếu chưa có (cho dữ liệu cũ)
        if (!customer.licenseHistory) {
            customer.licenseHistory = [];
        }

        // Đánh dấu license cũ là inactive
        customer.licenseHistory.forEach(license => {
            license.isActive = false;
        });

        // Thêm license mới
        customer.licenseHistory.push(licenseRecord);

        // Giới hạn tối đa 50 key per customer, xóa key cũ nhất nếu vượt quá
        // Mỗi customer có tối đa 50 key trong lịch sử (tăng từ 10 để tránh xóa key quá sớm)
        if (customer.licenseHistory.length > 50) {
            // Sắp xếp theo thời gian tạo (cũ nhất trước)
            customer.licenseHistory.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            // Xóa key cũ nhất cho đến khi còn 50 key
            while (customer.licenseHistory.length > 50) {
                customer.licenseHistory.shift();
            }
        }

        this.saveCustomers();
        return true;
    }

    /**
     * Lấy license key hiện tại của customer
     */
    getCurrentLicense(customerName) {
        const customer = this.getCustomer(customerName);
        if (!customer) return null;

        // Khởi tạo licenseHistory nếu chưa có
        if (!customer.licenseHistory) {
            customer.licenseHistory = [];
            return null;
        }

        return customer.licenseHistory.find(license => license.isActive) || null;
    }

    /**
     * Lấy lịch sử license của customer (sắp xếp theo thời gian mới nhất)
     */
    getLicenseHistory(customerName) {
        const customer = this.getCustomer(customerName);
        if (!customer) return [];

        // Khởi tạo licenseHistory nếu chưa có
        if (!customer.licenseHistory) {
            customer.licenseHistory = [];
            return [];
        }

        // Sắp xếp theo thời gian tạo (mới nhất trước)
        return customer.licenseHistory
            .slice() // Copy array để không thay đổi original
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Lấy thống kê license của customer
     */
    getLicenseStats(customerName) {
        const customer = this.getCustomer(customerName);
        if (!customer) {
            return {
                total: 0,
                active: 0,
                expired: 0,
                lifetime: 0
            };
        }

        // Khởi tạo licenseHistory nếu chưa có
        if (!customer.licenseHistory) {
            customer.licenseHistory = [];
            return {
                total: 0,
                active: 0,
                expired: 0,
                lifetime: 0
            };
        }

        const now = new Date();
        let active = 0, expired = 0, lifetime = 0;

        customer.licenseHistory.forEach(license => {
            if (license.expiryDays === -1) {
                lifetime++;
            } else {
                const expiryDate = new Date(new Date(license.createdAt).getTime() + (license.expiryDays * 24 * 60 * 60 * 1000));
                if (expiryDate > now) {
                    active++;
                } else {
                    expired++;
                }
            }
        });

        return {
            total: customer.licenseHistory.length,
            active,
            expired,
            lifetime
        };
    }

    /**
     * Tìm kiếm customers
     */
    searchCustomers(query) {
        const lowerQuery = query.toLowerCase();
        return Object.values(this.customers).filter(customer =>
            customer.customerName.toLowerCase().includes(lowerQuery) ||
            customer.machineId.toLowerCase().includes(lowerQuery) ||
            (customer.notes && customer.notes.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Thống kê
     */
    getStats() {
        const customers = Object.values(this.customers);
        const totalCustomers = customers.length;
        const customersWithLicense = customers.filter(c => c.licenseHistory && c.licenseHistory.length > 0).length;
        const activeLicenses = customers.filter(c => this.getCurrentLicense(c.customerName)).length;

        return {
            totalCustomers,
            customersWithLicense,
            activeLicenses,
            customersWithoutLicense: totalCustomers - customersWithLicense
        };
    }

    /**
     * Tự động xóa license hết hạn
     * Chạy khi load danh sách khách hàng
     */
    cleanupExpiredLicenses() {
        let cleanedCount = 0;
        const now = new Date();

        Object.keys(this.customers).forEach(customerName => {
            const customer = this.customers[customerName];

            if (!customer.licenseHistory || customer.licenseHistory.length === 0) {
                return;
            }

            // Lọc ra các key hết hạn
            const originalLength = customer.licenseHistory.length;
            customer.licenseHistory = customer.licenseHistory.filter(license => {
                // Giữ lại lifetime license
                if (license.expiryDays === -1) {
                    return true;
                }

                // Tính ngày hết hạn
                const expiryDate = new Date(new Date(license.createdAt).getTime() + (license.expiryDays * 24 * 60 * 60 * 1000));

                // Nếu hết hạn, xóa
                if (expiryDate <= now) {
                    cleanedCount++;
                    console.log(`🗑️ Removed expired license for ${customerName}: ${license.licenseKey.substring(0, 20)}...`);
                    return false;
                }

                return true;
            });

            // Nếu xóa key, cập nhật isActive
            if (customer.licenseHistory.length < originalLength) {
                // Đánh dấu key còn lại là inactive nếu không có key active
                const hasActive = customer.licenseHistory.some(l => l.isActive);
                if (!hasActive && customer.licenseHistory.length > 0) {
                    customer.licenseHistory[customer.licenseHistory.length - 1].isActive = true;
                }
            }
        });

        // Lưu nếu có thay đổi
        if (cleanedCount > 0) {
            this.saveCustomers();
            console.log(`✅ Cleanup completed: Removed ${cleanedCount} expired licenses`);
        }

        return cleanedCount;
    }

    /**
     * Export data để backup
     */
    exportData() {
    }

    /**
     * Import data từ backup
     */
    importData(data) {
        try {
            if (data.customers) {
                this.customers = data.customers;
                this.saveCustomers();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

module.exports = CustomerMachineManager;