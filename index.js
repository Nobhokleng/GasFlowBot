const fs = require('fs');
const colors = require('colors');
const { getProxyForWallet, requestWithProxy, extractProxyIp } = require('./proxy');
const { ELIGIBILITY_URL, DEPOSIT_URL, MAX_RETRIES, RETRY_DELAY, MIN_DELAY, MAX_DELAY, RUN_INTERVAL_HOURS } = require('./config');

const wallets = fs.readFileSync('wallets.txt', 'utf-8').split('\n').map(w => w.trim()).filter(Boolean);

// Delay function to avoid rate limits
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry handler for proxy requests
const requestWithRetry = async (url, proxy) => {
    console.log(`🔄 Making request using proxy: ${extractProxyIp(proxy)}\n`.cyan);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await requestWithProxy(url, proxy);
            if (response.status === 200) return response;
        } catch (error) {
            console.error(`❌ Attempt ${attempt} failed: ${error.message}`.bold.red);
            if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY);
        }
    }
    
    throw new Error(`Failed to request ${url} after ${MAX_RETRIES} attempts`);
};

const requestFaucet = async (wallet, index) => {
    try {
        console.log(`🔎 Checking eligibility for wallet: ${wallet.bold.green}`);

        const eligibilityUrl = `${ELIGIBILITY_URL}${wallet}`;
        const proxy = getProxyForWallet(index);

        // Introduce delay only if no proxy is available
        if (!proxy) {
            const delay = getRandomDelay();
            console.log(`⏳ No proxy detected, waiting for ${delay / 1000} seconds to avoid rate limits...\n`.bold.yellow);
            await sleep(delay);
        }

        // Step 1: Request eligibility
        const eligibleResponse = await requestWithRetry(eligibilityUrl, proxy);
        const data = eligibleResponse.data;

        if (data.eligibility === 'CLAIMED') {
            console.log(`🚫 Wallet already claimed: ${wallet.bold.yellow}`);
            console.log(`  Last Claim Time: ${new Date(data.last_claim_time * 1000).toLocaleString()}`.gray);
            console.log(`  Num Transactions: ${data.num_deposits}`.gray);
            console.log(`  Reward Amount: ${data.reward_amount}`.gray);
            return;
        } else if (data.eligibility == 'INELIGIBLE') {
            console.log(`🚫 Wallet is ineligible: ${wallet.bold.yellow}`);
            console.log(`  Num Transactions: ${data.num_deposits}`.gray);
            return;
        }

        console.log('✅ Eligibility confirmed'.bold.green);

        const hashTranx = data?.tx_hash || null;
        if (!hashTranx) {
            console.error(`❌ Failed to retrieve transaction hash: ${data}`.bold.red);
            return;
        }
        console.log(`🔗 Transaction Hash: ${hashTranx.bold.blue}`);
        await sleep(5000);

        // Step 2: Request claim faucet
        console.log('💸 Requesting claim faucet'.bold.magenta);
        const depositUrl = `${DEPOSIT_URL}${hashTranx}`;
        const claimFaucetResponse = await requestWithProxy(depositUrl, proxy);

        if (claimFaucetResponse.status === 200) {
            console.log('✅ Claim faucet successful'.bold.green);
            console.log(`  Claim Time: ${new Date(claimFaucetResponse.data.deposit.time * 1000).toLocaleString()}`.gray);
            console.log(`  Reward Amount: ${claimFaucetResponse.data.deposit.usd}`.gray);
        } else {
            console.error('❌ Claim faucet failed'.bold.red);
        }
    } catch (error) {
        console.error(`🚨 Error processing wallet ${wallet}: ${error.message}`.bold.red);
    }
};

function getRandomDelay() {
    return Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1)) + MIN_DELAY;
}

const runFaucet = async () => {
    console.log('🚀 Starting Faucet Automation...\n'.cyan.bold);

    // Use parallel processing (adjust concurrency as needed)
    await Promise.all(wallets.map(async (wallet, index) => {
        console.log(`⚡ Processing wallet: ${wallet.bold.green}`);
        await requestFaucet(wallet, index);
        console.log(`✅ Completed wallet: ${wallet.bold.green}\n`);
    }));

    console.log('🎯 All wallets processed!'.cyan.bold);

    // Schedule the next run after 12 hours + random delay
    const totalDelay = (RUN_INTERVAL_HOURS * 60 * 60 * 1000) + (getRandomDelay() * 10);
    const totalDelayInMinutes = totalDelay / (60 * 1000);

    console.log(`⏳ Next run in ${RUN_INTERVAL_HOURS} hours and ${Math.floor(totalDelayInMinutes % 60)} minutes`.bold.cyan);

    setTimeout(runFaucet, totalDelay);
};

// Start immediately
runFaucet();