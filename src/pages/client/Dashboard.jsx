import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchClientPosts } from '../../services/posts.service';
import { fetchClientByUserId } from '../../services/clients.service';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { formatRelativeTime, truncateText } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import './ClientDashboard.css';

import Modal from '../../components/common/Modal';
import PostDetailModal from '../../components/posts/PostDetailModal';

const ClientDashboard = () => {
    const [posts, setPosts] = useState([]);
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    // New state for modal
    const [selectedPost, setSelectedPost] = useState(null);

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        const { data: clientData } = await fetchClientByUserId(user.id);
        if (clientData) {
            setClient(clientData);
            const { data: postsData } = await fetchClientPosts(clientData.id);
            if (postsData) {
                setPosts(postsData);
            }
        }
        setLoading(false);
    };

    // Handle post update from modal
    const handlePostUpdate = () => {
        loadData();
    };

    const filteredPosts = posts.filter((post) => {
        if (filter === 'all') return true;
        return post.status === filter;
    });

    const stats = {
        total: posts.length,
        pending: posts.filter((p) => p.status === 'pending').length,
        approved: posts.filter((p) => p.status === 'approved').length,
        changes_requested: posts.filter((p) => p.status === 'changes_requested').length,
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

    return (
        <Layout>
            <div className="container">
                <div className="dashboard-intro">
                    <h1 className="welcome-title">
                        Olá, {client?.name || user?.email?.split('@')[0]} 👋
                    </h1>
                    <p className="subtitle">Confira suas postagens pendentes de aprovação</p>
                </div>

                {/* Stats Cards Row */}
                <div className="stats-row">
                    <div className="stat-box">
                        <div className="stat-box-header">
                            <span className="stat-title">Total de Postagens</span>
                            <span className="stat-icon-bg icon-file"><i className="ph ph-file-text"></i></span>
                        </div>
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-footer">Este mês</div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-box-header">
                            <span className="stat-title">Pendentes</span>
                            <span className="stat-icon-bg icon-clock"><i className="ph ph-clock"></i></span>
                        </div>
                        <div className="stat-value">{stats.pending}</div>
                        <div className="stat-footer">Aguardando aprovação</div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-box-header">
                            <span className="stat-title">Aprovadas</span>
                            <span className="stat-icon-bg icon-check"><i className="ph ph-check-circle"></i></span>
                        </div>
                        <div className="stat-value text-green">
                            {stats.approved} <span className="stat-diff">+12%</span>
                        </div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-box-header">
                            <span className="stat-title">Em Alteração</span>
                            <span className="stat-icon-bg icon-alert"><i className="ph ph-warning-circle"></i></span>
                        </div>
                        <div className="stat-value">{stats.changes_requested}</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs-container">
                    <button
                        className={`tab-btn ${filter === 'pending' ? 'active' : ''}`}
                        onClick={() => setFilter('pending')}
                    >
                        <i className="ph ph-clock mr-2"></i> Pendentes ({stats.pending})
                    </button>
                    <button
                        className={`tab-btn ${filter === 'approved' ? 'active' : ''}`}
                        onClick={() => setFilter('approved')}
                    >
                        <i className="ph ph-check-circle mr-2"></i> Aprovadas ({stats.approved})
                    </button>
                    <button
                        className={`tab-btn ${filter === 'changes_requested' ? 'active' : ''}`}
                        onClick={() => setFilter('changes_requested')}
                    >
                        <i className="ph ph-warning-circle mr-2"></i> Alteração ({stats.changes_requested})
                    </button>
                    <button
                        className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        <i className="ph ph-list-bullets mr-2"></i> Todas
                    </button>
                </div>

                {/* Posts Grid - New Style */}
                <div className="posts-grid-modern">
                    {filteredPosts.length === 0 ? (
                        <div className="empty-state-modern">
                            <p>Nenhuma postagem encontrada nesta categoria.</p>
                        </div>
                    ) : (
                        filteredPosts.map((post) => (
                            <div key={post.id} className="post-card-modern">
                                <div className="card-media-preview">
                                    <div className="status-badge-modern">
                                        {post.status === 'pending' && <><i className="ph ph-clock"></i> Pendente</>}
                                        {post.status === 'approved' && <><i className="ph ph-check-circle"></i> Aprovada</>}
                                        {post.status === 'changes_requested' && <><i className="ph ph-warning-circle"></i> Em Alteração</>}
                                    </div>

                                    {post.media_urls && post.media_urls.length > 0 ? (
                                        post.media_urls[0].type === 'image' ? (
                                            <img src={post.media_urls[0].url} alt={post.title} className="media-img" />
                                        ) : (
                                            <div className="media-video-placeholder">
                                                <span>🎬 Vídeo</span>
                                            </div>
                                        )
                                    ) : (
                                        <div className="media-placeholder">Sem Mídia</div>
                                    )}

                                    <div className="media-type-badge">
                                        {post.media_urls?.[0]?.type === 'image' ? <><i className="ph ph-image"></i> Imagem</> : <><i className="ph ph-video-camera"></i> Vídeo</>}
                                    </div>
                                </div>

                                <div className="card-content">
                                    <h3 className="card-title">{post.title}</h3>
                                    <p className="card-desc">
                                        {post.text_content ? truncateText(post.text_content, 100) : post.description}
                                    </p>

                                    <div className="card-meta">
                                        <div className="meta-item">
                                            <span><i className="ph ph-user"></i> {client?.name}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span><i className="ph ph-calendar-blank"></i> {new Date(post.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="meta-item">
                                            <span><i className="ph ph-chat-text"></i> {post.comments_count || 0}</span>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        <button
                                            className="action-btn btn-approve"
                                            onClick={() => setSelectedPost(post)}
                                        >
                                            <i className="ph ph-check"></i> Aprovar
                                        </button>
                                        <button
                                            className="action-btn btn-changes"
                                            onClick={() => setSelectedPost(post)}
                                        >
                                            <i className="ph ph-pencil-simple-line"></i> Alteração
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Post Detail Modal - ClickUp Style */}
            <Modal
                isOpen={!!selectedPost}
                onClose={() => setSelectedPost(null)}
                title={selectedPost?.title || 'Detalhes da Postagem'}
                size="xl"
                className="post-detail-modal-wrapper"
            >
                <PostDetailModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onUpdate={handlePostUpdate}
                />
            </Modal>
        </Layout>
    );
};

export default ClientDashboard;
