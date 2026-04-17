import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export interface ProfileData {
  id: string;
  phone: string;
  full_name: string;
  email: string;
  city: string;
  dob: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: ProfileData | null;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  refreshProfile: async () => { },
  logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      
      // Extract Google profile photo from user_metadata if not already in profile
      const googleAvatarUrl = user.user_metadata?.avatar_url 
        || user.user_metadata?.picture 
        || null;
      
      if (data && !data.avatar_url && googleAvatarUrl) {
        // Save Google photo to profiles table
        await supabase.from('profiles').upsert({
          id: user.id,
          avatar_url: googleAvatarUrl,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
        setProfile({ ...data, avatar_url: googleAvatarUrl });
      } else {
        setProfile(data);
      }
    } else {
      setProfile(null);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  useEffect(() => {
    // Initial fetch
    refreshProfile().finally(() => setIsLoading(false));

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        refreshProfile();
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
