import { useState } from "react";
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ParticleBackground />
      <div className="relative z-20">
        <Sidebar isOpen={sidebarOpen} onAlertsClick={() => {}} />

        <main className={cn("transition-all duration-300 pt-header", sidebarOpen ? "ml-64" : "ml-16")}>
          <div className="p-6 space-y-6">
            <header className="space-y-2 animate-slide-up-fade">
              <h1 className="text-3xl font-bold gradient-text">{t('settings.title', 'Settings')}</h1>
              <p className="text-muted-foreground">{t('settings.description', 'Manage your account and preferences.')}</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column for navigation (optional, can be added later) */}
              <div className="lg:col-span-1">
                {/* Could have a settings sidebar here */}
              </div>

              {/* Right column for settings content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Settings */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><User /> Profile</CardTitle>
                    <CardDescription>Update your personal information.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" defaultValue="John" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" defaultValue="Doe" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" defaultValue="john.doe@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Profile Picture</Label>
                      <div className="flex items-center gap-4">
                        <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="w-16 h-16 rounded-full" />
                        <Button variant="outline">Change Picture</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Shield /> Security</CardTitle>
                    <CardDescription>Manage your password and two-factor authentication.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Label htmlFor="2fa" className="font-medium">Two-Factor Authentication</Label>
                      <Switch id="2fa" />
                    </div>
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bell /> Notifications</CardTitle>
                    <CardDescription>Choose how you want to be notified.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <Switch id="email-notifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <Switch id="push-notifications" />
                    </div>
                    <div className="space-y-2">
                      <Label>Notification Types</Label>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <Switch id="notif-shipment" defaultChecked/>
                          <Label htmlFor="notif-shipment">Shipment Status</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="notif-route" defaultChecked/>
                          <Label htmlFor="notif-route">Route Changes</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="notif-system"/>
                          <Label htmlFor="notif-system">System Messages</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Appearance Settings */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Palette /> Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Theme</Label>
                      <Select defaultValue="dark">
                        <SelectTrigger id="theme">
                          <SelectValue placeholder="Select a theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">{t('settings.appearance.language', 'Language')}</Label>
                      <div className="flex items-center gap-4">
                        <LanguageSwitcher variant="default" className="flex-1" />
                        <span className="text-sm text-muted-foreground">
                          {t('settings.appearance.language.description', 'Choose your preferred language')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Features Teaser */}
                <EnhancedFeatures />

                <div className="flex justify-end">
                  <Button size="lg" onClick={handleSave} className="bg-gradient-primary hover:scale-105 transition-transform">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
