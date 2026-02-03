import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchClients } from '../../services/clients.service';
import { uploadFile } from '../../services/storage.service';
import { createPost } from '../../services/posts.service';
import { supabase } from '../../services/supabase';
import { MAX_IMAGE_SIZE, MAX_VIDEO_SIZE } from '../../utils/constants';
import Input from '../common/Input';
import Button from '../common/Button';
import './AdminPostCreate.css';

const AdminPostCreate = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        client_id: '',
        description: '',
        text_content: ''
    });

    const [files, setFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);

    useEffect(() => {
        loadClients();
        // Cleanup previews on unmount
        return () => {
            files.forEach(fileObj => {
                if (fileObj.preview) URL.revokeObjectURL(fileObj.preview);
            });
        };
    }, []);

    const loadClients = async () => {
        const { data } = await fetchClients();
        if (data) setClients(data);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (newFiles) => {
        const validFiles = [];
        const invalidFiles = [];

        Array.from(newFiles).forEach(file => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');

            if (!isImage && !isVideo) {
                invalidFiles.push(`${file.name} (Tipo não suportado)`);
                return;
            }

            if (isImage && file.size > MAX_IMAGE_SIZE) {
                invalidFiles.push(`${file.name} (Imagem muito grande. Max: ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`);
                return;
            }

            if (isVideo && file.size > MAX_VIDEO_SIZE) {
                invalidFiles.push(`${file.name} (Vídeo muito grande. Max: ${MAX_VIDEO_SIZE / 1024 / 1024}MB)`);
                return;
            }

            validFiles.push({
                file,
                id: Math.random().toString(36).substr(2, 9),
                preview: isImage ? URL.createObjectURL(file) : null,
                type: isImage ? 'image' : 'video'
            });
        });

        if (invalidFiles.length > 0) {
            alert(`Alguns arquivos não foram adicionados:\n${invalidFiles.join('\n')}`);
        }

        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => {
            const newFiles = [...prev];
            if (newFiles[index].preview) {
                URL.revokeObjectURL(newFiles[index].preview);
            }
            newFiles.splice(index, 1);
            return newFiles;
        });
    };

    // Reordering Logic
    const onDragStart = (e, index) => {
        setDraggedItemIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/html", e.target.parentNode);
        e.dataTransfer.setDragImage(e.target.parentNode, 20, 20);
    };

    const onDragOverItem = (index) => {
        if (draggedItemIndex === null || draggedItemIndex === index) return;

        const newFiles = [...files];
        const draggedItem = newFiles[draggedItemIndex];
        newFiles.splice(draggedItemIndex, 1);
        newFiles.splice(index, 0, draggedItem);

        setFiles(newFiles);
        setDraggedItemIndex(index);
    };

    const onDragEnd = () => {
        setDraggedItemIndex(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.client_id) return alert('Selecione um cliente');
        if (files.length === 0) return alert('Adicione pelo menos uma imagem ou vídeo');

        setLoading(true);
        setUploading(true);

        try {
            // 1. Upload Files
            const uploadedMedia = [];
            for (const fileObj of files) {
                const { data, error } = await uploadFile(fileObj.file);
                if (error) throw error;
                uploadedMedia.push({
                    type: fileObj.type,
                    url: data.url,
                    filename: data.name
                });
            }

            // 2. Create Post
            const postData = {
                title: formData.title,
                description: formData.description,
                text_content: formData.text_content,
                client_id: formData.client_id,
                media_urls: uploadedMedia,
                status: 'pending',
                created_by: user.id
            };

            const { error: postError } = await supabase
                .from('prpsct_posts')
                .insert([postData]);

            if (postError) throw postError;

            onSuccess?.();
            onClose?.();

        } catch (error) {
            console.error(error);
            alert('Erro ao criar postagem');
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="post-form">
            <div className="form-group">
                <label className="input-label">Cliente</label>
                <select
                    name="client_id"
                    value={formData.client_id}
                    onChange={handleChange}
                    className="select-input"
                    required
                >
                    <option value="">Selecione um cliente</option>
                    {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                </select>
            </div>

            <Input
                label="Título da Postagem"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ex: Campanha Dia das Mães - Post 1"
                required
                fullWidth
            />

            <div
                className={`drop-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className="drop-zone-label">
                    <div className="upload-icon">☁️</div>
                    <p>Arraste arquivos ou clique para fazer upload</p>
                    <span className="upload-hint">Imagens e Vídeos suportados</span>
                </label>
            </div>

            {files.length > 0 && (
                <div className="files-grid">
                    <p className="files-grid-title">Ordem de visualização (Arraste para reordenar)</p>
                    <div className="thumbnails-container">
                        {files.map((fileObj, index) => (
                            <div
                                key={fileObj.id}
                                className={`thumbnail-item ${draggedItemIndex === index ? 'dragging' : ''}`}
                                draggable
                                onDragStart={(e) => onDragStart(e, index)}
                                onDragOver={() => onDragOverItem(index)}
                                onDragEnd={onDragEnd}
                            >
                                {fileObj.type === 'image' ? (
                                    <img src={fileObj.preview} alt="preview" className="thumb-img" />
                                ) : (
                                    <div className="thumb-video">
                                        <span>🎬</span>
                                        <span className="video-name">{fileObj.file.name}</span>
                                    </div>
                                )}
                                <button type="button" onClick={() => removeFile(index)} className="remove-thumb">×</button>
                                <div className="thumb-order-badge">{index + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Input
                label="Legenda / Texto do Post"
                name="text_content"
                type="textarea"
                value={formData.text_content}
                onChange={handleChange}
                placeholder="Digite a legenda aqui..."
                fullWidth
            />

            <Input
                label="Observações Internas (Opcional)"
                name="description"
                type="textarea"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ex: Postar na terça-feira as 18h"
                fullWidth
            />

            <div className="form-actions">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" variant="primary" loading={loading}>
                    {uploading ? 'Enviando arquivos...' : 'Criar Postagem'}
                </Button>
            </div>
        </form>
    );
};

export default AdminPostCreate;
