/* global qortalRequest */

// Simplified Playlist API Service

/**
 * Get all playlists from QDN
 * @param {number} limit - Max number of playlists to fetch
 * @param {number} offset - Starting offset
 * @returns {Promise<Array>} - Array of playlist objects
 */
export const fetchPlaylists = async (limit = 20, offset = 0) => {
  try {
    console.log(`Fetching playlists with limit=${limit}, offset=${offset}`);
    
    // Check if API available
    if (typeof qortalRequest === 'undefined') {
      console.warn('Qortal API not available, using mock data');
      return getMockPlaylists();
    }
    
    // Fetch with PLAYLIST service
    const response = await qortalRequest({
      action: "SEARCH_QDN_RESOURCES",
      service: "PLAYLIST",
      query: "qmusic_playlist_",
      limit: limit,
      offset: offset,
      reverse: true,
      includeMetadata: true,
      excludeBlocked: true,
    });
    
    console.log(`Fetched ${response.length} playlists`);
    return processPlaylistsResponse(response);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return getMockPlaylists();
  }
};

// Helper function to process playlist response
const processPlaylistsResponse = (response) => {
  // Process playlists data
  const playlists = response.map(item => {
    // Extract playlist name from identifier
    let playlistName = extractPlaylistName(item.identifier);
    
    return {
      id: `${item.name}_PLAYLIST_${item.identifier}`,
      name: playlistName || 'Unnamed Playlist',
      identifier: item.identifier,
      creator: item.name,
      createdAt: item.created,
      thumbnailUrl: getThumbnailUrl(item.name, item.identifier),
      tracks: [],
      ...item
    };
  });
  
  return playlists;
};

/**
 * Get a specific playlist by identifier
 * @param {string} name - Creator name
 * @param {string} identifier - Playlist identifier
 * @returns {Promise<Object>} - Playlist data with tracks
 */
export const getPlaylist = async (name, identifier) => {
  try {
    console.log(`Fetching playlist ${identifier} by ${name}`);
    
    if (typeof qortalRequest === 'undefined') {
      return getMockPlaylist(identifier);
    }
    
    // Fetch with PLAYLIST service
    const response = await qortalRequest({
      action: "FETCH_QDN_RESOURCE",
      name: name,
      service: "PLAYLIST", 
      identifier: identifier
    });
    
    if (!response) {
      throw new Error('Playlist not found');
    }
    
    // Extract playlist name from identifier
    let playlistName = extractPlaylistName(identifier);
    
    return {
      id: `${name}_PLAYLIST_${identifier}`,
      name: playlistName || 'Unnamed Playlist',
      identifier: identifier,
      creator: name,
      tracks: response.tracks || [],
      description: response.description || '',
      thumbnailUrl: getThumbnailUrl(name, identifier),
      ...response
    };
    
  } catch (error) {
    console.error(`Error fetching playlist ${identifier}:`, error);
    return null;
  }
};

/**
 * Create a new playlist
 * @param {string} name - Playlist name
 * @param {string} description - Playlist description
 * @param {Array} tracks - Array of track objects to include
 * @param {File} thumbnailFile - Thumbnail image file
 * @returns {Promise<Object>} - Created playlist data
 */
