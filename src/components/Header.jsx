// src/components/Header.jsx
import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const HeaderContainer = styled.header`
  background-color: #1a1a1a;
  padding: 1rem;
  width: 100%;
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const Logo = styled(Link)`
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: 2rem;
`;

const NavMenu = styled.nav`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex: 1;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 0.5rem;
  transition: color 0.2s;

  &:hover {
    color: #1db954;
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  transition: color 0.2s;

  &:hover {
    color: #1db954;
  }
`;

const AuthButton = styled.button`
  background: ${props => props.isLogin ? 'linear-gradient(135deg, #4A90E2, #357ABD)' : 'linear-gradient(135deg, #e74c3c, #c0392b)'};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const Header = ({ isLoggedIn, currentUser, onLoginClick, onLogoutClick, onToggleSidebar }) => {
  return (
    <HeaderContainer>
      <HeaderContent>
        <IconButton onClick={onToggleSidebar} aria-label="menu">
          ☰
        </IconButton>
        
        <Logo to="/">qmusic</Logo>
        
        <NavMenu>
          <NavLink to="/">Browse Songs</NavLink>
          <NavLink to="/playlists">All Playlists</NavLink>
          
          {isLoggedIn && currentUser && (
            <>
              <NavLink to="/add-music">Add New Music</NavLink>
              <NavLink to="/create-playlist">Create Playlist</NavLink>
            </>
          )}
        </NavMenu>

        <AuthButton
          onClick={isLoggedIn ? onLogoutClick : onLoginClick}
          isLogin={!isLoggedIn}
        >
          {isLoggedIn ? `Log OUT (${currentUser?.name})` : 'Log IN'}
        </AuthButton>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
