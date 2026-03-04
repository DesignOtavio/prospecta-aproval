import { supabase, TABLES } from './supabase';

/**
 * Save an order request to DB and fire the client's webhook
 */
export const sendOrderRequest = async (clientId, orderData) => {
    try {
        // 1. Persist to Supabase
        const { data: saved, error: dbError } = await supabase
            .from(TABLES.ORDER_REQUESTS)
            .insert([{
                client_id: clientId,
                objetivo: orderData.objetivo,
                pedido: orderData.pedido,
                data: orderData.data || null,
                descricao: orderData.descricao,
                status: 'pending',
            }])
            .select()
            .single();

        if (dbError) throw dbError;

        // 2. Fetch client webhook config
        const { data: client, error: clientError } = await supabase
            .from('prpsct_clients')
            .select('id, name, webhook_url, webhook_secret')
            .eq('id', clientId)
            .single();

        if (clientError) throw clientError;

        // 3. Fire webhook (non-blocking, best-effort)
        if (client?.webhook_url) {
            const payload = JSON.stringify({
                event: 'order.requested',
                timestamp: new Date().toISOString(),
                client_id: clientId,
                client_name: client.name,
                order_request_id: saved.id,
                order: {
                    objetivo: orderData.objetivo,
                    pedido: orderData.pedido,
                    data: orderData.data || null,
                    descricao: orderData.descricao,
                },
            });

            fetch(client.webhook_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(client.webhook_secret
                        ? { 'X-Webhook-Secret': client.webhook_secret }
                        : {}),
                },
                body: payload,
            }).catch(err => console.error('[Order Webhook Error]', err));
        }

        return { success: true, data: saved, error: null };
    } catch (err) {
        console.error('[sendOrderRequest Error]', err);
        return { success: false, data: null, error: err };
    }
};

/**
 * Fetch all order requests for a client, newest first
 */
export const fetchOrderRequests = async (clientId) => {
    try {
        const { data, error } = await supabase
            .from(TABLES.ORDER_REQUESTS)
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (err) {
        console.error('[fetchOrderRequests Error]', err);
        return { data: null, error: err };
    }
};
