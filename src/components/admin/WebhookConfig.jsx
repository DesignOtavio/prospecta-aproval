import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';

const WebhookConfig = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [configs, setConfigs] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        // Fetch clients
        const { data: clientsData } = await supabase.from('prpsct_clients').select('*');
        if (clientsData) {
            setClients(clientsData);
            // Initialize configs
            const initialConfigs = {};
            clientsData.forEach(c => {
                initialConfigs[c.id] = {
                    webhook_url: c.webhook_url || '',
                    webhook_secret: c.webhook_secret || ''
                };
            });
            setConfigs(initialConfigs);
        }
        setLoading(false);
    };

    const handleChange = (clientId, field, value) => {
        setConfigs(prev => ({
            ...prev,
            [clientId]: {
                ...prev[clientId],
                [field]: value
            }
        }));
    };

    const handleSave = async (clientId) => {
        setSaving(true);
        const config = configs[clientId];

        try {
            const { error } = await supabase
                .from('prpsct_clients')
                .update({
                    webhook_url: config.webhook_url,
                    webhook_secret: config.webhook_secret
                })
                .eq('id', clientId);

            if (error) throw error;
            alert('Configuração salva com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar configuração.');
        } finally {
            setSaving(false);
        }
    };

    const handleTestWebhook = async (clientId) => {
        const config = configs[clientId];
        if (!config.webhook_url) return alert('Configure uma URL primeiro.');

        alert(`Simulando envio de webhook para: ${config.webhook_url}\n\nPayload: { event: "ping", timestamp: "${new Date().toISOString()}" }`);
        // In a real scenario, this would call an Edge Function to fire the webhook
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div className="webhook-config">
            <h3>Configuração de Webhooks</h3>
            <p className="text-gray mb-6">Configure para onde os eventos de cada cliente devem ser enviados.</p>

            <div className="clients-list">
                {clients.map(client => (
                    <Card key={client.id} className="mb-4" padding="md">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold">{client.name}</h4>
                            <span className="text-xs text-gray">{client.id}</span>
                        </div>

                        <div className="grid gap-4">
                            <Input
                                label="Webhook URL"
                                placeholder="https://api.seusistema.com/webhook"
                                value={configs[client.id]?.webhook_url || ''}
                                onChange={(e) => handleChange(client.id, 'webhook_url', e.target.value)}
                                fullWidth
                            />
                            <Input
                                label="Webhook Secret (Assinatura HMAC)"
                                placeholder="chave-secreta-para-validacao"
                                value={configs[client.id]?.webhook_secret || ''}
                                onChange={(e) => handleChange(client.id, 'webhook_secret', e.target.value)}
                                fullWidth
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTestWebhook(client.id)}
                            >
                                Testar Envio
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSave(client.id)}
                                loading={saving}
                            >
                                Salvar Configuração
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default WebhookConfig;
