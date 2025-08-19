import React, { useState, useEffect, useCallback } from 'react';
import { 
  createPlaylist, getUserSongs, getUserPlaylists, getSongUrl 
} from '../services/playlistService';

function CreatePlaylistPage({ currentUser }) {
  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [userSongs, setUserSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ✅ LAE KASUTAJA OMA LAULUD (AUDIO)
  const loadUserSongs = useCallback(async () => {
    if (!currentUser?.name) return;

    try {
      setLoading(true);
      const songs = await getUserSongs(currentUser);
      setUserSongs(songs);
    } catch (error) {
      console.error('Failed to load songs', error);
      setError('Failed to load songs: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, setLoading, setUserSongs, setError]);

  const loadUserPlaylists = useCallback(async () => {
    if (!currentUser?.name) return;

    try {
      setLoading(true);
      const playlists = await getUserPlaylists(currentUser);
      setUserPlaylists(playlists);
    } catch (error) {
      console.error('Failed to load playlists', error);
      setError('Failed to load playlists: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, setLoading, setUserPlaylists, setError]);

  useEffect(() => {
    if (currentUser?.name) {
      loadUserSongs();
      loadUserPlaylists();
    }
  }, [currentUser, loadUserSongs, loadUserPlaylists]);

  const toggleSongSelection = (song) => {
    setSelectedSongs((prev) => {
      const exists = prev.find((s) => s.identifier === song.identifier);
      return exists
        ? prev.filter((s) => s.identifier !== song.identifier)
        : [...prev, song];
    });
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName || selectedSongs.length === 0) {
      setError('Enter a playlist name and select at least one song.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Create playlist with the new approach that needs currentUser
      await createPlaylist(
        currentUser, 
        playlistName,
        selectedSongs,
        description
      );
      
      setSuccess(true);
      setPlaylistName('');
      setDescription('');
      setSelectedSongs([]);
      
      // Reload user playlists to show the new one
      await loadUserPlaylists();
    } catch (error) {
      console.error("Failed to create playlist:", error);
      setError("Failed to create playlist: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getQdnUrl = (song) => getSongUrl(song);

  const getPlaylistContent = async (playlist) => {
    const url = `/arbitrary/PLAYLIST/${playlist.name}/${playlist.identifier}/${playlist.filename}`;
    try {
      const response = await fetch(url);
      const json = await response.json();
      return json.songs || [];
    } catch (err) {
      console.error("Failed to load playlist content", err);
      return [];
    }
  };

  return (
    <div className="form-page-container">
      <h2>Create New Playlist</h2>
      
      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>
          Playlist created successfully!
        </div>
      )}
      
      <div className="form-group">
        <label>Playlist Name</label>
        <input
          type="text"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          disabled={loading}
        />
      </div>
      
      <div className="form-group">
        <label>Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          rows={3}
        />
      </div>

      <h3>Select Your Songs:</h3>
      {loading && <p>Loading...</p>}
      {!loading && userSongs.length === 0 && <p>You haven't published any songs yet.</p>}
      <ul>
        {userSongs.map((song) => (
          <li key={song.identifier}>
            <label>
              <input
                type="checkbox"
                checked={selectedSongs.some((s) => s.identifier === song.identifier)}
                onChange={() => toggleSongSelection(song)}
                disabled={loading}
              />
              {song.title || song.filename}
            </label>
          </li>
        ))}
      </ul>

      <button 
        onClick={handleCreatePlaylist} 
        disabled={loading || !playlistName || selectedSongs.length === 0}
      >
        {loading ? 'Creating...' : 'Create Playlist'}
      </button>

      <hr />
      <h2>Your Playlists</h2>
      {loading && <p>Loading...</p>}
      {!loading && userPlaylists.length === 0 && <p>No playlists created yet.</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {userPlaylists.map((playlist, idx) => (
          <div key={idx} style={{ border: '1px solid #ccc', padding: '10px' }}>
            <h4>{playlist.name || playlist.filename.replace('.json', '')}</h4>
            <PlaylistSongsRenderer playlist={playlist} getQdnUrl={getQdnUrl} getPlaylistContent={getPlaylistContent} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaylistSongsRenderer({ playlist, getQdnUrl, getPlaylistContent }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylistContent = async () => {
      try {
        setLoading(true);
        const content = await getPlaylistContent(playlist);
        setSongs(content);
      } catch (err) {
        console.error('Error loading playlist content:', err);
        setError('Failed to load playlist songs');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistContent();
  }, [playlist, getPlaylistContent]);

  if (loading) {
    return <p>Loading songs...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (songs.length === 0) {
    return <p>This playlist has no songs.</p>;
  }

  return (
    <ul>
      {songs.map((song, idx) => (
        <li key={idx}>
          <p><strong>{song.title || song.filename}</strong></p>
          <audio controls style={{ width: '100%' }}>
            <source src={getQdnUrl(song)} type="audio/mpeg" />
            Your browser does not support audio playback.
          </audio>
        </li>
      ))}
    </ul>
  );
}

export default CreatePlaylistPage;
