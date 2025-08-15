import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Github, 
  Mail, 
  Phone, 
  MapPin,
  Heart,
  ArrowUp
} from 'lucide-react';

export interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'github';
  url: string;
  icon?: React.ReactNode;
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: string;
}

export interface CustomizableFooterProps {
  variant?: 'default' | 'minimal' | 'expanded' | 'gradient' | 'glass';
  logo?: React.ReactNode;
  companyName?: string;
  description?: string;
  copyright?: string;
  sections?: FooterSection[];
  socialLinks?: SocialLink[];
  contactInfo?: ContactInfo;
  newsletter?: {
    title?: string;
    description?: string;
    placeholder?: string;
    onSubmit?: (email: string) => void;
  };
  backToTop?: boolean;
  className?: string;
  contentClassName?: string;
  sticky?: boolean;
  showDivider?: boolean;
  gradientColors?: string[];
  theme?: 'light' | 'dark';
  customContent?: React.ReactNode;
  animated?: boolean;
}

const socialIcons = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  github: Github,
};

const footerVariants = {
  default: 'bg-background border-t border-border',
  minimal: 'bg-transparent',
  expanded: 'bg-muted/50',
  gradient: 'bg-gradient-to-r',
  glass: 'bg-background/80 backdrop-blur-md border-t border-border/50'
};

export const CustomizableFooter: React.FC<CustomizableFooterProps> = ({
  variant = 'default',
  logo,
  companyName = 'Company',
  description,
  copyright,
  sections = [],
  socialLinks = [],
  contactInfo,
  newsletter,
  backToTop = true,
  className,
  contentClassName,
  sticky = false,
  showDivider = true,
  gradientColors = ['#3b82f6', '#8b5cf6'],
  theme = 'light',
  customContent,
  animated = true,
}) => {
  const [newsletterEmail, setNewsletterEmail] = React.useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    newsletter?.onSubmit?.(newsletterEmail);
    setNewsletterEmail('');
  };

  const handleBackToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const gradientStyle = variant === 'gradient' ? {
    backgroundImage: `linear-gradient(to right, ${gradientColors.join(', ')})`
  } : {};

  const getFooterClasses = () => {
    return cn(
      'w-full mt-auto',
      sticky && 'sticky bottom-0',
      footerVariants[variant],
      className
    );
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.footer
      className={getFooterClasses()}
      style={gradientStyle}
      initial={animated ? "hidden" : "visible"}
      whileInView={animated ? "visible" : "visible"}
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
    >
      {/* Back to Top Button */}
      {backToTop && (
        <motion.div
          className="absolute top-0 right-4 transform -translate-y-1/2"
          variants={itemVariants}
        >
          <Button
            variant="default"
            size="icon"
            className="rounded-full shadow-lg"
            onClick={handleBackToTop}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      <div className={cn("container mx-auto px-4 py-8 lg:py-12", contentClassName)}>
        {/* Main Footer Content */}
        {variant === 'minimal' ? (
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-between gap-4"
            variants={itemVariants}
          >
            {/* Logo & Company */}
            <div className="flex items-center gap-3">
              {logo}
              <span className="text-lg font-semibold">{companyName}</span>
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((social, index) => {
                  const IconComponent = socialIcons[social.platform];
                  return (
                    <motion.a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {social.icon || <IconComponent className="h-5 w-5" />}
                    </motion.a>
                  );
                })}
              </div>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Section */}
            <motion.div className="lg:col-span-1" variants={itemVariants}>
              <div className="flex items-center gap-3 mb-4">
                {logo}
                <h3 className="text-lg font-semibold">{companyName}</h3>
              </div>
              
              {description && (
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {description}
                </p>
              )}

              {/* Social Links */}
              {socialLinks.length > 0 && (
                <div className="flex items-center gap-3">
                  {socialLinks.map((social, index) => {
                    const IconComponent = socialIcons[social.platform];
                    return (
                      <motion.a
                        key={index}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-muted"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {social.icon || <IconComponent className="h-4 w-4" />}
                      </motion.a>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Link Sections */}
            {sections.map((section, index) => (
              <motion.div key={index} variants={itemVariants}>
                <h4 className="font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <motion.a
                        href={link.href}
                        target={link.external ? '_blank' : '_self'}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        whileHover={{ x: 2 }}
                      >
                        {link.label}
                      </motion.a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            {/* Contact Info */}
            {contactInfo && (
              <motion.div variants={itemVariants}>
                <h4 className="font-semibold mb-4">Contact</h4>
                <div className="space-y-3">
                  {contactInfo.email && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a 
                        href={`mailto:${contactInfo.email}`}
                        className="hover:text-foreground transition-colors"
                      >
                        {contactInfo.email}
                      </a>
                    </div>
                  )}
                  
                  {contactInfo.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <a 
                        href={`tel:${contactInfo.phone}`}
                        className="hover:text-foreground transition-colors"
                      >
                        {contactInfo.phone}
                      </a>
                    </div>
                  )}
                  
                  {contactInfo.address && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{contactInfo.address}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Newsletter */}
            {newsletter && (
              <motion.div variants={itemVariants}>
                <h4 className="font-semibold mb-4">
                  {newsletter.title || 'Newsletter'}
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  {newsletter.description || 'Subscribe to our newsletter for updates.'}
                </p>
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder={newsletter.placeholder || 'Enter your email'}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                  <Button type="submit" size="sm" className="w-full">
                    Subscribe
                  </Button>
                </form>
              </motion.div>
            )}
          </div>
        )}

        {/* Custom Content */}
        {customContent && (
          <motion.div className="mt-8" variants={itemVariants}>
            {customContent}
          </motion.div>
        )}

        {/* Divider */}
        {showDivider && variant !== 'minimal' && (
          <motion.div className="mt-8" variants={itemVariants}>
            <Separator />
          </motion.div>
        )}

        {/* Bottom Section */}
        <motion.div
          className={cn(
            "flex flex-col sm:flex-row items-center justify-between gap-4",
            variant !== 'minimal' ? "mt-8" : "mt-4"
          )}
          variants={itemVariants}
        >
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            {copyright || `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`}
          </p>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-red-500" />
            <span>by {companyName}</span>
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

// Specialized footer variants
export const MinimalFooter: React.FC<Omit<CustomizableFooterProps, 'variant'>> = (props) => (
  <CustomizableFooter variant="minimal" {...props} />
);

export const ExpandedFooter: React.FC<Omit<CustomizableFooterProps, 'variant'>> = (props) => (
  <CustomizableFooter variant="expanded" {...props} />
);

export const GradientFooter: React.FC<Omit<CustomizableFooterProps, 'variant'>> = (props) => (
  <CustomizableFooter variant="gradient" {...props} />
);

export const GlassFooter: React.FC<Omit<CustomizableFooterProps, 'variant'>> = (props) => (
  <CustomizableFooter variant="glass" {...props} />
);