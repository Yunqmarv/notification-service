const axios = require('axios');
const Logger = require('../utils/logger');

class UserClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL;
        this.timeout = config.timeout;
        this.retries = config.retries;
        this.retryDelay = config.retryDelay;

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            response => response,
            error => {
                Logger.error('User service request failed', {
                    url: error.config?.url,
                    method: error.config?.method,
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Get user identity by user ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - User data
     */
    async getUserIdentity(userId) {
        try {
            const response = await this.retryRequest(async () => {
                return await this.client.post('/user/get-user-identity', {
                    user_id: userId
                });
            });

            if (response.data.success && response.data.data) {
                Logger.debug('Successfully retrieved user identity', {
                    userId,
                    email: response.data.data.email
                });
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to retrieve user identity');
            }

        } catch (error) {
            Logger.error('Failed to get user identity', {
                userId,
                error: error.message,
                status: error.response?.status
            });
            throw error;
        }
    }

    /**
     * Get user email specifically
     * @param {string} userId - User ID
     * @returns {Promise<string|null>} - User email
     */
    async getUserEmail(userId) {
        try {
            const userData = await this.getUserIdentity(userId);
            return userData.email || null;
        } catch (error) {
            Logger.warn('Could not retrieve user email from user service', {
                userId,
                error: error.message
            });
            return null;
        }
    }

    /**
     * Retry request with exponential backoff
     * @param {Function} requestFn - Request function to retry
     * @returns {Promise} - Request response
     */
    async retryRequest(requestFn) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                
                if (attempt === this.retries) {
                    break;
                }

                // Don't retry on client errors (4xx)
                if (error.response?.status >= 400 && error.response?.status < 500) {
                    break;
                }

                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                Logger.debug(`Retrying user service request in ${delay}ms (attempt ${attempt}/${this.retries})`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    /**
     * Check if user service is healthy
     * @returns {Promise<Object>} - Health status
     */
    async checkHealth() {
        try {
            // Use a test user ID to check if the service responds
            const response = await this.client.post('/user/get-user-identity', {
                user_id: 'health_check'
            }, {
                timeout: 5000
            });

            // Even if the user doesn't exist, a proper response structure indicates health
            return {
                healthy: true,
                status: 'ok',
                responseTime: Date.now()
            };

        } catch (error) {
            return {
                healthy: false,
                error: error.message,
                status: error.response?.status || 'unknown'
            };
        }
    }
}

module.exports = UserClient;
