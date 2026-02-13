import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchClientByUserId, fetchClient } from '../../services/clients.service';
import Layout from '../../components/layout/Layout';
import ClientReportViewer from '../../components/client/ClientReportViewer';
import './ClientDashboard.css'; // Usando o mesmo CSS por enquanto para manter consistência

const Reports = () => {
    const { user, loading: authLoading } = useAuth();
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!user) return;

        let clientData = null;

        if (user.auth_type === 'table') {
            const { data } = await fetchClient(user.id);
            clientData = data;
        } else {
            const { data } = await fetchClientByUserId(user.id);
            clientData = data;
        }

        if (clientData) {
            setClient(clientData);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (!authLoading) {
            loadData();
        }
    }, [authLoading, loadData]);

    if (loading) {
        return (
            <Layout>
                <div className="container">
                    <div className="loading">Carregando...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container">
                <div className="dashboard-intro">
                    <h1 className="welcome-title">
                        Relatórios
                    </h1>
                    <p className="subtitle">Visualize seus dashboards e métricas</p>
                </div>

                <ClientReportViewer clientId={client?.id} />
            </div>
        </Layout>
    );
};

export default Reports;
