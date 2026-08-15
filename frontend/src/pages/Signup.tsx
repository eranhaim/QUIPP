import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';

const Signup = () => {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

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
    setLoading(true);
    try {
      await register({ email, password, firstName: firstName.trim() || undefined });
      navigate('/onboarding');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong';
      toast({ title: 'Signup failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
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
              <label className="text-xs font-medium text-card-foreground mb-1.5 block">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                className="w-full h-[52px] px-5 rounded-full border-2 border-border bg-background text-foreground text-base focus:outline-none focus:border-primary"
                placeholder="Chef"
              />
            </div>
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
                autoComplete="new-password"
                minLength={8}
                className="w-full h-[52px] px-5 rounded-full border-2 border-border bg-background text-foreground text-base focus:outline-none focus:border-primary"
                placeholder="At least 8 characters"
              />
            </div>
            <Button className="w-full rounded-full h-[52px] font-bold" type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Start →'}
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
