/**
 * Auto Sequence - Complete workflow like extension (WORKING VERSION from hidemium-tool-cu)
 * Register → Login → Add Bank → Check Promo (optional)
 * 
 * This is the PROVEN working version that matches extension behavior exactly
 */

const CompleteAutomation = require('./complete-automation');

class AutoSequence {
    constructor(settings, scripts) {
        this.settings = settings;
        this.automation = new CompleteAutomation(settings, scripts);
    }

    /**
     * Run complete sequence for one site
     * Register → Auto-Login → Add Bank → Check Promo (all on same page)
     */
    async runSequenceForSite(browser, site, profileData) {
        const siteName = site.name;
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🤖 Starting sequence for: ${siteName}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        // Use URLs from site object (registerUrl, loginUrl, withdrawUrl, promoUrl)
        const siteUrls = {
            register: site.registerUrl,
            login: site.loginUrl,
            withdraw: site.withdrawUrl,
            promo: site.promoUrl
        };

        console.log(`📍 Register URL: ${siteUrls.register}`);
        console.log(`📍 Login URL: ${siteUrls.login}`);
        console.log(`📍 Withdraw URL: ${siteUrls.withdraw}`);
        console.log(`📍 Promo URL: ${siteUrls.promo}\n`);

        const results = {
            site: siteName,
            register: { success: false },
            login: { success: false },
            addBank: { success: false },
            checkPromo: { success: false }
        };

        // STEP 1: Register + Auto-Login + Auto-Withdraw (all on same page)
        console.log(`📝 STEP 1/2: Registering on ${siteName} (with auto-login + auto-withdraw)...`);
        let registerPage = null;
        try {
            const registerResult = await this.automation.runRegistration(
                browser,
                siteUrls.register,
                {
                    username: profileData.username,
                    password: profileData.password,
                    withdrawPassword: profileData.withdrawPassword,
                    fullname: profileData.fullname,
                    apiKey: profileData.apiKey,
                    bankName: profileData.bankName,
                    bankBranch: profileData.bankBranch,
                    accountNumber: profileData.accountNumber
                },
                siteUrls.login, // Pass login URL for auto-login
                siteUrls.withdraw // Pass withdraw URL for auto-redirect
            );

            results.register = registerResult;

            // Store register page reference
            const pages = await browser.pages();
            registerPage = pages.find(p => {
                try {
                    return p.url().includes(new URL(siteUrls.register).hostname);
                } catch {
                    return false;
                }
            });

            if (!registerResult.success) {
                console.log(`❌ Register failed, skipping remaining steps`);
                return results;
            }

            console.log(`✅ Register successful`);

            // Check if auto-login was successful
            if (registerResult.autoLogin) {
                if (registerResult.autoLogin.success) {
                    console.log(`✅ Auto-login successful (same page)`);
                    results.login = registerResult.autoLogin;
                } else {
                    console.log(`⚠️ Auto-login failed:`, registerResult.autoLogin.error);
                    results.login = registerResult.autoLogin;
                    return results; // Stop if auto-login failed
                }
            } else {
                console.log(`⚠️ No auto-login result (loginUrl not provided?)`);
                results.login = { success: false, message: 'No auto-login performed' };
                return results;
            }

            // Check if auto-withdraw was successful (already done in runRegistration)
            if (registerResult.autoWithdraw) {
                if (registerResult.autoWithdraw.success) {
                    console.log(`✅ Auto-withdraw form filled (same page)`);
                    results.addBank = registerResult.autoWithdraw;
                } else {
                    console.log(`⚠️ Auto-withdraw failed:`, registerResult.autoWithdraw.error);
                    results.addBank = registerResult.autoWithdraw;
                }
            } else {
                // No bank info provided or withdrawUrl not set
                console.log(`⏭️  Skipping add bank (no bank info or withdrawUrl)`);
                results.addBank = { success: true, skipped: true, message: 'No bank info or withdrawUrl' };
            }

            await new Promise(resolve => setTimeout(resolve, 3000));

        } catch (error) {
            console.error(`❌ Register error:`, error.message);
            results.register = { success: false, message: error.message };
            return results;
        }

        // STEP 4: Check Promo (optional - create separate context for each site like extension)
        console.log(`🔍 DEBUG: profileData.checkPromo = ${profileData.checkPromo}`);
        if (profileData.checkPromo) {
            console.log(`🎁 STEP 2/2: Checking promotion on ${siteName}...`);
            try {
                // Create NEW context for this site's promo (like extension creates new window)
                console.log(`🪟 Creating separate context for ${siteName} promo check...`);
                const sitePromoContext = await browser.createBrowserContext();

                // Use promo URL if available, otherwise use login URL
                const promoUrl = siteUrls.promo || siteUrls.login;
                console.log(`📍 Promo URL: ${promoUrl}`);

                // Run check promo with FULL logic (auto-click and solve captcha like extension)
                const promoResult = await this.automation.runCheckPromotionFull(
                    sitePromoContext,
                    null, // No longer need login context
                    promoUrl,
                    siteUrls.login,
                    profileData.username,
                    profileData.apiKey
                );

                results.checkPromo = promoResult;

                if (promoResult.success) {
                    console.log(`✅ Check promo successful`);
                } else {
                    console.log(`⚠️  Check promo failed`);
                }

                console.log(`📂 Keeping promo context open for ${siteName}`);

            } catch (error) {
                console.error(`❌ Check promo error:`, error.message);
                results.checkPromo = { success: false, message: error.message };
            }
        } else {
            console.log(`⏭️  STEP 2/2: Skipping check promo (not enabled)`);
            results.checkPromo = { success: true, skipped: true, message: 'Skipped' };
        }

        console.log(`\n✅ Sequence completed for ${siteName}`);
        return results;
    }

