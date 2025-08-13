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
