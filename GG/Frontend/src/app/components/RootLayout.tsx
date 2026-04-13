import { Outlet } from 'react-router';

export function RootLayout() {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <Outlet />
    </div>
  );
}