export const createPlaylist = async (name, description = '', tracks = [], thumbnailFile = null) => {
  try {
    if (typeof qortalRequest === 'undefined') {
      throw new Error('Cannot create playlist: Qortal API not available');
    }
    
    if (!name) {
      throw new Error('Playlist name is required');
    }
    
    // Generate unique identifier
    const timestamp = Date.now();
    const randomCode = Math.random().toString(36).substring(2, 8);
    const identifier = `qmusic_playlist_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${randomCode}`;
    
    // Create playlist document
    const playlistData = {
      name: name,
      description: description,
      tracks: tracks,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    // Publish playlist to QDN
    await qortalRequest({
      action: "PUBLISH_QDN_RESOURCE",
      service: "PLAYLIST",
      name: "CURRENT_USER",
      identifier: identifier,
      data64: btoa(JSON.stringify(playlistData)),
      filename: "playlist.json",
      category: "MUSIC",
      tags: ["music", "playlist"]
    });
    
    // If thumbnail was provided, publish it as well
    if (thumbnailFile) {
      // Read file as base64
      const fileReader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        fileReader.onload = (e) => {
          // Extract base64 content from data URL
          const base64 = e.target.result.split(',')[1];
          resolve(base64);
        };
      });
      
      fileReader.readAsDataURL(thumbnailFile);
      const thumbnailBase64 = await base64Promise;
      
      // Publish thumbnail
      await qortalRequest({
        action: "PUBLISH_QDN_RESOURCE",
        service: "THUMBNAIL",
        name: "CURRENT_USER",
        identifier: identifier,
        data64: thumbnailBase64,
        filename: thumbnailFile.name
      });
    }
    
    return {
      id: `CURRENT_USER_PLAYLIST_${identifier}`,
      name: name,
      description: description,
      identifier: identifier,
      tracks: tracks,
      creator: "CURRENT_USER",
      thumbnailUrl: thumbnailFile ? getThumbnailUrl("CURRENT_USER", identifier) : null
    };
    
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

/**
 * Update an existing playlist
 * @param {string} identifier - Playlist identifier
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<Object>} - Updated playlist
 */
export const updatePlaylist = async (identifier, updates) => {
  try {
    if (typeof qortalRequest === 'undefined') {
      throw new Error('Cannot update playlist: Qortal API not available');
    }
    
    // Fetch existing playlist
    const response = await qortalRequest({
      action: "FETCH_QDN_RESOURCE",
      name: "CURRENT_USER",
      service: "PLAYLIST", 
      identifier: identifier
    });
    
    if (!response) {
      throw new Error('Playlist not found');
    }
    
    // Update fields
    const updatedData = {
      ...response,
      ...updates,
      updatedAt: Date.now()
    };
    
    // Publish updated playlist
    await qortalRequest({
      action: "PUBLISH_QDN_RESOURCE",
      service: "PLAYLIST",
      name: "CURRENT_USER",
      identifier: identifier,
      data64: btoa(JSON.stringify(updatedData)),
      filename: "playlist.json",
      category: "MUSIC",
      tags: ["music", "playlist"]
    });
    
    return {
      id: `CURRENT_USER_PLAYLIST_${identifier}`,
      identifier: identifier,
      ...updatedData
    };
    
  } catch (error) {
    console.error(`Error updating playlist ${identifier}:`, error);
    throw error;
  }
};

/**
 * Add a track to a playlist
 * @param {string} playlistIdentifier - Playlist identifier
 * @param {Object} track - Track object to add
 * @returns {Promise<Object>} - Updated playlist
 */
export const addTrackToPlaylist = async (playlistIdentifier, track) => {
  try {
    // Get current playlist
    const playlist = await getPlaylist("CURRENT_USER", playlistIdentifier);
    
    if (!playlist) {
      throw new Error('Playlist not found or access denied');
    }
    
    // Check if track already exists in playlist
    const trackExists = playlist.tracks.some(t => 
      t.id === track.id || 
      (t.identifier === track.identifier && t.name === track.name)
    );
    
    if (trackExists) {
      throw new Error('Track already exists in playlist');
    }
    
    // Add track to playlist
    const updatedTracks = [...playlist.tracks, track];
    
    // Update playlist
    return await updatePlaylist(playlistIdentifier, { tracks: updatedTracks });
    
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    throw error;
  }
};

/**
 * Remove a track from a playlist
 * @param {string} playlistIdentifier - Playlist identifier
 * @param {string} trackId - Track ID to remove
 * @returns {Promise<Object>} - Updated playlist
 */
export const removeTrackFromPlaylist = async (playlistIdentifier, trackId) => {
  try {
    // Get current playlist
    const playlist = await getPlaylist("CURRENT_USER", playlistIdentifier);
    
    if (!playlist) {
      throw new Error('Playlist not found or access denied');
    }
    
    // Remove track from playlist
    const updatedTracks = playlist.tracks.filter(track => track.id !== trackId);
    
    // Update playlist
    return await updatePlaylist(playlistIdentifier, { tracks: updatedTracks });
    
  } catch (error) {
    console.error('Error removing track from playlist:', error);
    throw error;
  }
};

// Helper function to extract playlist name from identifier
const extractPlaylistName = (identifier) => {
  if (!identifier || !identifier.startsWith('qmusic_playlist_')) {
    return null;
  }
  
  try {
    // Format: qmusic_playlist_name_randomcode
    const parts = identifier.split('_');
    // Remove "qmusic", "playlist", and the random code at the end
    if (parts.length >= 4) {
      const nameParts = parts.slice(2, -1);
      return nameParts.join(' ').replace(/_/g, ' ');
    }
  } catch (e) {
    console.error('Error extracting playlist name:', e);
  }
  
  return null;
};

// Get thumbnail URL helper
const getThumbnailUrl = (name, identifier) => {
  if (!name || !identifier) return null;
  return `/arbitrary/THUMBNAIL/${encodeURIComponent(name)}/${encodeURIComponent(identifier)}`;
};

// Mock data for development
const getMockPlaylists = () => {
  return [
    {
      id: 'user1_PLAYLIST_qmusic_playlist_summer_hits_abc123',
      name: 'Summer Hits',
      identifier: 'qmusic_playlist_summer_hits_abc123',
      creator: 'user1',
      createdAt: Date.now() - 1000000,
      description: 'My favorite summer tracks',
      trackCount: 12,
      thumbnailUrl: null,
      tracks: []
    },
    {
      id: 'user2_PLAYLIST_qmusic_playlist_workout_mix_def456',
      name: 'Workout Mix',
      identifier: 'qmusic_playlist_workout_mix_def456',
      creator: 'user2',
      createdAt: Date.now() - 2000000,
      description: 'Songs to get you pumped',
      trackCount: 8,
      thumbnailUrl: null,
      tracks: []
    }
  ];
};

// Mock playlist data
const getMockPlaylist = (identifier) => {
  // Extract name from identifier
  const name = extractPlaylistName(identifier) || 'Mock Playlist';
  
  return {
    id: `mock_user_PLAYLIST_${identifier}`,
    name: name,
    identifier: identifier,
    creator: 'mock_user',
    description: 'This is a mock playlist for development',
    createdAt: Date.now() - 1000000,
    tracks: [
      {
        id: 'track1',
        title: 'Mock Song 1',
        artist: 'Mock Artist',
        identifier: 'qmusic_track_mock_song_1_xyz123',
        uploader: 'mock_user'
      },
      {
        id: 'track2',
        title: 'Mock Song 2',
        artist: 'Another Artist',
        identifier: 'qmusic_track_mock_song_2_abc456',
        uploader: 'mock_user'
      }
    ],
    thumbnailUrl: null
  };
};

/**
 * Get a playlist by its full ID
 * @param {string} id - The full playlist ID (creator_SERVICE_identifier)
 * @returns {Promise<Object>} - Playlist data with tracks
 */
export const fetchPlaylistById = async (id) => {
  try {
    // Parse the ID to extract creator and identifier
    let creator, identifier;
    
    if (id.includes('_PLAYLIST_')) {
      [creator, identifier] = id.split('_PLAYLIST_');
    } else {
      // Try a more generic approach for compatibility
      const parts = id.split('_');
      if (parts.length < 3) {
        throw new Error('Invalid playlist ID format');
      }
      
      // Find the service part
      const serviceIndex = parts.findIndex(part => part === 'PLAYLIST');
      
      if (serviceIndex === -1) {
        throw new Error('Cannot determine service type from ID');
      }
      
      creator = parts.slice(0, serviceIndex).join('_');
      identifier = parts.slice(serviceIndex + 1).join('_');
    }
    
    // Use the existing getPlaylist function to fetch the playlist
    return await getPlaylist(creator, identifier);
  } catch (err) {
    console.error('Error fetching playlist by ID:', err);
    throw err;
  }
};