    /**
     * Run complete sequence for multiple sites IN PARALLEL (like extension)
     * Each site runs independently: Register → Login → Add Bank → Check Promo
     * Creates separate browser contexts: main for register, shared for login/addBank, separate for each promo
     */
    async runSequence(browser, profileData, sites) {
        console.log(`\n🤖🤖🤖 AUTO SEQUENCE MODE: ${sites.length} sites`);
        console.log(`Will run: Register → Login → Add Bank → Check Promo (optional)`);
        console.log(`🔄 Processing ALL sites in PARALLEL (like extension)\n`);

        // Initialize tab rotator for parallel processing
        const tabRotator = require('./tab-rotator');
        tabRotator.clear(); // Clear previous tabs
        console.log(`🔄 Tab rotator initialized\n`);

        // Clean up existing pages if profile was already open
        console.log(`🧹 Checking for existing pages...`);
        const existingPages = await browser.pages();
        console.log(`   Found ${existingPages.length} existing pages`);

        // Close all existing pages except the first one (about:blank)
        for (let i = 1; i < existingPages.length; i++) {
            try {
                console.log(`   Closing page ${i}: ${existingPages[i].url()}`);
                await existingPages[i].close();
            } catch (e) {
                console.log(`   ⚠️  Could not close page ${i}:`, e.message);
            }
        }

        console.log(`✅ Cleanup completed\n`);

        // Process ALL sites in PARALLEL (like extension)
        console.log(`🚀 Starting parallel processing for ${sites.length} sites...\n`);

        const promises = sites.map(async (site, i) => {
            try {
                console.log(`\n[${i + 1}/${sites.length}] Starting: ${site.name}`);

                // Small delay between starting sites to avoid overwhelming
                await new Promise(resolve => setTimeout(resolve, i * 1000));

                const result = await this.runSequenceForSite(browser, site, profileData);

                console.log(`\n📊 Summary for ${site.name}:`);
                console.log(`  Register: ${result.register.success ? '✅' : '❌'}`);
                console.log(`  Login: ${result.login.success ? '✅' : '❌'}`);
                console.log(`  Add Bank: ${result.addBank.success ? '✅' : '❌'}`);
                console.log(`  Check Promo: ${result.checkPromo.skipped ? '⏭️  Skipped' : (result.checkPromo.success ? '✅' : '❌')}`);

                return result;

            } catch (error) {
                console.error(`❌ Error processing ${site.name}:`, error.message);
                return {
                    site: site.name,
                    register: { success: false, message: error.message },
                    login: { success: false },
                    addBank: { success: false },
                    checkPromo: { success: false }
                };
            }
        });

        // Start tab rotation after all sites have started
        console.log(`\n🔄 Starting tab rotation to prevent throttling...\n`);
        setTimeout(() => {
            tabRotator.start();
        }, 5000); // Start rotation after 5 seconds

        // Wait for ALL sites to complete
        console.log(`\n⏳ Waiting for all ${sites.length} sites to complete...\n`);

        const allResults = await Promise.all(promises);

        // Stop rotation when all done
        tabRotator.stop();

        console.log(`\n✅ All ${sites.length} sites processing completed\n`);

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🎉 ALL SEQUENCES COMPLETED!`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        // Final summary
        console.log(`📊 Final Summary:`);
        allResults.forEach((result, i) => {
            console.log(`\n${i + 1}. ${result.site}:`);
            console.log(`   Register: ${result.register.success ? '✅ Success' : '❌ Failed'}`);
            console.log(`   Login: ${result.login.success ? '✅ Success' : '❌ Failed'}`);
            console.log(`   Add Bank: ${result.addBank.success ? '✅ Success' : '❌ Failed'}`);
            console.log(`   Check Promo: ${result.checkPromo.skipped ? '⏭️  Skipped' : (result.checkPromo.success ? '✅ Success' : '❌ Failed')}`);
        });

        console.log(`\n📂 Shared login context kept open with all login/addBank pages`);
        console.log(`ℹ️  Browser kept open for inspection`);

        return { success: true, results: allResults };
    }

    /**
     * Run SMS sequence for one site
     * Register → Add Bank directly on same page (no separate login)
     */
    /**
     * Run SMS sequence for one site
     * Register → Add Bank (using UI automation like App, no redirect)
     */
    async runSmsSequenceForSite(browser, site, profileData, sharedContext) {
        const siteName = site.name;
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`💬 Starting SMS sequence for: ${siteName}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        const registerUrl = site.registerUrl;
        console.log(`📍 Register URL: ${registerUrl}`);

        const results = {
            site: siteName,
            register: { success: false },
            addBank: { success: false }
        };

        // Check if bank info is provided
        if (!profileData.bankName || !profileData.accountNumber) {
            console.log(`⚠️  No bank info provided, will only register`);
        }

        // STEP 1: Register
        console.log(`📝 STEP 1/2: Registering on ${siteName}...`);
        let registerPage = null;
        try {
            const registerResult = await this.automation.runRegistration(browser, registerUrl, {
                username: profileData.username,
                password: profileData.password,
                withdrawPassword: profileData.withdrawPassword,
                fullname: profileData.fullname,
                apiKey: profileData.apiKey
            });

            results.register = registerResult;

            if (!registerResult.success) {
                console.log(`❌ Register failed, skipping add bank`);
                return results;
            }

            console.log(`✅ Register successful`);

            // Find the register page
            const pagesAfterReg = await browser.pages();
            registerPage = pagesAfterReg.find(p => {
                try {
                    const url = p.url();
                    const hostname = new URL(registerUrl).hostname;
                    return url.includes(hostname);
                } catch {
                    return false;
                }
            });

            if (!registerPage) {
                console.log(`⚠️  Could not find register page, skipping add bank`);
                results.addBank = { success: false, message: 'Register page not found' };
                return results;
            }

            console.log(`📄 Current page: ${registerPage.url()}`);
            console.log(`✅ Token received, ready to navigate to Financial page`);
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.error(`❌ Register error:`, error.message);
            results.register = { success: false, message: error.message };
            return results;
        }

        // STEP 2: Add Bank (using UI automation like App, no redirect)
        console.log(`💳 STEP 2/2: Adding bank on ${siteName}...`);

        if (!profileData.bankName || !profileData.accountNumber) {
            console.log(`⏭️  Skipping add bank (no bank info provided)`);
            results.addBank = { success: true, skipped: true, message: 'No bank info' };
        } else {
            try {
                console.log(`💳 Using UI automation to add bank (like App sequence)...`);

                // Use the same method as App: runAddBankInContext with sharedContext
                // First, need to login to sharedContext
                console.log(`🔐 Logging in to shared context for add bank...`);
                const loginUrl = site.registerUrl.replace('/Account/Register', '/Account/Login');

                const loginResult = await this.automation.runLogin(sharedContext, loginUrl, {
                    username: profileData.username,
                    password: profileData.password,
                    apiKey: profileData.apiKey
                });

                if (!loginResult.success) {
                    console.log(`❌ Login failed, cannot add bank`);
                    results.addBank = { success: false, message: 'Login failed' };
                    return results;
                }

                console.log(`✅ Login successful, now adding bank...`);
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Use runAddBankInContext (same as App sequence)
                const addBankResult = await this.automation.runAddBankInContext(sharedContext, loginUrl, {
                    bankName: profileData.bankName,
                    bankBranch: profileData.bankBranch || '',
                    accountNumber: profileData.accountNumber,
                    withdrawPassword: profileData.withdrawPassword
                });

                results.addBank = addBankResult;

                if (!addBankResult.success) {
                    console.log(`⚠️  Add bank failed: ${addBankResult.message}`);
                } else {
                    console.log(`✅ Add bank successful`);
                }

                await new Promise(resolve => setTimeout(resolve, 2000));

            } catch (error) {
                console.error(`❌ Add bank error:`, error.message);
                results.addBank = { success: false, message: error.message };
            }
        }

        console.log(`\n✅ SMS sequence completed for ${siteName}`);
        console.log(`📂 Keeping page open`);
        return results;
    }


