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
               <nav className="side-menu">
                {currentUser && (
                  <div className="menu-section publish-section">
                    <h3>Actions</h3>
                    <Link to="/upload" className="sidebar-link publish-link">
                      <span className="sidebar-icon">📤</span>
                      PUBLISH SONG
                    </Link>
                  </div>
                )}
                
                {/* Statistics - always visible */}
                <div className="menu-section">
                  <h3>Statistics</h3>
                  <div className="stat-item">
                    <span>All songs on QDN</span>
                    <span>0</span>
                  </div>
                  <div className="stat-item">
                    <span>Q-Music songs</span>
                    <span>0</span>
                  </div>
                  <div className="stat-item">
                    <span>Ear Bump songs</span>
                    <span>0</span>
                  </div>
                  <div className="stat-item">
                    <span>Publishers</span>
                    <span>0</span>
                  </div>
                </div>
                
                {currentUser && (
                  <div className="menu-section">
                    <h3>Your Library</h3>
                    <h4>Playlists</h4>
                    {/* Playlists will be listed here */}
                  </div>
                )}
                
                {/* Info box and links at bottom */}
                <div className="sidebar-info-box">
                  <p>Q-Music is a decentralized music platform built on the QORTAL blockchain. 
                  Discover, share, and publish music in a truly decentralized ecosystem.</p>
                </div>
                
                <div className="sidebar-bottom-links">
                  <a href="#" className="bottom-link">Q-MAIL</a>
                  <a href="#" className="bottom-link">Q-CHAT</a>
                  <a href="#" className="bottom-link">FAQ</a>
                </div>
              </nav>
            </div>
          </aside>
          {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />}

          <footer className="player">
            {/* Player content will go here */}
          </footer>
        </div>
      </div>
    </Router>
  );
};

// Helper functions should be outside of App component
const processIdentifierParts = (identifier) => {
  if (!identifier) return null;
    const parts = identifier.split('_');
    console.log(`qmusic_track parts:`, parts);
    console.log(`Parts length: ${parts.length}`);
    
    if (parts.length >= 4) {
      // Remove 'qmusic', 'track', and last random part
      const titleParts = parts.slice(2, -1);
      const title = titleParts.join(' ');
      console.log(`Extracted title (track format): "${title}"`);
      console.log(`Title parts used:`, titleParts);
      return title;
    } else {
      console.log(`Not enough parts for qmusic_track format`);
    }
  }
  
  // For qmusic_song_artist_title_RANDOMCODE format (older format)
  if (identifier.startsWith('qmusic_song_')) {
    const parts = identifier.split('_');
    console.log(`qmusic_song parts:`, parts);
    console.log(`Parts length: ${parts.length}`);
    
    if (parts.length >= 5) {
      // For complex titles like "qmusic_song_iffi_vaba_mees_mashupmix201980s-90s_1751610107234"
      // Skip qmusic, song, artist (first 3 parts) and random code (last part)
      const titleParts = parts.slice(3, -1);
      const title = titleParts.join(' ');
      console.log(`Extracted title (song format): "${title}"`);
      console.log(`Title parts used:`, titleParts);
      return title;
    } else {
      console.log(`Not enough parts for qmusic_song format`);
    }
  }
  
  // For earbump_song_title_RANDOMCODE format  
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
  
  console.log(`No title extraction pattern matched - returning identifier as-is`);
  console.log(`========================`);
  return identifier;
};

// Helper function to extract artist from identifier
const extractArtistFromIdentifier = (identifier) => {
  if (!identifier) return null;
  
  console.log(`Extracting artist from: ${identifier}`);
  
  // For qmusic_song_artist_title_RANDOMCODE format
  if (identifier.startsWith('qmusic_song_')) {
    const parts = identifier.split('_');
    console.log(`qmusic_song parts:`, parts);
    if (parts.length >= 5) {
      // Artist is the 3rd part (index 2)
      const artist = parts[2];
      console.log(`Extracted artist: ${artist}`);
      return artist;
    }
  }
  
  // For qmusic_track_artist_title_RANDOMCODE format (newer format)
  if (identifier.startsWith('qmusic_track_')) {
    const parts = identifier.split('_');
    console.log(`qmusic_track parts:`, parts);
    if (parts.length >= 5) {
      // Artist might be the 3rd part
      const artist = parts[2];
      console.log(`Extracted artist from track format: ${artist}`);
      return artist;
    }
  }
  
  console.log(`No artist found for: ${identifier}`);
  return null;
};

