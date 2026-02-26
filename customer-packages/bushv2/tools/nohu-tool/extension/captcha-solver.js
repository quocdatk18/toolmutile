// Captcha Solver API Integration
// API Docs: https://2captcha.com/api-docs
// Service: 2Captcha
// Real API Base: https://api.2captcha.com

// Prevent duplicate declaration
if (typeof CAPTCHA_API_BASE === 'undefined') {
  var CAPTCHA_API_BASE = 'https://api.2captcha.com';
}

// Prevent duplicate class declaration
if (typeof CaptchaSolver === 'undefined') {
  var CaptchaSolver = class {
    constructor(apiKey) {
      this.apiKey = apiKey;
    }

    /**
     * Convert Vietnamese number words to digits
     */
    convertVietnameseToDigits(text) {
      const vietnameseNumbers = {
        'không': '0', 'ko': '0', 'khong': '0', 'k': '0',
        'một': '1', 'mot': '1', 'mốt': '1', 'm': '1',
        'hai': '2', 'h': '2',
        'ba': '3', 'b': '3',
        'bốn': '4', 'bon': '4', 'b4': '4',
        'năm': '5', 'nam': '5', 'n': '5',
        'sáu': '6', 'sau': '6', 's': '6',
        'bảy': '7', 'bay': '7', 'b7': '7',
        'tám': '8', 'tam': '8', 't': '8',
        'chín': '9', 'chin': '9', 'c': '9'
      };

      let result = text.toLowerCase().trim();

      // Remove common punctuation and extra spaces
      result = result.replace(/[.,!?;:()[\]{}]/g, ' ').replace(/\s+/g, ' ').trim();

      // Try exact match first
      if (vietnameseNumbers[result]) {
        return vietnameseNumbers[result];
      }

      // Split by spaces and convert each word to digit
      const words = result.split(/\s+/);
      let digits = '';

      for (const word of words) {
        if (word && vietnameseNumbers[word]) {
          digits += vietnameseNumbers[word];
        }
      }

      // If we extracted digits, return them
      if (digits.length > 0) {
        console.log('🇻🇳 Converted words to digits:', digits);
        return digits;
      }

      // Fallback: return original text
      return text;
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
     * Download file as base64 (for audio files)
     */
    async downloadAsBase64(url) {
      try {
        console.log('📥 Downloading file as base64...');

        // Use background script to download file
        const data = await this.fetchViaBackground(url, 'GET', null);

        // If data is already base64 string, return it
        if (typeof data === 'string' && data.match(/^[A-Za-z0-9+/=]+$/)) {
          console.log('✅ File downloaded as base64');
          return data;
        }

        // If data is object with base64 property
        if (typeof data === 'object' && data.base64) {
          console.log('✅ File downloaded as base64');
          return data.base64;
        }

        // Otherwise, try to convert to base64
        console.warn('⚠️ Unexpected data format, attempting conversion...');
        if (typeof data === 'string') {
          return btoa(data);
        }

        throw new Error('Could not convert file to base64');
      } catch (error) {
        console.error('❌ Download error:', error.message);
        throw error;
      }
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

        // API: https://api.2captcha.com/getBalance (POST)
        const response = await this.fetchWithRetry(
          `${CAPTCHA_API_BASE}/getBalance`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              clientKey: this.apiKey
            })
          },
          2
        );

        const data = await response.json();
        console.log('💰 Balance check:', data);

        // Response: { errorId: 0, balance: 20000 }
        if (data.errorId === 0) {
          console.log(`✅ API Key valid! Balance: ${data.balance}`);
          return true;
        } else {
          console.error('❌ API Key invalid:', data.errorDescription);
          throw new Error(data.errorDescription || 'Invalid API Key');
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

        // Download audio file and convert to base64
        console.log('📥 Downloading audio file...');
        let base64Audio;
        try {
          // Fetch audio file as blob
          const response = await fetch(audioUrl);
          if (!response.ok) {
            throw new Error(`Failed to download audio: ${response.status}`);
          }

          // Get as ArrayBuffer
          const arrayBuffer = await response.arrayBuffer();

          // Convert ArrayBuffer to base64 using proper method
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          base64Audio = btoa(binary);

          console.log('✅ Audio downloaded and converted to base64 (size: ' + base64Audio.length + ' bytes)');
        } catch (downloadError) {
          console.error('❌ Failed to download audio:', downloadError.message);
          throw new Error(`Không thể tải audio: ${downloadError.message}`);
        }

        // Submit audio captcha using AudioTask
        // API: https://api.2captcha.com/createTask
        // Task type: AudioTask (for mp3 audio files)
        const requestBody = {
          clientKey: this.apiKey,
          task: {
            type: "AudioTask",
            body: base64Audio,
            lang: "en",
            numeric: 1,
            minLength: 6,
            maxLength: 6,
            comment: "IMPORTANT: Extract ONLY the 6 DIGITS spoken in this audio. Return ONLY numbers (0-9), no letters or words. Example: 123456"
          }
        };

        console.log('📤 Submitting to:', `${CAPTCHA_API_BASE}/createTask`);
        console.log('📦 Request body (audio size: ' + base64Audio.length + ' bytes)');

        const submitResponse = await this.fetchWithRetry(`${CAPTCHA_API_BASE}/createTask`, {
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

        // 2Captcha returns {errorId: 0, taskId: "xxx"}
        if (submitData.errorId !== 0) {
          const errorMsg = submitData.errorDescription || 'Failed to submit';
          console.error('❌ API Error:', errorMsg);

          if (errorMsg.includes('key') || errorMsg.includes('KEY')) {
            throw new Error('API Key không đúng! Vui lòng kiểm tra lại.');
          } else if (errorMsg.includes('balance') || errorMsg.includes('BALANCE') || errorMsg.includes('số dư')) {
            throw new Error('Tài khoản hết credit! Vui lòng nạp thêm.');
          } else {
            throw new Error(errorMsg);
          }
        }

        // Poll for result
        const taskId = submitData.taskId;
        if (!taskId) {
          throw new Error('No task ID returned');
        }

        const result = await this.pollResult2Captcha(taskId);
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

        // Test API Key first
        console.log('🔍 Testing API Key before solving...');
        try {
          await this.testApiKey();
        } catch (testError) {
          console.error('❌ API Key test failed:', testError.message);
          throw new Error(`API Key không hợp lệ: ${testError.message}`);
        }

        // Submit audio captcha using AudioTask
        // API: https://api.2captcha.com/createTask
        const requestBody = {
          clientKey: this.apiKey,
          task: {
            type: "AudioTask",
            body: cleanBase64,
            lang: "en",
            numeric: 1,
            minLength: 6,
            maxLength: 6,
            comment: "IMPORTANT: Extract ONLY the 6 DIGITS spoken in this audio. Return ONLY numbers (0-9), no letters or words. Example: 123456"
          }
        };

        console.log('📤 Submitting to:', `${CAPTCHA_API_BASE}/createTask`);
        console.log('📦 Request body (audio size: ' + cleanBase64.length + ' bytes)');

        const submitResponse = await this.fetchWithRetry(`${CAPTCHA_API_BASE}/createTask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const submitData = await submitResponse.json();
        console.log('📤 Submit response:', submitData);

        if (submitData.errorId !== 0) {
          throw new Error(submitData.errorDescription || 'Failed to submit');
        }

        const taskId = submitData.taskId;
        const result = await this.pollResult2Captcha(taskId);

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
          clientKey: this.apiKey,
          task: {
            type: "ImageToTextTask",
            body: cleanBase64
          }
        };

        const submitResponse = await this.fetchWithRetry(`${CAPTCHA_API_BASE}/createTask`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const submitData = await submitResponse.json();
        console.log('📤 Submit response:', submitData);

        // Handle error
        if (submitData.errorId !== 0) {
          throw new Error(submitData.errorDescription || 'Failed to submit');
        }

        // Handle polling format {errorId: 0, taskId: "xxx"}
        if (submitData.taskId) {
          const taskId = submitData.taskId;
          const result = await this.pollResult2Captcha(taskId);
          return result;
        }

        throw new Error('Unknown API response format');

      } catch (error) {
        console.error('❌ Image captcha solve error:', error);
        throw error;
      }
    }

    /**
     * Poll for captcha result (2Captcha)
     */
    async pollResult2Captcha(taskId, maxAttempts = 60) {
      for (let i = 0; i < maxAttempts; i++) {
        await this.sleep(2000); // Wait 2 seconds

        try {
          console.log(`🔄 Polling attempt ${i + 1}/${maxAttempts}...`);

          // API: https://api.2captcha.com/getTaskResult
          const endpoint = `${CAPTCHA_API_BASE}/getTaskResult`;
          const requestBody = {
            clientKey: this.apiKey,
            taskId: taskId
          };

          const data = await this.fetchViaBackground(endpoint, 'POST', requestBody);

          console.log('📥 Poll response:', data);

          // Check if resolved
          if (data.status === 'ready' && data.solution) {
            // Success - extract solution text from various formats
            let result;

            // Format 1: solution.text (object with text property)
            if (typeof data.solution === 'object' && data.solution.text) {
              result = data.solution.text;
            }
            // Format 2: solution.token (object with token property)
            else if (typeof data.solution === 'object' && data.solution.token) {
              result = data.solution.token;
            }
            // Format 3: solution is string directly
            else if (typeof data.solution === 'string') {
              result = data.solution;
            }
            // Format 4: solution is object, try to get any text property
            else if (typeof data.solution === 'object') {
              result = JSON.stringify(data.solution);
            }
            else {
              result = String(data.solution);
            }

            // Trim whitespace
            result = result.trim();

            // PRIORITY 1: Try to convert Vietnamese number words to digits FIRST
            console.log('🇻🇳 Attempting to convert Vietnamese numbers...');
            const converted = this.convertVietnameseToDigits(result);
            if (converted !== result) {
              console.log('✅ Converted Vietnamese to digits:', converted);
              result = converted;
            }

            // PRIORITY 2: Extract only digits if result still contains non-digit characters
            // (in case 2Captcha returns mixed text and numbers)
            const digitsOnly = result.replace(/\D/g, '');
            if (digitsOnly.length > 0 && digitsOnly.length <= 10) {
              console.log('📊 Extracted digits from result:', digitsOnly);
              result = digitsOnly;
            }

            console.log('✅ Captcha resolved:', result);
            console.log('📊 Solution format:', typeof data.solution, data.solution);
            return result;
          } else if (data.status === 'processing') {
            // Still processing
            console.log('⏳ Still processing...');
            continue;
          } else if (data.errorId !== 0) {
            // Error
            throw new Error(data.errorDescription || 'Failed to get result');
          } else {
            // Unknown, continue
            console.log('⚠️ Unknown response status:', data);
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
     * Poll for captcha result (old autocaptcha format - deprecated)
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
