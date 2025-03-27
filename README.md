# GasFlowBot

**GasFlowBot** is an automated bot for **daily transactions** and **faucet requests** for the **Gasdotzip Testnet Faucet**. This bot helps simplify the process of making daily faucet requests and handling transactions automatically.

## Features
- **Auto Daily Transaction**: Automatically handles daily transactions for you.
- **Auto Get Faucets**: Automatically requests faucets at set intervals.
- **Proxy Support** (Optional): Allows you to use proxies for requests.

## Requirements
- **Node.js**: Ensure you have Node.js installed. [Download Node.js](https://nodejs.org/)
- **npm**: Ensure you have npm installed. npm comes bundled with Node.js.

## Setup

### 1. Clone the repository

Clone this repository to your local machine:

```bash
git clone https://github.com/Nobhokleng/GasFlowBot.git
cd GasFlowBot
```

### 2. Install dependencies

Run the following command to install all required dependencies:

```bash
npm install
```

### 3. Set up wallet (public key)
Uou can add them in the wallets.txt file (one wallet per line).

Open the proxies.txt file:

```bash
vim wallets.txt
```

### 3. Optional: Set up proxy support
If you want to use proxies, you can add them in the proxies.txt file (one proxy per line). The bot supports both HTTP and SOCKS5 proxy protocols.

Open the proxies.txt file:

```bash
vim proxies.txt
```

Add proxies in the following format:

- For HTTP: http://user:password@ip:port
- For SOCKS5: socks5://user:password@ip:port

### 4. Run the script

Once dependencies are installed and your proxies (if any) are configured, run the bot:

```bash
npm start
```

The bot will begin making automatic faucet requests and handling daily transactions.