import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && user) return <Navigate to="/home" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || password.length < 8) {
      toast({
        title: 'Check your details',
        description: 'Password needs at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }
    setSubmitting(true);
    try {
      await register({ email, password, firstName: firstName.trim() || undefined });
      navigate('/onboarding', { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong';
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-10">
          <span className="text-3xl font-bold font-display text-primary lowercase">quipp</span>
        </div>

        <div className="bg-card rounded-3xl p-10">
          <h1 className="text-[32px] md:text-[40px] font-bold font-display text-card-foreground text-center mb-2 uppercase">
            GET QUIPP'D
          </h1>
          <p className="text-base text-muted-foreground text-center mb-8">
            Your skills. Your story. Your future.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="signup-first-name" className="text-xs font-medium text-card-foreground mb-1.5 block">
                First name
              </label>
              <input
                id="signup-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                className="w-full h-[52px] px-5 rounded-full border-2 border-border bg-background text-foreground text-base focus:outline-none focus:border-primary"
                placeholder="Chef"
              />
            </div>
            <div>
              <label htmlFor="signup-email" className="text-xs font-medium text-card-foreground mb-1.5 block">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full h-[52px] px-5 rounded-full border-2 border-border bg-background text-foreground text-base focus:outline-none focus:border-primary"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="text-xs font-medium text-card-foreground mb-1.5 block">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full h-[52px] px-5 rounded-full border-2 border-border bg-background text-foreground text-base focus:outline-none focus:border-primary"
                placeholder="At least 8 characters"
              />
            </div>
            <Button className="w-full rounded-full h-[52px] font-bold" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Sign up →'}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            Already here?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
