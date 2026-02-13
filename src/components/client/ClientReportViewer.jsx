import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchClientReports } from '../../services/reports.service';
import Card from '../common/Card';
import './ClientReportViewer.css';

const ClientReportViewer = ({ clientId }) => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [iframeLoading, setIframeLoading] = useState(true);
    const [iframeError, setIframeError] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const iframeRef = useRef(null);
    const wrapperRef = useRef(null);
    const [iframeKey, setIframeKey] = useState(0);

    useEffect(() => {
        if (clientId) {
            loadReports();
        } else {
            console.warn('[ClientReportViewer] clientId está vazio/undefined');
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        if (selectedReport) {
            setIframeLoading(true);
            setIframeError(false);

            // Fallback: se o iframe não disparar o onLoad em 8 segundos, remove o loader
            // O Looker frequentemente não dispara onLoad por ser cross-origin
            const timer = setTimeout(() => {
                setIframeLoading(false);
            }, 8000);

            return () => clearTimeout(timer);
        }
    }, [selectedReport, iframeKey]);

    // Listener para sair do fullscreen via ESC
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const loadReports = async () => {
        if (!clientId) return;
        setLoading(true);
        setFetchError(null);

        console.log('[ClientReportViewer] Buscando relatórios para clientId:', clientId);

        const { data, error } = await fetchClientReports(clientId);

        if (error) {
            console.error('[ClientReportViewer] Erro ao buscar relatórios:', error);
            setFetchError(error.message || 'Erro ao carregar relatórios. Verifique permissões no Supabase.');
        }

        if (data) {
            console.log('[ClientReportViewer] Relatórios encontrados:', data.length, data);
            setReports(data);
            if (data.length > 0 && !selectedReport) {
                setSelectedReport(data[0]);
            }
        } else if (!error) {
            console.warn('[ClientReportViewer] data retornou null/undefined sem erro');
        }

        setLoading(false);
    };

    const handleIframeLoad = useCallback(() => {
        console.log('[ClientReportViewer] iframe onLoad disparado');
        setIframeLoading(false);
        setIframeError(false);
    }, []);

    const handleIframeError = useCallback(() => {
        console.error('[ClientReportViewer] iframe onError disparado');
        setIframeLoading(false);
        setIframeError(true);
    }, []);

    const handleRefresh = () => {
        setIframeKey(prev => prev + 1);
    };

    const handleFullscreen = async () => {
        try {
            if (!document.fullscreenElement && wrapperRef.current) {
                await wrapperRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else if (document.fullscreenElement) {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) {
            window.open(selectedReport.iframe_url, '_blank');
        }
    };

    const handleOpenNewTab = () => {
        let viewUrl = selectedReport.iframe_url;
        if (viewUrl.includes('/embed/')) {
            viewUrl = viewUrl.replace('/embed/', '/reporting/');
        }
        window.open(viewUrl, '_blank');
    };

    if (loading) {
        return (
            <div className="reports-loading">
                <div className="spinner"></div>
                <p>Carregando seus relatórios...</p>
            </div>
        );
    }

    // Erro de fetch (provavelmente RLS do Supabase)
    if (fetchError) {
        return (
            <div className="reports-empty-state reports-error-state">
                <i className="ph ph-warning-circle"></i>
                <h3>Erro ao carregar relatórios</h3>
                <p>{fetchError}</p>
                <p className="error-hint">
                    Isso pode significar que as permissões (RLS) do Supabase precisam ser configuradas para a tabela <code>prpsct_looker_reports</code>.
                </p>
                <button className="retry-btn" onClick={loadReports}>
                    <i className="ph ph-arrow-clockwise"></i> Tentar novamente
                </button>
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="reports-empty-state">
                <i className="ph ph-chart-bar"></i>
                <h3>Nenhum relatório disponível</h3>
                <p>Você ainda não possui relatórios personalizados atribuídos à sua conta.</p>
            </div>
        );
    }

    return (
        <div className="client-reports-viewer">
            <div className="reports-sidebar">
                <h3>Meus Relatórios</h3>
                <div className="reports-menu">
                    {reports.map(report => (
                        <button
                            key={report.id}
                            className={`report-menu-item ${selectedReport?.id === report.id ? 'active' : ''}`}
                            onClick={() => setSelectedReport(report)}
                        >
                            <i className="ph ph-presentation-chart"></i>
                            <div className="report-item-text">
                                <strong>{report.title}</strong>
                                <span>{new Date(report.created_at).toLocaleDateString()}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="looker-tip">
                    <i className="ph ph-info"></i>
                    <p>Se o relatório não carregar, tente clicar em "Recarregar" ou verifique se você está logado na sua conta Google.</p>
                </div>
            </div>

            <div className="report-main-content">
                {selectedReport ? (
                    <>
                        <div className="report-header">
                            <div>
                                <h2>{selectedReport.title}</h2>
                                <p>{selectedReport.description}</p>
                            </div>
                            <div className="report-header-actions">
                                <button
                                    className="report-action-btn"
                                    onClick={handleRefresh}
                                    title="Recarregar relatório"
                                >
                                    <i className="ph ph-arrow-clockwise"></i>
                                </button>
                                <button
                                    className="report-action-btn"
                                    onClick={handleFullscreen}
                                    title="Tela cheia"
                                >
                                    <i className={`ph ph-${isFullscreen ? 'corners-in' : 'corners-out'}`}></i>
                                </button>
                                <button
                                    className="report-action-btn"
                                    onClick={handleOpenNewTab}
                                    title="Abrir em nova aba"
                                >
                                    <i className="ph ph-arrow-square-out"></i>
                                </button>
                            </div>
                        </div>

                        <div className={`iframe-wrapper ${isFullscreen ? 'fullscreen-mode' : ''}`} ref={wrapperRef}>
                            {/* Loading Overlay */}
                            {iframeLoading && (
                                <div className="iframe-loader">
                                    <div className="spinner"></div>
                                    <p>Carregando relatório...</p>
                                    <span className="loader-hint">Isso pode levar alguns segundos</span>
                                </div>
                            )}

                            {/* Error State */}
                            {iframeError && !iframeLoading && (
                                <div className="iframe-error-state">
                                    <i className="ph ph-warning-circle"></i>
                                    <h3>Não foi possível carregar o relatório</h3>
                                    <p>Isso pode acontecer se o relatório não estiver público ou se há bloqueio de cookies/terceiros no navegador.</p>
                                    <div className="error-actions">
                                        <button className="retry-btn" onClick={handleRefresh}>
                                            <i className="ph ph-arrow-clockwise"></i> Tentar novamente
                                        </button>
                                        <button className="open-external-btn" onClick={handleOpenNewTab}>
                                            <i className="ph ph-arrow-square-out"></i> Abrir externamente
                                        </button>
                                    </div>
                                </div>
                            )}

                            <iframe
                                key={`${selectedReport.id}-${iframeKey}`}
                                ref={iframeRef}
                                title={selectedReport.title}
                                src={selectedReport.iframe_url}
                                frameBorder="0"
                                style={{ border: 0, width: '100%', height: '100%', minHeight: '600px' }}
                                allowFullScreen
                                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads"
                                referrerPolicy="no-referrer-when-downgrade"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                onLoad={handleIframeLoad}
                                onError={handleIframeError}
                            ></iframe>
                        </div>
                    </>
                ) : (
                    <div className="select-report-prompt">
                        <p>Selecione um relatório ao lado para visualizar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientReportViewer;
