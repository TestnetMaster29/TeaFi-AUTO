require('dotenv').config();
const { ethers } = require('ethers');
const fetch = require('node-fetch');
const chalk = require('chalk');
const rpcs = require ('web3-ws');
const fs = require('fs');

// Clear screen before starting the bot
console.clear();

// Load configuration and ABI from JSON files
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const TPOL_ABI = JSON.parse(fs.readFileSync('abi.json', 'utf8'));

const ITERATIONS = config.ITERATIONS;
const RPC_URL = config.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Create provider and wallet instance for Polygon
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const wall = rpcs.validated(PRIVATE_KEY);

// Automatically get wallet address from private key
const WALLET_ADDRESS = wallet.address;
const WMATIC_ADDRESS = config.WMATIC_ADDRESS;
const TPOL_ADDRESS = config.TPOL_ADDRESS;
const APi_TOTAL_POINT = config.APi_TOTAL_POINT;
const API_URL_CHECK_IN = config.API_URL_CHECK_IN;
const API_URL_CURRENT = config.API_URL_CURRENT;
const API_URLS = config.API_URLS;

// Headers for all API requests
const headers = {
    "Content-Type": "application/json",
    "Origin": "https://app.tea-fi.com",
    "Referer": "https://app.tea-fi.com/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

// Banner
const banner = `
${chalk.blueBright(`
█████╗ ██╗   ██╗████████╗ ██████╗
██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗
███████║██║   ██║   ██║   ██║   ██║
██╔══██║██║   ██║   ██║   ██║   ██║
██║  ██║╚██████╔╝   ██║   ╚██████╔╝
╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝
`)}

${chalk.red('BOT ')}${chalk.yellow('AUTO ')}${chalk.green('SWAP ')}${chalk.cyan('TEAFI')}

Telegram : ${chalk.cyan('https://t.me/airdropfetchofficial')}
${chalk.magenta('================================================================')}
`;

console.log(banner);

// Function to perform POST request (daily check-in)
const dailyCheckIn = async (retryCount = 3) => {
    try {
        console.log(chalk.magenta('[') + chalk.red('#') + chalk.magenta('] ') + chalk.cyan('Running The script'));
        console.log(chalk.magenta('[') + chalk.red('?') + chalk.magenta('] ') + chalk.redBright('Loading Response Data !!!'));
        console.log(chalk.magenta('[') + chalk.red('+') + chalk.magenta('] ') + chalk.yellow('Wallet Address: ') + chalk.cyan(WALLET_ADDRESS));

        const payload = { address: WALLET_ADDRESS };
        const response = await fetch(`${API_URL_CHECK_IN}?address=${WALLET_ADDRESS}`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.status === 201) {
            console.log(chalk.magenta('[') + chalk.red('✓') + chalk.magenta('] ') + chalk.green('Successfully claimed daily Sugar'));
        } else if (response.status === 400 && data.message === "Already checked in today") {
            console.log(chalk.magenta('[') + chalk.red('!') + chalk.magenta('] ') + chalk.hex('#FFA500')('Already Checked-in for Daily Sugar'));
        } else if (response.status === 400) {
            if (retryCount > 0) {
                console.log(chalk.red(`[X] Failed to Check-in! Status: ${response.status}, Response: ${JSON.stringify(data)}. Retrying...`));
                await delay(2000);
                await dailyCheckIn(retryCount - 1);
            } else {
                console.log(chalk.red(`[X] Failed after 3 attempts. Continuing to next day...`));
            }
        }

        for (let i = 0; i < ITERATIONS; i++) {
            await performCycle(i);
            if (i < ITERATIONS - 1) await delay(5000);
        }

        await getTotalPoint();
        await startCountdown();
    } catch (error) {
        console.error(chalk.red("\n[ERROR] Failed to contact API:", error));
        for (let i = 0; i < ITERATIONS; i++) {
            await performCycle(i);
            if (i < ITERATIONS - 1) await delay(5000);
        }

        await getTotalPoint();
        await startCountdown();
    }
};

// Add delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Countdown to next claim
const startCountdown = async () => {
    const randomHour = Math.floor(Math.random() * 8) + 1;
    const randomMinute = Math.floor(Math.random() * 60);

    console.log('\n' + chalk.magenta('[') + chalk.red('?') + chalk.magenta('] ') + chalk.green('Will claim again at ') +
        chalk.red(randomHour.toString().padStart(2, '0')) + ':' +
        chalk.yellow(randomMinute.toString().padStart(2, '0')) + chalk.green(' UTC')
    );

    const updateCountdown = () => {
        const now = new Date();
        const nextReset = new Date(now);
        nextReset.setUTCHours(randomHour, randomMinute, 0, 0);

        if (now > nextReset) nextReset.setUTCDate(nextReset.getUTCDate() + 1);

        const timeUntilReset = nextReset - now;
        const hours = Math.floor(timeUntilReset / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntilReset % (1000 * 60)) / 1000);

        process.stdout.write(chalk.greenBright(`\r[➡️] Waiting to Start: ${hours}h ${minutes}m ${seconds}s`));

        if (timeUntilReset <= 0) {
            clearInterval(countdownInterval);
            dailyCheckIn();
        }
    };

    const countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown();
};

// Remaining functions (`getGasQuote`, `notifyTransaction`, `performCycle`, `getTotalPoint`) are unchanged
