import { useState } from 'react';
import Modal from '../common/Modal';
import { sendOrderRequest } from '../../services/webhooks.service';
import './OrderRequestModal.css';

const OrderRequestModal = ({ isOpen, onClose, onSuccess, clientId }) => {
    const [form, setForm] = useState({
        objetivo: '',
        pedido: '',
        data: '',
        descricao: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!form.objetivo.trim() || !form.pedido.trim() || !form.descricao.trim()) {
            setError('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        setLoading(true);
        const { success: ok, error: err } = await sendOrderRequest(clientId, form);
        setLoading(false);

        if (!ok) {
            setError(err?.message || 'Erro ao enviar solicitação. Tente novamente.');
        } else {
            setSuccess(true);
            setForm({ objetivo: '', pedido: '', data: '', descricao: '' });
        }
    };

    const handleClose = () => {
        setSuccess(false);
        setError(null);
        setForm({ objetivo: '', pedido: '', data: '', descricao: '' });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Solicitar Novo Pedido"
            size="md"
        >
            {success ? (
                <div className="order-request-form">
                    <div className="form-success">
                        <i className="ph ph-check-circle" style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}></i>
                        <strong>Solicitação enviada com sucesso!</strong>
                        <p style={{ marginTop: '4px', fontSize: '0.85rem' }}>Nossa equipe receberá seu pedido em breve.</p>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn-submit" onClick={handleClose}>
                            Fechar
                        </button>
                    </div>
                </div>
            ) : (
                <form className="order-request-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="form-error">
                            <i className="ph ph-warning-circle"></i> {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="req-objetivo">
                            Objetivo <span className="optional-tag">*</span>
                        </label>
                        <input
                            id="req-objetivo"
                            type="text"
                            name="objetivo"
                            placeholder="Ex: Campanha de Verão"
                            value={form.objetivo}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="req-pedido">
                            Pedido <span className="optional-tag">*</span>
                        </label>
                        <input
                            id="req-pedido"
                            type="text"
                            name="pedido"
                            placeholder="Ex: 3 artes para Instagram"
                            value={form.pedido}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="req-data">
                            Data desejada <span className="optional-tag">(opcional)</span>
                        </label>
                        <input
                            id="req-data"
                            type="date"
                            name="data"
                            value={form.data}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="req-descricao">
                            Descrição <span className="optional-tag">*</span>
                        </label>
                        <textarea
                            id="req-descricao"
                            name="descricao"
                            placeholder="Descreva os detalhes do seu pedido, referências, cores, etc."
                            value={form.descricao}
                            onChange={handleChange}
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={handleClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <i className="ph ph-spinner" style={{ animation: 'spin 1s linear infinite' }}></i>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <i className="ph ph-paper-plane-tilt"></i>
                                    Enviar Solicitação
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
};

export default OrderRequestModal;
