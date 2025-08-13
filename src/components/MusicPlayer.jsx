import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { IconButton, Slider } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { useAudio } from '../hooks/useAudio';

const PlayerContainer = styled.div`
  background-color: #282828;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: white;
`;

const PlaybackControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SongInfo = styled.div`
  min-width: 180px;
`;

const VolumeControl = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 150px;
`;

const ProgressContainer = styled.div`
  flex: 1;
  margin: 0 20px;
`;

const MusicPlayer = () => {
  const { 
    currentTrack, 
    isPlaying, 
    duration, 
    currentTime, 
    playPause, 
    seek,
    setVolume 
  } = useAudio();
  const [volume, setVolumeState] = useState(70);

  useEffect(() => {
    setVolume(volume);
  }, [volume, setVolume]);

  const formatTime = (time) => {
    if (!time) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <PlayerContainer>
      <SongInfo>
        <h4>{currentTrack?.title || 'No song playing'}</h4>
        <p>{currentTrack?.metadata?.artist || 'Unknown artist'}</p>
      </SongInfo>

      <PlaybackControls>
        <IconButton color="inherit" disabled>
          <SkipPreviousIcon />
        </IconButton>
        <IconButton color="inherit" onClick={playPause} disabled={!currentTrack}>
          {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
        </IconButton>
        <IconButton color="inherit" disabled>
          <SkipNextIcon />
        </IconButton>
      </PlaybackControls>

      <ProgressContainer>
        <Slider
          value={currentTime}
          onChange={(_, value) => seek(value)}
          min={0}
          max={duration || 100}
          sx={{ color: '#1db954' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </ProgressContainer>

      <VolumeControl>
        <VolumeUpIcon />
        <Slider
          value={volume}
          onChange={(_, value) => setVolumeState(value)}
          min={0}
          max={100}
          sx={{ color: '#1db954' }}
        />
      </VolumeControl>
    </PlayerContainer>
  );
};

export default MusicPlayer;
