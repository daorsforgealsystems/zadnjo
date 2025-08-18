import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Avatar from "@/components/Avatar";
import Logo from "@/components/Logo";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [website, setWebsite] = useState<string | null>(null);
  const [avatar_url, setAvatarUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!user) throw new Error("No user on the session!");

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`username, website, avatar_url`)
        .eq("id", user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Error loading user data",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string | null;
    website: string | null;
    avatar_url: string | null;
  }) {
    try {
      setLoading(true);
      if (!user) throw new Error("No user on the session!");

      const updates = {
        id: user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Error updating the profile",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full bg-black/90 overflow-hidden">
      {/* Hero image as background, zoomed out and darkened */}
      <img
        src="/src/assets/hero-logistics.jpg"
        alt="Logistics hero background"
        className="fixed inset-0 w-full h-full object-cover object-center scale-110 md:scale-125 z-0"
        style={{ filter: 'brightness(0.45) blur(2px)' }}
      />
      {/* Glassy dark overlay for extra porosity */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-zinc-900/80 to-black/90 backdrop-blur-xl z-10" />
      <div className="relative z-20 w-full max-w-lg mx-auto mt-12">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 text-white shadow-xl rounded-2xl p-8 flex flex-col items-center">
          <Logo size="md" showText={true} linkTo={null} className="mb-4" />
          <Avatar
            url={avatar_url}
            size={120}
            onUpload={(url) => {
              setAvatarUrl(url);
              updateProfile({ username, website, avatar_url: url });
            }}
          />
          <div className="w-full grid gap-4 mt-6">
            <div>
              <Label htmlFor="email" className="text-zinc-200">Email</Label>
              <Input id="email" type="text" value={user?.email} disabled className="bg-black/40 border-white/10 text-white" />
            </div>
            <div>
              <Label htmlFor="username" className="text-zinc-200">Name</Label>
              <Input
                id="username"
                type="text"
                required
                value={username || ""}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="website" className="text-zinc-200">Website</Label>
              <Input
                id="website"
                type="url"
                value={website || ""}
                onChange={(e) => setWebsite(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder-zinc-400 focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-teal-500 text-white font-semibold shadow-lg hover:brightness-110"
                onClick={() => updateProfile({ username, website, avatar_url })}
                disabled={loading}
              >
                {loading ? "Loading ..." : "Update"}
              </Button>
            </div>
            <div>
              <Button
                className="w-full bg-black/40 border-white/10 text-white hover:bg-black/60"
                variant="outline"
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}