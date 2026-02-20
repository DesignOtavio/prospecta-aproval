import { POST_STATUS, MEDIA_TYPES } from './constants';

/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutos atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas atrás`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;

    return formatDate(dateString);
};

/**
 * Get status badge color
 */
export const getStatusColor = (status, mediaUrls = []) => {
    switch (status) {
        case POST_STATUS.APPROVED:
            return 'success';
        case POST_STATUS.CHANGES_REQUESTED:
            return 'warning';
        case POST_STATUS.PENDING:
        default:
            return 'info';
    }
};

/**
 * Get status label
 */
export const getStatusLabel = (status, mediaUrls = []) => {
    const hasMedia = mediaUrls && mediaUrls.length > 0;

    switch (status) {
        case POST_STATUS.APPROVED:
            return hasMedia ? 'Aprovado' : 'Texto Aprovado';
        case POST_STATUS.CHANGES_REQUESTED:
            return 'Alterações Solicitadas';
        case POST_STATUS.PENDING:
        default:
            return hasMedia ? 'Design em Aprovação' : 'Texto em Aprovação';
    }
};

/**
 * Validate file type
 */
export const validateFileType = (file, allowedTypes) => {
    return allowedTypes.includes(file.type);
};

/**
 * Validate file size
 */
export const validateFileSize = (file, maxSize) => {
    return file.size <= maxSize;
};

/**
 * Get file extension
 */
export const getFileExtension = (filename) => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Generate unique filename
 */
export const generateFilename = (originalName) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const extension = getFileExtension(originalName);
    return `${timestamp}_${random}.${extension}`;
};

/**
 * Detect media type from file
 */
export const getMediaType = (file) => {
    if (file.type.startsWith('image/')) return MEDIA_TYPES.IMAGE;
    if (file.type.startsWith('video/')) return MEDIA_TYPES.VIDEO;
    return null;
};

/**
 * Generate WhatsApp share link
 */
export const generateWhatsAppLink = (postTitle, postUrl) => {
    const message = `Olá! Você tem uma nova postagem para aprovar:\n\n*${postTitle}*\n\nAcesse: ${postUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
};

/**
 * Generate post access URL
 */
export const generatePostUrl = (postId) => {
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    return `${baseUrl}/client/post/${postId}`;
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false;
    }
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};
