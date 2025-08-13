import React, { useState, useRef, useCallback } from 'react';
import { AudioContext } from '../hooks/useAudio';

export function AudioProvider({ children }) {
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(new Audio());

    const loadTrack = useCallback(async (track) => {
        try {
            const audioUrl = track.audioUrl;

            if (audioUrl) {
                audioRef.current.src = audioUrl;
                setCurrentTrack(track);
                setIsPlaying(false);
                setCurrentTime(0);
            }
        } catch (error) {
            console.error('Error loading track:', error);
        }
    }, []);

    const playPause = useCallback(() => {
        if (audioRef.current.src) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying]);

    const seek = useCallback((time) => {
        if (audioRef.current.src) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const setVolume = useCallback((value) => {
        audioRef.current.volume = value / 100;
    }, []);

    // Setup audio event listeners
    React.useEffect(() => {
        const audio = audioRef.current;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const value = {
        currentTrack,
        isPlaying,
        duration,
        currentTime,
        loadTrack,
        playPause,
        seek,
        setVolume
    };

    return (
        <AudioContext.Provider value={value}>
            {children}
        </AudioContext.Provider>
    );
}


