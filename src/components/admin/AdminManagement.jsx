import { useState, useEffect } from 'react';
import { fetchProfilesByRole, createAdminWithAuth, deleteProfile } from '../../services/profiles.service';
import { USER_ROLES } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import Input from '../common/Input';
import Badge from '../common/Badge';

const AdminManagement = () => {
    const { user: currentUser } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
    });
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        loadAdmins();
    }, []);

    const loadAdmins = async () => {
        setLoading(true);
        const { data } = await fetchProfilesByRole(USER_ROLES.ADMIN);
        if (data) setAdmins(data);
        setLoading(false);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setFormError('');

        if (formData.password.length < 6) {
            setFormError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (!window.confirm('Atenção: Criar um novo usuário pode te desconectar da sessão atual dependendo das configurações do Supabase. Deseja continuar?')) {
            return;
        }

        setFormLoading(true);
        const { error } = await createAdminWithAuth(formData.email, formData.password, formData.fullName);

        if (!error) {
            alert('Admin criado com sucesso! Se você foi desconectado, faça login novamente.');
            setIsAdding(false);
            setFormData({ fullName: '', email: '', password: '' });
            loadAdmins();
        } else {
            setFormError(error.message || 'Erro ao criar admin');
        }
        setFormLoading(false);
    };

    const handleDelete = async (id, fullName) => {
        if (id === currentUser.id) {
            alert('Você não pode excluir seu próprio perfil.');
            return;
        }

        if (!window.confirm(`Tem certeza que deseja remover o acesso administrativo de ${fullName}?`)) return;

        const { error } = await deleteProfile(id);
        if (!error) {
            loadAdmins();
        } else {
            alert('Erro ao remover perfil: ' + error.message);
        }
    };

    return (
        <div className="admin-management">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Administradores do Sistema</h3>
                <Button
                    variant={isAdding ? 'outline' : 'primary'}
                    size="sm"
                    onClick={() => setIsAdding(!isAdding)}
                >
                    {isAdding ? 'Cancelar' : '+ Novo Admin'}
                </Button>
            </div>

            {isAdding && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
                    <h4 className="font-bold mb-3">Cadastrar Novo Administrador</h4>
                    {formError && <div className="text-error text-sm mb-3">{formError}</div>}
                    <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                            label="Nome Completo"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                            fullWidth
                        />
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            fullWidth
                        />
                        <Input
                            label="Senha Inicial"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            fullWidth
                        />
                        <div className="md:col-span-3 flex justify-end">
                            <Button type="submit" loading={formLoading}>Salvar Admin</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table className="admin-table w-full">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="p-3">Nome</th>
                            <th className="p-3">Email</th>
                            <th className="p-3">Criado em</th>
                            <th className="p-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" className="p-4 text-center">Carregando...</td></tr>
                        ) : admins.length === 0 ? (
                            <tr><td colSpan="4" className="p-4 text-center">Nenhum admin encontrado.</td></tr>
                        ) : (
                            admins.map((admin) => (
                                <tr key={admin.id} className="border-t border-gray-100">
                                    <td className="p-3 font-medium">
                                        {admin.full_name}
                                        {admin.id === currentUser.id && <span className="text-xs text-gray-400 ml-2">(Você)</span>}
                                    </td>
                                    <td className="p-3 text-gray-600">{admin.email || '-'}</td>
                                    <td className="p-3 text-sm text-gray-500">{new Date(admin.created_at).toLocaleDateString()}</td>
                                    <td className="p-3 text-right">
                                        <button
                                            className="text-error hover:text-red-700 disabled:opacity-30"
                                            onClick={() => handleDelete(admin.id, admin.full_name)}
                                            disabled={admin.id === currentUser.id}
                                            title="Remover admin"
                                        >
                                            <i className="ph ph-trash text-lg"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminManagement;
