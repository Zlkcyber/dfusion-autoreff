import { Solver } from "@2captcha/captcha-solver";
import anticaptcha from "@antiadmin/anticaptchaofficial";
import log from './logger.js';
const pageurl = "https://genesis.dfusion.ai/";
const sitekey = "0x4AAAAAAA4Dne9x4EqprJ1Y";

/**
 * Solve CAPTCHA using 2Captcha API
 * @param {string} key - 2Captcha API key
 * @returns {Promise<string>} - Solved CAPTCHA token
 */
export async function solve2Captcha(key) {
    const solver = new Solver(key);

    try {
        log.info("Trying To Solve Captcha...");
        const result = await solver.cloudflareTurnstile({ pageurl, sitekey });
        return result.data; // Return the solved token
    } catch (err) {
        throw new Error(`2Captcha Error: ${err.message}`);
    }
}

/**
 * Solve CAPTCHA using Anti-Captcha API
 * @param {string} key - Anti-Captcha API key
 * @returns {Promise<string>} - Solved CAPTCHA token
 */
export async function solveAntiCaptcha(key) {
    anticaptcha.setAPIKey(key);

    try {
        const token = await anticaptcha.solveTurnstileProxyless(pageurl, sitekey);
        console.log("Anti-Captcha Solved!");
        return token; // Return the solved token
    } catch (err) {
        throw new Error(`Anti-Captcha Error: ${err.message}`);
    }
}
