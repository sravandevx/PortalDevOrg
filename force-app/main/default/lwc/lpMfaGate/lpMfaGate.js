import { LightningElement, track } from 'lwc';
import checkMfaEnrollment from '@salesforce/apex/LP_MfaGateController.checkMfaEnrollment';
import basePath from '@salesforce/community/basePath';

const MAX_REDIRECT_COUNT = 3;
const REDIRECT_STORAGE_KEY = 'lp_mfa_redirect_count';
const REDIRECT_TIMESTAMP_KEY = 'lp_mfa_redirect_ts';
const REDIRECT_WINDOW_MS = 60000; // 1 minute window for loop detection

export default class LpMfaGate extends LightningElement {
    @track isChecking = true;
    @track requiresEnrollment = false;
    @track showContent = false;
    @track isRedirecting = false;
    @track isLoopDetected = false;

    connectedCallback() {
        console.log('[MFA Gate] Component loaded, checking enrollment...');
        this.performMfaCheck();
    }

    async performMfaCheck() {
        try {
            const result = await checkMfaEnrollment();
            console.log('[MFA Gate] Apex result:', JSON.stringify(result));

            if (result.requiresEnrollment) {
                console.log('[MFA Gate] MFA enrollment required — showing interstitial');
                if (this.isRedirectLoop()) {
                    console.log('[MFA Gate] Redirect loop detected — showing error');
                    this.isLoopDetected = true;
                    this.isChecking = false;
                    return;
                }
                this.requiresEnrollment = true;
                this.isChecking = false;
            } else {
                console.log('[MFA Gate] MFA check passed — showing content');
                this.clearRedirectCounter();
                this.showContent = true;
                this.isChecking = false;
            }
        } catch (error) {
            // Fail open — show content rather than blocking the user
            console.error('[MFA Gate] Check failed, failing open:', error);
            this.showContent = true;
            this.isChecking = false;
        }
    }

    handleContinueToSetup() {
        this.isRedirecting = true;
        this.incrementRedirectCounter();

        const loginUrl = (basePath || '') + '/s/login?mfa=setup';
        const logoutUrl = (basePath || '') + '/secur/logout.jsp?retUrl=' +
            encodeURIComponent(loginUrl);
        window.location.href = logoutUrl;
    }

    // --- Loop detection ---

    isRedirectLoop() {
        try {
            const timestamp = sessionStorage.getItem(REDIRECT_TIMESTAMP_KEY);
            const count = parseInt(sessionStorage.getItem(REDIRECT_STORAGE_KEY) || '0', 10);

            if (timestamp) {
                const elapsed = Date.now() - parseInt(timestamp, 10);
                if (elapsed > REDIRECT_WINDOW_MS) {
                    this.clearRedirectCounter();
                    return false;
                }
            }
            return count >= MAX_REDIRECT_COUNT;
        } catch (e) {
            return false;
        }
    }

    incrementRedirectCounter() {
        try {
            const count = parseInt(sessionStorage.getItem(REDIRECT_STORAGE_KEY) || '0', 10);
            sessionStorage.setItem(REDIRECT_STORAGE_KEY, String(count + 1));
            if (!sessionStorage.getItem(REDIRECT_TIMESTAMP_KEY)) {
                sessionStorage.setItem(REDIRECT_TIMESTAMP_KEY, String(Date.now()));
            }
        } catch (e) {
            // sessionStorage unavailable
        }
    }

    clearRedirectCounter() {
        try {
            sessionStorage.removeItem(REDIRECT_STORAGE_KEY);
            sessionStorage.removeItem(REDIRECT_TIMESTAMP_KEY);
        } catch (e) {
            // sessionStorage unavailable
        }
    }
}
