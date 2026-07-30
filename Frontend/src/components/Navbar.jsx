import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FolderKanban, LayoutDashboard, ListChecks, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
];

function linkClasses({ isActive }) {
  const base = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200';
  return isActive ? `${base} bg-primary-soft text-primary` : `${base} text-muted hover:bg-canvas hover:text-ink`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 font-semibold">
            <ListChecks className="h-6 w-6 text-primary" aria-hidden="true" />
            Task Manager
          </span>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClasses}>
                <link.icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs capitalize text-muted">{user.role}</p>
          </div>
          <button type="button" onClick={logout} className="btn btn-secondary">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>

        <button
          type="button"
          className="btn btn-ghost h-11 w-11 px-0 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-line px-4 py-3 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={linkClasses}
                onClick={() => setMenuOpen(false)}
              >
                <link.icon className="h-4 w-4" aria-hidden="true" />
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs capitalize text-muted">{user.role}</p>
            </div>
            <button type="button" onClick={logout} className="btn btn-secondary">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
