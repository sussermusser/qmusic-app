import { qortalRequest } from '../utils/qortalRequest';

class AuthService {
    async login() {
        try {
            // Get logged in account data first
            const accountData = await qortalRequest({
                action: 'GET_ACCOUNT_DATA'
            });

            if (!accountData?.address) {
                console.error('No account data received');
                return null;
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
