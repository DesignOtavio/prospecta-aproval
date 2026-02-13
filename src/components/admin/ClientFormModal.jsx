import { useState } from 'react';
import { createClient } from '../../services/clients.service';
import Input from '../common/Input';
import Button from '../common/Button';

const ClientFormModal = ({ onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company_name: '',
        password: '', // New field
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { name, email, company_name, password } = formData;
            const result = await createClient({ name, email, company_name }, password);
            if (result.error) throw result.error;

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao criar cliente: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input
                label="Nome do Responsável"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                fullWidth
            />
            <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                fullWidth
            />
            <Input
                label="Nome da Empresa"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                fullWidth
            />
            <Input
                label="Senha Inicial do Cliente"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                fullWidth
                placeholder="Mínimo 6 caracteres"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" variant="primary" loading={loading}>Criar Cliente</Button>
            </div>
        </form>
    );
};

export default ClientFormModal;
