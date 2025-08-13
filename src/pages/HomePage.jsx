import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { qortalService } from '../services/qortalService';
import { useAudio } from '../hooks/useAudio';

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 30px;
`;

const Section = styled.section`
  flex: 1;
  min-height: calc(50vh - 100px); // Adjust the height to be roughly half of the available space
  position: relative;
`;

const ScrollButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1;
  opacity: 0.7;
  transition: opacity 0.3s;

  &:hover {
    opacity: 1;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  &.prev {
    left: 10px;
  }

  &.next {
    right: 10px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const SectionTitle = styled.h2`
  margin-bottom: 20px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
`;

const AlphaBadge = styled.span`
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
  animation: alphaPulse 2s infinite;
  display: inline-block;
  margin-left: 10px;
  
  @keyframes alphaPulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }
`;

const WelcomeSection = styled.div`
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 142, 83, 0.1));
  border: 2px solid rgba(255, 107, 107, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 30px;
  text-align: center;
`;

const WelcomeTitle = styled.h1`
  color: #fff;
  margin: 0 0 10px 0;
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
`;

const WelcomeText = styled.p`
  color: #b3b3b3;
  margin: 0;
  font-size: 1.1rem;
`;

const CardsContainer = styled.div`
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 10px 0;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;  /* Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  
  &::-webkit-scrollbar {
    display: none;  /* Chrome, Safari and Opera */
  }

  /* Add smooth scrolling */
  scroll-behavior: smooth;
`;

const Card = styled.div`
  background-color: #282828;
  border-radius: 8px;
  overflow: hidden;
  transition: background-color 0.3s;
  cursor: pointer;
  flex: 0 0 auto;
  width: 200px;
  scroll-snap-align: start;

  &:hover {
    background-color: #383838;
  }

  @media (max-width: 768px) {
    width: 150px;
  }
`;

const CardImage = styled.img`
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
`;

const CardContent = styled.div`
  padding: 16px;
  color: white;
`;

const CardTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  margin-bottom: 4px;
`;

const CardSubtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: #b3b3b3;
`;

const HomePage = () => {
  const [recentSongs, setRecentSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { loadTrack } = useAudio();

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const songs = await qortalService.searchQDNResources('AUDIO', 'qmusic', 15);
        console.log('Fetched songs:', songs);
        const songsWithMetadata = await Promise.all(
          songs.map(async (song) => {
            const metadata = await qortalService.getMetadata(
              song.address,
              song.service,
              song.identifier,
              song.name
            );
            console.log('Song with metadata:', { ...song, metadata });
            return { ...song, metadata };
          })
        );
        setRecentSongs(songsWithMetadata);
      } catch (error) {
        console.error('Error fetching songs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSongs();
  }, []);

  const handleScroll = (containerId, direction) => {
    const container = document.getElementById(containerId);
    const scrollAmount = direction === 'left' ? -400 : 400;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handlePlaySong = (song) => {
    loadTrack(song);
  };

  // Placeholder data for playlists until we implement that feature
  const recentPlaylists = Array(15).fill({
    title: 'Sample Playlist',
    description: 'Sample Description',
    cover: 'https://via.placeholder.com/200'
  });

  return (
    <HomeContainer>
      <WelcomeSection>
        <WelcomeTitle>
          🎵 Welcome to Q-Music
          <AlphaBadge>Alpha</AlphaBadge>
        </WelcomeTitle>
        <WelcomeText>
          Discover and share music in the decentralized Qortal ecosystem
        </WelcomeText>
      </WelcomeSection>

      <Section>
        <SectionTitle>
          Latest Releases
        </SectionTitle>
        <ScrollButton 
          className="prev" 
          onClick={() => handleScroll('songs-container', 'left')}
        >
          ←
        </ScrollButton>
        <ScrollButton 
          className="next" 
          onClick={() => handleScroll('songs-container', 'right')}
        >
          →
        </ScrollButton>
        <CardsContainer id="songs-container">
          {isLoading ? (
            <div>Loading songs...</div>
          ) : recentSongs.map((song, index) => (
            <Card key={song.id || index} onClick={() => handlePlaySong(song)}>
              <CardImage 
                src={song.thumbnailUrl}
                alt={song.title}
                onLoad={() => console.log('Image loaded:', song.thumbnailUrl)}
                onError={(e) => {
                  console.error('Image load error:', song.thumbnailUrl);
                  e.target.onerror = null;
                  e.target.src = '/assets/placeholder-music.png';
                }}
              />
              <CardContent>
                <CardTitle>{song.title}</CardTitle>
                <CardSubtitle>{song.artist}</CardSubtitle>
                {song.description && (
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                    {song.description}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CardsContainer>
      </Section>

      <Section>
        <SectionTitle>Featured Playlists</SectionTitle>
        <ScrollButton 
          className="prev" 
          onClick={() => handleScroll('playlists-container', 'left')}
        >
          ←
        </ScrollButton>
        <ScrollButton 
          className="next" 
          onClick={() => handleScroll('playlists-container', 'right')}
        >
          →
        </ScrollButton>
        <CardsContainer id="playlists-container">
          {recentPlaylists.map((playlist, index) => (
            <Card key={index}>
              <CardImage src={playlist.cover} alt={playlist.title} />
              <CardContent>
                <CardTitle>{playlist.title}</CardTitle>
                <CardSubtitle>{playlist.description}</CardSubtitle>
              </CardContent>
            </Card>
          ))}
        </CardsContainer>
      </Section>
    </HomeContainer>
  );
};

export default HomePage;
