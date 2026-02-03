import { useState } from 'react';
import Layout from '../../components/layout/Layout';
import Card from '../../components/common/Card';
import WebhookConfig from '../../components/admin/WebhookConfig';
import ActivityLogs from '../../components/admin/ActivityLogs';
import './Settings.css';

const Settings = () => {
    const [activeTab, setActiveTab] = useState('webhooks');

    return (
        <Layout>
            <div className="container">
                <div className="settings-header mb-6">
                    <h1>Configurações</h1>
                    <p className="text-gray">Gerencie as integrações e monitore o sistema.</p>
                </div>

                <div className="settings-tabs mb-6 flex gap-4 border-b border-gray-200">
                    <button
                        className={`tab-btn px-4 py-2 ${activeTab === 'webhooks' ? 'active border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('webhooks')}
                    >
                        Webhooks
                    </button>
                    <button
                        className={`tab-btn px-4 py-2 ${activeTab === 'logs' ? 'active border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('logs')}
                    >
                        Logs de Atividade
                    </button>
                    <button
                        className={`tab-btn px-4 py-2 ${activeTab === 'general' ? 'active border-b-2 border-blue-600 text-blue-600 font-medium' : 'text-gray-500'}`}
                        onClick={() => setActiveTab('general')}
                    >
                        Geral
                    </button>
                </div>

                <div className="settings-content">
                    {activeTab === 'webhooks' && (
                        <Card padding="lg">
                            <WebhookConfig />
                        </Card>
                    )}

                    {activeTab === 'logs' && (
                        <Card padding="lg">
                            <ActivityLogs />
                        </Card>
                    )}

                    {activeTab === 'general' && (
                        <Card padding="lg">
                            <h3>Preferências Gerais</h3>
                            <p className="text-gray mt-2">Configurações globais do sistema (Em breve).</p>
                        </Card>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Settings;
