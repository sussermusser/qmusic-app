import React, { useState } from 'react';
import { TextField, Button, Box, Typography, CircularProgress, Paper, Alert } from '@mui/material';
import { createPlaylist } from '../services/simplifiedPlaylistService';

/**
 * A simplified CreatePlaylistForm component
 * 
 * This component provides a form for creating new playlists
 * with proper error handling and loading states.
 */
const CreatePlaylistForm = ({ onSuccess, initialTracks = [] }) => {
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Handle thumbnail selection
  const handleThumbnailChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }
    
    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
      setError('Image file is too large. Maximum size is 500KB');
      return;
    }
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setThumbnailFile(file);
    setThumbnailPreview(previewUrl);
    setError(null);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!name.trim()) {
      setError('Playlist name is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Create playlist
      const result = await createPlaylist(
        name.trim(),
        description.trim(),
        initialTracks,
        thumbnailFile
      );
      
      // Handle success
      setSuccess(true);
      setName('');
      setDescription('');
      setThumbnailFile(null);
      setThumbnailPreview(null);
      
      // Call onSuccess callback if provided
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(result);
      }
      
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError(err.message || 'Failed to create playlist');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Paper elevation={2} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
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
      
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Playlist Name"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Playlist Thumbnail (optional)
          </Typography>
          
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="thumbnail-input"
            type="file"
            onChange={handleThumbnailChange}
            disabled={loading}
          />
          
          <label htmlFor="thumbnail-input">
            <Button 
              variant="outlined" 
              component="span"
              disabled={loading}
            >
              Choose Image
            </Button>
          </label>
          
          {thumbnailPreview && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img 
                src={thumbnailPreview} 
                alt="Thumbnail preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 200, 
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: 4
                }} 
              />
            </Box>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            type="button" 
            onClick={() => {
              setName('');
              setDescription('');
              setThumbnailFile(null);
              setThumbnailPreview(null);
              setError(null);
            }}
            disabled={loading}
          >
            Clear
          </Button>
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? 'Creating...' : 'Create Playlist'}
          </Button>
        </Box>
        
        {initialTracks.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {initialTracks.length} track{initialTracks.length !== 1 ? 's' : ''} will be added to this playlist.
            </Typography>
          </Box>
        )}
      </form>
    </Paper>
  );
};

export default CreatePlaylistForm;
