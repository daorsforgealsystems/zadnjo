import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  Heart,
  ExternalLink,
  Truck,
  Globe,
  Shield
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import './ModernFooter.css';

const ModernFooter = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: t('footer.company', 'Company'),
      links: [
        { name: t('footer.aboutUs', 'About Us'), href: '/about' },
        { name: t('footer.careers', 'Careers'), href: '/careers' },
        { name: t('footer.press', 'Press'), href: '/press' },
        { name: t('footer.blog', 'Blog'), href: '/blog' }
      ]
    },
    {
      title: t('footer.services', 'Services'),
      links: [
        { name: t('footer.packageTracking', 'Package Tracking'), href: '/item-tracking' },
        { name: t('footer.routeOptimization', 'Route Optimization'), href: '/route-optimization' },
        { name: t('footer.liveMap', 'Live Map'), href: '/live-map' },
        { name: t('footer.reports', 'Reports'), href: '/reports' }
      ]
    },
    {
      title: t('footer.support', 'Support'),
      links: [
        { name: t('footer.helpCenter', 'Help Center'), href: '/support' },
        { name: t('footer.contactUs', 'Contact Us'), href: '/contact' },
        { name: t('footer.apiDocs', 'API Documentation'), href: '/docs' },
        { name: t('footer.statusPage', 'Status Page'), href: '/status' }
      ]
    },
    {
      title: t('footer.legal', 'Legal'),
      links: [
        { name: t('footer.privacyPolicy', 'Privacy Policy'), href: '/privacy' },
        { name: t('footer.termsOfService', 'Terms of Service'), href: '/terms' },
        { name: t('footer.cookiePolicy', 'Cookie Policy'), href: '/cookies' },
        { name: t('footer.gdpr', 'GDPR'), href: '/gdpr' }
      ]
    }
  ];

  const features = [
    { icon: Truck, title: t('footer.features.tracking.title', 'Real-time Tracking'), description: t('footer.features.tracking.description', 'Monitor shipments live') },
    { icon: Globe, title: t('footer.features.coverage.title', 'Global Coverage'), description: t('footer.features.coverage.description', 'Worldwide logistics network') },
    { icon: Shield, title: t('footer.features.security.title', 'Secure Handling'), description: t('footer.features.security.description', 'End-to-end security') }
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
    { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
    { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
    { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' }
  ];

  return (
    <footer className="bg-gradient-to-br from-background to-muted/30 border-t border-border/50 mt-auto relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-10 right-10 w-64 h-64 bg-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-10 left-1/2 w-64 h-64 bg-accent rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Features Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index}
                className="flex items-start gap-4 p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
                <img 
                  src="/daorsforge-new-logo.jpg"
                  alt="DaorsForge AI Systems"
                  className="w-8 h-8 object-contain mix-blend-plus-lighter"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  DaorsForge
                </h3>
                <p className="text-xs text-muted-foreground">AI Logistics Systems</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {t('footer.description', 'Revolutionizing logistics with AI-powered solutions for real-time tracking, route optimization, and intelligent supply chain management.')}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 group">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <span>contact@daorsforge.com</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
                <span>+387 33 123 456</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                  <MapPin className="h-4 w-4" />
                </div>
                <span>Sarajevo, Bosnia and Herzegovina</span>
              </div>
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold mb-4 text-lg relative inline-block">
                {section.title}
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary/50 rounded-full"></span>
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link 
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 group"
                    >
                      <span className="w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-3"></span>
                      <span>{link.name}</span>
                      {link.href.startsWith('http') && <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-12 bg-border/30" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>© {currentYear} {t('footer.copyright.company', 'DaorsForge AI Systems')}. {t('footer.copyright.madeWith', 'Made with')}</span>
            <Heart className="h-4 w-4 text-red-500 fill-current animate-pulse" />
            <span>{t('footer.copyright.location', 'in Bosnia and Herzegovina')}</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const IconComponent = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
                  aria-label={social.name}
                >
                  <IconComponent className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default ModernFooter;
