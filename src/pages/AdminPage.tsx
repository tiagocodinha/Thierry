import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Chapter } from '../types';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Upload, 
  Save, 
  X, 
  Video, 
  Users,
  BookOpen,
  Eye
} from 'lucide-react';

const AdminPage: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeTab, setActiveTab] = useState<'chapters' | 'users'>('chapters');
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [showChapterForm, setShowChapterForm] = useState(false);

  useEffect(() => {
    const loadChapters = async () => {
      try {
        const { data: chaptersData, error } = await supabase
          .from('chapters')
          .select('*')
          .order('order', { ascending: true });

        if (error) {
          console.error('Erro ao carregar capítulos:', error);
          return;
        }

        setChapters(chaptersData || []);
      } catch (error) {
        console.error('Erro ao carregar capítulos:', error);
      }
    };

    loadChapters();
  }, []);

  const handleFileUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `videos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro ao fazer upload:', uploadError);
        alert(`Erro ao fazer upload: ${uploadError.message}`);
        return null;
      }

      console.log('Upload bem-sucedido:', filePath);
      return filePath;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro inesperado ao fazer upload');
      return null;
    }
  };

  const ChapterForm: React.FC<{ chapter?: Chapter; onSave: (chapter: Chapter) => void; onCancel: () => void }> = ({ 
    chapter, 
    onSave, 
    onCancel 
  }) => {
    const [formData, setFormData] = useState({
      title: chapter?.title || '',
      description: chapter?.description || '',
      video_file_path: chapter?.video_file_path || '',
      thumbnail_url: chapter?.thumbnail_url || '',
      duration: chapter?.duration || '',
      order: chapter?.order || chapters.length + 1,
      is_published: chapter?.is_published ?? true,
    });
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      let finalFormData = { ...formData };
      
      if (selectedFile) {
        setUploading(true);
        const filePath = await handleFileUpload(selectedFile);
        if (filePath) {
          finalFormData.video_file_path = filePath;
        }
        setUploading(false);
      }
      
      onSave(finalFormData as Chapter);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
          alert('O ficheiro deve ter no máximo 50MB');
          return;
        }
        setSelectedFile(file);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {chapter ? 'Editar Capítulo' : 'Novo Capítulo'}
              </h2>
              <button
                onClick={onCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vídeo (máx. 50MB)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {formData.video_file_path && (
                  <p className="text-sm text-gray-600 mt-1">
                    Vídeo atual: {formData.video_file_path}
                  </p>
                )}
              </div>

              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL da Thumbnail
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="15:30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordem
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_published" className="text-sm text-gray-700">
                  Publicado
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{uploading ? 'A fazer upload...' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Painel de Administração
          </h1>
          <p className="text-gray-600">
            Gerir conteúdo e utilizadores da plataforma
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{chapters.length}</div>
                <div className="text-gray-600">Capítulos</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">24</div>
                <div className="text-gray-600">Utilizadores</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'chapters', name: 'Capítulos', icon: BookOpen },
                { id: 'users', name: 'Utilizadores', icon: Users },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Chapters Tab */}
            {activeTab === 'chapters' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Gestão de Capítulos
                  </h2>
                  <button
                    onClick={() => setShowChapterForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Capítulo</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                          {chapter.thumbnail_url ? (
                            <img
                              src={chapter.thumbnail_url}
                              alt={chapter.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Video className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {chapter.order}. {chapter.title}
                          </h3>
                          <p className="text-sm text-gray-600 truncate max-w-md">
                            {chapter.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">
                              {chapter.duration}
                            </span>
                            {chapter.video_file_path && (
                              <span className="text-xs text-green-600">
                                Vídeo carregado
                              </span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              chapter.is_published 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {chapter.is_published ? 'Publicado' : 'Rascunho'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingChapter(chapter)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Gestão de Utilizadores
                  </h2>
                  <p className="text-gray-600">
                    Visualizar e gerir utilizadores registados
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Gestão de Utilizadores
                  </h3>
                  <p className="text-gray-600">
                    Esta funcionalidade será implementada na próxima versão.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chapter Form Modal */}
      {(showChapterForm || editingChapter) && (
        <ChapterForm
          chapter={editingChapter || undefined}
          onSave={(chapter) => {
            const saveChapter = async () => {
              try {
                if (editingChapter) {
                  const { error } = await supabase
                    .from('chapters')
                    .update({
                      title: chapter.title,
                      description: chapter.description,
                      video_file_path: chapter.video_file_path,
                      thumbnail_url: chapter.thumbnail_url,
                      duration: chapter.duration,
                      order: chapter.order,
                      is_published: chapter.is_published,
                    })
                    .eq('id', editingChapter.id);

                  if (error) {
                    console.error('Erro ao atualizar capítulo:', error);
                    return;
                  }

                  setChapters(prev => prev.map(c => c.id === editingChapter.id ? { ...editingChapter, ...chapter } : c));
                } else {
                  const { data, error } = await supabase
                    .from('chapters')
                    .insert({
                      title: chapter.title,
                      description: chapter.description,
                      video_file_path: chapter.video_file_path,
                      thumbnail_url: chapter.thumbnail_url,
                      duration: chapter.duration,
                      order: chapter.order,
                      is_published: chapter.is_published,
                    })
                    .select()
                    .single();

                  if (error) {
                    console.error('Erro ao criar capítulo:', error);
                    return;
                  }

                  if (data) {
                    setChapters(prev => [...prev, data]);
                  }
                }
              } catch (error) {
                console.error('Erro ao salvar capítulo:', error);
              }
            };

            saveChapter();
            setEditingChapter(null);
          }}
          onCancel={() => {
            setShowChapterForm(false);
            setEditingChapter(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminPage;