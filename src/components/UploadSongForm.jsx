import React, { useState } from 'react';
import { qortalService } from '../services/qortalService';

function UploadSongForm({ username, onSuccess }) {
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [audioFile, setAudioFile] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        setImageFile(file);
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!username) {
            setError('You must be logged in to upload music');
            return;
        }

        if (!title || !artist || !audioFile) {
            setError('Please fill in all required fields and select an audio file');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            const result = await qortalService.publishAudio(
                username,
                title,
                artist,
                audioFile,
                imageFile // optional
            );

            if (result.success) {
                setTitle('');
                setArtist('');
                setAudioFile(null);
                setImageFile(null);
                setImagePreview(null);
                setSuccess('Song published successfully!');
                onSuccess?.();
            } else {
                throw new Error('Failed to publish song');
            }
        } catch (err) {
            setError(err.message || 'Failed to publish song');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="add-music-form">
            <h2>Publish New Song</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Song Title *</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isUploading}
                        placeholder="Enter song title"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="artist">Artist Name *</label>
                    <input
                        id="artist"
                        type="text"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        disabled={isUploading}
                        placeholder="Enter artist name"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="audio">Audio File (MP3, WAV, FLAC) *</label>
                    <input
                        id="audio"
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setAudioFile(e.target.files?.[0])}
                        disabled={isUploading}
                        required
                    />
                    {audioFile && (
                        <div className="file-info">
                            Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="image">Cover Image (Optional)</label>
                    <input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isUploading}
                    />
                    {imageFile && (
                        <div className="file-info">
                            Selected: {imageFile.name}
                        </div>
                    )}
                    
                    {imagePreview && (
                        <div className="image-preview">
                            <img 
                                src={imagePreview} 
                                alt="Cover preview" 
                                style={{
                                    width: '150px',
                                    height: '150px',
                                    objectFit: 'cover',
                                    borderRadius: '8px',
                                    marginTop: '10px',
                                    border: '2px solid #3d4557'
                                }}
                            />
                        </div>
                    )}
                </div>

                <button 
                    type="submit" 
                    disabled={isUploading || !username}
                    className="publish-button"
                >
                    {isUploading ? 'Publishing...' : 'Publish Song'}
                </button>
                
                {!username && (
                    <p className="error-message" style={{ marginTop: '10px' }}>
                        You must be logged in to publish music
                    </p>
                )}
            </form>
        </div>
    );
}

export default UploadSongForm;
