import axios from 'axios';
import { Wallet } from 'ethers';
import { solve2Captcha, solveAntiCaptcha } from './utils/solver.js';
import log from './utils/logger.js';
import readline from 'readline';
import bedduSalama from './utils/banner.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

async function prompt(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}

async function getCaptchaSolver() {
    const solverChoice = await prompt(
        'Which captcha solver would you like to use?\n1. 2Captcha\n2. Anti-Captcha\nChoose an option (1 or 2): '
    );

    let solver = null;
    if (solverChoice === '1') {
        solver = '2captcha';
    } else if (solverChoice === '2') {
        solver = 'anticaptcha';
    } else {
        log.error('Invalid choice. Please enter 1 for 2Captcha or 2 for AntiCaptcha.');
        return null;
    }
    const apiKey = await prompt('Enter your API key for captcha solver: ');
    if (!apiKey) {
        log.error('API key cannot be empty.');
        return null;
    }
    const numberRef = await prompt('How Many Referral you want to generate: ');
    if (isNaN(numberRef) || Number(numberRef) <= 0) {
        log.error('Invalid number of referrals. Please enter a positive number.');
        return;
    }
    const reffCode = await prompt('Enter your Dfusion Referral code (example: 3p249ipz): ');

    return { solver, apiKey, reffCode, numberRef };
}

async function getMsg(payload) {
    const url = 'https://dfusion.app.cryptolock.ai/auth/newsiwemessage';
    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        log.error('Error:', error.response?.data || error.message);
        return null;
    }
}

async function loginWallet(msg, Signature, solver, apiKey, reffCode = '3p249ipz') {
    const url = 'https://dfusion.app.cryptolock.ai/auth/users';
    const payload = {
        SiweEncodedMessage: msg,
        Signature,
        Email: "",
        ReferralCode: reffCode,
    };

    try {
        const captchaToken = solver === 'anticaptcha'
            ? await solveAntiCaptcha(apiKey)
            : await solve2Captcha(apiKey);

        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'turnstile-login-token': captchaToken,
            },
        });
        return response.data;
    } catch (error) {
        log.error('Error posting payload:', error.response?.data || error.message);
        return null;
    }
}

async function signMessage(privateKey, message) {
    try {
        const wallet = new Wallet(privateKey);
        const signature = await wallet.signMessage(message);
        return signature;
    } catch (error) {
        log.error('Error signing the message:', error.message);
        return null;
    }
}

async function main() {
    log.info(bedduSalama);
    const solverConfig = await getCaptchaSolver();
    if (!solverConfig) {
        rl.close();
        return;
    }

    const { solver, apiKey, reffCode, numberRef } = solverConfig;
    rl.close();

    for (let i = 1; i <= numberRef; i++) {
        log.info(`Generating referral: ${i} of ${numberRef} Using referral code: ${reffCode}`);
        const wallet = Wallet.createRandom();
        const msg = await getMsg(wallet.address);
        if (!msg) {
            return;
        } else {
            const sign = await signMessage(wallet.privateKey, msg);
            if (!sign) {
                return;
            } else {
                const res = await loginWallet(msg, sign, solver, apiKey, reffCode);
                if (res) {
                    log.info(`Referral ${i} generated successfully.`);
                }
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    log.info('All referrals generated successfully.');
}

main();
