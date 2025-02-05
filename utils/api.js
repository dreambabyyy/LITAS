import axios from 'axios';
import log from "./logger.js"
import { newAgent } from './helper.js';

// Create an axios instance with timeout and retry support
const createAxiosInstance = (proxy) => {
    const agent = newAgent(proxy);
    return axios.create({
        timeout: 30000,
        httpsAgent: agent,
        proxy: false,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/json',
            'Origin': 'https://www.wallet.litas.io',
            'Referer': 'https://www.wallet.litas.io/',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
        },
        validateStatus: function (status) {
            return status >= 200 && status < 500;
        },
        maxRedirects: 5,
        decompress: true
    });
};

// Get a new access token
export async function getNewToken(token, refreshToken, proxy) {
    const axiosInstance = createAxiosInstance(proxy);
    try {
        log.info('Attempting to refresh token...');
        const response = await axiosInstance.post('https://wallet.litas.io/api/v1/auth/refresh', {
            refreshToken: refreshToken
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Origin': 'https://www.wallet.litas.io',
                'Referer': 'https://www.wallet.litas.io/',
                'Content-Type': 'application/json'
            }
        });

        log.info('Token refresh response status:', response.status);

        // Check response data
        if (!response.data) {
            log.error('Token refresh response is empty');
            return null;
        }

        // Log response data for debugging
        log.info('Token refresh response:', response.data);

        if (!response.data.accessToken || !response.data.refreshToken) {
            log.error('Invalid token refresh response format');
            return null;
        }

        return {
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken
        };
    } catch (error) {
        if (error.response) {
            if (error.response.status === 401) {
                log.error('Refresh token has expired, login required');
                log.error('Error response:', error.response.data);
                return "invalid_token";
            }
            log.error('Token refresh failed, status code:', error.response.status);
            log.error('Error response:', error.response.data);
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            log.error('Proxy connection failed:', error.message);
        } else {
            log.error('Unknown error:', error.message);
            if (error.stack) {
                log.error('Error stack:', error.stack);
            }
        }
        return null;
    }
}

// Get user farm information
export async function getUserFarm(token, proxy) {
    const axiosInstance = createAxiosInstance(proxy);
    try {
        log.info('Fetching farm information...');
        const response = await axiosInstance.get('https://wallet.litas.io/api/v1/miner/current-user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Origin': 'https://www.wallet.litas.io',
                'Referer': 'https://www.wallet.litas.io/',
                'Content-Type': 'application/json'
            }
        });
        
        log.info('Response status:', response.status);
        
        if (response.status === 401) {
            log.warn('Token needs to be refreshed');
            return "unauth";
        }
        
        if (!response.data) {
            log.error('Farm information response is empty');
            return null;
        }
        
        log.info('Farm information response:', response.data);
        return response.data;
    } catch (error) {
        if (error.response) {
            if (error.response.status === 401) {
                log.warn('Token needs to be refreshed');
                return "unauth";
            }
            log.error('Failed to fetch farm information, status code:', error.response.status);
        } else if (error.code) {
            if (['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT'].includes(error.code)) {
                log.error('Proxy connection failed:', error.message);
            } else {
                log.error('Network error:', error.code, error.message);
            }
        } else {
            log.error('Unknown error:', error.message);
        }
        return null;
    }
}

// Activate mining
export async function activateMining(token, proxy) {
    const axiosInstance = createAxiosInstance(proxy);
    try {
        const response = await axiosInstance.patch(
            'https://wallet.litas.io/api/v1/miner/activate',
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        if (error.response) {
            if (error.response.status === 401) {
                return "unauth";
            } else if (error.response.status === 409) {
                log.info('Mining is already activated');
                return "activated";
            }
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            log.error('Proxy connection failed:', error.message);
        } else if (error.response) {
            log.error('API response error:', error.response.data);
        } else {
            log.error('Request error:', error.message);
        }
        return null;
    }
}

// Claim mining rewards
export async function claimMining(token, proxy) {
    const axiosInstance = createAxiosInstance(proxy);
    try {
        const response = await axiosInstance.patch(
            'https://wallet.litas.io/api/v1/miner/claim',
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 401) {
            return "unauth";
        } else if (error.response && error.response.status === 409) {
            return "Reward already claimed";
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            log.error('Proxy connection failed:', error.message);
        } else if (error.response) {
            log.error('API response error:', error.response.data);
        } else {
            log.error('Request error:', error.message);
        }
        return null;
    }
}

