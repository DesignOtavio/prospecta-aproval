import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    fetchPost,
    fetchComments,
    addComment,
    createApprovalAction,
} from '../../services/posts.service';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { formatRelativeTime, generateWhatsAppLink, generatePostUrl, copyToClipboard } from '../../utils/helpers';
import { APPROVAL_ACTIONS, ROUTES } from '../../utils/constants';
import './PostView.css';

const PostView = () => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadPost();
        loadComments();
    }, [id]);

    const loadPost = async () => {
        const { data } = await fetchPost(id);
        if (data) {
            setPost(data);
        }
        setLoading(false);
    };

    const loadComments = async () => {
        const { data } = await fetchComments(id);
        if (data) {
            setComments(data);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        const { data } = await addComment(id, user.id, newComment);

        if (data) {
            setComments([...comments, data]);
            setNewComment('');
        }

        setSubmitting(false);
    };

    const handleApproval = async (action, notes = '') => {
        if (!window.confirm(`Tem certeza que deseja ${action === APPROVAL_ACTIONS.APPROVED ? 'aprovar' : 'solicitar alterações'} nesta postagem?`)) {
            return;
        }

        setSubmitting(true);
        await createApprovalAction(id, user.id, action, notes);
        await loadPost();
        setSubmitting(false);
    };

    const handleShareWhatsApp = () => {
        const postUrl = generatePostUrl(id);
        const link = generateWhatsAppLink(post.title, postUrl);
        window.open(link, '_blank');
    };

    const handleCopyLink = async () => {
        const postUrl = generatePostUrl(id);
        const success = await copyToClipboard(postUrl);
        if (success) {
            alert('Link copiado para a área de transferência!');
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="container">
                    <div className="loading">Carregando...</div>
                </div>
            </Layout>
        );
    }

    if (!post) {
        return (
            <Layout>
                <div className="container">
                    <Card padding="lg">
                        <div className="empty-state">
                            <h3>Postagem não encontrada</h3>
                            <Button onClick={() => navigate(ROUTES.CLIENT_DASHBOARD)}>
                                Voltar ao Dashboard
                            </Button>
                        </div>
                    </Card>
                </div>
            </Layout>
        );
    }

    const canApprove = post.status === 'pending';

    return (
        <Layout>
            <div className="container">
                <Button variant="ghost" onClick={() => navigate(ROUTES.CLIENT_DASHBOARD)} className="mb-6">
                    ← Voltar ao Dashboard
                </Button>

                <div className="post-view">
                    <div className="post-view__main">
                        <Card padding="lg">
                            <div className="post-view__header">
                                <div>
                                    <h1>{post.title}</h1>
                                    <p className="post-view__date">{formatRelativeTime(post.created_at)}</p>
                                </div>
                                <Badge status={post.status} />
                            </div>

                            {/* Media Section */}
                            {post.media_urls && post.media_urls.length > 0 && (
                                <div className="post-view__media">
                                    {post.media_urls.map((media, index) => (
                                        <div key={index} className="media-item">
                                            {media.type === 'image' ? (
                                                <div className="media-wrapper">
                                                    <img src={media.url} alt={`Media ${index + 1}`} />
                                                </div>
                                            ) : (
                                                <video controls src={media.url} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Description */}
                            {post.description && (
                                <div className="post-view__section">
                                    <h3>Descrição</h3>
                                    <p>{post.description}</p>
                                </div>
                            )}

                            {/* Text Content */}
                            {post.text_content && (
                                <div className="post-view__section">
                                    <h3>Conteúdo de Texto</h3>
                                    <div className="post-view__text-content">
                                        {post.text_content}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {canApprove && (
                                <div className="post-view__actions">
                                    <Button
                                        variant="success"
                                        size="lg"
                                        onClick={() => handleApproval(APPROVAL_ACTIONS.APPROVED)}
                                        disabled={submitting}
                                    >
                                        <i className="ph ph-check"></i> Aprovar
                                    </Button>
                                    <Button
                                        variant="warning"
                                        size="lg"
                                        onClick={() => handleApproval(APPROVAL_ACTIONS.CHANGES_REQUESTED)}
                                        disabled={submitting}
                                    >
                                        <i className="ph ph-warning-circle"></i> Solicitar Alterações
                                    </Button>
                                </div>
                            )}

                            {/* Share buttons */}
                            <div className="post-view__share">
                                <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
                                    <i className="ph ph-whatsapp-logo"></i> Compartilhar
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                                    <i className="ph ph-link"></i> Copiar Link
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Comments Sidebar */}
                    <div className="post-view__sidebar">
                        <Card padding="lg">
                            <h3 className="mb-4">Comentários</h3>

                            <form onSubmit={handleAddComment} className="comment-form">
                                <Input
                                    type="textarea"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Adicione um comentário..."
                                    fullWidth
                                />
                                <Button
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    disabled={!newComment.trim() || submitting}
                                >
                                    Comentar
                                </Button>
                            </form>

                            <div className="comments-list">
                                {comments.length === 0 ? (
                                    <p className="text-gray text-center">Nenhum comentário ainda</p>
                                ) : (
                                    comments.map((comment) => (
                                        <div key={comment.id} className="comment-item">
                                            <div className="comment-header">
                                                <strong>{comment.profiles?.full_name || 'Usuário'}</strong>
                                                <span className="comment-date">{formatRelativeTime(comment.created_at)}</span>
                                            </div>
                                            <p className="comment-content">{comment.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default PostView;
