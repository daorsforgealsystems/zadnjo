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
    if (user?.role === ROLES.CLIENT) {
      return <Navigate to="/portal/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen">
      <MediaBackground mediaSrc="/hero-logistics.jpg" type="image" />
      <div className="relative z-10">
        <Card className="w-full max-w-md glass hover-lift transition-all duration-300">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" showText={true} linkTo={null} />
            </div>
            <CardTitle className="text-xl">{t('signup.title', 'Create an Account')}</CardTitle>
            <CardDescription>{t('signup.description', 'Sign up to get started.')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t('signup.username', 'Username')}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="your_username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('signup.email', 'Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('signup.email.placeholder', 'user@example.com')}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('signup.password', 'Password')}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {message && <p className="text-sm text-green-500">{message}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('signup.loading', 'Creating account...') : t('signup.submit', 'Sign Up')}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              {t('signup.have_account', 'Already have an account?')}{' '}
              <Link to="/login" className="underline">
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
