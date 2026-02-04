import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import './Header.css';

const Header = () => {
    const { user, profile, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await signOut();
        navigate(ROUTES.LOGIN);
    };

    return (
        <header className="header topbar">
            <div className="topbar__logo--mobile">
                <img src="/logo-prospecta.png" alt="Prospecta" />
            </div>
            <div className="topbar__search">
                <i className="ph ph-magnifying-glass icon search-icon"></i>
                <input type="text" placeholder="Buscar postagens..." className="search-input" />
            </div>

            <div className="topbar__actions">
                <button className="icon-btn notification-btn">
                    <i className="ph ph-bell icon"></i>
                    <span className="notification-dot"></span>
                </button>

                {user && (
                    <div className="topbar__profile">
                        <div className="profile-info">
                            <span className="profile-name">{profile?.full_name}</span>
                            <span className="profile-role">{isAdmin ? 'Admin' : 'Cliente'}</span>
                        </div>
                        <div className="profile-avatar">
                            {profile?.full_name?.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
