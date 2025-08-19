/* global qortalRequest */

// Playlist API Service

/**
 * Get all playlists from QDN
 * @param {number} limit - Max number of playlists to fetch
 * @param {number} offset - Starting offset
 * @returns {Promise<Array>} - Array of playlist objects
 */
export const fetchPlaylists = async (limit = 20, offset = 0, forceRefresh = false) => {
  try {
    console.log(`Fetching playlists with limit=${limit}, offset=${offset}, forceRefresh=${forceRefresh}`);
    
    // Always log if API is available to debug
    console.log('Qortal API available:', typeof qortalRequest !== 'undefined');
    
    // If mockPlaylistsData exists and we're not forcing a refresh, check if we should use it
    if (mockPlaylistsData && !forceRefresh && typeof qortalRequest === 'undefined') {
      console.log('Using cached mock playlists data');
      return mockPlaylistsData;
    }
    
    if (typeof qortalRequest === 'undefined') {
      console.warn('Qortal API not available, using mock data');
      // Return mock playlists for development
      return getMockPlaylists();
    }
    
    // Use Qortal API to fetch playlists
    try {
      console.log('Fetching playlists with PLAYLIST service');
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
      
      if (response && response.length > 0) {
        console.log(`Fetched ${response.length} playlists with PLAYLIST service`);
        return processPlaylistsResponse(response);
      } else {
        console.log('No playlists found with PLAYLIST service, trying DOCUMENT service');
      }
    } catch (err) {
      console.warn('Error fetching with PLAYLIST service:', err);
    }
    
    // Try with DOCUMENT service as fallback
    try {
      console.log('Trying to fetch playlists with DOCUMENT service');
      const response = await qortalRequest({
        action: "SEARCH_QDN_RESOURCES",
        service: "DOCUMENT",
        query: "qmusic_playlist_",
        limit: limit,
        offset: offset,
        reverse: true,
        includeMetadata: true,
        excludeBlocked: true,
      });
      
      console.log(`Fetched ${response.length} playlists with DOCUMENT service`);
      return processPlaylistsResponse(response);
    } catch (err) {
      console.error('Error fetching with DOCUMENT service:', err);
      // If both attempts fail, return mock data
      console.warn('All API requests failed, falling back to mock data');
      return getMockPlaylists();
    }
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return [];
  }
};

