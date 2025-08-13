/* global qortalRequest */
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { fetchRecentAudioFiles, getAudioMetadata, getThumbnailUrl } from './services/qdnService';
import audioPlayer from './services/audioPlayerService';
import AudioCard from './components/AudioCard';
import AddMusicForm from './components/AddMusicForm';
import UploadSongForm from './components/UploadSongForm';
import './styles.css';

// Helper function to extract title from identifier
const extractTitleFromIdentifier = (identifier) => {
  if (!identifier) return null;
  
  console.log(`=== TITLE EXTRACTION ===`);
  console.log(`Input identifier: "${identifier}"`);
  
  // For qmusic_track_title_RANDOMCODE format
  if (identifier.startsWith('qmusic_track_')) {
    const parts = identifier.split('_');
    console.log(`qmusic_track parts:`, parts);
    console.log(`Parts length: ${parts.length}`);
    
    if (parts.length >= 4) {
      // Remove 'qmusic', 'track', and last random part
      const titleParts = parts.slice(2, -1);
      const title = titleParts.join(' ');
      console.log(`Extracted title (track format): "${title}"`);
      return title;
    } else {
      console.log(`Not enough parts for qmusic_track format`);
    }
  }
  
  // For qmusic_song_artist_title_RANDOMCODE format  
  if (identifier.startsWith('qmusic_song_')) {
    const parts = identifier.split('_');
    console.log(`qmusic_song parts:`, parts);
    console.log(`Parts length: ${parts.length}`);
    
    if (parts.length >= 5) {
      // Remove 'qmusic', 'song', first element (artist), and last random part
      // qmusic_song_artist_title_RANDOMCODE -> ['qmusic', 'song', 'artist', 'title', 'RANDOMCODE']
      const titleParts = parts.slice(3, -1);
      const title = titleParts.join(' ');
      console.log(`Extracted title (song format): "${title}"`);
      return title;
    } else {
      console.log(`Not enough parts for qmusic_song format`);
    }
  }
  
  // For earbump_song_title_RANDOMCODE format (similar pattern)
  if (identifier.startsWith('earbump_song_')) {
    const parts = identifier.split('_');
    console.log(`earbump_song parts:`, parts);
    
    if (parts.length >= 4) {
      // Remove 'earbump', 'song', and last random part  
      const titleParts = parts.slice(2, -1);
      const title = titleParts.join(' ');
      console.log(`Extracted title (earbump format): "${title}"`);
      return title;
    }
  }
  
  console.log(`No matching pattern found for identifier: "${identifier}"`);
  return null;
};

// Helper function to extract artist from identifier
const extractArtistFromIdentifier = (identifier) => {
  if (!identifier) return null;
  
  console.log(`=== ARTIST EXTRACTION ===`);
  console.log(`Input identifier: "${identifier}"`);
  
  // For qmusic_song_artist_title_RANDOMCODE format
  if (identifier.startsWith('qmusic_song_')) {
    const parts = identifier.split('_');
    console.log(`qmusic_song parts for artist:`, parts);
    
    if (parts.length >= 4) {
      // Artist is the 3rd element (index 2)
      // qmusic_song_artist_title_RANDOMCODE -> ['qmusic', 'song', 'artist', 'title', 'RANDOMCODE']
      const artist = parts[2];
      console.log(`Extracted artist: "${artist}"`);
      return artist;
    }
  }
  
  console.log(`No artist found in identifier: "${identifier}"`);
  return null;
};

function App() {
  // ... rest of the component
  return (
    <Router>
      <div className="app">
        {/* Your JSX content here */}
      </div>
    </Router>
  );
}

export default App;
