import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Container, Typography, TextField, Checkbox, 
  FormControlLabel, Button, Paper, List, ListItem, 
  Divider, Alert, CircularProgress 
} from '@mui/material';
import { createPlaylist, getUserSongs, getUserPlaylists, getSongUrl } from '../services/workingPlaylistService';

/**
 * CreatePlaylistPage - A component for creating and viewing playlists
 * Based on the working example implementation
 */
const CreatePlaylistPage = ({ currentUser }) => {
  // State
  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [userSongs, setUserSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Load user's songs and playlists
  useEffect(() => {
    if (currentUser?.name) {
      loadUserData();
    }
  }, [currentUser, loadUserData]);

  // Load user's songs and playlists
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load songs and playlists in parallel
      const [songs, playlists] = await Promise.all([
        getUserSongs(currentUser),
        getUserPlaylists(currentUser)
      ]);
      
      setUserSongs(songs);
      setUserPlaylists(playlists);
    } catch (error) {
      console.error('Failed to load user data:', error);
      setError('Failed to load your songs and playlists');
    } finally {
      setLoading(false);
    }
  }, [currentUser, setUserSongs, setUserPlaylists, setLoading, setError]);

  // Toggle song selection
  const toggleSongSelection = (song) => {
    setSelectedSongs((prev) => {
      const exists = prev.find((s) => s.identifier === song.identifier);
      return exists
        ? prev.filter((s) => s.identifier !== song.identifier)
        : [...prev, song];
    });
  };

  // Create a new playlist
  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      setError('Please enter a playlist name');
      return;
    }

    if (selectedSongs.length === 0) {
      setError('Please select at least one song');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Create the playlist
      await createPlaylist(
        currentUser,
        playlistName.trim(),
        selectedSongs,
        description.trim()
      );
      
      // Reset form and show success message
      setPlaylistName('');
      setDescription('');
      setSelectedSongs([]);
      setSuccess(true);
      
      // Reload playlists to show the new one
      const playlists = await getUserPlaylists(currentUser);
      setUserPlaylists(playlists);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      setError(error.message || 'Failed to create playlist');
    } finally {
      setLoading(false);
    }
  };

  // Get the content of a playlist
  const getPlaylistContent = useCallback(async (playlist) => {
    const url = `/arbitrary/PLAYLIST/${playlist.name}/${playlist.identifier}/${playlist.filename}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch playlist');
      }
      const json = await response.json();
      return json.songs || [];
    } catch (err) {
      console.error("Failed to load playlist content", err);
      return [];
    }
  }, []);

  // Get audio URL for a song
  const getQdnUrl = (song) => {
    return getSongUrl(song);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Playlist
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
            Playlist created successfully!
          </Alert>
        )}
        
        <Box component="form" noValidate sx={{ mt: 2 }}>
          <TextField
            label="Playlist Name"
            fullWidth
            required
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            margin="normal"
            disabled={loading}
          />
          
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            disabled={loading}
          />
          
          <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
            Select Your Songs:
          </Typography>
          
          {loading && userSongs.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          ) : userSongs.length === 0 ? (
            <Alert severity="info" sx={{ my: 2 }}>
              You haven't published any songs yet.
            </Alert>
          ) : (
            <List sx={{ bgcolor: 'background.paper', border: '1px solid #ddd', borderRadius: 1 }}>
              {userSongs.map((song) => (
                <ListItem key={song.identifier} divider>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedSongs.some((s) => s.identifier === song.identifier)}
                        onChange={() => toggleSongSelection(song)}
                        disabled={loading}
                      />
                    }
                    label={song.title || song.filename}
                  />
                </ListItem>
              ))}
            </List>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreatePlaylist}
              disabled={loading || !playlistName.trim() || selectedSongs.length === 0}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? 'Creating...' : 'Create Playlist'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      <Divider sx={{ my: 4 }} />
      
      <Typography variant="h4" component="h2" gutterBottom>
        Your Playlists
      </Typography>
      
      {loading && userPlaylists.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : userPlaylists.length === 0 ? (
        <Alert severity="info">
          You haven't created any playlists yet.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {userPlaylists.map((playlist) => (
            <Paper key={playlist.identifier} elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {playlist.name || playlist.filename.replace('.json', '')}
              </Typography>
              <PlaylistSongsRenderer
                playlist={playlist}
                getQdnUrl={getQdnUrl}
                getPlaylistContent={getPlaylistContent}
              />
            </Paper>
          ))}
        </Box>
      )}
    </Container>
  );
};

/**
 * PlaylistSongsRenderer - Displays songs in a playlist
 */
const PlaylistSongsRenderer = ({ playlist, getQdnUrl, getPlaylistContent }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPlaylistContent = async () => {
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

    loadPlaylistContent();
  }, [playlist, getPlaylistContent]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (songs.length === 0) {
    return <Alert severity="info">This playlist has no songs.</Alert>;
  }

  return (
    <List>
      {songs.map((song, idx) => (
        <ListItem key={idx} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {song.title || song.filename}
          </Typography>
          <Box sx={{ width: '100%', mt: 1 }}>
            <audio controls style={{ width: '100%' }}>
              <source src={getQdnUrl(song)} type="audio/mpeg" />
              Your browser does not support audio playback.
            </audio>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

export default CreatePlaylistPage;
