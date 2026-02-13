import { supabase, TABLES } from './supabase';

/**
 * Fetch all reports for a specific client
 */
export const fetchClientReports = async (clientId) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.LOOKER_REPORTS)
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Create a new Looker report for a client
 */
export const createReport = async (reportData) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.LOOKER_REPORTS)
            .insert([reportData])
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Update a Looker report
 */
export const updateReport = async (reportId, reportData) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.LOOKER_REPORTS)
            .update(reportData)
            .eq('id', reportId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Delete a Looker report
 */
export const deleteReport = async (reportId) => {
    try {
        const { error } = await supabase
            .from(TABLES.LOOKER_REPORTS)
            .delete()
            .eq('id', reportId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error };
    }
};
