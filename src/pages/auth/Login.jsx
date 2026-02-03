import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signIn, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { data, error } = await signIn(email, password);

        if (error) {
            setError('Email ou senha inválidos');
            setLoading(false);
            return;
        }

        // Redirect based on role
        if (isAdmin) {
            navigate(ROUTES.ADMIN_DASHBOARD);
        } else {
            navigate(ROUTES.CLIENT_DASHBOARD);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-logo">
                    <img src="/logo-prospecta.png" alt="Prospecta Digitals" />
                </div>

                <Card padding="lg" className="auth-card">
                    <div className="auth-header">
                        <h1>Bem-vindo de volta</h1>
                        <p>Entre com suas credenciais para acessar a plataforma</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <Input
                            type="email"
                            name="email"
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            fullWidth
                        />

                        <Input
                            type="password"
                            name="password"
                            label="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            fullWidth
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={loading}
                        >
                            Entrar
                        </Button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Não tem uma conta?{' '}
                            <Link to={ROUTES.REGISTER} className="auth-link">
                                Cadastre-se
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Login;