// Helper function to process playlist response
const processPlaylistsResponse = (response) => {
  console.log('Processing playlists response:', response);
  
  // Process playlists data
  const playlists = response.map(item => {
    // Extract playlist name from identifier
    let playlistName = extractPlaylistName(item.identifier);
    
    return {
      id: `${item.name}_${item.service}_${item.identifier}`,
      name: playlistName || 'Unnamed Playlist',
      identifier: item.identifier,
      creator: item.name,
      createdAt: item.created,
      // If there's a specific thumbnail resource, use it
      thumbnailUrl: getThumbnailUrl(item.name, item.identifier),
      tracks: [], // Initialize empty tracks array, will be populated when viewing details
      ...item
    };
  });
  
  console.log(`Processed ${playlists.length} playlists`);
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
      console.warn('Qortal API not available for getPlaylist');
      // Return mock playlist for development
      return getMockPlaylist(identifier);
    }
    
    let response = null;
    
    // Fetch with PLAYLIST service
    try {
      console.log(`Fetching playlist with PLAYLIST service: ${name}/${identifier}`);
      response = await qortalRequest({
        action: "FETCH_QDN_RESOURCE",
        name: name,
        service: "PLAYLIST", 
        identifier: identifier
      });
      
      if (response && response.tracks) {
        console.log('Successfully fetched playlist with PLAYLIST service');
      } else {
        console.log('Playlist format invalid or missing tracks with PLAYLIST service');
        
        // Try DOCUMENT service as fallback
        console.log(`Trying to fetch playlist with DOCUMENT service: ${name}/${identifier}`);
        response = await qortalRequest({
          action: "FETCH_QDN_RESOURCE",
          name: name,
          service: "DOCUMENT", 
          identifier: identifier
        });
        
        if (response && response.tracks) {
          console.log('Successfully fetched playlist with DOCUMENT service');
        } else {
          console.log('Playlist format invalid or missing tracks with DOCUMENT service');
          throw new Error('Invalid playlist format or not found');
        }
      }
    } catch (err) {
      console.error('Error fetching playlist:', err);
      throw err;
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
 * @param {Object} currentUser - The current user object with name property
 * @param {string} name - Playlist name
 * @param {string} description - Playlist description (optional)
 * @param {Array} songs - Array of song objects to include (optional)
 * @param {File} thumbnailFile - Thumbnail image file (optional)
 * @returns {Promise<Object>} - Created playlist data
 */
export const createPlaylist = async (currentUser, name, songs = [], description = '', thumbnailFile = null) => {
  try {
    console.log('Creating playlist with working approach');
    if (typeof qortalRequest === 'undefined') {
      console.error('Qortal API not available');
      throw new Error('Cannot create playlist: Qortal API not available');
    }
    
    if (!currentUser?.name) {
      throw new Error('User not logged in or username not available');
    }
    
    if (!name) {
      throw new Error('Playlist name is required');
    }
    
    // Generate unique identifier with user's name
    const uuid = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
    const identifier = `qmusic_playlist_${currentUser.name}_${uuid}`;
    
    // Create filename from playlist name
    const filename = `${name.replace(/ /g, '_')}.json`;
    
    // Format songs/tracks to match the working example
    const songsFormatted = songs.map(song => ({
      name: song.name || currentUser.name,
      identifier: song.identifier,
      filename: song.filename,
      title: song.title || song.filename
    }));
    
    // Create playlist data structure
    const playlistData = {
      name: name,
      createdBy: currentUser.name,
      songs: songsFormatted,
      createdAt: new Date().toISOString(),
    };
    
    console.log('Publishing playlist with direct data approach');
    // Publish playlist directly without using data64
    const result = await qortalRequest({
      action: "PUBLISH_QDN_RESOURCE",
      name: currentUser.name,
      service: "PLAYLIST",
      identifier: identifier,
      data: playlistData,
      filename: filename,
      title: name,
      description: description || `Playlist created by ${currentUser.name}`
    });
    
    if (result !== true) {
      console.error('Error result from QDN:', result);
      throw new Error(JSON.stringify(result));
    }
    
    console.log('Successfully published playlist with direct approach');
    
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
        name: currentUser.name,
        identifier: identifier,
        data64: thumbnailBase64,
        filename: thumbnailFile.name
      });
    }
    
    return {
      id: `${currentUser.name}_PLAYLIST_${identifier}`,
      name: name,
      identifier: identifier,
      filename: filename,
      creator: currentUser.name,
      createdBy: currentUser.name,
      songs: songsFormatted,
      tracks: songsFormatted, // For compatibility
      createdAt: new Date().toISOString(),
      description: description || `Playlist created by ${currentUser.name}`,
      thumbnailUrl: thumbnailFile ? getThumbnailUrl(currentUser.name, identifier) : null
    };
    
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

/**
 * Update an existing playlist
 * @param {Object} currentUser - The current user object with name property
 * @param {string} identifier - Playlist identifier
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<Object>} - Updated playlist
 */
export const updatePlaylist = async (currentUser, identifier, updates) => {
  try {
    console.log(`Updating playlist ${identifier} with:`, updates);
    
    if (typeof qortalRequest === 'undefined') {
      console.error('Qortal API not available');
      throw new Error('Cannot update playlist: Qortal API not available');
    }
    
    if (!currentUser?.name) {
      throw new Error('User not logged in or username not available');
    }
    
    // Fetch existing playlist
    let response = null;
    
    // Fetch with PLAYLIST service
    try {
      console.log('Fetching existing playlist with PLAYLIST service');
      response = await qortalRequest({
        action: "FETCH_QDN_RESOURCE",
        name: currentUser.name,
        service: "PLAYLIST", 
        identifier: identifier
      });
      
      if (!response) {
        throw new Error('Playlist not found');
      }
      
      console.log('Found playlist with PLAYLIST service');
    } catch (err) {
      console.error('Error fetching playlist:', err);
      throw new Error('Playlist not found or access denied');
    }
    
    // Update fields
    const updatedData = {
      ...response,
      ...updates,
      name: updates.name || response.name,
      songs: updates.songs || updates.tracks || response.songs || response.tracks || [],
      updatedAt: new Date().toISOString()
    };
    
    // Get or update filename
    const filename = updates.filename || response.filename || 
                    `${updatedData.name.replace(/ /g, '_')}.json`;
    
    // Publish updated playlist directly without using data64
    console.log('Publishing updated playlist with direct data approach');
    const result = await qortalRequest({
      action: "PUBLISH_QDN_RESOURCE",
      name: currentUser.name,
      service: "PLAYLIST",
      identifier: identifier,
      data: updatedData,
      filename: filename,
      title: updatedData.name,
      description: updatedData.description || `Playlist updated by ${currentUser.name}`
    });
    
    if (result !== true) {
      console.error('Error result from QDN:', result);
      throw new Error(JSON.stringify(result));
    }
    
    return {
      id: `${currentUser.name}_PLAYLIST_${identifier}`,
      identifier: identifier,
      ...updatedData
    };
    
  } catch (error) {
    console.error(`Error updating playlist ${identifier}:`, error);
    throw error;
  }
};

