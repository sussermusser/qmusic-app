/* global qortalRequest */

// Improved Playlist API Service based on working implementation

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
    
    // Try PLAYLIST service first
    try {
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
      }
    } catch (err) {
      console.warn('Error fetching with PLAYLIST service:', err);
    }
    
    // Fallback to DOCUMENT service
    try {
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
      return getMockPlaylists();
    }
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return getMockPlaylists();
  }
};

// Helper function to process playlist response
const processPlaylistsResponse = (response) => {
  // Process playlists data
  const playlists = response.map(item => {
    // Extract playlist name from identifier or filename
    let playlistName = item.title || extractPlaylistName(item.identifier) || 
                      (item.filename ? item.filename.replace('.json', '') : 'Unnamed Playlist');
    
    return {
      id: `${item.name}_${item.service}_${item.identifier}`,
      name: playlistName,
      identifier: item.identifier,
      filename: item.filename,
      creator: item.name,
      createdAt: item.created,
      thumbnailUrl: getThumbnailUrl(item.name, item.identifier),
      songs: [], // Initialize empty songs array, will be populated when viewing details
      ...item
    };
  });
  
  return playlists;
};

/**
 * Get a specific playlist by identifier
 * @param {string} name - Creator name
 * @param {string} identifier - Playlist identifier
 * @returns {Promise<Object>} - Playlist data with songs/tracks
 */
