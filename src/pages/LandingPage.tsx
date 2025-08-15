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
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: Truck,
      title: t('landing.features.tracking.title', 'Real-time Tracking'),
      description: t('landing.features.tracking.description', 'Monitor your shipments in real-time with our advanced GPS tracking system.')
    },
    {
      icon: Globe,
      title: t('landing.features.coverage.title', 'Global Coverage'),
      description: t('landing.features.coverage.description', 'Seamless logistics across borders with our extensive international network.')
    },
    {
      icon: Shield,
      title: t('landing.features.security.title', 'Secure Handling'),
      description: t('landing.features.security.description', 'Military-grade security protocols to ensure your cargo arrives safely.')
    },
    {
      icon: Zap,
      title: t('landing.features.speed.title', 'Fast Delivery'),
      description: t('landing.features.speed.description', 'Optimized routes and efficient processes for the fastest delivery times.')
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
      <MediaBackground mediaSrc="/hero-logistics.jpg" type="image" />
      <ParticleBackground />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Language Selector */}
        <LanguageSwitcher variant="floating" />
        
        {/* Main Content - This will grow to fill available space */}
        <main className="flex-1">
          {/* Hero Section */}
          <section className="min-h-screen flex flex-col justify-center items-center px-4 py-12 text-center backdrop-blur-sm bg-background/20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <motion.h1 
              className="text-4xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-700"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('landing.hero.title', 'Revolutionizing Logistics with AI')}
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-3xl text-foreground/90 mb-12 max-w-3xl mx-auto font-light"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {t('landing.hero.subtitle', 'Intelligent supply chain solutions that predict, optimize, and automate your logistics operations.')}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Button asChild size="lg" className="group text-xl px-10 py-7 bg-gradient-to-r from-primary to-blue-700 hover:from-primary/90 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full">
                <Link to="/signup">
                  {t('landing.cta.getStarted', 'Get Started')}
                  <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="text-xl px-10 py-7 border-2 backdrop-blur-sm bg-background/30 hover:bg-background/50 rounded-full">
                <Link to="/login">
                  {t('landing.cta.login', 'Login')}
                </Link>
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Animated Stats */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-32 max-w-5xl w-full mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : {}}
          >
            {[
              { value: "99.9%", label: t('landing.stats.onTime', 'On-Time Delivery') },
              { value: "24/7", label: t('landing.stats.tracking', 'Tracking') },
              { value: "150+", label: t('landing.stats.countries', 'Countries') },
              { value: "1M+", label: t('landing.stats.shipments', 'Shipments') }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <Card className="bg-background/40 backdrop-blur-md border-border/50 hover:shadow-xl transition-all duration-300 shadow-lg">
                  <CardContent className="p-6">
                    <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.features.title', 'Powerful Features')}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t('landing.features.subtitle', 'Our platform offers cutting-edge solutions for modern logistics challenges')}
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
                  <Card className="h-full bg-background/30 backdrop-blur-sm border-border/50 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <div className="bg-primary/10 p-3 rounded-full mb-4">
                        <feature.icon className="h-8 w-8 text-primary" />
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('landing.cta.title', 'Ready to Transform Your Logistics?')}</h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                {t('landing.cta.subtitle', 'Join thousands of businesses that trust our platform for their supply chain needs')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="group text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary">
                  <Link to="/signup">
                    {t('landing.cta.startTrial', 'Start Free Trial')}
                    <CheckCircle className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6 border-2">
                  <Link to="/contact">
                    {t('landing.cta.contactSales', 'Contact Sales')}
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
