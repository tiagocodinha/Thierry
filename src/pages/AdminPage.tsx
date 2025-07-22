import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Chapter, User } from '../types';
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
  Eye,
  Phone,
  Mail
} from 'lucide-react';

const AdminPage: React.FC = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeTab, setActiveTab] = useState<'chapters' | 'users'>('chapters');
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [deletingChapter, setDeletingChapter] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userProgress, setUserProgress] = useState<Record<string, any[]>>({});
  const [loadingUsers, setLoadingUsers] = useState(false);

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

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      // Carregar utilizadores
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Erro ao carregar utilizadores:', usersError);
        return;
      }

      setUsers(usersData || []);

      // Carregar progresso de cada utilizador
      const progressData: Record<string, any[]> = {};
      
      for (const user of usersData || []) {
        const { data: userProgressData, error: progressError } = await supabase
          .from('user_progress')
          .select(`
            *,
            chapters (
              id,
              title,
              order
            )
          `)
          .eq('user_id', user.id)
          .eq('watched', true);

        if (!progressError) {
          progressData[user.id] = userProgressData || [];
        }
      }

      setUserProgress(progressData);
    } catch (error) {
      console.error('Erro ao carregar dados dos utilizadores:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

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

  const handleThumbnailUpload = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('thumbnails')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Erro ao fazer upload da thumbnail:', uploadError);
        alert(`Erro ao fazer upload da thumbnail: ${uploadError.message}`);
        return null;
      }

      // Obter URL pública da thumbnail
      const { data: publicData } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(filePath);

      return publicData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da thumbnail:', error);
      alert('Erro inesperado ao fazer upload da thumbnail');
      return null;
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Tem certeza que deseja apagar este capítulo? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingChapter(chapterId);

    try {
      const chapter = chapters.find(c => c.id === chapterId);
      
      // Apagar vídeo do storage se existir
      if (chapter?.video_file_path) {
        const { error: videoDeleteError } = await supabase.storage
          .from('videos')
          .remove([chapter.video_file_path]);
        
        if (videoDeleteError) {
          console.error('Erro ao apagar vídeo:', videoDeleteError);
        }
      }

      // Apagar thumbnail do storage se for do nosso storage
      if (chapter?.thumbnail_url && chapter.thumbnail_url.includes('thumbnails/')) {
        const thumbnailPath = chapter.thumbnail_url.split('/').slice(-2).join('/');
        const { error: thumbnailDeleteError } = await supabase.storage
          .from('thumbnails')
          .remove([thumbnailPath]);
        
        if (thumbnailDeleteError) {
          console.error('Erro ao apagar thumbnail:', thumbnailDeleteError);
        }
      }

      // Apagar capítulo da base de dados
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);

      if (error) {
        console.error('Erro ao apagar capítulo:', error);
        alert('Erro ao apagar capítulo');
        return;
      }

      setChapters(prev => prev.filter(c => c.id !== chapterId));
      alert('Capítulo apagado com sucesso!');
    } catch (error) {
      console.error('Erro ao apagar capítulo:', error);
      alert('Erro inesperado ao apagar capítulo');
    } finally {
      setDeletingChapter(null);
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
    const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      let finalFormData = { ...formData };
      
      // Upload thumbnail se selecionada
      if (selectedThumbnail) {
        setUploadingThumbnail(true);
        const thumbnailUrl = await handleThumbnailUpload(selectedThumbnail);
        if (thumbnailUrl) {
          finalFormData.thumbnail_url = thumbnailUrl;
        }
        setUploadingThumbnail(false);
      }
      
      // Upload vídeo se selecionado
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
        setSelectedFile(file);
      }
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedThumbnail(file);
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
                type="button"
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
                    Thumbnail (máx. 5MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {formData.thumbnail_url && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">Thumbnail atual:</p>
                      <img 
                        src={formData.thumbnail_url} 
                        alt="Thumbnail atual" 
                        className="w-32 h-20 object-cover rounded border"
                      />
                    </div>
                  )}
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
                  disabled={uploading || uploadingThumbnail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {uploading || uploadingThumbnail ? 'A fazer upload...' : 'Guardar'}
                  </span>
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
                <div className="text-2xl font-bold text-gray-900">{users.length}</div>
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
                          disabled={deletingChapter === chapter.id}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteChapter(chapter.id)}
                          disabled={deletingChapter === chapter.id}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingChapter === chapter.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
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
                    Visualizar utilizadores registados e o seu progresso
                  </p>
                </div>

                {loadingUsers ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando utilizadores...</p>
                  </div>
                ) : users.length > 0 ? (
                  <div className="space-y-4">
                    {users.map((user) => {
                      const progress = userProgress[user.id] || [];
                      const watchedCount = progress.length;
                      const progressPercentage = chapters.length > 0 ? (watchedCount / chapters.length) * 100 : 0;

                      return (
                        <div
                          key={user.id}
                          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-semibold text-lg">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">
                                    {user.name}
                                  </h3>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <div className="flex items-center space-x-1">
                                      <Mail className="w-4 h-4" />
                                      <span>{user.email}</span>
                                    </div>
                                    {user.phone && (
                                      <div className="flex items-center space-x-1">
                                        <Phone className="w-4 h-4" />
                                        <span>{user.phone}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Progresso */}
                              <div className="mb-4">
                                <div className="flex items-center justify-between text-sm mb-2">
                                  <span className="font-medium text-gray-700">Progresso do Curso</span>
                                  <span className="text-gray-600">{watchedCount}/{chapters.length} capítulos</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressPercentage}%` }}
                                  />
                                </div>
                                <div className="text-right text-sm text-gray-600 mt-1">
                                  {Math.round(progressPercentage)}% concluído
                                </div>
                              </div>

                              {/* Capítulos assistidos */}
                              {progress.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">Capítulos Assistidos:</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {progress
                                      .sort((a, b) => a.chapters.order - b.chapters.order)
                                      .map((item) => (
                                        <span
                                          key={item.chapter_id}
                                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                                        >
                                          {item.chapters.order}. {item.chapters.title}
                                        </span>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role === 'admin' ? 'Admin' : 'Utilizador'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Nenhum utilizador encontrado
                    </h3>
                    <p className="text-gray-600">
                      Ainda não há utilizadores registados na plataforma.
                    </p>
                  </div>
                )}
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