/**
 * Add a song/track to a playlist
 * @param {Object} currentUser - The current user object with name property
 * @param {string} playlistIdentifier - Playlist identifier
 * @param {Object} song - Song object to add
 * @returns {Promise<Object>} - Updated playlist
 */
export const addTrackToPlaylist = async (currentUser, playlistIdentifier, song) => {
  try {
    if (typeof qortalRequest === 'undefined') {
      console.error('Qortal API not available');
      throw new Error('Cannot update playlist: Qortal API not available');
    }
    
    if (!currentUser?.name) {
      throw new Error('User not logged in or username not available');
    }
    
    // Get current playlist
    const playlist = await getPlaylist(currentUser.name, playlistIdentifier);
    
    if (!playlist) {
      throw new Error('Playlist not found or access denied');
    }
    
    // Check if song already exists in playlist
    const songArray = playlist.songs || playlist.tracks || [];
    const songExists = songArray.some(s => 
      (s.id === song.id) || 
      (s.identifier === song.identifier && s.name === song.name)
    );
    
    if (songExists) {
      throw new Error('Song already exists in playlist');
    }
    
    // Format song to match structure
    const formattedSong = {
      name: song.name || currentUser.name,
      identifier: song.identifier,
      filename: song.filename,
      title: song.title || song.filename
    };
    
    // Add song to playlist
    const updatedSongs = [...songArray, formattedSong];
    
    // Update playlist
    return await updatePlaylist(currentUser, playlistIdentifier, { 
      songs: updatedSongs,
      tracks: updatedSongs // For compatibility
    });
    
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    throw error;
  }
};

/**
 * Remove a song/track from a playlist
 * @param {Object} currentUser - The current user object with name property
 * @param {string} playlistIdentifier - Playlist identifier
 * @param {string} songIdentifier - Song/track identifier to remove
 * @returns {Promise<Object>} - Updated playlist
 */
