import { supabase, STORAGE_BUCKETS } from './supabase';
import { generateFilename } from '../utils/helpers';

/**
 * Upload file to Supabase Storage
 * @param {File} file - File object to upload
 * @param {string} bucket - Bucket name (default: post-media)
 * @returns {Promise<{url: string, path: string, type: string} | {error: any}>}
 */
export const uploadFile = async (file, bucket = STORAGE_BUCKETS.POST_MEDIA) => {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = generateFilename(fileExt);
        const filePath = `${fileName}`;

        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return {
            data: {
                url: publicUrl,
                path: filePath,
                type: file.type,
                name: file.name
            },
            error: null
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        return { data: null, error };
    }
};

/**
 * Delete file from Supabase Storage
 */
export const deleteFile = async (path, bucket = STORAGE_BUCKETS.POST_MEDIA) => {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error deleting file:', error);
        return { error };
    }
};
