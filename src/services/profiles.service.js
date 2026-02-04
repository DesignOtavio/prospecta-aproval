import { supabase, TABLES } from './supabase';
import { USER_ROLES } from '../utils/constants';

/**
 * Fetch profiles by role
 */
export const fetchProfilesByRole = async (role) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.PROFILES)
            .select('*')
            .eq('role', role)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Create a new admin user
 * NOTE: Using this method might sign out the current user if auto-login is enabled in Supabase
 */
export const createAdminWithAuth = async (email, password, fullName) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                    role: USER_ROLES.ADMIN
                }
            }
        });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Delete a profile (and potentially its auth user if handled via Edge Function/Trigger)
 * Note: Deleting from profiles table only won't remove from auth.users without a trigger.
 */
export const deleteProfile = async (id) => {
    try {
        const { error } = await supabase
            .from(TABLES.PROFILES)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error };
    }
};
