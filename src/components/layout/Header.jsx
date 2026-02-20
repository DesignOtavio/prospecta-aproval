import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import { fetchAllPosts, fetchClientPosts, fetchAllActivities } from '../../services/posts.service';
import { formatRelativeTime } from '../../utils/helpers';
import Modal from '../common/Modal';
import PostDetailModal from '../posts/PostDetailModal';
import './Header.css';

const Header = () => {
    const { user, profile, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [posts, setPosts] = useState([]);
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [loading, setLoading] = useState(false);

    const searchRef = useRef(null);
    const notifRef = useRef(null);

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;

            // Load posts for search
            const { data: postsData } = isAdmin ? await fetchAllPosts() : await fetchClientPosts(user.id);
            if (postsData) setPosts(postsData);

            // Load notifications (recent activities)
            const { data: activities } = await fetchAllActivities(10);
            if (activities) setNotifications(activities);
        };

        loadData();
    }, [user, isAdmin]);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredPosts([]);
            return;
        }

        const filtered = posts.filter(post =>
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.description?.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5);

        setFilteredPosts(filtered);
    }, [searchTerm, posts]);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSearch(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate(ROUTES.LOGIN);
    };

    const handleSelectPost = (post) => {
        setSelectedPost(post);
        setShowSearch(false);
        setSearchTerm('');
    };

    return (
        <>
            <header className="header topbar">
                <div className="topbar__logo--mobile">
                    <img src="/logo-prospecta.png" alt="Prospecta" />
                </div>

                <div className="topbar__search" ref={searchRef}>
                    <i className="ph ph-magnifying-glass icon search-icon"></i>
                    <input
                        type="text"
                        placeholder="Buscar postagens..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowSearch(true);
                        }}
                        onFocus={() => setShowSearch(true)}
                    />

                    {showSearch && searchTerm.trim() && (
                        <div className="header-dropdown">
                            <div className="dropdown-header">
                                <h3>Resultados da Busca</h3>
                            </div>
                            {filteredPosts.length === 0 ? (
                                <div className="dropdown-empty">Nenhuma postagem encontrada</div>
                            ) : (
                                filteredPosts.map(post => (
                                    <div
                                        key={post.id}
                                        className="search-result-item"
                                        onClick={() => handleSelectPost(post)}
                                    >
                                        <div className="result-thumb">
                                            {post.media_urls?.[0]?.url ? (
                                                <img src={post.media_urls[0].url} alt="" />
                                            ) : (
                                                <i className="ph ph-article"></i>
                                            )}
                                        </div>
                                        <div className="result-info">
                                            <div className="result-title">{post.title}</div>
                                            <div className="result-meta">
                                                {post.prpsct_clients?.name || 'Cliente'} • {formatRelativeTime(post.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="topbar__actions">
                    <div className="notification-wrapper" ref={notifRef} style={{ position: 'relative' }}>
                        <button
                            className="icon-btn notification-btn"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <i className="ph ph-bell icon"></i>
                            {notifications.length > 0 && <span className="notification-dot"></span>}
                        </button>

                        {showNotifications && (
                            <div className="header-dropdown">
                                <div className="dropdown-header">
                                    <h3>Notificações</h3>
                                </div>
                                {notifications.length === 0 ? (
                                    <div className="dropdown-empty">Sem notificações recentes</div>
                                ) : (
                                    notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            className="notification-item"
                                            onClick={() => {
                                                if (notif.post_id) {
                                                    const post = posts.find(p => p.id === notif.post_id);
                                                    if (post) {
                                                        handleSelectPost(post);
                                                    }
                                                    setShowNotifications(false);
                                                }
                                            }}
                                        >
                                            <div className="notif-icon">
                                                <i className="ph ph-lightning"></i>
                                            </div>
                                            <div className="notif-content">
                                                <div className="notif-text">
                                                    <strong>{notif.prpsct_profiles?.full_name}</strong>
                                                    {notif.action_type === 'post_created' ? ' criou uma nova postagem' :
                                                        notif.action_type === 'comment_added' ? ' adicionou um comentário' :
                                                            ' alterou o status da postagem'}
                                                    {notif.prpsct_posts?.title && <span> em <strong>{notif.prpsct_posts.title}</strong></span>}
                                                </div>
                                                <div className="notif-time">{formatRelativeTime(notif.created_at)}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    {user && (
                        <div className="topbar__profile" onClick={handleSignOut} style={{ cursor: 'pointer' }}>
                            <div className="profile-info">
                                <span className="profile-name">{profile?.full_name}</span>
                                <span className="profile-role">{isAdmin ? 'Admin' : 'Cliente'}</span>
                            </div>
                            <div className="profile-avatar">
                                {profile?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {selectedPost && (
                <Modal
                    isOpen={!!selectedPost}
                    onClose={() => setSelectedPost(null)}
                    title={selectedPost.title}
                    size="xl"
                    className="post-detail-modal-wrapper"
                >
                    <PostDetailModal
                        post={selectedPost}
                        onClose={() => setSelectedPost(null)}
                        onUpdate={() => {
                            // Refresh logic if needed
                        }}
                    />
                </Modal>
            )}
        </>
    );
};

export default Header;
