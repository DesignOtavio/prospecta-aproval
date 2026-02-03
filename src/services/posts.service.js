import { supabase, TABLES, STORAGE_BUCKETS } from './supabase';
import { POST_STATUS, ACTIVITY_TYPES } from '../utils/constants';
import { generateFilename, getMediaType } from '../utils/helpers';

/**
 * Fetch posts for client
 */
export const fetchClientPosts = async (clientId) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.POSTS)
            .select(`
        *,
        prpsct_clients (
          id,
          name
        )
      `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Fetch all posts (admin)
 */
export const fetchAllPosts = async () => {
    try {
        const { data, error } = await supabase
            .from(TABLES.POSTS)
            .select(`
        *,
        prpsct_clients (
          id,
          name
        )
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Fetch single post by ID
 */
export const fetchPost = async (postId) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.POSTS)
            .select(`
        *,
        prpsct_clients (
          id,
          name,
          webhook_url
        )
      `)
            .eq('id', postId)
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Create a new post
 */
export const createPost = async (postData, mediaFiles = []) => {
    try {
        // Upload media files to storage
        const mediaUrls = [];

        for (const file of mediaFiles) {
            const filename = generateFilename(file.name);
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKETS.POST_MEDIA)
                .upload(filename, file);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(STORAGE_BUCKETS.POST_MEDIA)
                .getPublicUrl(filename);

            mediaUrls.push({
                type: getMediaType(file),
                url: publicUrl,
                filename: filename,
            });
        }

        // Create post
        const { data, error } = await supabase
            .from(TABLES.POSTS)
            .insert([
                {
                    ...postData,
                    media_urls: mediaUrls,
                    status: POST_STATUS.PENDING,
                },
            ])
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await logActivity({
            post_id: data.id,
            user_id: postData.created_by,
            action_type: ACTIVITY_TYPES.POST_CREATED,
            details: { post_title: postData.title },
        });

        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Update post status
 */
export const updatePostStatus = async (postId, status, userId) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.POSTS)
            .update({ status })
            .eq('id', postId)
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await logActivity({
            post_id: postId,
            user_id: userId,
            action_type: ACTIVITY_TYPES.STATUS_CHANGED,
            details: { new_status: status },
        });

        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Fetch comments for a post
 */
export const fetchComments = async (postId) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.COMMENTS)
            .select(`
        *,
        prpsct_profiles (
          id,
          full_name,
          avatar_url
        )
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Add comment to post
 */
export const addComment = async (postId, userId, content, markers = null) => {
    try {
        const payload = {
            post_id: postId,
            user_id: userId,
            content,
        };

        if (markers) {
            payload.markers = markers;
        }

        const { data, error } = await supabase
            .from(TABLES.COMMENTS)
            .insert([payload])
            .select() // ... rest of the function
            .single();

        if (error) throw error;

        // Log activity
        await logActivity({
            post_id: postId,
            user_id: userId,
            action_type: ACTIVITY_TYPES.COMMENT_ADDED,
            details: { comment: content },
        });

        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Create approval action
 */
export const createApprovalAction = async (postId, userId, action, notes = '') => {
    try {
        let approvalData = null;

        // Only insert into approval_actions for actual approval/rejection
        // to avoid potential enum/constraint conflicts with 'pending'
        if (action === 'approved' || action === 'changes_requested') {
            const { data, error } = await supabase
                .from(TABLES.APPROVAL_ACTIONS)
                .insert([
                    {
                        post_id: postId,
                        user_id: userId,
                        action,
                        notes,
                    },
                ])
                .select()
                .single();

            if (error) throw error;
            approvalData = data;
        }

        // Determine new status and activity type
        let newStatus = POST_STATUS.PENDING;
        let actionType = ACTIVITY_TYPES.STATUS_CHANGED;

        if (action === 'approved') {
            newStatus = POST_STATUS.APPROVED;
            actionType = ACTIVITY_TYPES.POST_APPROVED;
        } else if (action === 'changes_requested') {
            newStatus = POST_STATUS.CHANGES_REQUESTED;
            actionType = ACTIVITY_TYPES.CHANGES_REQUESTED;
        }

        // Update post status
        const { error: statusError } = await updatePostStatus(postId, newStatus, userId);
        if (statusError) throw statusError;

        // Log specific activity (redundant with updatePostStatus but more specific)
        await logActivity({
            post_id: postId,
            user_id: userId,
            action_type: actionType,
            details: { action, notes },
        });

        return { data: approvalData, error: null };
    } catch (error) {
        console.error('Error in createApprovalAction service:', error);
        return { data: null, error };
    }
};

/**
 * Log activity
 */
export const logActivity = async (activityData) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.ACTIVITY_LOGS)
            .insert([activityData]);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Fetch activity logs for a post
 */
export const fetchActivityLogs = async (postId) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.ACTIVITY_LOGS)
            .select(`
        *,
        prpsct_profiles (
          full_name,
          avatar_url
        )
      `)
            .eq('post_id', postId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};
/**
 * Fetch all activity logs (admin)
 */
export const fetchAllActivities = async (limit = 10) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.ACTIVITY_LOGS)
            .select(`
                *,
                prpsct_profiles (
                    full_name,
                    avatar_url
                ),
                prpsct_posts (
                    title
                )
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Update a post
 */
export const updatePost = async (postId, postData, userId) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.POSTS)
            .update(postData)
            .eq('id', postId)
            .select()
            .single();

        if (error) throw error;

        // Log activity
        await logActivity({
            post_id: postId,
            user_id: userId,
            action_type: ACTIVITY_TYPES.STATUS_CHANGED, // Or create a new type if preferred
            details: { updated_fields: Object.keys(postData) },
        });

        return { data, error: null };
    } catch (error) {
        return { data: null, error };
    }
};

/**
 * Delete a post
 */
export const deletePost = async (postId, userId) => {
    try {
        const { error } = await supabase
            .from(TABLES.POSTS)
            .delete()
            .eq('id', postId);

        if (error) throw error;

        return { error: null };
    } catch (error) {
        return { error };
    }
};
