import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import './BottomNav.css';

const BottomNav = () => {
    const { isAdmin, signOut } = useAuth();

    return (
        <nav className="bottom-nav">
            <NavLink
                to={isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.CLIENT_DASHBOARD}
                className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}
            >
                <i className="ph ph-squares-four icon"></i>
                <span>Início</span>
            </NavLink>

            {isAdmin && (
                <NavLink
                    to={ROUTES.ADMIN_POSTS}
                    className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}
                >
                    <i className="ph ph-file-text icon"></i>
                    <span>Posts</span>
                </NavLink>
            )}

            {!isAdmin && (
                <NavLink
                    to={ROUTES.CLIENT_REPORTS}
                    className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}
                >
                    <i className="ph ph-chart-bar icon"></i>
                    <span>Relatórios</span>
                </NavLink>
            )}

            <NavLink
                to={isAdmin ? ROUTES.ADMIN_SETTINGS : "/profile"}
                className={({ isActive }) => `bottom-nav__item ${isActive ? 'active' : ''}`}
            >
                <i className="ph ph-gear icon"></i>
                <span>Ajustes</span>
            </NavLink>

            <button onClick={signOut} className="bottom-nav__item logout">
                <i className="ph ph-sign-out icon"></i>
                <span>Sair</span>
            </button>
        </nav>
    );
};

export default BottomNav;