export const removeTrackFromPlaylist = async (currentUser, playlistIdentifier, songIdentifier) => {
  try {
    if (typeof qortalRequest === 'undefined') {
      console.error('Qortal API not available');
      throw new Error('Cannot update playlist: Qortal API not available');
    }
    
    if (!currentUser?.name) {
      throw new Error('User not logged in or username not available');
    }
    
    // Get current playlist
    const playlist = await getPlaylist(currentUser.name, playlistIdentifier);
    
    if (!playlist) {
      throw new Error('Playlist not found or access denied');
    }
    
    // Get songs/tracks array (handle both naming conventions)
    const songsArray = playlist.songs || playlist.tracks || [];
    
    // Remove song/track from playlist by identifier
    const updatedSongs = songsArray.filter(item => 
      item.identifier !== songIdentifier && item.id !== songIdentifier
    );
    
    // Update playlist
    return await updatePlaylist(currentUser, playlistIdentifier, { 
      songs: updatedSongs,
      tracks: updatedSongs // For compatibility
    });
    
  } catch (error) {
    console.error('Error removing song from playlist:', error);
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
  
  // Check if thumbnail exists for this identifier by trying to load it
  return `/arbitrary/THUMBNAIL/${encodeURIComponent(name)}/${encodeURIComponent(identifier)}`;
};

// Get QDN URL for a song
export const getSongUrl = (song) => {
  if (!song || !song.name || !song.identifier || !song.filename) return null;
  return `/arbitrary/AUDIO/${encodeURIComponent(song.name)}/${encodeURIComponent(song.identifier)}/${encodeURIComponent(song.filename)}`;
};

// Get playlist content URL
export const getPlaylistContentUrl = (playlist) => {
  if (!playlist || !playlist.name || !playlist.identifier || !playlist.filename) return null;
  return `/arbitrary/PLAYLIST/${encodeURIComponent(playlist.name)}/${encodeURIComponent(playlist.identifier)}/${encodeURIComponent(playlist.filename)}`;
};

// Mock data for development
const getMockPlaylists = () => {
  // Return existing mock data if it exists
  if (mockPlaylistsData) {
    return mockPlaylistsData;
  }
  
  // Otherwise initialize with default mock playlists
  mockPlaylistsData = [
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
    },
    {
      id: 'iffi_PLAYLIST_qmusic_playlist_chill_vibes_ghi789',
      name: 'Chill Vibes',
      identifier: 'qmusic_playlist_chill_vibes_ghi789',
      creator: 'iffi',
      createdAt: Date.now() - 3000000,
      description: 'Relaxing tunes',
      trackCount: 15,
      thumbnailUrl: null,
      tracks: []
    }
  ];
  
  return mockPlaylistsData;
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
 * Get a playlist by its full ID (format: creator_SERVICE_identifier)
 * @param {string} id - The full playlist ID (creator_SERVICE_identifier)
 * @returns {Promise<Object>} - Playlist data with tracks
 */
export const fetchPlaylistById = async (id) => {
  try {
    console.log('Fetching playlist by ID:', id);
    
    // Parse the ID to extract creator and identifier
    // Format can be either creator_PLAYLIST_identifier or creator_DOCUMENT_identifier
    let creator, identifier;
    
    if (id.includes('_PLAYLIST_')) {
      [creator, identifier] = id.split('_PLAYLIST_');
      console.log('Parsed PLAYLIST ID format:', { creator, identifier });
    } else if (id.includes('_DOCUMENT_')) {
      [creator, identifier] = id.split('_DOCUMENT_');
      console.log('Parsed DOCUMENT ID format:', { creator, identifier });
    } else {
      // Try a more generic approach for compatibility
      const parts = id.split('_');
      if (parts.length < 3) {
        throw new Error('Invalid playlist ID format');
      }
      
      // Find the service part (either PLAYLIST or DOCUMENT)
      const serviceIndex = parts.findIndex(part => 
        part === 'PLAYLIST' || part === 'DOCUMENT'
      );
      
      if (serviceIndex === -1) {
        throw new Error('Cannot determine service type from ID');
      }
      
      creator = parts.slice(0, serviceIndex).join('_');
      identifier = parts.slice(serviceIndex + 1).join('_');
      console.log('Parsed generic ID format:', { creator, identifier });
    }
    
    // Use the existing getPlaylist function to fetch the playlist
    return await getPlaylist(creator, identifier);
  } catch (err) {
    console.error('Error fetching playlist by ID:', err);
    throw err;
  }
};

/**
 * Get user's playlists
 * @param {Object} currentUser - The current user object with name property
 * @returns {Promise<Array>} - Array of user's playlists
 */
export const getUserPlaylists = async (currentUser) => {
  try {
    if (typeof qortalRequest === 'undefined') {
      console.error('Qortal API not available for getUserPlaylists');
      return getMockPlaylists();
    }
    
    if (!currentUser?.name) {
      throw new Error('User not logged in or username not available');
    }
    
    console.log(`Fetching playlists for user: ${currentUser.name}`);
    const result = await qortalRequest({
      action: "LIST_QDN_RESOURCES",
      name: currentUser.name,
    });
    
    const playlists = result.filter((r) => r.service === "PLAYLIST");
    console.log(`Found ${playlists.length} playlists for user ${currentUser.name}`);
    
    return playlists.map(playlist => ({
      id: `${playlist.name}_PLAYLIST_${playlist.identifier}`,
      name: playlist.title || playlist.filename.replace('.json', ''),
      identifier: playlist.identifier,
      filename: playlist.filename,
      creator: playlist.name,
      service: playlist.service
    }));
    
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    return [];
  }
};

/**
 * Get user's songs
 * @param {Object} currentUser - The current user object with name property
 * @returns {Promise<Array>} - Array of user's songs
 */
export const getUserSongs = async (currentUser) => {
  try {
    if (typeof qortalRequest === 'undefined') {
      console.error('Qortal API not available for getUserSongs');
      return [];
    }
    
    if (!currentUser?.name) {
      throw new Error('User not logged in or username not available');
    }
    
    console.log(`Fetching songs for user: ${currentUser.name}`);
    const result = await qortalRequest({
      action: "LIST_QDN_RESOURCES",
      name: currentUser.name,
    });
    
    const songs = result.filter(
      (r) => r.service === "AUDIO" && r.identifier.startsWith("qmusic_song_")
    );
    
    console.log(`Found ${songs.length} songs for user ${currentUser.name}`);
    return songs;
    
  } catch (error) {
    console.error('Error fetching user songs:', error);
    return [];
  }
};

// Mock data storage for development
let mockPlaylistsData = null;

// Helper to add a new playlist to mock data
export const addMockPlaylist = (playlist) => {
  console.log('Adding new playlist to mock data:', playlist);
  
  // Initialize mock data if not already done
  if (!mockPlaylistsData) {
    mockPlaylistsData = getMockPlaylists();
  }
  
  // Check if the playlist already exists
  const exists = mockPlaylistsData.some(p => p.identifier === playlist.identifier);
  if (exists) {
    console.log('Playlist already exists in mock data, not adding again');
    return playlist;
  }
  
  // Add the new playlist to the mock data
  mockPlaylistsData.unshift(playlist);
  
  console.log('Added new mock playlist:', playlist.name);
  console.log('Mock playlists now contains:', mockPlaylistsData.length, 'playlists');
  return playlist;
};
