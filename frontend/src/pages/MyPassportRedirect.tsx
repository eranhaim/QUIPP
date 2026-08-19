import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const MyPassportRedirect = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const handle = profile?.username ?? user.firstName?.toLowerCase() ?? user.email.split('@')[0];
  return <Navigate to={`/passport/${handle}`} replace />;
};

export default MyPassportRedirect;
