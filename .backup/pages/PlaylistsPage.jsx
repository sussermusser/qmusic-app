import React, { useState, useEffect, useCallback } from 'react';
import { fetchPlaylists } from '../services/playlistService';
import { Link, useLocation } from 'react-router-dom';
import '../styles/playlists.css';

const PlaylistsPage = () => {
  console.log('PlaylistsPage: Component initializing');
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  const loadPlaylists = useCallback(async (forceRefresh = false) => {
    try {
      console.log('PlaylistsPage: Loading playlists... forceRefresh=', forceRefresh);
      setLoading(true);
      const data = await fetchPlaylists(20, 0, forceRefresh);
      console.log('PlaylistsPage: Playlists loaded:', data);
      setPlaylists(data);
      setError(null);
    } catch (err) {
      console.error('Error loading playlists:', err);
      setError('Failed to load playlists. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('PlaylistsPage: useEffect triggered, location state:', location.state);
    const shouldRefresh = location.state?.refresh === true;
    loadPlaylists(shouldRefresh);
    
    // Clean up the state so future navigations don't trigger refreshes
    if (shouldRefresh && history.replaceState) {
      history.replaceState(
        { ...history.state, state: { ...location.state, refresh: false } },
        document.title,
        location.pathname
      );
    }
  }, [loadPlaylists, location]);

  if (loading) {
    console.log('PlaylistsPage: Rendering loading state');
    return (
      <div className="playlists-container loading">
        <div className="loading-spinner"></div>
        <p>Loading playlists...</p>
      </div>
    );
  }

  if (error) {
    console.log('PlaylistsPage: Rendering error state:', error);
    return (
      <div className="playlists-container error">
        <div className="error-message">{error}</div>
        <button onClick={loadPlaylists} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="playlists-container">
      {console.log('PlaylistsPage: Rendering main content with', playlists.length, 'playlists')}
      <div className="playlists-header">
        <h1>Playlists</h1>
        <Link to="/create-playlist" className="create-playlist-button">
          Create Playlist
        </Link>
      </div>

      {playlists.length === 0 ? (
        <div className="no-playlists">
          <p>No playlists found. Create your first playlist!</p>
          <Link to="/create-playlist" className="create-playlist-button">
            Create Playlist
          </Link>
        </div>
      ) : (
        <div className="playlists-grid">
          {playlists.map((playlist) => (
            <Link
              to={`/playlist/${playlist.id}`}
              key={playlist.id}
              className="playlist-card"
            >
              <div className="playlist-thumbnail">
                {playlist.thumbnailUrl ? (
                  <img
                    src={playlist.thumbnailUrl}
                    alt={playlist.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="playlist-thumbnail-placeholder">
                    <span>🎵</span>
                  </div>
                )}
              </div>
              <div className="playlist-info">
                <h3 className="playlist-name">{playlist.name}</h3>
                <p className="playlist-songs-count">
                  {playlist.tracks ? 
                    `${playlist.tracks.length} ${playlist.tracks.length === 1 ? 'song' : 'songs'}` :
                    playlist.trackCount ? 
                      `${playlist.trackCount} ${playlist.trackCount === 1 ? 'song' : 'songs'}` : 
                      '0 songs'
                  }
                </p>
                <p className="playlist-creator">
                  By {playlist.creator || 'Anonymous'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistsPage;