    /**
     * Run SMS sequence for multiple sites IN PARALLEL
     * Register → Add Bank (no login, no promo check)
     */
    async runSmsSequence(browser, profileData, sites) {
        console.log(`\n💬💬💬 SMS SEQUENCE MODE: ${sites.length} sites`);
        console.log(`Will run: Register → Add Bank (no promo check)`);
        console.log(`🔄 Processing ALL sites in PARALLEL\n`);

        // Clean up existing pages
        console.log(`🧹 Checking for existing pages...`);
        const existingPages = await browser.pages();
        console.log(`   Found ${existingPages.length} existing pages`);

        for (let i = 1; i < existingPages.length; i++) {
            try {
                console.log(`   Closing page ${i}: ${existingPages[i].url()}`);
                await existingPages[i].close();
            } catch (e) {
                console.log(`   ⚠️  Could not close page ${i}:`, e.message);
            }
        }

        console.log(`✅ Cleanup completed\n`);

        // Create SHARED browser context for all login/addBank operations
        console.log(`🪟 Creating shared context for login/addBank operations...`);
        const sharedContext = await browser.createBrowserContext();
        console.log(`✅ Shared context created\n`);

        // Process ALL sites in PARALLEL
        console.log(`🚀 Starting parallel processing for ${sites.length} sites...\n`);

        const promises = sites.map(async (site, i) => {
            try {
                console.log(`\n[${i + 1}/${sites.length}] Starting: ${site.name}`);

                const result = await this.runSmsSequenceForSite(browser, site, profileData, sharedContext);

                console.log(`\n📊 Summary for ${site.name}:`);
                console.log(`  Register: ${result.register.success ? '✅' : '❌'}`);
                console.log(`  Add Bank: ${result.addBank.success ? '✅' : '❌'}`);

                return result;

            } catch (error) {
                console.error(`❌ Error processing ${site.name}:`, error.message);
                return {
                    site: site.name,
                    register: { success: false, message: error.message },
                    addBank: { success: false }
                };
            }
        });

        // Wait for ALL sites to complete
        console.log(`\n⏳ Waiting for all ${sites.length} sites to complete...\n`);

        const allResults = await Promise.all(promises);
        console.log(`\n✅ All ${sites.length} sites processing completed\n`);

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🎉 SMS SEQUENCES COMPLETED!`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        // Final summary
        console.log(`📊 Final Summary:`);
        allResults.forEach((result, i) => {
            console.log(`\n${i + 1}. ${result.site}:`);
            console.log(`   Register: ${result.register.success ? '✅ Success' : '❌ Failed'}`);
            console.log(`   Add Bank: ${result.addBank.success ? '✅ Success' : '❌ Failed'}`);
        });

        console.log(`\n📂 Shared context kept open with all login/addBank pages`);
        console.log(`ℹ️  Browser kept open for inspection`);

        return { success: true, results: allResults };
    }

    /**
     * Run check promo only (standalone action)
     */
    async runCheckPromoOnly(browser, profileData, sites) {
        console.log(`\n🎁 CHECK PROMO ONLY MODE: ${sites.length} sites`);
        console.log(`Username: ${profileData.username}`);
        console.log(`🔄 Processing ALL sites in PARALLEL for faster execution\n`);

        // Process ALL sites in PARALLEL (like auto sequence)
        const promises = sites.map(async (site, index) => {
            console.log(`\n[${index + 1}/${sites.length}] Starting: ${site.name}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

            try {
                // Create separate context for this site's promo
                const promoContext = await browser.createBrowserContext();
                const promoUrl = site.promoUrl || site.loginUrl || site.registerUrl;

                console.log(`📍 ${site.name} - Promo URL: ${promoUrl}`);

                // Run check promo
                const promoResult = await this.automation.runCheckPromotionFull(
                    promoContext,
                    null, // No login context for standalone
                    promoUrl,
                    promoUrl,
                    profileData.username,
                    profileData.apiKey
                );

                console.log(`✅ ${site.name}: Found ${promoResult.promotions?.length || 0} promotions`);

                return {
                    site: site.name,
                    success: promoResult.success,
                    promotions: promoResult.promotions || [],
                    message: promoResult.message
                };

            } catch (error) {
                console.error(`❌ ${site.name} error:`, error.message);
                return {
                    site: site.name,
                    success: false,
                    promotions: [],
                    message: error.message
                };
            }
        });

        // Wait for ALL sites to complete
        console.log(`\n⏳ Waiting for all ${sites.length} sites to complete...\n`);
        const results = await Promise.all(promises);

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🎉 CHECK PROMO COMPLETED!`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        // Summary
        results.forEach((result, i) => {
            console.log(`${i + 1}. ${result.site}: ${result.success ? '✅' : '❌'} - ${result.promotions?.length || 0} promotions`);
        });

        console.log(`\nℹ️  Promo tabs have been closed automatically after screenshot`);
        console.log(`ℹ️  Browser profile kept open for inspection\n`);

        return { success: true, results };
    }

    /**
     * Run register only (standalone action)
     */
    async runRegisterOnly(browser, profileData, sites) {
        console.log(`\n📝 REGISTER ONLY MODE: ${sites.length} sites`);
        console.log(`Username: ${profileData.username}\n`);

        const results = [];

        for (const site of sites) {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📝 Registering on: ${site.name}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

            try {
                const registerUrl = site.registerUrl || site.url;
                console.log(`📍 Register URL: ${registerUrl}`);

                // Run registration
                const registerResult = await this.automation.runRegistration(browser, registerUrl, {
                    username: profileData.username,
                    password: profileData.password,
                    withdrawPassword: profileData.withdrawPassword,
                    fullname: profileData.fullname,
                    apiKey: profileData.apiKey
                });

                results.push({
                    site: site.name,
                    success: registerResult.success,
                    message: registerResult.message || 'Registration completed'
                });

                console.log(`✅ ${site.name}: ${registerResult.success ? 'Success' : 'Failed'}`);

            } catch (error) {
                console.error(`❌ Error registering ${site.name}:`, error.message);
                results.push({
                    site: site.name,
                    success: false,
                    message: error.message
                });
            }
        }

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🎉 REGISTER COMPLETED!`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        return { success: true, results };
    }

    /**
     * Run login only (standalone action)
     */
    async runLoginOnly(browser, profileData, sites) {
        console.log(`\n🔐 LOGIN ONLY MODE: ${sites.length} sites`);
        console.log(`Username: ${profileData.username}\n`);

        const results = [];

        // Create shared login context
        const sharedLoginContext = await browser.createBrowserContext();

        for (const site of sites) {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`🔐 Logging in to: ${site.name}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

            try {
                const loginUrl = site.loginUrl || site.url;
                console.log(`📍 Login URL: ${loginUrl}`);

                // Run login
                const loginResult = await this.automation.runLogin(sharedLoginContext, loginUrl, {
                    username: profileData.username,
                    password: profileData.password,
                    apiKey: profileData.apiKey
                });

                results.push({
                    site: site.name,
                    success: loginResult.success,
                    message: loginResult.message || 'Login completed'
                });

                console.log(`✅ ${site.name}: ${loginResult.success ? 'Success' : 'Failed'}`);

            } catch (error) {
                console.error(`❌ Error logging in ${site.name}:`, error.message);
                results.push({
                    site: site.name,
                    success: false,
                    message: error.message
                });
            }
        }

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🎉 LOGIN COMPLETED!`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        console.log(`ℹ️  Keeping login context open for inspection`);

        return { success: true, results };
    }

    /**
     * Run add bank only (standalone action)
     */
    async runAddBankOnly(browser, profileData, sites) {
        console.log(`\n💳 ADD BANK ONLY MODE: ${sites.length} sites`);
        console.log(`Username: ${profileData.username}\n`);

        if (!profileData.bankName || !profileData.accountNumber) {
            console.log(`❌ Missing bank information!`);
            return { success: false, message: 'Bank name and account number required' };
        }

        const results = [];

        // Create shared login context (need to login first)
        const sharedLoginContext = await browser.createBrowserContext();

        for (const site of sites) {
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`💳 Adding bank to: ${site.name}`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

            try {
                const loginUrl = site.loginUrl || site.url;
                console.log(`📍 Login URL: ${loginUrl}`);

                // Step 1: Login first
                console.log(`🔐 Logging in...`);
                const loginResult = await this.automation.runLogin(sharedLoginContext, loginUrl, {
                    username: profileData.username,
                    password: profileData.password,
                    apiKey: profileData.apiKey
                });

                if (!loginResult.success) {
                    console.log(`❌ Login failed, skipping bank add`);
                    results.push({
                        site: site.name,
                        success: false,
                        message: 'Login failed'
                    });
                    continue;
                }

                // Step 2: Add bank
                console.log(`💳 Adding bank...`);
                const bankResult = await this.automation.runAddBankInContext(sharedLoginContext, loginUrl, {
                    bankName: profileData.bankName,
                    bankBranch: profileData.bankBranch || '',
                    accountNumber: profileData.accountNumber,
                    withdrawPassword: profileData.withdrawPassword
                });

                results.push({
                    site: site.name,
                    success: bankResult.success,
                    message: bankResult.message || 'Bank added'
                });

                console.log(`✅ ${site.name}: ${bankResult.success ? 'Success' : 'Failed'}`);

            } catch (error) {
                console.error(`❌ Error adding bank to ${site.name}:`, error.message);
                results.push({
                    site: site.name,
                    success: false,
                    message: error.message
                });
            }
        }

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🎉 ADD BANK COMPLETED!`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
        console.log(`ℹ️  Keeping login context open for inspection`);

        return { success: true, results };
    }
}

module.exports = AutoSequence;
