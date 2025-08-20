/**
 * Wrapper for Qortal API requests
 * This implementation uses proper Qortal UI's request system
 */

export const qortalRequest = (params) => {
    // Access Qortal API through UI's request system
    if (!window?.parent?.qortal) {
        throw new Error('Qortal API not available - please run this app in Qortal UI');
    }

    // Make the request using parent frame's qortal object
    return window.parent.qortal.request(params);
};

// Resource URL helpers
export const getResourceUrl = (service, name, identifier) => 
    `/arbitrary/${service}/${encodeURIComponent(name)}/${encodeURIComponent(identifier)}`;

export const getThumbnailUrl = (name, identifier) => 
    `/arbitrary/THUMBNAIL/${encodeURIComponent(name)}/${encodeURIComponent(identifier)}`;
