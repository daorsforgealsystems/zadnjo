import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

// Forge Constitution: Client-side UX only. Real auth is enforced server-side.
const Signup = () => {
  const { t } = useTranslation();
  const { isAuthenticated, signup, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: signupError } = await signup(email, password, username);
      if (signupError) {
        setError(signupError.message);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-black/90 overflow-hidden">
      <img
        src="/hero-logistics.jpg"
        alt="Logistics hero background"
        className="fixed inset-0 w-full h-full object-cover object-center scale-110 md:scale-125 z-0"
        style={{ filter: 'brightness(0.45) blur(2px)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-zinc-900/80 to-black/90 backdrop-blur-xl z-10" />
      <div className="relative z-20 w-full max-w-md">
        <Card className="w-full bg-black/60 backdrop-blur-xl border border-white/10 text-white shadow-xl rounded-2xl hover-lift transition-all duration-300">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" showText={true} linkTo={null} />
            </div>
            <CardTitle className="text-2xl font-bold text-white drop-shadow-lg">{t('signup.title', 'Create your Account')}</CardTitle>
            <CardDescription className="text-zinc-300">{t('signup.description', 'Sign up to access the dashboard.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-zinc-200">{t('signup.username', 'Username')}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={t('signup.username.placeholder', 'john_doe')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-black/40 border-white/10 text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-200">{t('signup.email', 'Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('signup.email.placeholder', 'user@example.com')}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/40 border-white/10 text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-200">{t('signup.password', 'Password')}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/40 border-white/10 text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-400"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold shadow-lg hover:brightness-110" disabled={loading}>
                {loading ? t('signup.loading', 'Creating account...') : t('signup.submit', 'Sign up')}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-zinc-300">
              {t('signup.have_account', 'Already have an account?')}{' '}
              <Link to="/login" className="underline text-blue-400 hover:text-blue-300">
                {t('signup.login', 'Login')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;