export const getPlaylist = async (name, identifier) => {
  try {
    console.log(`Fetching playlist ${identifier} by ${name}`);
    
    if (typeof qortalRequest === 'undefined') {
      return getMockPlaylist(identifier);
    }
    
    let response = null;
    
    // Try with PLAYLIST service
    try {
      response = await qortalRequest({
        action: "FETCH_QDN_RESOURCE",
        name: name,
        service: "PLAYLIST", 
        identifier: identifier
      });
      
      if (response) {
        console.log('Successfully fetched playlist with PLAYLIST service');
      }
    } catch (err) {
      console.warn('Error fetching with PLAYLIST service:', err);
      
      // Try with DOCUMENT service
      try {
        response = await qortalRequest({
          action: "FETCH_QDN_RESOURCE",
          name: name,
          service: "DOCUMENT", 
          identifier: identifier
        });
        
        if (response) {
          console.log('Successfully fetched playlist with DOCUMENT service');
        }
      } catch (error) {
        console.error('Error fetching with DOCUMENT service:', error);
        return null;
      }
    }
    
    // Adapt to different structure formats
    const songs = response.songs || response.tracks || [];
    
    // Extract playlist name from different sources
    let playlistName = response.name || 
                      response.title || 
                      extractPlaylistName(identifier) || 
                      'Unnamed Playlist';
    
    return {
      id: `${name}_PLAYLIST_${identifier}`,
      name: playlistName,
      identifier: identifier,
      filename: response.filename,
      creator: name,
      createdBy: response.createdBy || name,
      songs: songs,
      tracks: songs, // Alias for compatibility
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
 * Create a new playlist using the approach from the working example
 * @param {Object} currentUser - The current user object with name property
 * @param {string} playlistName - Playlist name
 * @param {Array} selectedSongs - Array of song objects to include
 * @param {string} description - Optional description
 * @returns {Promise<Object>} - Created playlist data
 */
export const createPlaylist = async (currentUser, playlistName, selectedSongs, description = '') => {
  try {
    if (typeof qortalRequest === 'undefined') {
      throw new Error('Cannot create playlist: Qortal API not available');
    }
    
    if (!currentUser?.name) {
      throw new Error('User not logged in or username not available');
    }
    
    if (!playlistName) {
      throw new Error('Playlist name is required');
    }
    
    if (!selectedSongs || selectedSongs.length === 0) {
      throw new Error('At least one song must be selected');
    }
    
    // Generate unique identifier with user's name
    const uuid = Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
    const identifier = `qmusic_playlist_${currentUser.name}_${uuid}`;
    
    // Create filename from playlist name
    const filename = `${playlistName.replace(/ /g, '_')}.json`;
    
    // Format songs to match the working example
    const songsFormatted = selectedSongs.map(song => ({
      name: song.name,
      identifier: song.identifier,
      filename: song.filename,
      title: song.title
    }));
    
    // Create playlist data structure
    const playlistData = {
      name: playlistName,
      createdBy: currentUser.name,
      songs: songsFormatted,
      createdAt: new Date().toISOString(),
    };
    
    // Publish playlist directly without using data64
    const result = await qortalRequest({
      action: "PUBLISH_QDN_RESOURCE",
      name: currentUser.name,
      service: "PLAYLIST",
      identifier: identifier,
      data: playlistData,
      filename: filename,
      title: playlistName,
      description: description || `Playlist created by ${currentUser.name}`
    });
    
    if (result !== true) {
      throw new Error(JSON.stringify(result));
    }
    
    return {
      id: `${currentUser.name}_PLAYLIST_${identifier}`,
      name: playlistName,
      identifier: identifier,
      filename: filename,
      creator: currentUser.name,
      createdBy: currentUser.name,
      songs: songsFormatted,
      createdAt: new Date().toISOString(),
      description: description || `Playlist created by ${currentUser.name}`
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
    if (typeof qortalRequest === 'undefined') {
      throw new Error('Cannot update playlist: Qortal API not available');
    }
    
    if (!currentUser?.name) {
      throw new Error('User not logged in or username not available');
    }
    
    // Fetch existing playlist
    const playlist = await getPlaylist(currentUser.name, identifier);
    
    if (!playlist) {
      throw new Error('Playlist not found or access denied');
    }
    
    // Update fields
    const updatedData = {
      ...playlist,
      ...updates,
      name: updates.name || playlist.name,
      songs: updates.songs || playlist.songs,
      updatedAt: new Date().toISOString()
    };
    
    // Get or update filename
    const filename = updates.filename || playlist.filename || 
                    `${updatedData.name.replace(/ /g, '_')}.json`;
    
    // Publish updated playlist
    const result = await qortalRequest({
      action: "PUBLISH_QDN_RESOURCE",
      name: currentUser.name,
      service: "PLAYLIST",
      identifier: identifier,
      data: updatedData,
      filename: filename,
      title: updatedData.name,
      description: updatedData.description || `Playlist created by ${currentUser.name}`
    });
    
    if (result !== true) {
      throw new Error(JSON.stringify(result));
    }
    
    return {
      ...updatedData,
      id: `${currentUser.name}_PLAYLIST_${identifier}`
    };
    
  } catch (error) {
    console.error(`Error updating playlist ${identifier}:`, error);
    throw error;
  }
};

/**
 * Add a song to a playlist
 * @param {Object} currentUser - The current user object with name property
 * @param {string} playlistIdentifier - Playlist identifier
 * @param {Object} song - Song object to add
 * @returns {Promise<Object>} - Updated playlist
 */
export const addSongToPlaylist = async (currentUser, playlistIdentifier, song) => {
  try {
    if (typeof qortalRequest === 'undefined') {
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
    const songExists = playlist.songs.some(s => 
      s.identifier === song.identifier && s.name === song.name
    );
    
    if (songExists) {
      throw new Error('Song already exists in playlist');
    }
    
    // Format song to match structure
    const formattedSong = {
      name: song.name,
      identifier: song.identifier,
      filename: song.filename,
      title: song.title || song.filename
    };
    
    // Add song to playlist
    const updatedSongs = [...playlist.songs, formattedSong];
    
    // Update playlist
    return await updatePlaylist(currentUser, playlistIdentifier, { songs: updatedSongs });
    
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    throw error;
  }
};

/**
 * Remove a song from a playlist
 * @param {Object} currentUser - The current user object with name property
 * @param {string} playlistIdentifier - Playlist identifier
 * @param {string} songIdentifier - Song identifier to remove
 * @returns {Promise<Object>} - Updated playlist
 */
export const removeSongFromPlaylist = async (currentUser, playlistIdentifier, songIdentifier) => {
  try {
    if (typeof qortalRequest === 'undefined') {
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
    
    // Remove song from playlist
    const updatedSongs = playlist.songs.filter(song => song.identifier !== songIdentifier);
    
    // Update playlist
    return await updatePlaylist(currentUser, playlistIdentifier, { songs: updatedSongs });
    
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    throw error;
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
      throw new Error('Qortal API not available');
    }
    
    if (!currentUser?.name) {
      throw new Error('User not logged in or username not available');
    }
    
    const result = await qortalRequest({
      action: "LIST_QDN_RESOURCES",
      name: currentUser.name,
    });
    
    const playlists = result.filter((r) => r.service === "PLAYLIST");
    
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
      throw new Error('Qortal API not available');
    }
    
    if (!currentUser?.name) {
      throw new Error('User not logged in or username not available');
    }
    
    const result = await qortalRequest({
      action: "LIST_QDN_RESOURCES",
      name: currentUser.name,
    });
    
    const songs = result.filter(
      (r) => r.service === "AUDIO" && r.identifier.startsWith("qmusic_song_")
    );
    
    return songs;
    
  } catch (error) {
    console.error('Error fetching user songs:', error);
    return [];
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

// Get QDN URL for a song
export const getSongUrl = (song) => {
  return `/arbitrary/AUDIO/${encodeURIComponent(song.name)}/${encodeURIComponent(song.identifier)}/${encodeURIComponent(song.filename)}`;
};

// Get playlist content URL
export const getPlaylistContentUrl = (playlist) => {
  return `/arbitrary/PLAYLIST/${encodeURIComponent(playlist.name)}/${encodeURIComponent(playlist.identifier)}/${encodeURIComponent(playlist.filename)}`;
};

// Mock data for development
const getMockPlaylists = () => {
  return [
    {
      id: 'user1_PLAYLIST_qmusic_playlist_summer_hits_abc123',
      name: 'Summer Hits',
      identifier: 'qmusic_playlist_summer_hits_abc123',
      filename: 'Summer_Hits.json',
      creator: 'user1',
      createdAt: new Date(Date.now() - 1000000).toISOString(),
      description: 'My favorite summer tracks',
      songs: []
    },
    {
      id: 'user2_PLAYLIST_qmusic_playlist_workout_mix_def456',
      name: 'Workout Mix',
      identifier: 'qmusic_playlist_workout_mix_def456',
      filename: 'Workout_Mix.json',
      creator: 'user2',
      createdAt: new Date(Date.now() - 2000000).toISOString(),
      description: 'Songs to get you pumped',
      songs: []
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
    filename: `${name.replace(/ /g, '_')}.json`,
    creator: 'mock_user',
    createdBy: 'mock_user',
    description: 'This is a mock playlist for development',
    createdAt: new Date(Date.now() - 1000000).toISOString(),
    songs: [
      {
        name: 'mock_user',
        title: 'Mock Song 1',
        identifier: 'qmusic_song_mock_song_1_xyz123',
        filename: 'mock_song_1.mp3'
      },
      {
        name: 'mock_user',
        title: 'Mock Song 2',
        identifier: 'qmusic_song_mock_song_2_abc456',
        filename: 'mock_song_2.mp3'
      }
    ]
  };
};
