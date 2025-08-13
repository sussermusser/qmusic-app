import React, { useState } from 'react';
import { qortalService } from '../services/qortalService';

function CreatePlaylistForm({ username, availableSongs, onSuccess }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedSongs, setSelectedSongs] = useState([]);
    const [imageFile, setImageFile] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!username) {
            setError('You must be logged in to create a playlist');
            return;
        }

        if (!name || selectedSongs.length === 0) {
            setError('Please enter a name and select at least one song');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            const result = await qortalService.publishPlaylist(
                username,
                name,
                description,
                selectedSongs,
                imageFile // optional
            );

            if (result.success) {
                setName('');
                setDescription('');
                setSelectedSongs([]);
                setImageFile(null);
                onSuccess?.();
            } else {
                throw new Error('Failed to create playlist');
            }
        } catch (err) {
            setError(err.message || 'Failed to create playlist');
        } finally {
            setIsCreating(false);
        }
    };

    const toggleSongSelection = (song) => {
        setSelectedSongs(prev => {
            const exists = prev.find(s => s.identifier === song.identifier);
            if (exists) {
                return prev.filter(s => s.identifier !== song.identifier);
            } else {
                return [...prev, song];
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="playlist-form">
            <h2>Create New Playlist</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
                <label htmlFor="name">Playlist Name *</label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isCreating}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isCreating}
                    rows={3}
                />
            </div>

            <div className="form-group">
                <label htmlFor="image">Playlist Cover (Optional)</label>
                <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0])}
                    disabled={isCreating}
                />
            </div>

            <div className="form-group">
                <label>Select Songs *</label>
                <div className="songs-list">
                    {availableSongs.map(song => (
                        <div key={song.identifier} className="song-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedSongs.some(s => s.identifier === song.identifier)}
                                    onChange={() => toggleSongSelection(song)}
                                    disabled={isCreating}
                                />
                                <span>{song.title} - {song.artist}</span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <button 
                type="submit" 
                disabled={isCreating}
                className="submit-button"
            >
                {isCreating ? 'Creating...' : 'Create Playlist'}
            </button>
        </form>
    );
}

export default CreatePlaylistForm;
