import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Logo from "@/components/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { ROLES } from "@/lib/types";
import MediaBackground from "@/components/MediaBackground";

const SignUp = () => {
  const { t } = useTranslation();
  const { isAuthenticated, signup, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const { error } = await signup(email, password, username, ROLES.CLIENT);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the confirmation link!');
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
  // After signup/auth, send users to the main dashboard instead of portal
  return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen w-full bg-black/90 overflow-hidden">
      {/* Hero image as background, zoomed out and darkened */}
      <img
        src="/src/assets/hero-logistics.jpg"
        alt="Logistics hero background"
        className="fixed inset-0 w-full h-full object-cover object-center scale-110 md:scale-125 z-0"
        style={{ filter: 'brightness(0.45) blur(2px)' }}
      />
      {/* Glassy dark overlay for extra porosity */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-zinc-900/80 to-black/90 backdrop-blur-xl z-10" />
      <div className="relative z-20 w-full max-w-md">
        <Card className="w-full bg-black/60 backdrop-blur-xl border border-white/10 text-white shadow-xl rounded-2xl hover-lift transition-all duration-300">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" showText={true} linkTo={null} />
            </div>
            <CardTitle className="text-2xl font-bold text-white drop-shadow-lg">{t('signup.title', 'Create an Account')}</CardTitle>
            <CardDescription className="text-zinc-300">{t('signup.description', 'Sign up to get started.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-zinc-200">{t('signup.username', 'Username')}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="your_username"
                  required
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
              {message && <p className="text-sm text-green-400">{message}</p>}
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold shadow-lg hover:brightness-110" disabled={loading}>
                {loading ? t('signup.loading', 'Creating account...') : t('signup.submit', 'Sign Up')}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-zinc-300">
              {t('signup.have_account', 'Already have an account?')}{' '}
              <Link to="/login" className="underline text-blue-400 hover:text-blue-300">
                {t('signup.login', 'Log in')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;
