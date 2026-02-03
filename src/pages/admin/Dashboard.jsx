import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAllPosts, fetchAllActivities } from '../../services/posts.service';
import { fetchClients, deleteClient } from '../../services/clients.service';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatRelativeTime } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import './AdminDashboard.css';

import Modal from '../../components/common/Modal';
import AdminPostCreate from '../../components/admin/AdminPostCreate';
import ClientFormModal from '../../components/admin/ClientFormModal';
import PostDetailModal from '../../components/posts/PostDetailModal';

const AdminDashboard = () => {
    const [posts, setPosts] = useState([]);
    const [clients, setClients] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const { data: postsData } = await fetchAllPosts();
        const { data: clientsData } = await fetchClients();
        const { data: activityData } = await fetchAllActivities();

        if (postsData) setPosts(postsData);
        if (clientsData) setClients(clientsData);
        if (activityData) setActivities(activityData);

        setLoading(false);
    };

    const handlePostCreated = () => {
        loadData();
    };

    const handleClientCreated = () => {
        loadData();
    };

    const handleDeleteClient = async (clientId) => {
        if (!window.confirm('Tem certeza que deseja remover este cliente? Todas as postagens vinculadas podem ser afetadas.')) return;

        setLoading(true);
        const { error } = await deleteClient(clientId);
        if (!error) {
            loadData();
        } else {
            alert('Erro ao excluir cliente: ' + error.message);
        }
        setLoading(false);
    };

    const stats = {
        totalPosts: posts.length,
        totalClients: clients.length,
        pendingPosts: posts.filter((p) => p.status === 'pending').length,
        approvedPosts: posts.filter((p) => p.status === 'approved').length,
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
                <div className="dashboard-header">
                    <div>
                        <h1>Admin Dashboard</h1>
                        <p className="text-gray">Gerencie clientes e postagens</p>
                    </div>
                    <div className="header-actions">
                        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                            + Nova Postagem
                        </Button>
                        <Button variant="secondary" onClick={() => setIsClientModalOpen(true)}>
                            + Novo Cliente
                        </Button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="stats-row">
                    <div className="stat-box">
                        <div className="stat-box-header">
                            <span className="stat-title">Total de Clientes</span>
                            <span className="stat-icon-bg icon-users"><i className="ph ph-users"></i></span>
                        </div>
                        <div className="stat-value">{stats.totalClients}</div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-box-header">
                            <span className="stat-title">Total de Postagens</span>
                            <span className="stat-icon-bg icon-file"><i className="ph ph-file-text"></i></span>
                        </div>
                        <div className="stat-value">{stats.totalPosts}</div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-box-header">
                            <span className="stat-title">Pendentes</span>
                            <span className="stat-icon-bg icon-clock"><i className="ph ph-clock"></i></span>
                        </div>
                        <div className="stat-value">{stats.pendingPosts}</div>
                    </div>

                    <div className="stat-box">
                        <div className="stat-box-header">
                            <span className="stat-title">Aprovadas</span>
                            <span className="stat-icon-bg icon-check"><i className="ph ph-check-circle"></i></span>
                        </div>
                        <div className="stat-value text-green">{stats.approvedPosts}</div>
                    </div>
                </div>

                {/* Recent Posts - Thumbnail View */}
                <div className="section-header mt-8 mb-4">
                    <h2 className="text-xl font-bold">Postagens Recentes</h2>
                    <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ADMIN_POSTS)}>
                        Ver todas →
                    </Button>
                </div>

                {posts.length === 0 ? (
                    <Card padding="md"><p className="text-gray-500">Nenhuma postagem recente.</p></Card>
                ) : (
                    <div className="posts-grid-compact">
                        {posts.slice(0, 8).map((post) => (
                            <div
                                key={post.id}
                                className="post-thumb-card"
                                onClick={() => setSelectedPost(post)}
                            >
                                <div className="thumb-preview">
                                    {post.media_urls && post.media_urls.length > 0 ? (
                                        post.media_urls[0].type === 'image' ? (
                                            <img src={post.media_urls[0].url} alt={post.title} className="thumb-img" />
                                        ) : (
                                            <div className="thumb-video-placeholder">🎬</div>
                                        )
                                    ) : (
                                        <div className="thumb-placeholder">Sem Mídia</div>
                                    )}
                                    <div className="thumb-status">
                                        {post.status === 'pending' && <span className="status-dot pending" title="Pendente"></span>}
                                        {post.status === 'approved' && <span className="status-dot approved" title="Aprovada"></span>}
                                        {post.status === 'changes_requested' && <span className="status-dot changes" title="Alteração"></span>}
                                    </div>
                                </div>
                                <div className="thumb-info">
                                    <h4 className="thumb-title" title={post.title}>{post.title}</h4>
                                    <p className="thumb-client">{post.prpsct_clients?.name || post.clients?.name || 'Cliente'}</p>
                                    <p className="thumb-date">{formatRelativeTime(post.created_at)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Recent Activities */}
                <Card padding="lg" className="mt-6 mb-6">
                    <div className="section-header">
                        <h2>Atividades Recentes</h2>
                    </div>
                    <div className="activity-list-dashboard">
                        {activities.length === 0 ? (
                            <p className="text-gray-500">Nenhuma atividade recente.</p>
                        ) : (
                            activities.map((activity) => (
                                <div key={activity.id} className="activity-item-compact">
                                    <div className="activity-avatar-mini">
                                        {activity.prpsct_profiles?.avatar_url ? (
                                            <img src={activity.prpsct_profiles.avatar_url} alt="" />
                                        ) : (
                                            <i className="ph ph-user"></i>
                                        )}
                                    </div>
                                    <div className="activity-content-mini">
                                        <p>
                                            <strong>{activity.prpsct_profiles?.full_name}</strong>
                                            {' '}{activity.action_type === 'comment_added' ? 'comentou em' : 'atualizou'}
                                            {' '}<strong>{activity.prpsct_posts?.title}</strong>
                                        </p>
                                        <span className="activity-time-mini">{formatRelativeTime(activity.created_at)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Recent Clients */}
                <Card padding="lg" className="mt-6">
                    <div className="section-header">
                        <h2>Clientes</h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.ADMIN_CLIENTS)}>
                            Ver todos →
                        </Button>
                    </div>

                    <div className="table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Criado em</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.slice(0, 5).map((client) => (
                                    <tr key={client.id}>
                                        <td>
                                            <div className="client-name-cell">
                                                <div className="client-avatar-mini">
                                                    {client.name.charAt(0)}
                                                </div>
                                                <strong>{client.name}</strong>
                                            </div>
                                        </td>
                                        <td>{client.email}</td>
                                        <td>
                                            <Badge
                                                variant={client.is_active ? 'success' : 'error'}
                                                label={client.is_active ? 'Ativo' : 'Inativo'}
                                            />
                                        </td>
                                        <td className="text-gray">{formatRelativeTime(client.created_at)}</td>
                                        <td>
                                            <div className="table-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button
                                                    className="action-icon-btn delete"
                                                    onClick={() => handleDeleteClient(client.id)}
                                                    title="Excluir cliente"
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                >
                                                    <i className="ph ph-trash icon" style={{ fontSize: '1.2rem' }}></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Criar Nova Postagem"
                size="md"
            >
                <AdminPostCreate
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={handlePostCreated}
                />
            </Modal>

            <Modal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                title="Novo Cliente"
                size="sm"
            >
                <ClientFormModal
                    onClose={() => setIsClientModalOpen(false)}
                    onSuccess={handleClientCreated}
                />
            </Modal>

            {/* Post Detail Modal */}
            <Modal
                isOpen={!!selectedPost}
                onClose={() => setSelectedPost(null)}
                title="Detalhes da Postagem"
                size="xl"
            >
                <PostDetailModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onUpdate={loadData}
                />
            </Modal>
        </Layout>
    );
};

export default AdminDashboard;
