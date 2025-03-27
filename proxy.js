// proxy.js
const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');

// Read proxies from the proxies.txt file
const proxies = fs.readFileSync('proxies.txt', 'utf-8').split('\n').map(p => p.trim()).filter(Boolean);

// Function to get a proxy for each wallet or return null for no proxy
const getProxyForWallet = (index) => {
    const proxy = proxies[index % proxies.length];

    // Return null if the proxy is 'NaN' or any other word you choose to indicate no proxy
    if (!proxy || proxy?.toLowerCase() === 'nan' || proxy?.toLowerCase() === 'none') {
        return null;
    }
    return proxy;
};

// Function to create the appropriate proxy agent based on the protocol
const createProxyAgent = (proxy) => {
    const protocol = proxy.split(':')[0];

    if (protocol.includes('socks5')) {
        return new SocksProxyAgent(proxy);
    } else if (protocol.includes('http') || protocol.includes('https')) {
        return new HttpsProxyAgent(proxy);
    } else {
        throw new Error(`Unsupported proxy protocol: ${protocol}`);
    }
};

// Function to extract the IP address from the proxy URL
const extractProxyIp = (proxy) => {
    if (!proxy) return 'No Proxy';

    try {
        const url = new URL(proxy);
        return url.hostname;
    } catch (error) {
        return 'Invalid Proxy';
    }
};

// Function to make a request with proxy support
const requestWithProxy = async (url, proxy) => {
    let agent = null;

    if (proxy) {
        agent = createProxyAgent(proxy);  // Create the appropriate proxy agent if available
    }

    try {
        const config = agent ? { httpsAgent: agent } : {};

        const response = await axios.get(url, config);

        return response;
    } catch (error) {
        console.error(`❌ Request Error: ${error.message}`.red);
    }
};

module.exports = { getProxyForWallet, requestWithProxy, extractProxyIp };
