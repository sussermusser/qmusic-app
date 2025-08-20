/**
 * Wrapper for Qortal API requests
 * This implementation uses proper Qortal UI's request system
 */

export const qortalRequest = async (params) => {
    // Access Qortal API through UI's request system
    if (!window?.parent?.qortal) {
        console.error('Qortal API not available in window.parent');
        throw new Error('Qortal API not available - please run this app in Qortal UI');
    }

    try {
        // Verify that qortal.request is actually a function
        if (typeof window.parent.qortal.request !== 'function') {
            console.error('qortal.request is not a function');
            throw new Error('Invalid Qortal API implementation');
        }

        // Make the request using parent frame's qortal object
        const response = await window.parent.qortal.request(params);
        
        // Log successful requests for debugging
        console.log(`Qortal API request successful:`, { params, response });
        
        return response;
    } catch (error) {
        console.error('Qortal API request failed:', { params, error });
        throw error;
    }
};

// Resource URL helpers
export const getResourceUrl = (service, name, identifier) => 
    `/arbitrary/${service}/${encodeURIComponent(name)}/${encodeURIComponent(identifier)}`;

export const getThumbnailUrl = (name, identifier) => 
    `/arbitrary/THUMBNAIL/${encodeURIComponent(name)}/${encodeURIComponent(identifier)}`;
