import { LightningElement, track, api } from 'lwc';
import login from '@salesforce/apex/CustomLoginController.login';
import { NavigationMixin } from 'lightning/navigation';
import neuroNoiseSrc from '@salesforce/resourceUrl/neuroNoise';
import fundPanelLogoSrc from '@salesforce/resourceUrl/fundPanelLogo';

export default class CustomLogin extends NavigationMixin(LightningElement) {
    @api startUrl; // Configurable via Builder
    @track username = '';
    bgVideoSrc = neuroNoiseSrc;
    logoSrc = fundPanelLogoSrc;
    @track password = '';
    @track errorMessage = '';
    @track isLoading = false;

    handleUsernameChange(event) {
        this.username = event.target.value;
    }

    handlePasswordChange(event) {
        this.password = event.target.value;
    }

    handleEnterKey(event) {
        if (event.key === 'Enter') {
            this.handleLogin();
        }
    }

    handleLogin() {
        if (!this.username || !this.password) {
            this.errorMessage = 'Please enter both username and password.';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        login({ username: this.username, password: this.password, startUrl: this.startUrl })
            .then((result) => {
                // Determine redirect URL
                // If the Apex returns a URL (standard behavior of Site.login returns the URL to redirect to)
                if (result) {
                    window.location.href = result;
                } else {
                   // Fallback or error
                   this.errorMessage = 'Login failed. Please check your credentials.';
                }
            })
            .catch((error) => {
                this.errorMessage = error.body ? error.body.message : 'Unknown error';
                console.error('Login error', error);
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    handleForgotPassword() {
        // Navigate to the standard Forgot Password page or a custom one
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'Forgot_Password'
            }
        });
    }
}