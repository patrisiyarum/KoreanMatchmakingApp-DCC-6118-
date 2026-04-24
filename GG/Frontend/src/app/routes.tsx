import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { RequireAuthLayout } from './components/RequireAuthLayout';
import { Layout } from './components/Layout';
import { CreateProfile } from './components/CreateProfile';
import { Discover } from './components/Discover';
import { MyPartners } from './components/MyPartners';
import { Games } from './components/Games';
import { Chat } from './components/Chat';
import { Schedule } from './components/Schedule';
import { DashboardHome } from './components/DashboardHome';
import { ViewProfile } from './components/ViewProfile';
import { EditProfile } from './components/EditProfile';
import { GamesProfile } from './components/GamesProfile';
import { AgoraCall } from './components/AgoraCall';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { IndexRedirect } from './components/IndexRedirect';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: IndexRedirect },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      {
        Component: RequireAuthLayout,
        children: [
          {
            Component: Layout,
            children: [
              { path: 'home', Component: DashboardHome },
              { path: 'create-profile', Component: CreateProfile },
              { path: 'view-profile', Component: ViewProfile },
              { path: 'edit-profile', Component: EditProfile },
              { path: 'discover', Component: Discover },
              { path: 'partners', Component: MyPartners },
              { path: 'games', Component: Games },
              { path: 'games/profile', Component: GamesProfile },
              { path: 'games/profile/:userId', Component: GamesProfile },
              { path: 'schedule', Component: Schedule },
              { path: 'call/:meetingId', Component: AgoraCall },
              { path: 'chat/:partnerId', Component: Chat },
            ],
          },
        ],
      },
    ],
  },
]);
