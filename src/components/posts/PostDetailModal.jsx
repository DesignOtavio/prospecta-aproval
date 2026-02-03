import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    fetchComments,
    addComment,
    createApprovalAction,
    updatePost,
    deletePost
} from '../../services/posts.service';
import { formatRelativeTime } from '../../utils/helpers';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';
import './PostDetailModal.css';

const PostDetailModal = ({ post, onClose, onUpdate }) => {
    const { user, isAdmin } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(post?.title || '');
    const [editedDescription, setEditedDescription] = useState(post?.description || '');
    const [editedTextContent, setEditedTextContent] = useState(post?.text_content || '');

    useEffect(() => {
        if (post?.id) {
            loadComments();
        }
    }, [post?.id]);

    const loadComments = async () => {
        const { data } = await fetchComments(post.id);
        if (data) setComments(data);
    };



    const handleAction = async (action) => {
        let confirmMsg = 'Confirmar ação?';
        if (action === 'approved') confirmMsg = 'Aprovar esta postagem?';
        else if (action === 'changes_requested') confirmMsg = 'Solicitar alterações nesta postagem?';
        else if (action === 'pending') confirmMsg = 'Mover postagem de volta para Pendente?';

        if (!confirm(confirmMsg)) return;

        setActionLoading(true);
        const { error } = await createApprovalAction(post.id, user.id, action);
        if (!error) {
            onUpdate?.(); // Refresh list
            onClose(); // Close modal
        } else {
            console.error('Error in handleAction:', error);
            alert('Erro ao processar ação: ' + (error.message || 'Erro desconhecido'));
        }
        setActionLoading(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.')) return;

        setLoading(true);
        const { error } = await deletePost(post.id, user.id);
        if (!error) {
            onUpdate?.();
            onClose();
        } else {
            alert('Erro ao excluir postagem: ' + error.message);
        }
        setLoading(false);
    };

    const handleSaveEdit = async () => {
        setLoading(true);
        const { error } = await updatePost(post.id, {
            title: editedTitle,
            description: editedDescription,
            text_content: editedTextContent
        }, user.id);

        if (!error) {
            setIsEditing(false);
            onUpdate?.(); // Refresh list to see changes
        } else {
            alert('Erro ao salvar alterações: ' + error.message);
        }
        setLoading(false);
    };

    if (!post) return null;

    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [tempMarker, setTempMarker] = useState(null); // { x: 50, y: 50 } percentages

    const mediaList = post.media_urls || [];
    const currentMedia = mediaList[currentMediaIndex] || {};
    const hasMultipleMedia = mediaList.length > 1;

    const handleNextMedia = () => {
        setCurrentMediaIndex((prev) => (prev + 1) % mediaList.length);
        setTempMarker(null);
    };

    const handlePrevMedia = () => {
        setCurrentMediaIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);
        setTempMarker(null);
    };

    const handleImageClick = (e) => {
        if (post.status === 'approved') return; // Disable marking on approved posts

        const rect = e.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setTempMarker({ x, y, mediaIndex: currentMediaIndex });

        // Focus comment input
        const input = document.querySelector('.comment-form input');
        if (input) input.focus();
    };

    const handleSendComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setLoading(true);
        // Pass tempMarker as metadata/markers if your backend supports it
        // Or append to text if not. Assuming we added 'markers' column based on plan.
        const commentData = {
            content: newComment,
            markers: tempMarker ? [tempMarker] : null
        };

        // Modified addComment call to accept extra data (markers)
        // You might need to update addComment signature in service or pass object
        const { error } = await addComment(post.id, user.id, newComment, tempMarker ? [tempMarker] : null);

        if (!error) {
            setNewComment('');
            setTempMarker(null);
            loadComments();
        }
        setLoading(false);
    };

    // Filter comments that have markers for the current media
    const currentMarkers = comments
        .filter(c => c.markers && c.markers[0]?.mediaIndex === currentMediaIndex)
        .map(c => ({ ...c.markers[0], id: c.id, author: c.prpsct_profiles?.full_name }));

    return (
        <div className="post-detail-modal">
            <div className="post-detail-container">
                {/* Left: Content */}
                <div className="post-detail-content">
                    <div className="post-detail-media" style={{ cursor: 'crosshair' }}>
                        {hasMultipleMedia && (
                            <>
                                <button className="media-nav-btn prev" onClick={handlePrevMedia}>
                                    <i className="ph ph-caret-left"></i>
                                </button>
                                <button className="media-nav-btn next" onClick={handleNextMedia}>
                                    <i className="ph ph-caret-right"></i>
                                </button>
                                <div className="media-counter">
                                    {currentMediaIndex + 1} / {mediaList.length}
                                </div>
                            </>
                        )}

                        {currentMedia.type === 'video' ? (
                            <video src={currentMedia.url} controls className="media-content" />
                        ) : (
                            <div className="media-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                    src={currentMedia.url || '/placeholder.png'}
                                    alt={post.title}
                                    className="media-content"
                                    onClick={handleImageClick}
                                />

                                {/* Render Saved Markers */}
                                {currentMarkers.map((marker, idx) => (
                                    <div
                                        key={marker.id}
                                        className="image-marker saved"
                                        style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                                        title={marker.author}
                                    >
                                        {idx + 1}
                                    </div>
                                ))}

                                {/* Render Temp Marker */}
                                {tempMarker && tempMarker.mediaIndex === currentMediaIndex && (
                                    <div
                                        className="image-marker temp"
                                        style={{ left: `${tempMarker.x}%`, top: `${tempMarker.y}%` }}
                                    >
                                        <i className="ph ph-push-pin-simple"></i>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="post-metadata">
                        <div className="metadata-item">
                            <label>Status</label>
                            <Badge status={post.status} />
                        </div>
                        <div className="metadata-item">
                            <label>Cliente</label>
                            <span>{post.clients?.name}</span>
                        </div>
                        <div className="metadata-item">
                            <label>Criado em</label>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="edit-form">
                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">Título</label>
                                <Input
                                    value={editedTitle}
                                    onChange={(e) => setEditedTitle(e.target.value)}
                                    fullWidth
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">Descrição</label>
                                <textarea
                                    className="form-textarea"
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    rows={3}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                <label className="form-label">Legenda / Copy</label>
                                <textarea
                                    className="form-textarea"
                                    value={editedTextContent}
                                    onChange={(e) => setEditedTextContent(e.target.value)}
                                    rows={5}
                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                                />
                            </div>

                            <div className="edit-actions" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                <Button onClick={handleSaveEdit} loading={loading}>Salvar</Button>
                                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="post-detail-title">{post.title}</h2>

                            {post.description && (
                                <div className="post-detail-description">
                                    {post.description}
                                </div>
                            )}

                            <div className="text-content">
                                <h3>Legenda / Copy</h3>
                                <p>{post.text_content || 'Sem texto definido.'}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Right: Activity & Actions */}
                <div className="post-detail-sidebar">
                    <div className="sidebar-header">
                        <span className="sidebar-title">Atividade</span>
                        <div className="sidebar-actions" style={{ display: 'flex', gap: '12px' }}>
                            {isAdmin && (
                                <>
                                    <button
                                        className="action-icon-btn"
                                        onClick={() => setIsEditing(!isEditing)}
                                        title="Editar postagem"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                                    >
                                        <i className={`ph ph-${isEditing ? 'x' : 'pencil-simple'} icon`} style={{ fontSize: '1.25rem' }}></i>
                                    </button>
                                    <button
                                        className="action-icon-btn delete"
                                        onClick={handleDelete}
                                        title="Excluir postagem"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                    >
                                        <i className="ph ph-trash icon" style={{ fontSize: '1.25rem' }}></i>
                                    </button>
                                </>
                            )}
                            <button
                                className="action-icon-btn"
                                onClick={onClose}
                                title="Fechar"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                            >
                                <i className="ph ph-x icon" style={{ fontSize: '1.5rem' }}></i>
                            </button>
                        </div>
                    </div>

                    <div className="activity-feed">
                        {/* System Log Example */}
                        <div className="system-log">
                            <span>Postagem criada em {formatRelativeTime(post.created_at)}</span>
                        </div>

                        {comments.map(comment => (
                            <div key={comment.id} className="comment-item">
                                <div className="comment-avatar">
                                    {comment.prpsct_profiles?.full_name?.charAt(0) || '?'}
                                </div>
                                <div className="comment-content">
                                    <div className="comment-header">
                                        <span className="comment-author">{comment.prpsct_profiles?.full_name}</span>
                                        <span className="comment-time">{formatRelativeTime(comment.created_at)}</span>
                                    </div>
                                    <div className="comment-text">{comment.content}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="activity-actions">
                        <form onSubmit={handleSendComment} className="comment-form">
                            <Input
                                placeholder="Escreva um comentário..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                disabled={loading}
                                fullWidth
                            />
                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                                <Button type="submit" size="sm" loading={loading} disabled={!newComment.trim()}>
                                    Enviar
                                </Button>
                            </div>
                        </form>

                        <div className="approval-actions" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    fullWidth
                                    onClick={() => handleAction('pending')}
                                    loading={actionLoading}
                                    disabled={post.status === 'pending'}
                                >
                                    <i className="ph ph-clock mr-2"></i> Pendente
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-error border-error hover:bg-red-50"
                                    fullWidth
                                    onClick={() => handleAction('changes_requested')}
                                    loading={actionLoading}
                                    disabled={post.status === 'changes_requested'}
                                >
                                    <i className="ph ph-warning-circle mr-2"></i> Em Alteração
                                </Button>
                            </div>
                            <Button
                                variant="success"
                                fullWidth
                                onClick={() => handleAction('approved')}
                                loading={actionLoading}
                                disabled={post.status === 'approved'}
                            >
                                <i className="ph ph-check-circle mr-2"></i> Aprovar Postagem
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetailModal;
