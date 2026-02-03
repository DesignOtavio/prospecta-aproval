import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import './Sidebar.css';

const Sidebar = () => {
    const { pathname } = useLocation();
    const { user, isAdmin, signOut } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate(ROUTES.LOGIN);
    };

    const isActive = (path) => pathname === path;

    return (
        <aside className="sidebar">
            <div className="sidebar__logo">
                <img src="/assets/logo_prospecta_1.png" alt="Prospecta" />
            </div>

            <nav className="sidebar__nav">
                <Link
                    to={isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.CLIENT_DASHBOARD}
                    className={`sidebar__link ${isActive(isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.CLIENT_DASHBOARD) ? 'active' : ''}`}
                >
                    <i className="ph ph-squares-four icon"></i>
                    Dashboard
                </Link>

                {isAdmin && (
                    <Link
                        to={ROUTES.ADMIN_POSTS || '#'}
                        className={`sidebar__link ${isActive(ROUTES.ADMIN_POSTS) ? 'active' : ''}`}
                        onClick={(e) => !ROUTES.ADMIN_POSTS && e.preventDefault()}
                    >
                        <i className="ph ph-file-text icon"></i>
                        Postagens
                    </Link>
                )}

                {/* Visual parity item if needed, but only for admin */}

                {isAdmin && (
                    <Link
                        to={ROUTES.ADMIN_SETTINGS}
                        className={`sidebar__link ${isActive(ROUTES.ADMIN_SETTINGS) ? 'active' : ''}`}
                    >
                        <i className="ph ph-gear icon"></i>
                        Configurações
                    </Link>
                )}
            </nav>

            <div className="sidebar__footer">
                <button onClick={handleSignOut} className="sidebar__logout">
                    <i className="ph ph-sign-out icon"></i>
                    Sair
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
