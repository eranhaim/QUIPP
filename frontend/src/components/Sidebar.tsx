import { NavLink, useNavigate } from 'react-router-dom';
import { Home, IdCard, GraduationCap, ShieldCheck, Users, LogOut, Settings } from 'lucide-react';
import InitialsAvatar from '@/components/InitialsAvatar';
import { useAuth, type AuthUser } from '@/hooks/useAuth';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', Icon: Home },
  { to: '/passport/me', label: 'My Passport', Icon: IdCard },
  { to: '/academy', label: 'Academy', Icon: GraduationCap },
  { to: '/credentials', label: 'Credentials', Icon: ShieldCheck },
  { to: '/workplace', label: 'Workplace', Icon: Users },
] as const;

function displayName(user: AuthUser): string {
  if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
  if (user.firstName) return user.firstName;
  return user.email.split('@')[0];
}

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handle = profile?.username ?? user.firstName?.toLowerCase() ?? user.email.split('@')[0];
  const techScore = profile?.techProficiencyScore ?? 0;
  const scoreLabel = (profile?.techScoreLabel ?? 'Building').toUpperCase();

  const handleSignOut = async () => {
    await logout();
    onNavigate?.();
    navigate('/', { replace: true });
  };

  return (
    <aside
      className="flex h-full w-full flex-col text-white"
      style={{ background: '#1d123c' }}
      aria-label="Primary"
    >
      <div className="px-6 pt-7 pb-4">
        <span className="text-xl font-extrabold font-display lowercase tracking-tight text-white">
          quipp
        </span>
      </div>

      <div className="px-6 pb-5">
        <div className="flex items-center gap-3">
          <InitialsAvatar
            firstName={user.firstName ?? user.email[0]}
            lastName={user.lastName ?? ''}
            size={44}
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{displayName(user)}</p>
            <p className="text-xs text-white/70 truncate">@{handle}</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 px-4 py-3">
          <p className="text-[10px] uppercase tracking-widest text-white/70">Tech proficiency</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-display text-white">{techScore}</span>
            <span className="text-xs text-white/70">/ 100</span>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary mt-0.5">
            {scoreLabel}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-3 space-y-0.5" aria-label="Sections">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#1d123c]',
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
          to="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          <Settings className="h-4 w-4" aria-hidden />
          <span>Settings</span>
        </NavLink>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
