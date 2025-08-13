import React from 'react';
import styled from 'styled-components';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import MusicPlayer from '../components/MusicPlayer';
import { Outlet } from 'react-router-dom';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ContentArea = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 20px;
`;

const MainLayout = () => {
  return (
    <LayoutContainer>
      <MainContent>
        <Header />
        <ContentArea>
          <Outlet />
        </ContentArea>
        <MusicPlayer />
      </MainContent>
      <Sidebar />
    </LayoutContainer>
  );
};

export default MainLayout;
