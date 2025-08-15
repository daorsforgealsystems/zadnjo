import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Logo from "@/components/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { ROLES } from "@/lib/types"; // Import Role type
import MediaBackground from "@/components/MediaBackground";

const Login = () => {
  const { t } = useTranslation();
  const { isAuthenticated, login, user, loading: authLoading, loginAsGuest } = useAuth(); // Destructure loginAsGuest
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => { // Added type for event
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: loginError } = await login(email, password);
      if (loginError) {
        setError(loginError.message);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => { // Handler for guest login
    setLoading(true); // Use the same loading state for guest login
    setError('');
    try {
      const { error: guestError } = await loginAsGuest();
      if (guestError) {
        setError(guestError.message);
      }
      // Navigation is handled by the useEffect hook in AuthProvider based on isAuthenticated
    } catch (err) {
      setError('An unexpected error occurred during guest login.');
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
    // Redirect based on role
    if (user?.role === ROLES.CLIENT || user?.role === ROLES.GUEST) { // Check for GUEST role as well
      return <Navigate to="/portal" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen">
      <MediaBackground mediaSrc="/hero-logistics.jpg" type="image" />
      <div className="relative z-10 w-full max-w-md">
        <Card className="w-full glass hover-lift transition-all duration-300">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" showText={true} linkTo={null} />
            </div>
            <CardTitle className="text-xl">{t('login.title', 'Login to your Account')}</CardTitle>
            <CardDescription>{t('login.description', 'Enter your credentials to access the dashboard.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('login.email', 'Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('login.email.placeholder', 'user@example.com')}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password', 'Password')}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('login.loading', 'Logging in...') : t('login.submit', 'Login')}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              {t('login.no_account', "Don't have an account?")}{' '}
              <Link to="/signup" className="underline">
                {t('login.signup', 'Sign up')}
              </Link>
            </div>
            {/* Guest Login Button */}
            <div className="mt-4 text-center">
              <Button variant="outline" className="w-full" onClick={handleGuestLogin} disabled={loading}>
                {t('login.guest', 'Login as Guest')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
