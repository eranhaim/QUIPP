import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, Film, ShieldCheck, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { to: '/admin/courses', label: 'Courses', Icon: BookOpen },
  { to: '/admin/videos', label: 'Videos', Icon: Film },
  { to: '/admin/deep-submissions', label: 'DEEP queue', Icon: ShieldCheck },
] as const;

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className="w-64 shrink-0 border-r border-border flex flex-col text-white"
        style={{ background: '#1d123c' }}
        aria-label="Admin"
      >
        <div className="px-6 pt-7 pb-4">
          <p className="text-[10px] uppercase tracking-widest text-white/60">Admin</p>
          <span className="text-xl font-extrabold font-display lowercase tracking-tight text-white">
            quipp
          </span>
        </div>

        <nav className="flex-1 px-3 pb-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-[#1d123c] font-semibold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-5 space-y-0.5 border-t border-white/10 pt-3">
          <NavLink
            to="/home"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to app
          </NavLink>
          <button
            type="button"
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </button>
          {user && (
            <p className="mt-3 px-3 text-[11px] text-white/50 truncate">
              {user.firstName ?? user.email}
            </p>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
