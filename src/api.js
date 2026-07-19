import { CONFIG } from './config';

export async function fetchStoreData() {
    return new Promise((resolve, reject) => {
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const hasValidKey = CONFIG.RECAPTCHA_SITE_KEY && CONFIG.RECAPTCHA_SITE_KEY !== 'YOUR_RECAPTCHA_SITE_KEY';

        if (isLocalhost) {
            console.log('Localhost detected, bypassing reCAPTCHA.');
            return requestDataWithToken(null).then(resolve).catch(reject);
        }

        if (!hasValidKey) {
            return requestDataWithToken(null).then(resolve).catch(reject);
        }

        if (typeof window.grecaptcha !== 'undefined') {
            executeRecaptcha(resolve, reject);
        } else {
            const script = document.createElement('script');
            script.src = `https://www.google.com/recaptcha/api.js?render=${CONFIG.RECAPTCHA_SITE_KEY}`;
            script.onload = () => executeRecaptcha(resolve, reject);
            script.onerror = () => {
                console.warn('Failed to load reCAPTCHA script. Proceeding without token.');
                requestDataWithToken(null).then(resolve).catch(reject);
            };
            document.head.appendChild(script);
        }
    });
}

function executeRecaptcha(resolve, reject) {
    window.grecaptcha.ready(function() {
        window.grecaptcha.execute(CONFIG.RECAPTCHA_SITE_KEY, {action: 'fetch_data'}).then(function(token) {
            requestDataWithToken(token).then(resolve).catch(reject);
        }).catch(function(err) {
            console.error("reCAPTCHA execute Error:", err);
            requestDataWithToken(null).then(resolve).catch(reject);
        });
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

