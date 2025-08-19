/**
 * Simplified QortalRequest utility
 * A streamlined wrapper for interacting with the Qortal API
 */

/**
 * Makes a request to the Qortal API
 * 
 * This is a thin wrapper around the global qortalRequest function that adds
 * error handling and logging for development purposes.
 * 
 * @param {Object} params - The request parameters to pass to qortalRequest
 * @returns {Promise<any>} - The response from the Qortal API
 * @throws {Error} If the Qortal API is not available or returns an error
 */
export const qortalRequest = async (params) => {
  // Check if qortalRequest is available in the global scope
  if (typeof window.qortalRequest === 'undefined') {
    console.error('Qortal API not available. Are you running outside of Qortal?');
    throw new Error('Qortal API not available');
  }

  try {
    // Log request in development mode
    const isDevelopment = import.meta.env.DEV;
    if (isDevelopment) {
      console.log('Qortal API Request:', params);
    }

    // Forward the request to the Qortal API
    const response = await window.qortalRequest(params);
    
    // Log response in development mode
    if (isDevelopment) {
      if (response && typeof response === 'object' && response.error) {
        console.error('Qortal API Error:', response.error);
      } else {
        const logResponse = Array.isArray(response) && response.length > 10 
          ? `Array with ${response.length} items` 
          : response;
        console.log('Qortal API Response:', logResponse);
      }
    }

    // Check for error in response
    if (response && typeof response === 'object' && response.error) {
      throw new Error(response.error);
    }

    return response;
  } catch (error) {
    console.error('Error in qortalRequest:', error);
    throw error;
  }
};

export default qortalRequest;
