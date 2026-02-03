import { supabase, TABLES } from './supabase';

/**
 * Fetch all clients
 */
export const fetchClients = async () => {
    try {
        const { data, error } = await supabase
            .from(TABLES.CLIENTS)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Fetch single client
 */
export const fetchClient = async (clientId) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.CLIENTS)
            .select('*')
            .eq('id', clientId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Create new client with Auth registration
 */
export const createClientWithAuth = async (clientData, password) => {
    try {
        // 1. Create client in the prpsct_clients table first
        const { data: client, error: clientError } = await supabase
            .from(TABLES.CLIENTS)
            .insert([clientData])
            .select()
            .single();

        if (clientError) throw clientError;

        // 2. Sign up the user in Supabase Auth
        // Note: Using clientData.email. We pass metadata to help the trigger.
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: clientData.email,
            password: password,
            options: {
                data: {
                    full_name: clientData.name,
                    role: 'client'
                }
            }
        });

        if (authError) throw authError;

        return { data: { client, authUser: authData.user }, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Old createClient method
 */
export const createClient = async (clientData) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.CLIENTS)
            .insert([clientData])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Update client
 */
export const updateClient = async (clientId, clientData) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.CLIENTS)
            .update(clientData)
            .eq('id', clientId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Delete client
 */
export const deleteClient = async (clientId) => {
    try {
        const { error } = await supabase
            .from(TABLES.CLIENTS)
            .delete()
            .eq('id', clientId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error };
    }
};

/**
 * Fetch client by user ID
 */
export const fetchClientByUserId = async (userId) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.CLIENTS)
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};
