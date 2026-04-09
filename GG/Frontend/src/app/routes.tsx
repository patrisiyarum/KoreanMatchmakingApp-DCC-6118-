import { createBrowserRouter } from 'react-router';
import { RootLayout } from './components/RootLayout';
import { RequireAuthLayout } from './components/RequireAuthLayout';
import { Layout, GuestShell } from './components/Layout';
import { Home } from './components/Home';
import { Discover } from './components/Discover';
import { MyPartners } from './components/MyPartners';
import { Games } from './components/Games';
import { Chat } from './components/Chat';
import { Schedule } from './components/Schedule';
import { DashboardHome } from './components/DashboardHome';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { IndexRedirect } from './components/IndexRedirect';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: IndexRedirect },
      {
        path: 'welcome',
        Component: GuestShell,
        children: [{ index: true, Component: Home }],
      },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      {
        Component: RequireAuthLayout,
        children: [
          {
            Component: Layout,
            children: [
              { path: 'home', Component: DashboardHome },
              { path: 'profile', Component: Profile },
              { path: 'discover', Component: Discover },
              { path: 'partners', Component: MyPartners },
              { path: 'games', Component: Games },
              { path: 'schedule', Component: Schedule },
              { path: 'chat/:partnerId', Component: Chat },
            ],
          },
        ],
      },
    ],
  },
]);
