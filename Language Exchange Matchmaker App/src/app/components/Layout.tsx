import { Outlet, Link, useLocation } from 'react-router';
import { Home, Users, Gamepad2, MessageSquare } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/discover', icon: Users, label: 'Discover' },
    { path: '/partners', icon: MessageSquare, label: 'Partners' },
    { path: '/games', icon: Gamepad2, label: 'Games' },
  ];

  return (
    <div className="size-full flex flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-neutral-900">LangMatch</h1>
          <p className="text-sm text-neutral-600">Find your perfect study partner</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      <nav className="border-t border-neutral-200 bg-white">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
