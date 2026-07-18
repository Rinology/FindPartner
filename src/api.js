import { CONFIG } from './config';

export async function fetchStoreData() {
    return new Promise((resolve, reject) => {
        if (CONFIG.RECAPTCHA_SITE_KEY && CONFIG.RECAPTCHA_SITE_KEY !== 'YOUR_RECAPTCHA_SITE_KEY' && typeof window.grecaptcha !== 'undefined') {
            window.grecaptcha.ready(function() {
                window.grecaptcha.execute(CONFIG.RECAPTCHA_SITE_KEY, {action: 'fetch_data'}).then(function(token) {
                    requestDataWithToken(token).then(resolve).catch(reject);
                }).catch(function(err) {
                    console.error("reCAPTCHA execute Error:", err);
                    requestDataWithToken(null).then(resolve).catch(reject);
                });
            });
        } else {
            requestDataWithToken(null).then(resolve).catch(reject);
        }
    });
}

async function requestDataWithToken(token) {
    const headers = {};
    if (token) {
        headers['X-Recaptcha-Token'] = token;
    }

    try {
        const res = await fetch(CONFIG.GAS_URL, { headers });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    } catch (err) {
        console.error("Data Fetch Error:", err);
        throw err;
    }
}

