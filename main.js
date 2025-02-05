import log from "./utils/logger.js"
import bedduSalama from "./utils/banner.js"
import { delay, readAccountsFromFile, readFile } from './utils/helper.js';
import { claimMining, getNewToken, getUserFarm, activateMining } from './utils/api.js';
import fs from 'fs/promises';
import readline from 'readline';

// Create readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Encapsulated question function
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Function to refresh access token
async function refreshAccessToken(token, refreshToken, proxy) {
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
        const refresh = await getNewToken(token, refreshToken, proxy);
        
        if (refresh === "invalid_token") {
            log.error('Refresh token has expired, re-login is required');
            return null;
        }
        
        if (refresh && refresh.accessToken && refresh.refreshToken) {
            log.info('Token refreshed successfully');
            return refresh;
        }

        retryCount++;
        if (retryCount >= maxRetries) {
            log.error('Too many failed attempts to refresh token, skipping current account');
            return null;
        }

        log.info(`Token refresh failed, retrying... (${retryCount}/${maxRetries})`);
        await delay(3);
    }

    return null;
}

// Function to activate mining process
async function activateMiningProcess(token, refreshToken, proxy) {
    let activate;
    let retryCount = 0;
    const maxRetries = 3;

    do {
        activate = await activateMining(token, proxy);
        if (activate === "unauth") {
            log.warn('Unauthorized, refreshing token...');
            const refreshedTokens = await refreshAccessToken(token, refreshToken, proxy);
            if (!refreshedTokens) {
                throw new Error('Unable to refresh token, please check account information');
            }
            token = refreshedTokens.accessToken;
            refreshToken = refreshedTokens.refreshToken;
        } else if (activate === "activated") {
            return token;  // If already activated, return immediately
        } else if (!activate) {
            retryCount++;
            if (retryCount >= maxRetries) {
                throw new Error('Too many failed activation attempts');
            }
            log.info(`Activation failed, retrying... (${retryCount}/${maxRetries})`);
            await delay(3);
        }
    } while (!activate || activate === "unauth");

    log.info('Mining successfully activated');
    return token;
}

// Function to get user farm information
async function getUserFarmInfo(accessToken, refreshToken, proxy, index) {
    let userFarmInfo;
    let currentToken = accessToken;
    let currentRefreshToken = refreshToken;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
        userFarmInfo = await getUserFarm(currentToken, proxy);
        
        if (userFarmInfo === "unauth") {
            log.info('Token expired, refreshing...');
            const refreshedTokens = await refreshAccessToken(currentToken, currentRefreshToken, proxy);
            if (!refreshedTokens) {
                throw new Error('Unable to refresh token, please check account information');
            }
            currentToken = refreshedTokens.accessToken;
            currentRefreshToken = refreshedTokens.refreshToken;
            continue;  // Retry with new token
        }
        
        if (userFarmInfo) {
            const { status, totalMined } = userFarmInfo;
            log.info(`Account ${index} farm info:`, { status, totalMined });
            return {
                userFarmInfo,
                accessToken: currentToken,
                refreshToken: currentRefreshToken
            };
        }

        retryCount++;
        if (retryCount >= maxRetries) {
            throw new Error(`Account ${index} failed to retrieve farm info, max retries reached`);
        }
        log.warn(`Account ${index} failed to retrieve farm info, retrying... (${retryCount}/${maxRetries})`);
        await delay(3);
    }

    throw new Error(`Account ${index} failed to retrieve farm info`);
}

// Function to handle mining rewards
async function handleFarming(userFarmInfo, token, refreshToken, proxy) {
    const canBeClaimedAt = new Date(userFarmInfo.canBeClaimedAt).getTime();
    const timeNow = new Date().getTime();

    if (canBeClaimedAt < timeNow) {
        log.info('Mining rewards can be claimed, attempting to claim...');
        let claimResponse;

        do {
            claimResponse = await claimMining(token, proxy);
            if (!claimResponse) log.info('Failed to claim mining rewards, retrying...');
            await delay(3);
        } while (!claimResponse);

        log.info('Mining rewards claim response:', claimResponse);
        await activateMiningProcess(token, refreshToken, proxy)
    } else {
        log.info('Mining rewards can be claimed at:', new Date(canBeClaimedAt).toLocaleString())
    }
}

// Main function
async function main() {
    log.info(bedduSalama);
    
    // User inputs multiple account information
    log.info('Please enter account information (leave blank to finish)');
    const accounts = [];
    
    while (true) {
        const accountNum = accounts.length + 1;
        log.info(`\nEntering account ${accountNum}:`);
        
        const token = await question('Enter token (press enter to finish): ');
        if (!token.trim()) {
            break;
        }
        
        const refreshToken = await question('Enter refreshToken: ');
        if (!refreshToken.trim()) {
            log.warn('refreshToken cannot be empty, please re-enter this account');
            continue;
        }

        accounts.push({ token: token.trim(), refreshToken: refreshToken.trim() });
        log.info(`Account ${accountNum} added successfully`);
    }

    if (accounts.length === 0) {
        log.error('No account information entered!');
        rl.close();
        process.exit(1);
    }

    log.info(`Successfully read ${accounts.length} accounts`);

    // User inputs proxy
    log.info('Supported proxy formats:');
    log.info('1. ip:port');
    log.info('2. ip:port:username:password');
    log.info('3. username:password@ip:port');
    log.info('4. http://ip:port or socks5://ip:port');
    const proxyInput = await question('Enter proxy address (comma-separated, press enter to skip): ');
    const proxies = proxyInput ? proxyInput.split(',').map(p => p.trim()).filter(p => p) : [];
    
    // User inputs check interval
    const checkInterval = parseInt(await question('Enter check interval (hours) (press enter for default 1 hour): ')) || 1;
    
    log.info('Starting program...');
    log.info(`Configuration:\n- Accounts: ${accounts.length}\n- Proxies: ${proxies.length || 'No proxy'}\n- Check interval: ${checkInterval} hours`);

    // Main loop
    while (true) {
        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            const proxy = proxies.length > 0 ? proxies[i % proxies.length] : null;
            
            try {
                log.info(`Processing account ${i + 1}/${accounts.length}, using proxy: ${proxy || "No proxy"}`);
                const { userFarmInfo, accessToken, refreshToken } = await getUserFarmInfo(
                    account.token,
                    account.refreshToken,
                    proxy,
                    i + 1
                );
                await activateMiningProcess(accessToken, refreshToken, proxy);
                await handleFarming(userFarmInfo, accessToken, refreshToken, proxy);

                // Update account token
                account.token = accessToken;
                account.refreshToken = refreshToken;
            } catch (error) {
                log.error(`Account ${i + 1} encountered an error:`, error.message);
            }
            await delay(3);
        }

        log.info(`All accounts processed, waiting ${checkInterval} hours for the next round...`);
        await delay(checkInterval * 60 * 60);
    }
}

// Function to write account information to a file
async function writeAccountsToFile(filename, accounts) {
    const data = accounts.map(account => `${account.token}|${account.reToken}`).join('\n');
    await fs.writeFile(filename, data, 'utf-8');
}

// Modify process exit handling to ensure readline is properly closed
process.on('SIGINT', () => {
    log.warn(`Received SIGINT signal, cleaning up and exiting program...`);
    rl.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    log.warn(`Received SIGTERM signal, cleaning up and exiting program...`);
    rl.close();
    process.exit(0);
});

main().catch(error => {
    log.error('Program encountered an error:', error);
    rl.close();
    process.exit(1);
});

