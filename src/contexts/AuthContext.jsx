import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('prpsct_profiles') // Ensure correct table name
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // If profile doesn't exist (PGRST116), create it automatically
                if (error.code === 'PGRST116') {
                    console.log('Profile not found, creating new profile for:', userId);
                    const { data: userData } = await supabase.auth.getUser();

                    if (userData?.user) {
                        const newProfile = {
                            id: userId,
                            full_name: userData.user.user_metadata?.full_name || userData.user.email,
                            role: userData.user.user_metadata?.role || USER_ROLES.CLIENT,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };

                        const { data: createdProfile, error: createError } = await supabase
                            .from('prpsct_profiles')
                            .insert([newProfile])
                            .select()
                            .single();

                        if (createError) {
                            console.error('Error creating profile:', createError);
                            throw createError;
                        }

                        setProfile(createdProfile);
                        return;
                    }
                }
                throw error;
            }
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email, password, fullName, role = USER_ROLES.CLIENT) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                    },
                },
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const signIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
            setProfile(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const isAdmin = profile?.role === USER_ROLES.ADMIN;
    const isClient = profile?.role === USER_ROLES.CLIENT;

    const value = {
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        isAdmin,
        isClient,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