function App() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [recentTracks, setRecentTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = async () => {
    try {
      console.log("Attempting to get user account...");
      const accountData = await qortalRequest({ action: "GET_USER_ACCOUNT" });

      if (accountData && accountData.address) {
        console.log("Account data received, fetching names...");
        const namesData = await qortalRequest({ 
          action: 'GET_ACCOUNT_NAMES', 
          address: accountData.address 
        });
        
        const userName = (namesData && namesData.length > 0) 
            ? namesData[0].name 
            : `User ${accountData.address.substring(0, 6)}...`;
        
        const userToSet = {
          name: userName,
          address: accountData.address,
          publicKey: accountData.publicKey
        };

        console.log("Setting user:", userToSet);
        setCurrentUser(userToSet);
        console.log(`User logged in: ${userToSet.name}`);

      } else {
        throw new Error("User account data could not be retrieved.");
      }
    } catch (error) {
      console.error("Login failed:", error);
      alert(`Login failed: ${error.message || "An unknown error occurred."}`);
    }
  };

  // Remove automatic login check; login only on button click

  const handlePlayTrack = useCallback(async (track) => {
    try {
      if (currentTrack?.id === track.id) {
        if (isPlaying) {
          audioPlayer.pause();
          setIsPlaying(false);
        } else {
          audioPlayer.resume();
          setIsPlaying(true);
        }
      } else {
        setCurrentTrack(track);
        await audioPlayer.play(track);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing track:', error);
      setError('Failed to play track. Please try again.');
    }
  }, [currentTrack, isPlaying]);

  // Update progress bar
  useEffect(() => {
    const cleanup = audioPlayer.onTimeUpdate(() => {
      const progress = (audioPlayer.getCurrentTime() / audioPlayer.getDuration()) * 100;
      setProgress(isNaN(progress) ? 0 : progress);
    });

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    const endedCleanup = audioPlayer.onEnded(handleEnded);

    return () => {
      cleanup();
      endedCleanup();
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load recent tracks from QDN
  const loadRecentTracks = useCallback(async () => {
    try {
      console.log('Loading recent tracks from QDN...');
      setIsLoading(true);
      setError(null);
      const audioFiles = await fetchRecentAudioFiles(20);
      console.log('Fetched audio files:', audioFiles);
      
      // Add debug info for each track
      audioFiles.forEach(file => {
        console.log(`Processing track: ${file.name} with identifier: ${file.identifier}`);
        const extractedTitle = extractTitleFromIdentifier(file.identifier);
        console.log(`Extracted title: ${extractedTitle}`);
      });
      
      // Fetch metadata for each audio file - using Earbump's approach
      const tracksWithMetadata = await Promise.all(
        audioFiles.map(async (file) => {
          try {
            // Use Earbump's metadata parsing approach - data comes from search results
            console.log(`=== PROCESSING TRACK ===`);
            console.log(`File:`, file);
            
            // Parse metadata from search result (like Earbump does)
            const description = file?.metadata?.description || "";
            console.log(`Description field:`, description);
            
            // Parse title and author from description field (Earbump style)
            let parsedTitle = null;
            let parsedArtist = null;
            
            if (description) {
              const pairs = description.split(';');
              console.log(`Description pairs:`, pairs);
              
              for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i].split('=');
                if (pair.length === 2) {
                  const key = pair[0].trim();
                  const value = pair[1].trim();
                  
                  if (key === 'title') {
                    parsedTitle = value;
                    console.log(`Found title in description: ${parsedTitle}`);
                  }
                  if (key === 'author') {
                    parsedArtist = value;
                    console.log(`Found author in description: ${parsedArtist}`);
                  }
                }
              }
            }
            
            // Fallback to identifier parsing if no metadata
            if (!parsedTitle) {
              parsedTitle = extractTitleFromIdentifier(file.identifier);
              console.log(`Using identifier title: ${parsedTitle}`);
            }
            
            if (!parsedArtist) {
              parsedArtist = extractArtistFromIdentifier(file.identifier);
              console.log(`Using identifier artist: ${parsedArtist}`);
            }
            
            // Final fallback
            const finalTitle = parsedTitle || file?.metadata?.title || file.name;
            const finalArtist = parsedArtist || 'Unknown Artist';
            
            console.log(`=== FINAL RESULT ===`);
            console.log(`Title: ${finalTitle}`);
            console.log(`Artist: ${finalArtist}`);
            console.log(`Uploader: ${file.name}`);
            console.log(`====================`);

            return {
              id: `${file.name}_${file.service}_${file.identifier}`,
              title: finalTitle,
              artist: finalArtist,
              uploader: file.name,
              thumbnail: getThumbnailUrl(file.name, file.identifier),
              ...file
            };
          } catch (error) {
            console.warn(`Error processing track ${file.name}:`, error);
            
            // Fallback: try to extract info from identifier
            const extractedArtist = extractArtistFromIdentifier(file.identifier);
            
            return {
              id: `${file.name}_${file.service}_${file.identifier}`,
              title: extractTitleFromIdentifier(file.identifier) || file.name,
              artist: extractedArtist || 'Unknown Artist',
              uploader: file.name,
              thumbnail: getThumbnailUrl(file.name, file.identifier),
              ...file
            };
          }
        })
      );

      console.log('Tracks with metadata:', tracksWithMetadata);
      
      // Filter and prioritize user's own tracks - expanded pattern matching
      const prioritizedTracks = tracksWithMetadata.sort((a, b) => {
        // Check for various patterns that indicate user's own tracks
        const aIsOwn = a.id && (
          a.id.includes('Q-Music_AUDIO_qmusic_track_') || 
          a.id.includes('Q-Music_AUDIO_qmusic_song_') ||
          a.id.includes('iffi vaba mees_AUDIO_qmusic_song_') ||
          a.id.includes('iffi forest life_AUDIO_qmusic_song_') ||
          a.name === 'Q-Music' ||
          (a.name && a.name.toLowerCase().includes('iffi'))
        );
        
        const bIsOwn = b.id && (
          b.id.includes('Q-Music_AUDIO_qmusic_track_') || 
          b.id.includes('Q-Music_AUDIO_qmusic_song_') ||
          b.id.includes('iffi vaba mees_AUDIO_qmusic_song_') ||
          b.id.includes('iffi forest life_AUDIO_qmusic_song_') ||
          b.name === 'Q-Music' ||
          (b.name && b.name.toLowerCase().includes('iffi'))
        );
        
        if (aIsOwn && !bIsOwn) return -1;
        if (bIsOwn && !aIsOwn) return 1;
        return 0;
      });
      
      // Log with proper own track detection
      console.log('Prioritized tracks (own tracks first):', prioritizedTracks.map(t => ({
        id: t.id, 
        title: t.title, 
        name: t.name,
        isOwn: t.id && (
          t.id.includes('Q-Music_AUDIO_qmusic_track_') || 
          t.id.includes('Q-Music_AUDIO_qmusic_song_') ||
          t.id.includes('iffi vaba mees_AUDIO_qmusic_song_') ||
          t.id.includes('iffi forest life_AUDIO_qmusic_song_') ||
          t.name === 'Q-Music' ||
          (t.name && t.name.toLowerCase().includes('iffi'))
        )
      })));
      setRecentTracks(prioritizedTracks);
    } catch (err) {
      console.error('Error loading tracks:', err);
      setError('Failed to load tracks. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to handle new music added
  const handleMusicAdded = useCallback(async (newTrack = null) => {
    console.log('🎵 handleMusicAdded called with:', newTrack);
    
    if (newTrack) {
      // Add new track immediately to the beginning of the list
      console.log('✅ Adding new track immediately:', newTrack);
      setRecentTracks(prevTracks => {
        console.log('📋 Current tracks before adding:', prevTracks.length, prevTracks.map(t => ({id: t.id, title: t.title})));
        
        // Check if track already exists to avoid duplicates
        const exists = prevTracks.some(track => {
          const isDuplicate = track.id === newTrack.id || 
                             (track.title === newTrack.title && track.artist === newTrack.artist);
          if (isDuplicate) {
            console.log('⚠️  Duplicate found:', track.id, 'vs', newTrack.id);
          }
          return isDuplicate;
        });
        
        if (exists) {
          console.log('❌ Track already exists, not adding');
          return prevTracks;
        }
        
        const newTracks = [newTrack, ...prevTracks];
        console.log('✅ New tracks array:', newTracks.length, newTracks.map(t => ({id: t.id, title: t.title})));
        return newTracks;
      });
    } else {
      console.log('🔄 Refreshing from QDN...');
      
      // Refresh from QDN but preserve immediately added tracks
      setRecentTracks(prevTracks => {
        console.log('📋 Current tracks before QDN refresh:', prevTracks.length, prevTracks.map(t => ({id: t.id, title: t.title})));
        
        // Keep tracks added in the last 60 seconds (much more generous)
        const now = Date.now();
        const sixtySecondsAgo = now - (60 * 1000);
        
        const immediatelyAdded = prevTracks.filter(track => {
          // Check if track was created recently (has a recent timestamp in created field)
          const isRecent = track.created && track.created > sixtySecondsAgo;
          // Keep tracks from current user with various patterns
          const isOwnTrack = track.id && (
            track.id.includes('Q-Music_AUDIO_qmusic_track_') ||
            track.id.includes('Q-Music_AUDIO_qmusic_song_') ||
            track.id.includes('iffi vaba mees_AUDIO_qmusic_song_') ||
            track.id.includes('iffi forest life_AUDIO_qmusic_song_') ||
            (track.name === 'Q-Music') ||
            (track.name && track.name.toLowerCase().includes('iffi'))
          );
          
          if (isRecent || isOwnTrack) {
            console.log('🕒 Keeping recent/own track:', track.id, track.title, 'created:', track.created, 'isRecent:', isRecent, 'isOwnTrack:', isOwnTrack);
          }
          return isRecent || isOwnTrack;
        });
        
        console.log('✅ Preserved immediately added tracks:', immediatelyAdded.length, immediatelyAdded.map(t => ({id: t.id, title: t.title})));
        return immediatelyAdded;
      });
      
      // Load fresh data and merge
      setTimeout(async () => {
        try {
          const audioFiles = await fetchRecentAudioFiles(20);
          const tracksWithMetadata = await Promise.all(
            audioFiles.map(async (file) => {
              try {
                const metadata = await getAudioMetadata(file.name, file.service, file.identifier);
                
                let artist = 'Unknown Artist';
                if (metadata.description && typeof metadata.description === 'string') {
                  const artistMatch = metadata.description.match(/artist=([^;]+)/);
                  if (artistMatch) {
                    artist = artistMatch[1];
                  }
                }
                
                return {
                  id: `${file.name}_${file.service}_${file.identifier}`,
                  title: (metadata.title && metadata.title.trim()) || extractTitleFromIdentifier(file.identifier) || file.name,
                  artist: artist,
                  thumbnail: metadata.thumbnail || null,
                  ...file
                };
              } catch {
            // Fallback: try to extract info from identifier
            const extractedArtist = extractArtistFromIdentifier(file.identifier);
            
            return {
              id: `${file.name}_${file.service}_${file.identifier}`,
              title: extractTitleFromIdentifier(file.identifier) || file.name,
              artist: extractedArtist || 'Unknown Artist',
              uploader: file.name,
              thumbnail: null,
              ...file
            };
          }
            })
          );
          
          console.log('🌐 QDN tracks loaded:', tracksWithMetadata.length, tracksWithMetadata.map(t => ({id: t.id, title: t.title, artist: t.artist})));
          
          // Merge QDN tracks with existing tracks (avoid duplicates)
          setRecentTracks(prevTracks => {
            console.log('📋 Current tracks before QDN merge:', prevTracks.length, prevTracks.map(t => ({id: t.id, title: t.title})));
            
            const combined = [...prevTracks];
            
            tracksWithMetadata.forEach(qdnTrack => {
              const exists = combined.some(existingTrack => {
                const titleMatch = existingTrack.title === qdnTrack.title;
                const artistMatch = existingTrack.artist === qdnTrack.artist;
                const durationMatch = Math.abs((existingTrack.duration || 0) - (qdnTrack.duration || 0)) < 5;
                const isDuplicate = titleMatch && artistMatch && durationMatch;
                
                if (isDuplicate) {
                  console.log('🔍 Duplicate detected:', existingTrack.id, 'vs', qdnTrack.id);
                }
                
                return isDuplicate;
              });
              
              if (!exists) {
                console.log('➕ Adding QDN track:', qdnTrack.id, qdnTrack.title);
                combined.push(qdnTrack);
              } else {
                console.log('⏭️  Skipping duplicate QDN track:', qdnTrack.id, qdnTrack.title);
              }
            });
            
            console.log('📋 Combined tracks before sort:', combined.length, combined.map(t => ({id: t.id, title: t.title})));
            
            // Sort by most recent first (immediate tracks with created timestamp stay at top)
            const sorted = combined.sort((a, b) => {
              const aIsRecent = a.created && (Date.now() - a.created) < 60000; // Last 60 seconds
              const bIsRecent = b.created && (Date.now() - b.created) < 60000;
              
              // Check for various patterns that indicate user's own tracks
              const aIsOwn = a.id && (
                a.id.includes('Q-Music_AUDIO_qmusic_track_') ||
                a.id.includes('Q-Music_AUDIO_qmusic_song_') ||
                a.id.includes('iffi vaba mees_AUDIO_qmusic_song_') ||
                a.id.includes('iffi forest life_AUDIO_qmusic_song_') ||
                (a.name === 'Q-Music') ||
                (a.name && a.name.toLowerCase().includes('iffi'))
              );
              
              const bIsOwn = b.id && (
                b.id.includes('Q-Music_AUDIO_qmusic_track_') ||
                b.id.includes('Q-Music_AUDIO_qmusic_song_') ||
                b.id.includes('iffi vaba mees_AUDIO_qmusic_song_') ||
                b.id.includes('iffi forest life_AUDIO_qmusic_song_') ||
                (b.name === 'Q-Music') ||
                (b.name && b.name.toLowerCase().includes('iffi'))
              );
              
              // Prioritize own tracks or recent tracks
              if ((aIsRecent || aIsOwn) && !(bIsRecent || bIsOwn)) return -1;
              if ((bIsRecent || bIsOwn) && !(aIsRecent || aIsOwn)) return 1;
              
              // Both recent/own or both old, sort by created time if available
              if (a.created && b.created) return b.created - a.created;
              if (a.created && !b.created) return -1;
              if (b.created && !a.created) return 1;
              
              return 0; // Keep original order
            });
            
            console.log('✅ Final sorted tracks:', sorted.length, sorted.map(t => ({id: t.id, title: t.title})));
            return sorted;
          });
        } catch (error) {
          console.error('Error refreshing tracks:', error);
        }
      }, 1000);
    }
  }, []);

  useEffect(() => {
    loadRecentTracks();
  }, [loadRecentTracks]);
  
  return (
    <Router>
      <div className="app">
        <div className="app-container">
          <header className="header">
            <div className="header-content">
              <div className="header-left">
                <button 
                  className="hamburger-menu"
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                >
                  ☰
                </button>
                <div className="logo">
                  <span className="logo-letter">Q</span>
                  <span className="logo-text">-Music</span>
                </div>
              </div>
              <div className="header-center">
                <div className="search-container">
                  <input 
                    type="text" 
                    id="search-input"
                    name="search"
                    placeholder="Search..." 
                    className="search-input" 
                  />
                  <button className="search-button">
                    🔍
                  </button>
                </div>
                <div className="browse-options">
                  <Link to="/" className="browse-button">Home</Link>
                  <button className="browse-button">Songs</button>
                  <button className="browse-button">Playlists</button>
                </div>
              </div>
              <div className="header-right">
                {/* User info moved to sidebar */}
              </div>
            </div>
          </header>
          
          <main className="main-content">
            <div className="content-area">
              <Routes>
                <Route path="/" element={
                  <div className="home-container">
                    <section className="section">
                      <h2 className="section-title">Recently Added Songs</h2>
                      <div className="horizontal-scroll-container">
                        {isLoading ? (
                          <div className="loading-message">Loading songs...</div>
                        ) : error ? (
                          <div className="error-message">{error}</div>
                        ) : recentTracks.length === 0 ? (
                          <div className="empty-message">No songs found</div>
                        ) : (
                          recentTracks.map(track => (
                            <AudioCard 
                              key={track.id} 
                              audio={track}
                              isPlaying={isPlaying && currentTrack?.id === track.id}
                              onPlay={handlePlayTrack}
                            />
                          ))
                        )}
                      </div>
                    </section>
                    
                    <section className="section">
                      <h2 className="section-title">Recently Created Playlists</h2>
                      <div className="horizontal-scroll-container">
                        {/* Playlist cards will be added here */}
                      </div>
                    </section>
                  </div>
                } />
                <Route path="/add-music" element={<AddMusicForm currentUser={currentUser} onMusicAdded={handleMusicAdded} />} />
                <Route path="/upload" element={<AddMusicForm currentUser={currentUser} onMusicAdded={handleMusicAdded} />} />
              </Routes>
            </div>
          </main>

          <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-content">
              {/* User Section */}
              <div className="user-section">
                {currentUser ? (
                  <div className="user-info">
                    <div className="user-avatar">👤</div>
                    <span className="user-name">{currentUser.name}</span>
                  </div>
                ) : (
                  <button className="sidebar-login-button" onClick={handleLogin}>
                    🔐 Login
                  </button>
                )}
              </div>
              
              <nav className="side-menu">
                {currentUser && (
                  <div className="menu-section">
                    <h3>Actions</h3>
                    <Link to="/upload" className="sidebar-link publish-link">
                      <span className="sidebar-icon">📤</span>
                      PUBLISH SONG
                    </Link>
                  </div>
                )}
                
                {/* Always visible menu items */}
                <div className="menu-section">
                  <h3>Browse</h3>
                  <div className="sidebar-link">
                    <span className="sidebar-icon">🎵</span>
                    All Songs
                  </div>
                  <div className="sidebar-link">
                    <span className="sidebar-icon">�</span>
                    Artists
                  </div>
                  <div className="sidebar-link">
                    <span className="sidebar-icon">📀</span>
                    Albums
                  </div>
                  <div className="sidebar-link">
                    <span className="sidebar-icon">🎭</span>
                    Genres
                  </div>
                </div>
                
                {currentUser && (
                  <div className="menu-section">
                    <h3>Your Library</h3>
                    <h4>Playlists</h4>
                    {/* Playlists will be listed here */}
                  </div>
                )}
                
                {/* Info box and links at bottom */}
                <div className="sidebar-info-box">
                  <p>Q-Music is a decentralized music platform built on the QORTAL blockchain. 
                  Discover, share, and publish music in a truly decentralized ecosystem.</p>
                </div>
                
                <div className="sidebar-bottom-links">
                  <a href="#" className="bottom-link">Q-MAIL</a>
                  <a href="#" className="bottom-link">Q-CHAT</a>
                  <a href="#" className="bottom-link">FAQ</a>
                </div>
              </nav>
            </div>
          </aside>
          {isSidebarOpen && <div className="sidebar-backdrop" onClick={() => setIsSidebarOpen(false)} />}

          <footer className="player">
            {currentTrack ? (
              <div className="player-controls">
                <div className="track-info">
                  {currentTrack.thumbnail ? (
                    <img src={currentTrack.thumbnail} alt={currentTrack.title} className="track-image" />
                  ) : (
                    <div className="track-image-placeholder">🎵</div>
                  )}
                  <div className="track-details">
                    <h4>{currentTrack.title}</h4>
                    <p>{currentTrack.artist}</p>
                  </div>
                </div>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="controls">
                  <button 
                    className="play-button" 
                    onClick={() => handlePlayTrack(currentTrack)}
                  >
                    {isPlaying ? '⏸️' : '▶️'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="player-placeholder">
                <p>Select a track to play</p>
              </div>
            )}
          </footer>
        </div>
      </div>
    </Router>
  );
}

export default App;
