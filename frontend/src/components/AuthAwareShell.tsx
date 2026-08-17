import AppShell from '@/components/AppShell';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';

interface AuthAwareShellProps {
  children: React.ReactNode;
}

const AuthAwareShell = ({ children }: AuthAwareShellProps) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (user) return <AppShell>{children}</AppShell>;
  return <Layout>{children}</Layout>;
};

export default AuthAwareShell;
