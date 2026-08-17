import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nextParam = params.get('next');
  const next = nextParam && /^\/(?!\/)/.test(nextParam) ? nextParam : '/home';

  useEffect(() => {
    if (!loading && user) navigate(next, { replace: true });
  }, [user, loading, navigate, next]);

  if (!loading && user) return <Navigate to={next} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(next, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong';
      toast({ title: 'Login failed', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-10">
          <span className="text-3xl font-bold font-display text-primary lowercase">quipp</span>
        </div>

        <div className="bg-card rounded-3xl p-10">
          <h1 className="text-[32px] md:text-[40px] font-bold font-display text-card-foreground text-center mb-2 uppercase">
            WELCOME BACK
          </h1>
          <p className="text-base text-muted-foreground text-center mb-8">Log in to your Passport</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-medium text-card-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full h-[52px] px-5 rounded-full border-2 border-border bg-background text-foreground text-base focus:outline-none focus:border-primary"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-card-foreground mb-1.5 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full h-[52px] px-5 rounded-full border-2 border-border bg-background text-foreground text-base focus:outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            <Button className="w-full rounded-full h-[52px] font-bold" type="submit" disabled={submitting}>
              {submitting ? 'Logging in…' : 'Go →'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            New here?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Start
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
