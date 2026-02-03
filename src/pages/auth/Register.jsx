import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES, USER_ROLES } from '../../utils/constants';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate
        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        const { data, error } = await signUp(
            formData.email,
            formData.password,
            formData.fullName,
            USER_ROLES.CLIENT
        );

        if (error) {
            setError(error.message || 'Erro ao criar conta');
            setLoading(false);
            return;
        }

        // Success
        if (data?.session) {
            // Se o Supabase retornar uma sessão, o login foi automático (Email Confirmation Disabled)
            // O redirecionamento baseia-se no role
            const userRole = data.user?.user_metadata?.role;
            if (userRole === USER_ROLES.ADMIN) {
                navigate(ROUTES.ADMIN_DASHBOARD);
            } else {
                navigate(ROUTES.CLIENT_DASHBOARD);
            }
        } else {
            // Se não retornar sessão, precisa confirmar email ou fazer login
            alert('Conta criada com sucesso! Se necessário, verifique seu email.');
            navigate(ROUTES.LOGIN);
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
                        <h1>Criar conta</h1>
                        <p>Preencha os dados para criar sua conta</p>
                    </div>

                    {error && (
                        <div className="auth-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <Input
                            type="text"
                            name="fullName"
                            label="Nome Completo"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Seu nome completo"
                            required
                            fullWidth
                        />

                        <Input
                            type="email"
                            name="email"
                            label="Email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="seu@email.com"
                            required
                            fullWidth
                        />

                        <Input
                            type="password"
                            name="password"
                            label="Senha"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            fullWidth
                        />

                        <Input
                            type="password"
                            name="confirmPassword"
                            label="Confirmar Senha"
                            value={formData.confirmPassword}
                            onChange={handleChange}
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
                            Criar Conta
                        </Button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Já tem uma conta?{' '}
                            <Link to={ROUTES.LOGIN} className="auth-link">
                                Entrar
                            </Link>
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Register;
