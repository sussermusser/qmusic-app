import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const SidebarContainer = styled.aside`
  width: 250px;
  background-color: #000000;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    display: none;
  }
`;

const StatsSection = styled.div`
  margin-top: 20px;
`;

const StatItem = styled.div`
  margin: 10px 0;
  display: flex;
  justify-content: space-between;
`;

const InfoBox = styled.div`
  margin-top: auto;
  padding: 15px;
  background-color: #1a1a1a;
  border-radius: 5px;
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  font-size: 0.9rem;
  margin-top: 10px;
  padding: 8px;
  background-color: rgba(255, 68, 68, 0.1);
  border-radius: 4px;
  text-align: center;
`;

const Links = styled.div`
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  
  a {
    color: #1db954;
    text-decoration: none;
    padding: 8px 12px;
    border-radius: 4px;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: #1a1a1a;
      text-decoration: none;
    }
  }
`;

const UploadButton = styled(Link)`
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  color: white !important;
  text-align: center;
  font-weight: bold;
  
  &:hover {
    background: linear-gradient(135deg, #5B9FEF, #4A90E2) !important;
  }
`;

const LoginButton = styled.button`
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  margin-bottom: 15px;
  font-weight: bold;
  
  &:hover {
    background: linear-gradient(135deg, #5B9FEF, #4A90E2);
  }
`;

const UserInfo = styled.div`
  padding: 10px;
  margin-bottom: 15px;
  background-color: #1a1a1a;
  border-radius: 4px;
  font-size: 0.9rem;
`;

const Sidebar = ({ isLoggedIn, currentUser, onLoginClick, onLogoutClick }) => {
  return (
    <SidebarContainer>
      {!isLoggedIn ? (
        <LoginButton onClick={onLoginClick}>
          Log IN
        </LoginButton>
      ) : (
        <UserInfo>
          <strong>{currentUser.name}</strong>
          <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
            {currentUser.address.slice(0, 10)}...
          </div>
          <LoginButton onClick={onLogoutClick}>
            Log OUT
          </LoginButton>
        </UserInfo>
      )}
      <h2>STATISTICS</h2>
      <StatsSection>
        <StatItem>
          <span>All songs</span>
          <span>N/A</span>
        </StatItem>
        <StatItem>
          <span>qmusic songs</span>
          <span>N/A</span>
        </StatItem>
        <StatItem>
          <span>earbump songs</span>
          <span>N/A</span>
        </StatItem>
        <StatItem>
          <span>publisher</span>
          <span>N/A</span>
        </StatItem>
      </StatsSection>
      <InfoBox>
        Welcome to qmusic! This is a decentralized music platform running on the QORTAL network.
      </InfoBox>
      <Links>
        {isLoggedIn && (
          <UploadButton to="/upload">📤 PUBLISH SONG</UploadButton>
        )}
        <Link to="/about">About</Link>
        <Link to="/help">Help</Link>
      </Links>
    </SidebarContainer>
  );
};

export default Sidebar;
