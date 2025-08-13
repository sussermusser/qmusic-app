class AudioPlayerService {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
  }

  async play(track) {
    try {
      // Get audio file URL from QDN
      const response = await fetch(`/arbitrary/AUDIO/${track.name}/${track.identifier}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audio file');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Update audio source and play
      this.audio.src = url;
      await this.audio.play();
      
      // Clean up old URL when new source is set
      this.audio.oncanplay = () => {
        if (this.previousUrl) {
          URL.revokeObjectURL(this.previousUrl);
        }
        this.previousUrl = url;
      };

      return true;
    } catch (error) {
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  pause() {
    this.audio.pause();
  }

  resume() {
    this.audio.play();
  }

  seek(time) {
    this.audio.currentTime = time;
  }

  setVolume(volume) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  getCurrentTime() {
    return this.audio.currentTime;
  }

  getDuration() {
    return this.audio.duration;
  }

  isPlaying() {
    return !this.audio.paused;
  }

  // Add event listeners
  onTimeUpdate(callback) {
    this.audio.addEventListener('timeupdate', callback);
    return () => this.audio.removeEventListener('timeupdate', callback);
  }

  onEnded(callback) {
    this.audio.addEventListener('ended', callback);
    return () => this.audio.removeEventListener('ended', callback);
  }

  onError(callback) {
    this.audio.addEventListener('error', callback);
    return () => this.audio.removeEventListener('error', callback);
  }

  // Cleanup
  destroy() {
    if (this.previousUrl) {
      URL.revokeObjectURL(this.previousUrl);
    }
    this.audio.pause();
    this.audio.src = '';
  }
}

// Create singleton instance
const audioPlayer = new AudioPlayerService();
export default audioPlayer;
