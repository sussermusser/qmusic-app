import React, { useState } from 'react';
import { createPlaylist } from '../services/simplePlaylistService';

/**
 * Lihtne playlist loomise komponent
 * Sisaldab ainult nime ja kirjelduse välju
 */
function SimpleCreatePlaylistPage({ currentUser }) {
  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Playlist loomise funktsioon
  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    
    if (!playlistName) {
      setError('Palun sisesta playlisti nimi');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      
      console.log('Loon playlisti:', { name: playlistName, description, user: currentUser });
      
      // Kutsume playlist loomise teenuse
      const result = await createPlaylist(currentUser, playlistName, description);
      
      console.log('Playlist loomise tulemus:', result);
      
      if (result.success) {
        setSuccess(true);
        // Tühjendame väljad uue playlisti jaoks
        setPlaylistName('');
        setDescription('');
      } else {
        setError('Playlisti loomine ebaõnnestus');
      }
    } catch (err) {
      console.error('Viga playlisti loomisel:', err);
      setError(`Playlisti loomine ebaõnnestus: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Näita kasutajale kui ta pole sisse logitud
  if (!currentUser?.name) {
    return (
      <div className="create-playlist-container">
        <h1>Loo uus playlist</h1>
        <div className="error-message">
          Playlisti loomiseks pead olema sisse logitud.
        </div>
      </div>
    );
  }

  return (
    <div className="create-playlist-container">
      <h1>Loo uus playlist</h1>
      
      {success && (
        <div className="success-message">
          Playlist edukalt loodud!
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleCreatePlaylist}>
        <div className="form-group">
          <label htmlFor="playlist-name">Playlisti nimi</label>
          <input
            id="playlist-name"
            type="text"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            placeholder="Sisesta playlisti nimi"
            disabled={loading}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="playlist-description">Kirjeldus (valikuline)</label>
          <textarea
            id="playlist-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kirjelda oma playlisti"
            disabled={loading}
            rows={4}
          />
        </div>
        
        <button 
          type="submit" 
          className="create-button" 
          disabled={loading || !playlistName}
        >
          {loading ? 'Loomisel...' : 'Loo playlist'}
        </button>
      </form>
    </div>
  );
}

export default SimpleCreatePlaylistPage;
