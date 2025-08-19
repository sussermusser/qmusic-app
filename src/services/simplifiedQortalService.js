/* global qortalRequest */

/**
 * Simplified QortalService for QDN interactions
 * Provides core functionality for interacting with Qortal Distributed Network
 */

/**
 * Check if the Qortal API is available in the current environment
 * @returns {boolean} - Whether Qortal API is available
 */
export const isQortalApiAvailable = () => {
  return typeof qortalRequest !== 'undefined';
};

/**
 * Publish a resource to QDN
 * @param {Object} params - Publishing parameters
 * @returns {Promise<Object>} - Result of the publishing operation
 */
export const publishToQDN = async ({
  service,
  name = 'CURRENT_USER',
  identifier,
  data,
  filename = 'data.json',
  category = 'MUSIC',
  tags = [],
  title = null,
  description = null
}) => {
  try {
    if (!isQortalApiAvailable()) {
      throw new Error('Qortal API not available');
    }
    
    if (!service || !identifier) {
      throw new Error('Service and identifier are required for publishing');
    }
    
    // Convert data to base64 if it's not already
    let data64;
    if (typeof data === 'string' && (data.startsWith('data:') || /^[A-Za-z0-9+/=]+$/.test(data))) {
      // Already base64 or data URL
      data64 = data.includes('base64,') ? data.split('base64,')[1] : data;
    } else if (data instanceof Blob || data instanceof File) {
      // Convert Blob/File to base64
      const reader = new FileReader();
      data64 = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result.split('base64,')[1]);
        reader.readAsDataURL(data);
      });
    } else {
      // Convert JSON to base64
      data64 = btoa(typeof data === 'string' ? data : JSON.stringify(data));
    }
    
    // Prepare request object
    const requestObj = {
      action: 'PUBLISH_QDN_RESOURCE',
      service,
      name,
      identifier,
      data64,
      filename
    };
    
    // Add optional parameters if provided
    if (category) requestObj.category = category;
    if (tags && tags.length > 0) requestObj.tags = tags;
    if (title) requestObj.title = title;
    if (description) requestObj.description = description;
    
    // Send the request
    const response = await qortalRequest(requestObj);
    
    return {
      success: true,
      service,
      name,
      identifier,
      response
    };
  } catch (error) {
    console.error('Error publishing to QDN:', error);
    return {
      success: false,
      error: error.message || 'Unknown error publishing to QDN'
    };
  }
};

/**
 * Fetch a resource from QDN
 * @param {Object} params - Fetch parameters
 * @returns {Promise<Object>} - The fetched resource data
 */
export const fetchFromQDN = async ({
  service,
  name,
  identifier,
  convert = true
}) => {
  try {
    if (!isQortalApiAvailable()) {
      throw new Error('Qortal API not available');
    }
    
    if (!service || !name || !identifier) {
      throw new Error('Service, name, and identifier are required for fetching');
    }
    
    const response = await qortalRequest({
      action: 'FETCH_QDN_RESOURCE',
      service,
      name,
      identifier
    });
    
    if (!response) {
      throw new Error('Resource not found');
    }
    
    // If convert is true and response is a string, try to parse it as JSON
    if (convert && typeof response === 'string') {
      try {
        return JSON.parse(response);
      } catch {
        // Return as is if not valid JSON
        return response;
      }
    }
    
    return response;
  } catch (error) {
    console.error(`Error fetching from QDN (${service}/${name}/${identifier}):`, error);
    throw error;
  }
};

/**
 * Search for resources on QDN
 * @param {Object} params - Search parameters
 * @returns {Promise<Array>} - Array of matching resources
 */
export const searchQDN = async ({
  service,
  query = '',
  category = null,
  name = null,
  exactMatchNames = false,
  limit = 20,
  offset = 0,
  reverse = true,
  includeMeta = true
}) => {
  try {
    if (!isQortalApiAvailable()) {
      throw new Error('Qortal API not available');
    }
    
    const requestObj = {
      action: 'SEARCH_QDN_RESOURCES',
      service,
      query,
      limit,
      offset,
      reverse,
      includeMetadata: includeMeta,
      excludeBlocked: true
    };
    
    // Add optional parameters if provided
    if (category) requestObj.category = category;
    if (name) {
      requestObj.name = name;
      requestObj.exactMatchNames = exactMatchNames;
    }
    
    const response = await qortalRequest(requestObj);
    
    if (!response || !Array.isArray(response)) {
      return [];
    }
    
    return response;
  } catch (error) {
    console.error('Error searching QDN:', error);
    return [];
  }
};

/**
 * Get information about the current user
 * @returns {Promise<Object>} - User information
 */
export const getCurrentUser = async () => {
  try {
    if (!isQortalApiAvailable()) {
      throw new Error('Qortal API not available');
    }
    
    const response = await qortalRequest({
      action: 'GET_ACCOUNT_DATA'
    });
    
    return response;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get direct URL for a QDN resource
 * @param {Object} params - Resource parameters
 * @returns {string} - URL for the resource
 */
export const getResourceUrl = ({
  service,
  name,
  identifier,
  filename = null
}) => {
  let url = `/arbitrary/${encodeURIComponent(service)}/${encodeURIComponent(name)}/${encodeURIComponent(identifier)}`;
  
  if (filename) {
    url += `/${encodeURIComponent(filename)}`;
  }
  
  return url;
};

/**
 * Get thumbnail URL for a resource
 * @param {string} name - Resource owner/creator
 * @param {string} identifier - Resource identifier
 * @returns {string} - URL for the thumbnail
 */
export const getThumbnailUrl = (name, identifier) => {
  if (!name || !identifier) return null;
  return getResourceUrl({
    service: 'THUMBNAIL',
    name,
    identifier
  });
};

export default {
  isQortalApiAvailable,
  publishToQDN,
  fetchFromQDN,
  searchQDN,
  getCurrentUser,
  getResourceUrl,
  getThumbnailUrl
};
