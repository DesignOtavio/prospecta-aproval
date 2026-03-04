import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchClientByUserId, fetchClient } from '../../services/clients.service';
import { fetchClientPosts } from '../../services/posts.service';
import Layout from '../../components/layout/Layout';
import { truncateText } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';
import './ClientDashboard.css';

import Modal from '../../components/common/Modal';
import PostDetailModal from '../../components/posts/PostDetailModal';
import OrderRequestModal from '../../components/client/OrderRequestModal';
import OrderRequestsTab from '../../components/client/OrderRequestsTab';

const ClientDashboard = () => {
    const [client, setClient] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedPost, setSelectedPost] = useState(null);
    const [isOrderRequestOpen, setIsOrderRequestOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewTab, setViewTab] = useState('posts');
    const [requestRefreshKey, setRequestRefreshKey] = useState(0);

    const { user, loading: authLoading } = useAuth();

    const loadData = useCallback(async () => {
        if (!user) return;
        let clientData = null;
        if (user.auth_type === 'table') {
            const { data } = await fetchClient(user.id);
            clientData = data;
        } else {
            const { data } = await fetchClientByUserId(user.id);
            clientData = data;
        }
        if (clientData) {
            setClient(clientData);
            const { data: postsData } = await fetchClientPosts(clientData.id);
            if (postsData) setPosts(postsData);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (!authLoading) loadData();
    }, [authLoading, loadData]);

    const handlePostUpdate = () => loadData();

    const filteredPosts = posts.filter((post) => {
        const matchesStatus = filter === 'all' || post.status === filter;
        const matchesSearch =
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.text_content?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
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

                {/* Header */}
                <div className="dashboard-intro" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 className="welcome-title">
                            Olá, {client?.name || user?.email?.split('@')[0]} 👋
                        </h1>
                        <p className="subtitle">Confira suas postagens e solicitações</p>
                    </div>
                    <button
                        onClick={() => setIsOrderRequestOpen(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', background: '#2563eb', color: '#fff',
                            border: 'none', borderRadius: '10px', fontWeight: '600',
                            fontSize: '0.9rem', cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(37,99,235,0.18)',
                            transition: 'background 0.15s', whiteSpace: 'nowrap',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#1d4ed8'}
                        onMouseOut={e => e.currentTarget.style.background = '#2563eb'}
                    >
                        <i className="ph ph-plus-circle" style={{ fontSize: '1.1rem' }}></i>
                        Solicitar Novo Pedido
                    </button>
                </div>

                {/* Stats */}
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

                {/* Main view switcher tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0' }}>
                    {[
                        { key: 'posts', label: 'Postagens', icon: 'ph-images' },
                        { key: 'requests', label: 'Minhas Solicitações', icon: 'ph-clipboard-text' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setViewTab(tab.key)}
                            style={{
                                padding: '10px 20px', fontWeight: '600', fontSize: '0.875rem',
                                background: 'none', border: 'none', cursor: 'pointer',
                                borderBottom: viewTab === tab.key ? '2px solid #2563eb' : '2px solid transparent',
                                color: viewTab === tab.key ? '#2563eb' : '#64748b',
                                marginBottom: '-2px', display: 'flex', alignItems: 'center',
                                gap: '6px', transition: 'all 0.15s',
                            }}
                        >
                            <i className={`ph ${tab.icon}`}></i> {tab.label}
                        </button>
                    ))}
                </div>

                {/* — POSTS VIEW — */}
                {viewTab === 'posts' && (
                    <>
                        {/* Post filter tabs */}
                        <div className="tabs-container">
                            <button className={`tab-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
                                <i className="ph ph-clock mr-2"></i> Pendentes ({stats.pending})
                            </button>
                            <button className={`tab-btn ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>
                                <i className="ph ph-check-circle mr-2"></i> Aprovadas ({stats.approved})
                            </button>
                            <button className={`tab-btn ${filter === 'changes_requested' ? 'active' : ''}`} onClick={() => setFilter('changes_requested')}>
                                <i className="ph ph-warning-circle mr-2"></i> Alteração ({stats.changes_requested})
                            </button>
                            <button className={`tab-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                                <i className="ph ph-list-bullets mr-2"></i> Todas
                            </button>
                            <div className="tab-search" style={{ marginLeft: 'auto' }}>
                                <div className="search-box">
                                    <i className="ph ph-magnifying-glass"></i>
                                    <input
                                        type="text"
                                        placeholder="Buscar postagem..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        style={{
                                            paddingLeft: '2.5rem', paddingRight: '1rem',
                                            paddingTop: '0.5rem', paddingBottom: '0.5rem',
                                            borderRadius: '8px', border: '1px solid #e2e8f0',
                                            fontSize: '0.875rem',
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Posts grid */}
                        <div className="posts-sections">

                            {/* Media Posts */}
                            <div className="posts-section mb-12" style={{ marginBottom: '40px' }}>
                                <div className="section-header mb-6" style={{ marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
                                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#1a365d' }}>
                                        <i className="ph ph-image-square" style={{ color: '#2563eb' }}></i>
                                        Postagens com Mídia
                                    </h2>
                                    <p style={{ fontSize: '0.875rem', color: '#718096' }}>Artes e vídeos para aprovação visual</p>
                                </div>
                                <div className="posts-grid-modern">
                                    {filteredPosts.filter(p => p.media_urls && p.media_urls.length > 0).length === 0 ? (
                                        <div style={{ padding: '20px', color: '#a0aec0', textAlign: 'center' }}>
                                            Nenhuma postagem com mídia nesta categoria.
                                        </div>
                                    ) : (
                                        filteredPosts
                                            .filter(p => p.media_urls && p.media_urls.length > 0)
                                            .map((post) => (
                                                <div key={post.id} className="post-card-modern">
                                                    <div className="card-media-preview">
                                                        <div className="status-badge-modern">
                                                            {post.status === 'pending' && <><i className="ph ph-clock"></i> Pendente</>}
                                                            {post.status === 'approved' && <><i className="ph ph-check-circle"></i> Aprovada</>}
                                                            {post.status === 'changes_requested' && <><i className="ph ph-warning-circle"></i> Em Alteração</>}
                                                        </div>
                                                        {post.media_urls[0].type === 'image' ? (
                                                            <img src={post.media_urls[0].url} alt={post.title} className="media-img" />
                                                        ) : (
                                                            <div className="media-video-placeholder"><span>🎬 Vídeo</span></div>
                                                        )}
                                                        <div className="media-type-badge">
                                                            {post.media_urls[0].type === 'image' ? <><i className="ph ph-image"></i> Imagem</> : <><i className="ph ph-video-camera"></i> Vídeo</>}
                                                        </div>
                                                    </div>
                                                    <div className="card-content">
                                                        <h3 className="card-title">{post.title}</h3>
                                                        <p className="card-desc">{post.text_content ? truncateText(post.text_content, 100) : post.description}</p>
                                                        <div className="card-meta">
                                                            <div className="meta-item"><span><i className="ph ph-user"></i> {client?.name}</span></div>
                                                            <div className="meta-item"><span><i className="ph ph-calendar-blank"></i> {new Date(post.created_at).toLocaleDateString()}</span></div>
                                                            <div className="meta-item"><span><i className="ph ph-chat-text"></i> {post.comments_count || 0}</span></div>
                                                        </div>
                                                        <div className="card-actions">
                                                            <button className="action-btn btn-approve" onClick={() => setSelectedPost(post)}>
                                                                <i className="ph ph-check"></i> Aprovar
                                                            </button>
                                                            <button className="action-btn btn-changes" onClick={() => setSelectedPost(post)}>
                                                                <i className="ph ph-pencil-simple-line"></i> Alteração
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </div>

                            {/* Text-only Posts */}
                            {filteredPosts.filter(p => !p.media_urls || p.media_urls.length === 0).length > 0 && (
                                <div className="posts-section">
                                    <div className="section-header mb-6" style={{ marginBottom: '20px', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: '#1a365d' }}>
                                            <i className="ph ph-text-aa" style={{ color: '#2563eb' }}></i>
                                            Aprovações de Texto
                                        </h2>
                                        <p style={{ fontSize: '0.875rem', color: '#718096' }}>Legendas e copies aguardando revisão</p>
                                    </div>
                                    <div className="posts-grid-modern">
                                        {filteredPosts
                                            .filter(p => !p.media_urls || p.media_urls.length === 0)
                                            .map((post) => (
                                                <div key={post.id} className="post-card-modern">
                                                    <div className="card-media-preview text-only" style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
                                                        <div className="status-badge-modern">
                                                            {post.status === 'pending' && <><i className="ph ph-clock"></i> Pendente</>}
                                                            {post.status === 'approved' && <><i className="ph ph-check-circle"></i> Aprovada</>}
                                                            {post.status === 'changes_requested' && <><i className="ph ph-warning-circle"></i> Em Alteração</>}
                                                        </div>
                                                        <div className="media-placeholder-text">
                                                            <i className="ph ph-article" style={{ fontSize: '3rem', color: '#cbd5e0' }}></i>
                                                        </div>
                                                    </div>
                                                    <div className="card-content">
                                                        <h3 className="card-title">{post.title}</h3>
                                                        <p className="card-desc" style={{ fontSize: '0.875rem', color: '#4a5568', margin: '12px 0' }}>
                                                            {post.text_content ? truncateText(post.text_content, 120) : post.description}
                                                        </p>
                                                        <div className="card-meta" style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#718096' }}>
                                                            <div className="meta-item">
                                                                <span><i className="ph ph-calendar-blank"></i> {new Date(post.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="card-actions" style={{ marginTop: '16px' }}>
                                                            <button
                                                                className="action-btn btn-approve"
                                                                onClick={() => setSelectedPost(post)}
                                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#2563eb', color: 'white', border: 'none', cursor: 'pointer' }}
                                                            >
                                                                <i className="ph ph-eye"></i> Visualizar & Aprovar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {filteredPosts.length === 0 && (
                                <div className="empty-state-modern" style={{ textAlign: 'center', padding: '60px 20px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0' }}>
                                    <i className="ph ph-folders" style={{ fontSize: '3rem', color: '#cbd5e0', marginBottom: '16px' }}></i>
                                    <p style={{ color: '#64748b', fontWeight: '500' }}>Nenhuma postagem encontrada nesta categoria.</p>
                                </div>
                            )}

                            {/* Post Detail Modal */}
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
                        </div>
                    </>
                )}

                {/* — REQUESTS VIEW — */}
                {viewTab === 'requests' && (
                    <OrderRequestsTab
                        clientId={client?.id}
                        onNewRequest={requestRefreshKey}
                    />
                )}

                {/* Order Request Modal (always mounted) */}
                <OrderRequestModal
                    isOpen={isOrderRequestOpen}
                    onClose={() => setIsOrderRequestOpen(false)}
                    onSuccess={() => {
                        setIsOrderRequestOpen(false);
                        setRequestRefreshKey(k => k + 1);
                        setViewTab('requests');
                    }}
                    clientId={client?.id}
                />

            </div>
        </Layout>
    );
};

export default ClientDashboard;
