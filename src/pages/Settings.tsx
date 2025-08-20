import { useState } from "react";
import { motion } from "framer-motion";
import { pageTransition, cardHover } from "@/lib/motion-variants";
import { useTranslation } from "react-i18next";
import { User, Shield, Bell, Palette, Save } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";
import ParticleBackground from "@/components/ParticleBackground";
import EnhancedFeatures from "@/components/EnhancedFeatures";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Settings = () => {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSave = () => {
    toast.success(t('settings.saveChanges.success', 'Settings saved successfully!'));
  };

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden flex items-stretch justify-stretch bg-black/90"
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Hero background image with dark overlay */}
      <img
        src="/src/assets/hero-logistics.jpg"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover object-center scale-105 blur-sm opacity-60 z-0 select-none pointer-events-none"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-gray-900/80 z-10" />
      <ParticleBackground />
      <div className="relative z-20 flex w-full">
        <Sidebar isOpen={sidebarOpen} onAlertsClick={() => {}} />

        <main className={cn("transition-all duration-300 pt-header flex-1", sidebarOpen ? "ml-64" : "ml-16")}> 
          <div className="p-6 min-h-screen flex flex-col">
            <header className="space-y-2 animate-slide-up-fade mb-6">
              <h1 className="text-3xl font-bold gradient-text drop-shadow-lg text-white">{t('settings.title', 'Settings')}</h1>
              <p className="text-lg text-white/80 max-w-2xl">{t('settings.description', 'Manage your account and preferences.')}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
              {/* Left column for navigation (optional, can be added later) */}
              <div className="lg:col-span-1"></div>

              {/* Right column for settings content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Profile Settings */}
                <Card className="glass bg-white/10 backdrop-blur-md border border-white/20 shadow-xl text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User /> {t('settings.profile.title', 'Profile')}</CardTitle>
                    <CardDescription className="text-white/70">{t('settings.profile.description', 'Update your personal information.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-white/90">{t('settings.profile.firstName', 'First Name')}</Label>
                        <Input id="firstName" defaultValue="John" className="bg-white/10 text-white placeholder:text-white/60 border-white/20" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-white/90">{t('settings.profile.lastName', 'Last Name')}</Label>
                        <Input id="lastName" defaultValue="Doe" className="bg-white/10 text-white placeholder:text-white/60 border-white/20" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/90">{t('settings.profile.email', 'Email')}</Label>
                      <Input id="email" type="email" defaultValue="john.doe@example.com" className="bg-white/10 text-white placeholder:text-white/60 border-white/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/90">{t('settings.profile.picture', 'Profile Picture')}</Label>
                      <div className="flex items-center gap-4">
                        <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="w-16 h-16 rounded-full border-2 border-white/30 shadow" />
                        <Button variant="outline" className="border-white/30 text-white/90 hover:bg-white/10">{t('settings.profile.changePicture', 'Change Picture')}</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="glass bg-white/10 backdrop-blur-md border border-white/20 shadow-xl text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield /> {t('settings.security.title', 'Security')}</CardTitle>
                    <CardDescription className="text-white/70">{t('settings.security.description', 'Manage your password and two-factor authentication.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-white/90">{t('settings.security.currentPassword', 'Current Password')}</Label>
                      <Input id="currentPassword" type="password" className="bg-white/10 text-white placeholder:text-white/60 border-white/20" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-white/90">{t('settings.security.newPassword', 'New Password')}</Label>
                      <Input id="newPassword" type="password" className="bg-white/10 text-white placeholder:text-white/60 border-white/20" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Label htmlFor="2fa" className="font-medium text-white/90">{t('settings.security.2fa', 'Two-Factor Authentication')}</Label>
                      <Switch id="2fa" />
                    </div>
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="glass bg-white/10 backdrop-blur-md border border-white/20 shadow-xl text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell /> {t('settings.notifications.title', 'Notifications')}</CardTitle>
                    <CardDescription className="text-white/70">{t('settings.notifications.description', 'Choose how you want to be notified.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications" className="text-white/90">{t('settings.notifications.email', 'Email Notifications')}</Label>
                      <Switch id="email-notifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications" className="text-white/90">{t('settings.notifications.push', 'Push Notifications')}</Label>
                      <Switch id="push-notifications" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white/90">{t('settings.notifications.types', 'Notification Types')}</Label>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Switch id="notif-shipment" defaultChecked/>
                          <Label htmlFor="notif-shipment" className="text-white/80">{t('settings.notifications.shipment', 'Shipment Status')}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="notif-route" defaultChecked/>
                          <Label htmlFor="notif-route" className="text-white/80">{t('settings.notifications.route', 'Route Changes')}</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="notif-system"/>
                          <Label htmlFor="notif-system" className="text-white/80">{t('settings.notifications.system', 'System Messages')}</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Appearance Settings */}
                <Card className="glass bg-white/10 backdrop-blur-md border border-white/20 shadow-xl text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Palette /> {t('settings.appearance.title', 'Appearance')}</CardTitle>
                    <CardDescription className="text-white/70">{t('settings.appearance.description', 'Customize the look and feel of the application.')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme" className="text-white/90">{t('settings.appearance.theme', 'Theme')}</Label>
                      <Select defaultValue="dark">
                        <SelectTrigger id="theme" className="bg-white/10 text-white border-white/20">
                          <SelectValue placeholder={t('settings.appearance.theme.placeholder', 'Select a theme')} />
                        </SelectTrigger>
                        <SelectContent className="bg-black/90 text-white">
                          <SelectItem value="light">{t('settings.appearance.theme.light', 'Light')}</SelectItem>
                          <SelectItem value="dark">{t('settings.appearance.theme.dark', 'Dark')}</SelectItem>
                          <SelectItem value="system">{t('settings.appearance.theme.system', 'System')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language" className="text-white/90">{t('settings.appearance.language', 'Language')}</Label>
                      <div className="flex items-center gap-4">
                        <LanguageSwitcher variant="default" className="flex-1" />
                        <span className="text-sm text-white/70">
                          {t('settings.appearance.language.description', 'Choose your preferred language')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Features Teaser */}
                <EnhancedFeatures />

                <div className="flex justify-end">
                  <Button size="lg" onClick={handleSave} className="bg-gradient-primary hover:scale-105 transition-transform text-white shadow-lg">
                    <Save className="mr-2 h-4 w-4" />
                    {t('settings.saveChanges.button', 'Save Changes')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </motion.div>
  );
};

export default Settings;
