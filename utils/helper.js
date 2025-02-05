import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import fs from 'fs/promises';
import log from './logger.js';

// Delay function
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms * 1000));
}

// Save data to file
export async function saveToFile(filename, data) {
    try {
        await fs.appendFile(filename, `${data}\n`, 'utf-8');
        log.info(`Data has been saved to ${filename}`);
    } catch (error) {
        log.error(`Failed to save data to ${filename}: ${error.message}`);
    }
}

// Read account information from file
export async function readAccountsFromFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const lines = data.trim().split('\n');

        const accounts = lines
            .map(line => {
                const [token, reToken] = line.split('|');
                if (!token || !reToken) return null; 
                return { token: token.trim(), reToken: reToken.trim() };
            })
            .filter(account => account !== null); 

        return accounts;
    } catch (error) {
        log.error('Error reading account file:', error.message);
        return [];
    }
}

// Read file content
export async function readFile(pathFile) {
    try {
        const datas = await fs.readFile(pathFile, 'utf8');
        return datas.split('\n')
            .map(data => data.trim())
            .filter(data => data.length > 0);
    } catch (error) {
        log.error(`Error reading file: ${error.message}`);
        return [];
    }
}

// Create proxy agent
export const newAgent = (proxy = null) => {
    if (!proxy) return null;
    
    try {
        // Handle proxy format with username and password
        if (proxy.includes('@')) {
            return new HttpsProxyAgent(`http://${proxy}`);
        }
        
        // Handle format: ip:port:user:pass
        const parts = proxy.split(':');
        if (parts.length === 4) {
            const [ip, port, user, pass] = parts;
            return new HttpsProxyAgent(`http://${user}:${pass}@${ip}:${port}`);
        }
        
        // Handle format: ip:port
        if (parts.length === 2) {
            return new HttpsProxyAgent(`http://${proxy}`);
        }

        // If the protocol is already included, use it directly
        if (proxy.startsWith('http://') || proxy.startsWith('https://') || 
            proxy.startsWith('socks4://') || proxy.startsWith('socks5://')) {
            return proxy.startsWith('socks') ? new SocksProxyAgent(proxy) : new HttpsProxyAgent(proxy);
        }

        // Default to adding http:// prefix
        return new HttpsProxyAgent(`http://${proxy}`);
    } catch (error) {
        log.error(`Invalid proxy format: ${proxy}`, error.message);
        return null;
    }
};

