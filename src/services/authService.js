import { qortalRequest } from '../utils/qortalRequest';

class AuthService {
    async login() {
        try {
            console.log('Starting login process...');
            
            // First check if we're in Qortal UI
            if (!window?.parent) {
                throw new Error('This app must be run inside Qortal UI iframe');
            }

            // Then check if Qortal API is available
            if (!window.parent.qortal) {
                throw new Error('Qortal API not found - please run in Qortal UI');
            }

            // Finally check if the request method is available
            if (typeof window.parent.qortal.request !== 'function') {
                throw new Error('Invalid Qortal API implementation');
            }

            console.log('Qortal API checks passed, proceeding with login...');

            // Get logged in account data first
            const accountData = await qortalRequest({
                action: 'GET_ACCOUNT_DATA'
            });

            // More detailed validation of account data
            if (!accountData) {
                throw new Error('No account data received from Qortal');
            }

            if (!accountData.address) {
                throw new Error('No address found in account data');
            }

            console.log('Account data received:', accountData);

            // Get any registered names for this address
            const namesData = await qortalRequest({
                action: 'GET_ACCOUNT_NAMES',
                address: accountData.address
            });

            console.log('Names data received:', namesData);

            // Use first name if available, otherwise use shortened address
            const userName = Array.isArray(namesData) && namesData.length > 0
                ? namesData[0].name
                : `User ${accountData.address.slice(0, 6)}...`;

            const userData = {
                name: userName,
                address: accountData.address,
                publicKey: accountData.publicKey || null
            };

            console.log('Login successful, returning user data:', userData);
            return userData;

        } catch (error) {
            console.error('Login error:', error);
            // Let the UI handle the error
            throw new Error('Login failed: ' + (error.message || 'Unknown error'));
        }
    }
}

export const authService = new AuthService();
