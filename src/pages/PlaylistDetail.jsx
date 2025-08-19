import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchPlaylistById } from '../services/playlistService';
import '../styles/playlistDetail.css';

const PlaylistDetail = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);

  const loadPlaylistDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPlaylistById(id);
      setPlaylist(data);
      setError(null);
    } catch (err) {
      console.error('Error loading playlist details:', err);
      setError('Failed to load playlist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlaylistDetails();
  }, [loadPlaylistDetails]);

  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
    // You might need to implement actual audio playback here
    // or integrate with your existing audio player component
  };

  if (loading) {
    return (
      <div className="playlist-detail-container loading">
        <div className="loading-spinner"></div>
        <p>Loading playlist...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="playlist-detail-container error">
        <div className="error-message">{error}</div>
        <button onClick={loadPlaylistDetails} className="retry-button">
          Try Again
        </button>
        <Link to="/playlists" className="back-link">
          Back to Playlists
        </Link>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="playlist-detail-container not-found">
        <h2>Playlist Not Found</h2>
        <p>The requested playlist does not exist or has been removed.</p>
        <Link to="/playlists" className="back-link">
          Back to Playlists
        </Link>
      </div>
    );
  }

  return (
    <div className="playlist-detail-container">
      <div className="playlist-header">
        <div className="playlist-cover">
          {playlist.thumbnailUrl ? (
            <img src={playlist.thumbnailUrl} alt={playlist.name} />
          ) : (
            <div className="playlist-cover-placeholder">
              <span>🎵</span>
            </div>
          )}
        </div>

        <div className="playlist-info">
          <h1>{playlist.name}</h1>
          {playlist.description && <p className="playlist-description">{playlist.description}</p>}
          <div className="playlist-meta">
            <p>Created by {playlist.creator || 'Anonymous'}</p>
            <p>{playlist.tracks.length} {playlist.tracks.length === 1 ? 'song' : 'songs'}</p>
          </div>
          <div className="playlist-actions">
            <button className="play-all-button" onClick={() => playlist.tracks.length > 0 && handlePlayTrack(playlist.tracks[0])}>
              {currentTrack ? 'Now Playing' : 'Play All'}
            </button>
          </div>
        </div>
      </div>

      <div className="playlist-tracks">
        <h2>Tracks</h2>
        
        {playlist.tracks.length === 0 ? (
          <div className="no-tracks">
            <p>This playlist has no tracks.</p>
          </div>
        ) : (
          <ul className="tracks-list">
            {playlist.tracks.map((track, index) => (
              <li 
                key={track.id} 
                className={`track-item ${currentTrack?.id === track.id ? 'active' : ''}`}
                onClick={() => handlePlayTrack(track)}
              >
                <div className="track-number">{index + 1}</div>
                <div className="track-artwork">
                  {track.artwork ? (
                    <img src={track.artwork} alt={track.title} />
                  ) : (
                    <div className="track-artwork-placeholder"></div>
                  )}
                </div>
                <div className="track-details">
                  <div className="track-title">{track.title}</div>
                  <div className="track-artist">{track.artist}</div>
                </div>
                <div className="track-duration">
                  {track.duration || '--:--'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;
