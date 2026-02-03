import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { formatRelativeTime } from '../../utils/helpers';
import Badge from '../common/Badge';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();

        // Subscribe to changes
        const subscription = supabase
            .channel('public:prpsct_activity_logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'prpsct_activity_logs' }, payload => {
                setLogs(prev => [payload.new, ...prev]);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const loadLogs = async () => {
        // In a real app, you might want to join with users/profiles to get names
        // But for now we might just show raw actions if we didn't setup the join relation on the table query easily without a view
        // Let's try to select relations if possible, or just show text
        const { data } = await supabase
            .from('prpsct_activity_logs')
            .select(`
                *,
                prpsct_profiles:user_id (full_name, role)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) setLogs(data);
        setLoading(false);
    };

    if (loading) return <div>Carregando logs...</div>;

    return (
        <div className="activity-logs">
            <h3 className="mb-4">Monitoramento de Atividades</h3>

            <div className="logs-list space-y-3">
                {logs.length === 0 ? (
                    <p className="text-gray">Nenhuma atividade registrada.</p>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="log-item p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                    {log.prpsct_profiles?.full_name || 'Usuário'}
                                    <span className="text-gray-500 font-normal"> {log.action_type}</span>
                                </span>
                                <span className="text-xs text-gray-500">
                                    {JSON.stringify(log.details)}
                                </span>
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                {formatRelativeTime(log.created_at)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityLogs;
