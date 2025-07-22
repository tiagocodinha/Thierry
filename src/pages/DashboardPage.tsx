import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Chapter } from '../types';
import ChapterCard from '../components/Dashboard/ChapterCard';
import VideoPlayer from '../components/Dashboard/VideoPlayer';
import { BookOpen, Play, Users, Award } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [watchedChapters, setWatchedChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadChapters = async () => {
      try {
        const { data: chaptersData, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('is_published', true)
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

    const loadUserProgress = async () => {
      if (!user?.id) return;

      try {
        const { data: progressData, error } = await supabase
          .from('user_progress')
          .select('chapter_id')
          .eq('user_id', user.id)
          .eq('watched', true);

        if (error) {
          console.error('Erro ao carregar progresso:', error);
          return;
        }

        const watchedIds = new Set(progressData?.map(p => p.chapter_id) || []);
        setWatchedChapters(watchedIds);
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
      }
    };

    loadChapters();
    loadUserProgress();
  }, [user?.id]);

  const handlePlayChapter = async (chapter: Chapter) => {
    setSelectedChapter(chapter);
    
    // Marcar como assistido na base de dados
    if (user?.id) {
      try {
        const { error } = await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            chapter_id: chapter.id,
            watched: true,
            completed_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Erro ao atualizar progresso:', error);
        } else {
          setWatchedChapters(prev => new Set([...prev, chapter.id]));
        }
      } catch (error) {
        console.error('Erro ao atualizar progresso:', error);
      }
    }
  };

  const totalChapters = chapters.length;
  const watchedCount = watchedChapters.size;
  const progressPercentage = totalChapters > 0 ? (watchedCount / totalChapters) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold mb-2">
                Bem-vindo, {user?.name}!
              </h1>
              <p className="text-blue-100 text-lg">
                Continue sua jornada de aprendizagem
              </p>
            </div>
            <div className="text-center md:text-right">
              <div className="text-3xl font-bold mb-1">{watchedCount}/{totalChapters}</div>
              <div className="text-blue-100">Capítulos Assistidos</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Progresso do Curso</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-blue-500 bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{totalChapters}</div>
                <div className="text-gray-600">Total de Capítulos</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Play className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{watchedCount}</div>
                <div className="text-gray-600">Assistidos</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{Math.round(progressPercentage)}%</div>
                <div className="text-gray-600">Concluído</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Capítulos do Curso</h2>
            <div className="text-sm text-gray-500">
              {chapters.length} capítulos disponíveis
            </div>
          </div>

          {chapters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {chapters
                .sort((a, b) => a.order - b.order)
                .map((chapter) => (
                  <ChapterCard
                    key={chapter.id}
                    chapter={chapter}
                    isWatched={watchedChapters.has(chapter.id)}
                    onPlay={handlePlayChapter}
                  />
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum capítulo disponível
              </h3>
              <p className="text-gray-600">
                Novos capítulos serão adicionados em breve.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {selectedChapter && (
        <VideoPlayer
          chapter={selectedChapter}
          onClose={() => setSelectedChapter(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;