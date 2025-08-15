import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import Logo from "@/components/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';
import { ROLES } from "@/lib/types";
import VideoBackground from "@/components/VideoBackground";
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

const AuthPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, login, signup, user, loading: authLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [username, setUsername] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupMessage, setSignupMessage] = useState('');
  
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const { error: loginError } = await login(loginEmail, loginPassword);
      if (loginError) {
        setLoginError(loginError.message);
      }
    } catch (err) {
      setLoginError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSignupError('');
    setSignupMessage('');
    try {
      const { error } = await signup(signupEmail, signupPassword, username, ROLES.CLIENT);
      if (error) {
        setSignupError(error.message);
      } else {
        setSignupMessage('Check your email for the confirmation link!');
      }
    } catch (err) {
      setSignupError('An unexpected error occurred.');
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
      return <Navigate to="/portal" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen">
      <VideoBackground videoSrc="/Whisk_cauajde4m2myzdrmlwfkyzutnduzyi1hngqzltk.mp4" />
      <div className="z-10 w-full max-w-md px-4">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="w-full glass hover-lift transition-all duration-300">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-6">
                <Logo size="lg" showText={true} linkTo={null} />
              </div>
              <CardTitle className="text-xl">
                {isLoginMode ? t('login.title', 'Login to your Account') : t('signup.title', 'Create an Account')}
              </CardTitle>
              <CardDescription>
                {isLoginMode 
                  ? t('login.description', 'Enter your credentials to access the dashboard.') 
                  : t('signup.description', 'Sign up to get started.')
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {isLoginMode ? (
                  <motion.form
                    key="login"
                    onSubmit={handleLogin}
                    className="space-y-4"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t('login.email', 'Email')}</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder={t('login.email.placeholder', 'user@example.com')}
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">{t('login.password', 'Password')}</Label>
                      <Input
                        id="login-password"
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                      />
                    </div>
                    {loginError && <p className="text-sm text-destructive">{loginError}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t('login.loading', 'Logging in...') : t('login.submit', 'Login')}
                    </Button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="signup"
                    onSubmit={handleSignUp}
                    className="space-y-4"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="signup-username">{t('signup.username', 'Username')}</Label>
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="your_username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t('signup.email', 'Email')}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t('signup.email.placeholder', 'user@example.com')}
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t('signup.password', 'Password')}</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        required
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                      />
                    </div>
                    {signupError && <p className="text-sm text-destructive">{signupError}</p>}
                    {signupMessage && <p className="text-sm text-green-500">{signupMessage}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t('signup.loading', 'Creating account...') : t('signup.submit', 'Sign Up')}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
              
              <div className="mt-4 text-center text-sm">
                {isLoginMode ? (
                  <>
                    {t('login.no_account', "Don't have an account?")}{' '}
                    <button 
                      onClick={() => setIsLoginMode(false)} 
                      className="underline text-primary hover:text-primary/80"
                    >
                      {t('login.signup', 'Sign up')}
                    </button>
                  </>
                ) : (
                  <>
                    {t('signup.have_account', 'Already have an account?')}{' '}
                    <button 
                      onClick={() => setIsLoginMode(true)} 
                      className="underline text-primary hover:text-primary/80"
                    >
                      {t('signup.login', 'Log in')}
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
