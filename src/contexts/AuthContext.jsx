import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, TABLES } from '../services/supabase';
import { USER_ROLES } from '../utils/constants';
import bcrypt from 'bcryptjs';

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
        const initAuth = async () => {
            // 1. Tenta recuperar sessão de tabela (localStorage)
            const storedSession = localStorage.getItem('table_session');
            if (storedSession) {
                try {
                    const parsedSession = JSON.parse(storedSession);
                    // Verifica se ainda é válido (poderíamos checar no banco, mas por performance/simplicidade aceitamos por enquanto)
                    // Idealmente: RPC get_client_by_id para confirmar
                    setUser(parsedSession.user);
                    setProfile(parsedSession.profile);
                    setLoading(false);
                    return; // Retorna antecipado se achou sessão tabela
                } catch (e) {
                    console.error('Erro ao parsear sessão tabela', e);
                    localStorage.removeItem('table_session');
                }
            }

            // 2. Se não, tenta Auth do Supabase
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }

            // Listen for auth changes (apenas Supabase Auth)
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                if (session?.user) {
                    setUser(session.user);
                    fetchProfile(session.user.id);
                } else if (!localStorage.getItem('table_session')) {
                    // Só limpa se não tiver sessão de tabela ativa
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
            });

            return () => subscription.unsubscribe();
        };

        initAuth();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from(TABLES.PROFILES)
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // ... lógica de criação automática removida por simplicidade/segurança, 
                // ou manter se necessário para Admin. Admins já existem.
                console.error('Error fetching profile:', error);
            }
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email, password) => {
        setLoading(true);
        try {
            // 1. Tenta Login via Tabela (Prioridade: Clients)
            // Usamos RPC segura para buscar dados (incluindo senha hash) pelo email
            const { data: clientRows, error: rpcError } = await supabase
                .rpc('get_client_by_email', { email_input: email });

            if (!rpcError && clientRows && clientRows.length > 0) {
                const client = clientRows[0];
                if (client.password) {
                    const match = await bcrypt.compare(password, client.password);
                    if (match) {
                        const tableUser = {
                            id: client.id,
                            email: client.email,
                            role: 'client',
                            auth_type: 'table'
                        };
                        const tableProfile = {
                            id: client.id,
                            full_name: client.name,
                            role: 'client'
                        };

                        setUser(tableUser);
                        setProfile(tableProfile);

                        // Persiste sessão
                        localStorage.setItem('table_session', JSON.stringify({ user: tableUser, profile: tableProfile }));

                        setLoading(false);
                        return { data: { user: tableUser }, error: null };
                    }
                }
            }

            // 2. Se falhar ou não achar na tabela, tenta Supabase Auth (Admin)
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            setLoading(false);
            console.error('Login error:', error);
            return { data: null, error };
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            // Limpa sessão local
            localStorage.removeItem('table_session');

            // Limpa Supabase Auth
            await supabase.auth.signOut();

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
        signIn,
        signOut,
        isAdmin,
        isClient,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
