// Captcha Solver API Integration
// API Docs: https://documenter.getpostman.com/view/18090353/2s9YC8vAoo
// Service: autocaptcha.pro
// Real API Base: https://autocaptcha.pro/apiv3

// Prevent duplicate declaration
if (typeof CAPTCHA_API_BASE === 'undefined') {
  var CAPTCHA_API_BASE = 'https://autocaptcha.pro/apiv3';
}

// Prevent duplicate class declaration
if (typeof CaptchaSolver === 'undefined') {
  var CaptchaSolver = class {
    constructor(apiKey) {
      this.apiKey = apiKey;
    }

    /**
     * Fetch via background script to bypass CORS
     * In Puppeteer mode, use window.__puppeteerApiCall instead
     */
    async fetchViaBackground(endpoint, method = 'GET', body = null) {
      // Check if running in Puppeteer mode (has window.__puppeteerApiCall)
      if (typeof window !== 'undefined' && window.__puppeteerApiCall) {
        console.log('🤖 Using Puppeteer API call (no CORS)');
        try {
          const data = await window.__puppeteerApiCall(endpoint, method, body, this.apiKey);
          return data;
        } catch (error) {
          throw new Error(error.message || 'Puppeteer API call failed');
        }
      }

      // Original extension mode - use chrome.runtime.sendMessage
      return new Promise((resolve, reject) => {
        console.log('📤 Sending message to background:', { endpoint, method });

        chrome.runtime.sendMessage({
          action: 'apiCall',
          data: {
            endpoint,
            method,
            body,
            apiKey: this.apiKey
          }
        }, (response) => {
          console.log('📥 Response from background:', response);

          if (chrome.runtime.lastError) {
            console.error('❌ Chrome runtime error:', chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response?.error || 'API call failed'));
          }
        });
      });
    }

    /**
     * Fetch with retry logic
     */
    async fetchWithRetry(url, options, maxRetries = 5) {
      let lastError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`📤 Fetch attempt ${attempt}/${maxRetries}...`);
          console.log(`🌐 Fetch request: ${url}`);

          // Use background script to bypass CORS
          const method = options.method || 'GET';
          const body = options.body ? JSON.parse(options.body) : null;

          const data = await this.fetchViaBackground(url, method, body);
          console.log(`✅ Fetch successful on attempt ${attempt}`);

          // Return fake response object for compatibility
          return {
            ok: true,
            status: 200,
            json: async () => data
          };

        } catch (error) {
          lastError = error;
          const errorMsg = error.message || String(error);
          console.error(`❌ Fetch attempt ${attempt} failed:`, errorMsg);

          // Check if it's a server error (5xx)
          const isServerError = errorMsg.includes('521') ||
            errorMsg.includes('502') ||
            errorMsg.includes('503') ||
            errorMsg.includes('504');

          if (attempt < maxRetries) {
            // Longer wait for server errors
            const waitTime = isServerError ? attempt * 2000 : attempt * 1000;
            console.log(`⏳ Waiting ${waitTime}ms before retry...`);

            if (isServerError) {
              console.log(`⚠️  Server error detected (${errorMsg}), will retry with longer delay`);
            }

            await this.sleep(waitTime);
          } else {
            // Last attempt failed
            if (isServerError) {
              console.error(`❌ Server is down after ${maxRetries} attempts`);
              console.error(`💡 Suggestion: Try again later or check API status`);
            }
          }
        }
      }

      throw new Error(`Network error after ${maxRetries} attempts: ${lastError.message}`);
    }

    /**
     * Test API Key by checking balance
     */
    async testApiKey() {
      try {
        console.log('🔍 Testing API Key...');

        // API: https://autocaptcha.pro/apiv3/balance?key=YOUR_KEY
        const response = await this.fetchWithRetry(
          `${CAPTCHA_API_BASE}/balance?key=${this.apiKey}`,
          { method: 'GET' },
          2
        );

        const data = await response.json();
        console.log('💰 Balance check:', data);

        // Response: { success: true, message: "THANH CONG", balance: 20000 }
        if (data.success === true) {
          console.log(`✅ API Key valid! Balance: ${data.balance}`);
          return true;
        } else {
          console.error('❌ API Key invalid:', data.message);
          throw new Error(data.message || 'Invalid API Key');
        }
      } catch (error) {
        console.error('❌ API Key test failed:', error);
        throw error;
      }
    }

    /**
     * Giải audio captcha từ URL
     */
    async solveAudioCaptcha(audioUrl) {
      try {
        console.log('🔊 Sending audio captcha to API...');
        console.log('🔗 Audio URL:', audioUrl);
        console.log('🔑 API Key:', this.apiKey.substring(0, 5) + '...');

        if (!this.apiKey) {
          throw new Error('API Key is empty');
        }

        if (!audioUrl) {
          throw new Error('Audio URL is empty');
        }

        console.log('🔍 Original audio URL:', audioUrl);

        // Fix URL: Remove escaped slashes and convert HTTP → HTTPS
        const oldUrl = audioUrl;

        // Step 1: Remove all backslashes (unescape the URL)
        audioUrl = audioUrl.split('\\').join('');

        // Step 2: Convert HTTP → HTTPS
        audioUrl = audioUrl.split('http://').join('https://');

        if (oldUrl !== audioUrl) {
          console.log('🔒 Fixed audio URL');
          console.log('   Before:', oldUrl);
          console.log('   After:', audioUrl);
        } else {
          console.log('✅ URL already correct');
        }

        // Test API Key first
        console.log('🔍 Testing API Key before solving...');
        try {
          await this.testApiKey();
        } catch (testError) {
          console.error('❌ API Key test failed:', testError.message);
          throw new Error(`API Key không hợp lệ: ${testError.message}`);
        }

        // Submit audio captcha using JSON
        // API: https://autocaptcha.pro/apiv3/process
        // IMPORTANT: Use "SpeechToText" for audio URL (case sensitive!)
        const requestBody = {
          key: this.apiKey,
          type: "SpeechToText",
          body: audioUrl
        };

        console.log('📤 Submitting to:', `${CAPTCHA_API_BASE}/process`);
        console.log('📦 Request body:', requestBody);

        const submitResponse = await this.fetchWithRetry(`${CAPTCHA_API_BASE}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        console.log('📥 Response status:', submitResponse.status);

        if (!submitResponse.ok) {
          throw new Error(`HTTP error! status: ${submitResponse.status}`);
        }

        const submitData = await submitResponse.json();
        console.log('📤 Submit response:', submitData);

        // SpeechToText API returns result immediately, no polling needed!
        // Response format: { success: true, message: "Thành công", captcha: "123456" }

        if (submitData.success === false) {
          const errorMsg = submitData.message || 'Failed to submit';
          console.error('❌ API Error:', errorMsg);

          if (errorMsg.includes('key') || errorMsg.includes('KEY')) {
            throw new Error('API Key không đúng! Vui lòng kiểm tra lại.');
          } else if (errorMsg.includes('balance') || errorMsg.includes('BALANCE') || errorMsg.includes('số dư')) {
            throw new Error('Tài khoản hết credit! Vui lòng nạp thêm.');
          } else if (errorMsg.includes('busy') || errorMsg.includes('SLOT') || errorMsg.includes('quá tải')) {
            throw new Error('Server đang quá tải, vui lòng thử lại sau.');
          } else if (errorMsg === 'ERROR') {
            throw new Error('API trả về lỗi ERROR - có thể do audio URL không hợp lệ hoặc không thể tải được');
          } else {
            throw new Error(errorMsg);
          }
        }

        // Get captcha result directly from response (no polling needed)
        const result = submitData.captcha;
        if (!result) {
          console.error('❌ No captcha in response:', submitData);
          throw new Error('API không trả về captcha result');
        }

        console.log('✅ Audio captcha solved:', result);
        return result;

      } catch (error) {
        console.error('❌ Audio captcha solve error:', error);
        throw error;
      }
    }

    /**
     * Giải audio captcha từ base64
     */
    async solveAudioBase64(base64Audio) {
      try {
        console.log('🔊 Sending audio captcha (base64) to API...');

        const cleanBase64 = base64Audio.replace(/^data:audio\/[a-z0-9]+;base64,/, '');

        if (!this.apiKey || !cleanBase64) {
          throw new Error('API Key or audio data is empty');
        }

        const requestBody = {
          type: "ImageToTextTask",
          body: cleanBase64,
          key: this.apiKey
        };

        const submitResponse = await this.fetchWithRetry(`${CAPTCHA_API_BASE}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const submitData = await submitResponse.json();
        console.log('📤 Submit response:', submitData);

        if (submitData.errorId !== undefined && submitData.errorId !== 0) {
          throw new Error(submitData.message || 'Failed to submit');
        }

        const taskId = submitData.taskId;
        const result = await this.pollResult(taskId);

        return result;

      } catch (error) {
        console.error('❌ Audio base64 solve error:', error);
        throw error;
      }
    }

    /**
     * Giải image captcha từ base64
     */
    async solveImageCaptcha(base64Image) {
      try {
        console.log('🔐 Sending image captcha to API...');

        const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');

        const requestBody = {
          type: "ImageToTextTask",
          body: cleanBase64,
          key: this.apiKey
        };

        const submitResponse = await this.fetchWithRetry(`${CAPTCHA_API_BASE}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const submitData = await submitResponse.json();
        console.log('📤 Submit response:', submitData);

        // Handle direct response format {success: true, captcha: "text"}
        if (submitData.success && submitData.captcha) {
          console.log('✅ Direct captcha result:', submitData.captcha);
          return submitData.captcha;
        }

        // Handle error
        if (submitData.errorId !== undefined && submitData.errorId !== 0) {
          throw new Error(submitData.message || 'Failed to submit');
        }

        // Handle polling format {errorId: 0, taskId: "xxx"}
        if (submitData.taskId) {
          const taskId = submitData.taskId;
          const result = await this.pollResult(taskId);
          return result;
        }

        throw new Error('Unknown API response format');

      } catch (error) {
        console.error('❌ Image captcha solve error:', error);
        throw error;
      }
    }

    /**
     * Poll for captcha result
     */
    async pollResult(taskId, maxAttempts = 20) {
      for (let i = 0; i < maxAttempts; i++) {
        await this.sleep(3000); // Wait 3 seconds

        try {
          console.log(`🔄 Polling attempt ${i + 1}/${maxAttempts}...`);

          // API: https://autocaptcha.pro/apiv3/result?key=YOUR_KEY&taskId=TASK_ID
          const endpoint = `${CAPTCHA_API_BASE}/result?key=${this.apiKey}&taskId=${taskId}`;
          const data = await this.fetchViaBackground(endpoint, 'GET', null);

          console.log('📥 Poll response:', data);

          // Check if resolved
          if (data.resolved !== null && data.resolved !== undefined) {
            // Success - return resolved text
            console.log('✅ Captcha resolved:', data.resolved);
            return data.resolved;
          } else if (data.errorId === 0 && data.resolved === null) {
            // Still processing
            console.log('⏳ Still processing...');
            continue;
          } else if (data.errorId !== 0) {
            // Error
            throw new Error(data.message || 'Failed to get result');
          } else {
            // Unknown, continue
            continue;
          }
        } catch (error) {
          console.error('❌ Poll error:', error);
          if (i === maxAttempts - 1) {
            throw error;
          }
        }
      }

      throw new Error('Timeout waiting for captcha result');
    }

    /**
     * Sleep helper
     */
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get image as base64 from img element or canvas
     */
    async getImageBase64(element) {
      if (element.tagName === 'CANVAS') {
        return element.toDataURL('image/png');
      } else if (element.tagName === 'IMG') {
        return new Promise((resolve, reject) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const img = new Image();
          img.crossOrigin = 'anonymous';

          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };

          img.onerror = reject;

          if (element.src.startsWith('data:')) {
            resolve(element.src);
          } else {
            img.src = element.src;
          }
        });
      }

      throw new Error('Unsupported element type');
    }
  }; // Close class
} // Close if statement

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CaptchaSolver;
}
