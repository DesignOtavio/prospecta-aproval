import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';

const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, profile, loading, isAdmin } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    if (adminOnly && !isAdmin) {
        return <Navigate to={ROUTES.CLIENT_DASHBOARD} replace />;
    }

    return children;
};

export default ProtectedRoute;
