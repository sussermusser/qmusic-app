import React, { useState, useEffect } from 'react';
import { getUserPlaylists } from '../services/simplePlaylistService';
import { Link } from 'react-router-dom';

/**
 * Lihtne playlistide kuvamise leht
 */
function SimplePlaylistsPage({ currentUser }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Laadime kasutaja playlistid
  useEffect(() => {
    const loadPlaylists = async () => {
      if (!currentUser?.name) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const userPlaylists = await getUserPlaylists(currentUser);
        setPlaylists(userPlaylists);
      } catch (err) {
        console.error('Viga playlistide laadimisel:', err);
        setError('Playlistide laadimine ebaõnnestus');
      } finally {
        setLoading(false);
      }
    };

    loadPlaylists();
  }, [currentUser]);

  // Kui kasutaja pole sisse logitud
  if (!currentUser?.name) {
    return (
      <div className="playlists-container">
        <h1>Minu playlistid</h1>
        <div className="error-message">
          Playlistide vaatamiseks pead olema sisse logitud.
        </div>
        <div className="cta-button">
          <Link to="/create-simple-playlist" className="button">
            Loo uus playlist
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="playlists-container">
      <h1>Minu playlistid</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="cta-button">
        <Link to="/create-simple-playlist" className="button">
          Loo uus playlist
        </Link>
      </div>
      
      {loading ? (
        <div className="loading-message">
          Laadin playlistid...
        </div>
      ) : playlists.length === 0 ? (
        <div className="empty-message">
          Sul pole veel ühtegi playlisti.
        </div>
      ) : (
        <div className="playlists-grid">
          {playlists.map(playlist => (
            <div key={playlist.id} className="playlist-card">
              <h3>{playlist.name}</h3>
              <p>{playlist.description || 'Kirjeldus puudub'}</p>
              <div className="playlist-meta">
                <span>{playlist.songs?.length || 0} laulu</span>
                <span>Loodud: {new Date(playlist.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SimplePlaylistsPage;
