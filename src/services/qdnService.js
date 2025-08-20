/* global qortalRequest */

// QDN API endpoints
const BASE_URL = '/arbitrary';

// Mock data for development
const MOCK_TRACKS = [
  {
    name: 'TestUser1',
    service: 'AUDIO',
    identifier: 'qmusic_song_john_doe_hello_world_ABC123',
    created: Date.now() - 3600000,
    size: 5000000
  },
  {
    name: 'TestUser2', 
    service: 'AUDIO',
    identifier: 'qmusic_track_amazing_grace_DEF456',
    created: Date.now() - 7200000,
    size: 4500000
  },
  {
    name: 'iffi',
    service: 'AUDIO', 
    identifier: 'qmusic_song_iffi_vaba_mees_mashupmix201980s_GHI789',
    created: Date.now() - 1800000,
    size: 6000000
  }
];

// Mock playlists for development
const MOCK_PLAYLISTS = [
  {
    name: 'TestUser1',
    service: 'PLAYLIST',
    identifier: 'qmusic_playlist_summer_hits_XYZ789',
    title: 'Summer Hits 2025',
    description: 'Best summer tracks',
    created: Date.now() - 3600000,
    data64: btoa(JSON.stringify({
      title: 'Summer Hits 2025',
      description: 'Best summer tracks',
      tracks: ['qmusic_track_amazing_grace_DEF456'],
      created: Date.now() - 3600000,
      version: "1.0"
    }))
  },
  {
    name: 'iffi',
    service: 'PLAYLIST',
    identifier: 'qmusic_playlist_rock_classics_ABC123',
    title: 'Rock Classics',
    description: 'Best rock songs ever',
    created: Date.now() - 7200000,
    data64: btoa(JSON.stringify({
      title: 'Rock Classics',
      description: 'Best rock songs ever',
      tracks: ['qmusic_song_iffi_vaba_mees_mashupmix201980s_GHI789'],
      created: Date.now() - 7200000,
      version: "1.0"
    }))
  }
];

export const fetchRecentAudioFiles = async (limit = 20, offset = 0) => {
  try {
    console.log(`Fetching audio files with limit=${limit}, offset=${offset}`);
    
    // Check if we're in Qortal environment
    if (typeof qortalRequest === 'undefined') {
      console.log('Development mode - using mock data');
      return MOCK_TRACKS.slice(offset, offset + limit);
    }
    
    // Use Earbump's fetch method instead of qortalRequest
    const url = `/arbitrary/resources/search?mode=ALL&service=AUDIO&query=qmusic_&limit=${limit * 2}&includemetadata=true&offset=${offset}&reverse=true&excludeblocked=true&includestatus=true`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const audioFiles = await response.json();
    console.log(`Raw API response: ${audioFiles.length} total audio files`);
    
    // Filter to include music tracks only
    const musicTracks = audioFiles.filter(track => {
      const isMusic = track.identifier && (
        track.identifier.startsWith('qmusic_') || 
        track.identifier.startsWith('earbump_song_') ||
        track.identifier.startsWith('qaudio_qblog_')
      );
      if (isMusic) {
        console.log(`Found music track: ${track.name} with identifier: ${track.identifier}`);
      }
      return isMusic;
    });
    
    console.log(`Filtered to ${musicTracks.length} music tracks`);
    
    // Return only the requested limit
    const result = musicTracks.slice(0, limit);
    console.log(`Returning ${result.length} tracks after limit`);
    
    return result;
  } catch (error) {
    console.error('Error fetching audio files:', error);
    throw error;
  }
};

export const fetchPlaylists = async (limit = 20, offset = 0) => {
  try {
    console.log(`Fetching playlists with limit=${limit}, offset=${offset}`);
    
    if (typeof qortalRequest === 'undefined') {
      console.log('Development mode - using mock playlists');
      return MOCK_PLAYLISTS;
    }

    // Fetch playlists from QDN
    const response = await qortalRequest({
      action: "SEARCH_QDN_RESOURCES",
      service: "PLAYLIST",
      query: "qmusic_playlist",
      limit,
      offset,
      includemetadata: true,
      reverse: true,
      exactmatchnames: false,
      mode: "ALL",
      status: "READY"
    });

    // Accept all playlists that contain qmusic_playlist in identifier
    const playlists = response.filter(playlist => 
      playlist.identifier && playlist.identifier.includes('qmusic_playlist')
    );

    console.log(`Found ${playlists.length} qmusic playlists`);
    return playlists;

  } catch (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }
};

export const getAudioMetadata = async (name, service, identifier) => {
  try {
    console.log(`Fetching metadata for: ${name}/${service}/${identifier}`);
    
    // Check if we're in Qortal environment
    if (typeof qortalRequest === 'undefined') {
      console.log('Development mode - using mock metadata');
      // Return mock metadata with artist info
      return {
        title: identifier.includes('hello_world') ? 'Hello World' : 
               identifier.includes('amazing_grace') ? 'Amazing Grace' :
               identifier.includes('vaba_mees') ? 'Vaba Mees Mashup' : identifier,
        description: identifier.includes('john_doe') ? 'title=Hello World;author=John Doe' :
                    identifier.includes('iffi') ? 'title=Vaba Mees Mashup;author=Iffi' : 
                    identifier.includes('amazing_grace') ? 'title=Amazing Grace;author=Unknown Artist' : null,
        thumbnail: null
      };
    }
    
    // In production, metadata comes from the search results directly
    // No need for separate API call
    return {
      title: null,
      description: null,
      thumbnail: null
    };
    
  } catch (error) {
    console.error(`Error fetching audio metadata for ${name}:`, error);
    // Return fallback metadata instead of throwing
    return {
      title: identifier || name,
      description: null,
      thumbnail: null
    };
  }
};

// Generate thumbnail URL for a QDN resource
export const getThumbnailUrl = (name, identifier) => {
  if (!name || !identifier) return null;
  return `/arbitrary/THUMBNAIL/${encodeURIComponent(name)}/${encodeURIComponent(identifier)}`;
};
