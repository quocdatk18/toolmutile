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

                        console.log(`🔧 Migration: Set machineIdLocked=${customer.machineIdLocked} for ${customerName}`);
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
    addOrUpdateCustomer(customerName, machineId, notes = '') {
        const now = new Date().toISOString();

        if (this.customers[customerName]) {
            // Update existing customer
            const existingCustomer = this.customers[customerName];

            // Check if Machine ID is locked (not placeholder and already set)
            const isPlaceholder = existingCustomer.machineId === 'PLACEHOLDER_MACHINE_ID';
            const isMachineIdLocked = !isPlaceholder && existingCustomer.machineIdLocked;

            if (isMachineIdLocked && machineId !== existingCustomer.machineId) {
                throw new Error('Machine ID đã được khóa và không thể thay đổi. Liên hệ admin nếu cần thiết.');
            }

            // Update machine ID and lock it if it's being set for the first time (from placeholder)
            if (isPlaceholder && machineId !== 'PLACEHOLDER_MACHINE_ID') {
                this.customers[customerName].machineId = machineId;
                this.customers[customerName].machineIdLocked = true;
                this.customers[customerName].machineIdSetAt = now;
                console.log(`🔒 Machine ID locked for customer: ${customerName}`);
            } else if (!isMachineIdLocked) {
                // Allow update if not locked yet
                this.customers[customerName].machineId = machineId;
                if (machineId !== 'PLACEHOLDER_MACHINE_ID') {
                    this.customers[customerName].machineIdLocked = true;
                    this.customers[customerName].machineIdSetAt = now;
                }
            }

            this.customers[customerName].notes = notes;
            this.customers[customerName].updatedAt = now;
            this.customers[customerName].updateCount = (this.customers[customerName].updateCount || 0) + 1;
        } else {
            // Add new customer
            const isRealMachineId = machineId !== 'PLACEHOLDER_MACHINE_ID';
            this.customers[customerName] = {
                customerName,
                machineId,
                notes,
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
        return Object.values(this.customers).sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
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
        console.log(`🔓 Machine ID unlocked for customer: ${customerName}. Reason: ${adminReason}`);
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

        // Đánh dấu license cũ là inactive
        customer.licenseHistory.forEach(license => {
            license.isActive = false;
        });

        // Thêm license mới
        customer.licenseHistory.push(licenseRecord);

        this.saveCustomers();
        return true;
    }

    /**
     * Lấy license key hiện tại của customer
     */
    getCurrentLicense(customerName) {
        const customer = this.getCustomer(customerName);
        if (!customer || !customer.licenseHistory) return null;

        return customer.licenseHistory.find(license => license.isActive) || null;
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
     * Export data để backup
     */
    exportData() {
        return {
            exportedAt: new Date().toISOString(),
            customers: this.customers,
            stats: this.getStats()
        };
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