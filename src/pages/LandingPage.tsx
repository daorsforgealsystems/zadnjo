import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Truck, 
  Globe, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import MediaBackground from '@/components/MediaBackground';
import ParticleBackground from '@/components/ParticleBackground';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const LandingPage = () => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Truck,
      title: t('landing.features.tracking.title', { defaultValue: 'Real-time Tracking' }),
      description: t('landing.features.tracking.description', { defaultValue: 'Monitor your shipments in real-time with our advanced GPS tracking system.' })
    },
    {
      icon: Globe,
      title: t('landing.features.coverage.title', { defaultValue: 'Global Coverage' }),
      description: t('landing.features.coverage.description', { defaultValue: 'Seamless logistics across borders with our extensive international network.' })
    },
    {
      icon: Shield,
      title: t('landing.features.security.title', { defaultValue: 'Secure Handling' }),
      description: t('landing.features.security.description', { defaultValue: 'Military-grade security protocols to ensure your cargo arrives safely.' })
    },
    {
      icon: Zap,
      title: t('landing.features.speed.title', { defaultValue: 'Fast Delivery' }),
      description: t('landing.features.speed.description', { defaultValue: 'Optimized routes and efficient processes for the fastest delivery times.' })
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="relative min-h-screen">
  <MediaBackground mediaSrc="/hero-logistics.jpg" type="image" overlayOpacity={0.48} />
      <ParticleBackground />
      
      {/* Bring main content above background/particles */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Skip link for keyboard users */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 px-3 py-2 rounded-md bg-background/80">Skip to main content</a>

        {/* Simple header / nav */}
        <header className="w-full flex items-center justify-between px-4 sm:px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-lg font-bold tracking-tight">Logi<span className="text-primary">Core</span></Link>
          </div>

          <div className="flex items-center gap-3">
            <nav className="hidden sm:flex gap-4 items-center">
              <Link to="/login" className="text-sm px-3 py-2 rounded-md hover:bg-background/20">{t('nav.login', { defaultValue: 'Login' })}</Link>
              <Link to="/signup" className="text-sm px-3 py-2 rounded-md bg-gradient-primary text-white">{t('nav.signup', { defaultValue: 'Get started' })}</Link>
            </nav>

            <button
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
              className="sm:hidden p-2 rounded-md hover:bg-background/20"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {mobileOpen ? <path d="M6 18L18 6M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
              </svg>
            </button>

            <LanguageSwitcher variant="floating" />
          </div>

          {/* Mobile dropdown */}
          {mobileOpen && (
            <div className="sm:hidden absolute right-4 top-16 z-40 w-48 bg-background/90 backdrop-blur-md rounded-md shadow-lg py-2">
              <Link to="/login" className="block px-4 py-2 text-sm hover:bg-background/20">{t('nav.login', { defaultValue: 'Login' })}</Link>
              <Link to="/signup" className="block px-4 py-2 text-sm hover:bg-background/20">{t('nav.signup', { defaultValue: 'Get started' })}</Link>
            </div>
          )}
        </header>

        {/* Main Content - This will grow to fill available space */}
        <main id="main-content" className="flex-1">
          {/* Hero Section */}
          <section className="min-h-screen flex flex-col justify-center items-center px-4 py-12 text-center hero-section">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.h1 
              aria-label={t('landing.hero.title', { defaultValue: 'Revolutionizing Logistics with AI' })}
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 gradient-text hero-text leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('landing.hero.title', { defaultValue: 'Revolutionizing Logistics with AI' })}
            </motion.h1>
            
            <motion.p 
              className="text-base md:text-xl text-foreground/95 mb-8 max-w-3xl mx-auto font-light hero-text"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {t('landing.hero.subtitle', { defaultValue: 'Intelligent supply chain solutions that predict, optimize, and automate your logistics operations.' })}
            </motion.p>
            
              <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Button asChild size="lg" className="group text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-6 bg-gradient-primary hover:shadow-lg-strong transition-all duration-300 rounded-full cta-hover-scale">
                <Link to="/signup" aria-label={t('landing.cta.getStarted', { defaultValue: 'Get Started' })}>
                  {t('landing.cta.getStarted', { defaultValue: 'Get Started' })}
                  <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

              <Button asChild variant="outline" size="lg" className="text-lg sm:text-xl px-8 sm:px-10 py-4 sm:py-6 border-2 backdrop-blur-sm bg-background/40 hover:bg-background/60 rounded-full cta-hover-scale">
                <Link to="/login">
                  {t('landing.cta.login', { defaultValue: 'Login' })}
                </Link>
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Animated Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 md:mt-28 max-w-5xl w-full mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : {}}
            aria-live="polite"
            aria-atomic="true"
          >
            {[
              { value: "99.9%", label: t('landing.stats.onTime', { defaultValue: 'On-Time Delivery' }) },
              { value: "24/7", label: t('landing.stats.tracking', { defaultValue: 'Tracking' }) },
              { value: "150+", label: t('landing.stats.countries', { defaultValue: 'Countries' }) },
              { value: "1M+", label: t('landing.stats.shipments', { defaultValue: 'Shipments' }) }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="text-center"
              >
        <Card className="bg-background/40 backdrop-blur-md border-border/50 hover:shadow-xl transition-all duration-300 shadow-lg">
                  <CardContent className="p-6">
          <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">{stat.value}</div>
          <div className="text-foreground/80">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </section>
          
          {/* Features Section */}
          <section className="py-20 px-4 backdrop-blur-sm bg-background/10">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">{t('landing.features.title', { defaultValue: 'Powerful Features' })}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('landing.features.subtitle', { defaultValue: 'Our platform offers cutting-edge solutions for modern logistics challenges' })}
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className="h-full"
                >
                  <Card className="h-full feature-card">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="bg-primary/10 p-3 rounded-full mb-4" aria-hidden="true">
                        <feature.icon className="h-8 w-8 text-primary" aria-hidden="true" />
                        <span className="sr-only">{feature.title}</span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-20 px-4 backdrop-blur-sm bg-background/5">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('landing.cta.title', { defaultValue: 'Ready to Transform Your Logistics?' })}</h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                {t('landing.cta.subtitle', { defaultValue: 'Join thousands of businesses that trust our platform for their supply chain needs' })}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="group text-lg px-8 py-6 bg-gradient-primary hover:shadow-xl transition-all duration-300">
                  <Link to="/signup">
                    {t('landing.cta.startTrial', { defaultValue: 'Start Free Trial' })}
                    <CheckCircle className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-2 backdrop-blur-sm bg-background/30 hover:bg-background/50">
                  <Link to="/contact">
                    {t('landing.cta.contactSales', { defaultValue: 'Contact Sales' })}
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default LandingPage;