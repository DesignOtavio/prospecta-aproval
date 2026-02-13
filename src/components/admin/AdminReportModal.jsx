import { useState, useEffect } from 'react';
import { fetchClientReports, createReport, updateReport, deleteReport } from '../../services/reports.service';
import Button from '../common/Button';
import Card from '../common/Card';
import './AdminReportModal.css';

const AdminReportModal = ({ client, onClose }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
    const [showPreview, setShowPreview] = useState(false);
    const [urlError, setUrlError] = useState('');
    const [newReport, setNewReport] = useState({
        title: '',
        description: '',
        iframe_url: ''
    });

    const extractIframeSrc = (input) => {
        if (!input) return '';
        if (input.includes('<iframe')) {
            const srcMatch = input.match(/src="([^"]+)"/);
            return srcMatch ? srcMatch[1] : input;
        }
        return input;
    };

    const validateUrl = (input) => {
        if (!input) return '';
        const cleanUrl = extractIframeSrc(input);
        if (!cleanUrl.startsWith('https://')) {
            return 'A URL deve começar com https://';
        }
        return '';
    };

    useEffect(() => {
        if (client?.id) {
            loadReports();
        }
    }, [client?.id]);

    const loadReports = async () => {
        setLoading(true);
        const { data, error } = await fetchClientReports(client.id);
        if (data) setReports(data);
        setLoading(false);
    };

    const resetForm = () => {
        setNewReport({ title: '', description: '', iframe_url: '' });
        setIsAdding(false);
        setEditingReport(null);
        setShowPreview(false);
        setUrlError('');
    };

    const handleAddReport = async (e) => {
        e.preventDefault();

        const error = validateUrl(newReport.iframe_url);
        if (error) {
            setUrlError(error);
            return;
        }

        setLoading(true);
        const reportData = {
            ...newReport,
            iframe_url: extractIframeSrc(newReport.iframe_url),
            client_id: client.id
        };

        const { error: saveError } = await createReport(reportData);

        if (!saveError) {
            resetForm();
            loadReports();
        } else {
            alert('Erro ao adicionar relatório: ' + saveError.message);
        }
        setLoading(false);
    };

    const handleEditReport = async (e) => {
        e.preventDefault();

        const error = validateUrl(newReport.iframe_url);
        if (error) {
            setUrlError(error);
            return;
        }

        setLoading(true);
        const reportData = {
            title: newReport.title,
            description: newReport.description,
            iframe_url: extractIframeSrc(newReport.iframe_url)
        };

        const { error: saveError } = await updateReport(editingReport.id, reportData);

        if (!saveError) {
            resetForm();
            loadReports();
        } else {
            alert('Erro ao atualizar relatório: ' + saveError.message);
        }
        setLoading(false);
    };

    const handleStartEdit = (report) => {
        setEditingReport(report);
        setNewReport({
            title: report.title,
            description: report.description || '',
            iframe_url: report.iframe_url
        });
        setIsAdding(true);
        setShowPreview(false);
        setUrlError('');
    };

    const handleDeleteReport = async (reportId) => {
        if (!window.confirm('Excluir este relatório?')) return;

        setLoading(true);
        const { error } = await deleteReport(reportId);
        if (!error) {
            loadReports();
        } else {
            alert('Erro ao excluir relatório: ' + error.message);
        }
        setLoading(false);
    };

    const handleUrlChange = (value) => {
        setNewReport({ ...newReport, iframe_url: value });
        if (urlError) {
            setUrlError(validateUrl(value));
        }
        setShowPreview(false);
    };

    const handleTestPreview = () => {
        const error = validateUrl(newReport.iframe_url);
        if (error) {
            setUrlError(error);
            return;
        }
        setUrlError('');
        setShowPreview(true);
    };

    const previewUrl = extractIframeSrc(newReport.iframe_url);

    return (
        <div className="admin-reports-container">
            <div className="client-info-header">
                <h3>Relatórios para {client.name}</h3>
                <Button
                    variant={isAdding ? 'ghost' : 'primary'}
                    size="sm"
                    onClick={() => {
                        if (isAdding) {
                            resetForm();
                        } else {
                            setIsAdding(true);
                            setEditingReport(null);
                        }
                    }}
                >
                    {isAdding ? 'Cancelar' : '+ Novo Relatório'}
                </Button>
            </div>

            {isAdding && (
                <Card className="add-report-card" padding="md">
                    <form onSubmit={editingReport ? handleEditReport : handleAddReport}>
                        {editingReport && (
                            <div className="editing-badge">
                                <i className="ph ph-pencil-simple"></i>
                                Editando: {editingReport.title}
                            </div>
                        )}
                        <div className="form-group">
                            <label>Título</label>
                            <input
                                type="text"
                                required
                                value={newReport.title}
                                onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                                placeholder="Ex: Dashboard Mensal de Vendas"
                            />
                        </div>
                        <div className="form-group">
                            <label>URL ou Código do Iframe (Looker)</label>
                            <textarea
                                required
                                value={newReport.iframe_url}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                placeholder={'Cole a URL (https://...) ou o código completo (<iframe>...</iframe>)'}
                                className={`iframe-textarea ${urlError ? 'input-error' : ''}`}
                            />
                            {urlError && (
                                <span className="field-error">
                                    <i className="ph ph-warning"></i> {urlError}
                                </span>
                            )}
                            <div className="url-actions">
                                <button
                                    type="button"
                                    className="test-preview-btn"
                                    onClick={handleTestPreview}
                                    disabled={!newReport.iframe_url}
                                >
                                    <i className="ph ph-eye"></i> Testar Preview
                                </button>
                            </div>
                        </div>

                        {/* Preview inline */}
                        {showPreview && previewUrl && (
                            <div className="inline-preview">
                                <div className="preview-header">
                                    <span><i className="ph ph-monitor"></i> Preview</span>
                                    <button type="button" className="close-preview-btn" onClick={() => setShowPreview(false)}>
                                        <i className="ph ph-x"></i>
                                    </button>
                                </div>
                                <div className="preview-iframe-wrapper">
                                    <iframe
                                        src={previewUrl}
                                        title="Preview"
                                        frameBorder="0"
                                        sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                                        style={{ width: '100%', height: '100%', border: 0 }}
                                    ></iframe>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>Descrição (opcional)</label>
                            <textarea
                                value={newReport.description}
                                onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                                placeholder="Breve descrição do conteúdo do relatório"
                            />
                        </div>
                        <div className="form-actions">
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Salvando...' : (editingReport ? 'Atualizar Relatório' : 'Salvar Relatório')}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            <div className="reports-list">
                {loading && reports.length === 0 ? (
                    <p>Carregando relatórios...</p>
                ) : reports.length === 0 ? (
                    <p className="empty-state">Nenhum relatório cadastrado para este cliente.</p>
                ) : (
                    reports.map(report => (
                        <div key={report.id} className="report-item">
                            <div className="report-info">
                                <strong>{report.title}</strong>
                                <p>{report.description || 'Sem descrição'}</p>
                                <code className="url-preview">
                                    {report.iframe_url.length > 60
                                        ? report.iframe_url.substring(0, 60) + '...'
                                        : report.iframe_url}
                                </code>
                            </div>
                            <div className="report-actions">
                                <button
                                    className="edit-btn"
                                    onClick={() => handleStartEdit(report)}
                                    title="Editar Relatório"
                                >
                                    <i className="ph ph-pencil-simple"></i>
                                </button>
                                <button
                                    className="delete-btn"
                                    onClick={() => handleDeleteReport(report.id)}
                                    title="Excluir Relatório"
                                >
                                    <i className="ph ph-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminReportModal;
