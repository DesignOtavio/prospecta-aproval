import { useState, useEffect } from 'react';
import { fetchOrderRequests } from '../../services/webhooks.service';
import './OrderRequestsTab.css';

const STATUS_LABELS = {
    pending: { label: 'Pendente', icon: 'ph-clock' },
    in_progress: { label: 'Em andamento', icon: 'ph-spinner' },
    done: { label: 'Concluído', icon: 'ph-check-circle' },
};

const OrderRequestsTab = ({ clientId, onNewRequest }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = async () => {
        if (!clientId) return;
        setLoading(true);
        const { data } = await fetchOrderRequests(clientId);
        if (data) setRequests(data);
        setLoading(false);
    };

    useEffect(() => {
        loadRequests();
    }, [clientId]);

    // Allow parent to trigger a refresh (e.g., after new request submitted)
    useEffect(() => {
        if (onNewRequest) {
            loadRequests();
        }
    }, [onNewRequest]);

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <i className="ph ph-spinner" style={{ fontSize: '1.5rem' }}></i>
                <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>Carregando solicitações...</p>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="order-requests-empty">
                <i className="ph ph-clipboard-text"></i>
                <p>Nenhuma solicitação encontrada.</p>
                <p style={{ marginTop: '4px', fontSize: '0.8rem', color: '#94a3b8' }}>
                    Clique em <strong>Solicitar Novo Pedido</strong> para começar.
                </p>
            </div>
        );
    }

    return (
        <div className="order-requests-tab">
            <div className="tab-header">
                <h3>
                    <i className="ph ph-clipboard-text" style={{ marginRight: '8px', color: '#2563eb' }}></i>
                    Minhas Solicitações
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{requests.length} registro(s)</span>
            </div>

            {requests.map((req) => {
                const st = STATUS_LABELS[req.status] || STATUS_LABELS.pending;
                return (
                    <div key={req.id} className="order-request-card">
                        <div className="card-top">
                            <span className="objetivo">{req.objetivo}</span>
                            <span className={`req-badge ${req.status}`}>
                                <i className={`ph ${st.icon}`}></i>
                                {st.label}
                            </span>
                        </div>

                        <div className="details-row">
                            <span className="detail-item">
                                <i className="ph ph-tag"></i>
                                <strong>Pedido:</strong>&nbsp;{req.pedido}
                            </span>
                            {req.data && (
                                <span className="detail-item">
                                    <i className="ph ph-calendar-blank"></i>
                                    {new Date(req.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                                </span>
                            )}
                            <span className="detail-item">
                                <i className="ph ph-clock"></i>
                                {new Date(req.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>

                        <div className="descricao">{req.descricao}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default OrderRequestsTab;
