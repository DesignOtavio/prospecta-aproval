// User roles
export const USER_ROLES = {
    ADMIN: 'admin',
    CLIENT: 'client',
};

// Post statuses
export const POST_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    CHANGES_REQUESTED: 'changes_requested',
};

// Approval actions
export const APPROVAL_ACTIONS = {
    APPROVED: 'approved',
    CHANGES_REQUESTED: 'changes_requested',
};

// Activity types
export const ACTIVITY_TYPES = {
    POST_CREATED: 'post_created',
    COMMENT_ADDED: 'comment_added',
    STATUS_CHANGED: 'status_changed',
    POST_APPROVED: 'post_approved',
    CHANGES_REQUESTED: 'changes_requested',
};

// Media types
export const MEDIA_TYPES = {
    IMAGE: 'image',
    VIDEO: 'video',
};

// Allowed file extensions
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

// File size limits (in bytes)
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

// Routes
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',

    // Client routes
    CLIENT_DASHBOARD: '/client/dashboard',
    CLIENT_POST: '/client/post/:id',

    // Admin routes
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_CLIENTS: '/admin/clients',
    ADMIN_POSTS: '/admin/posts',
    ADMIN_SETTINGS: '/admin/settings',
};
