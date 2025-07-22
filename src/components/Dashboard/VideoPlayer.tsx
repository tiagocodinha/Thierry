import React from 'react';
import { X } from 'lucide-react';
import { Chapter } from '../../types';
import { supabase } from '../../lib/supabase';

interface VideoPlayerProps {
  chapter: Chapter;
  onClose: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ chapter, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 truncate">
            {chapter.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Video */}
        <div className="aspect-video bg-black">
          {chapter.video_file_path ? (
            <VideoComponent filePath={chapter.video_file_path} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-8 h-8" />
                </div>
                <p>Vídeo não disponível</p>
                <p className="text-sm text-gray-400 mt-2">
                  Nenhum ficheiro de vídeo foi carregado para este capítulo
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {chapter.description && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Sobre este capítulo</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {chapter.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const VideoComponent: React.FC<{ filePath: string }> = ({ filePath }) => {
  const [videoUrl, setVideoUrl] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    const getVideoUrl = async () => {
      try {
        console.log('Tentando carregar vídeo:', filePath);
        
        // Criar URL assinada
        const { data, error } = await supabase.storage
          .from('videos')
          .createSignedUrl(filePath, 7200); // 2 horas de expiração

        if (error) {
          console.error('Erro ao criar URL assinada:', error);
          
          // Tentar obter URL pública como fallback
          const { data: publicData } = supabase.storage
            .from('videos')
            .getPublicUrl(filePath);
          
          if (publicData?.publicUrl) {
            console.log('Usando URL pública:', publicData.publicUrl);
            setVideoUrl(publicData.publicUrl);
          } else {
            setError(`Erro ao carregar vídeo: ${error.message}`);
          }
        } else if (data?.signedUrl) {
          console.log('URL do vídeo criada:', data.signedUrl);
          setVideoUrl(data.signedUrl);
        } else {
          setError('Não foi possível gerar URL do vídeo');
        }
      } catch (error) {
        console.error('Erro geral ao carregar vídeo:', error);
        setError('Erro inesperado ao carregar vídeo');
      } finally {
        setLoading(false);
      }
    };

    if (filePath) {
      getVideoUrl();
    } else {
      setError('Caminho do ficheiro não especificado');
      setLoading(false);
    }
  }, [filePath]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p>Carregando vídeo...</p>
        </div>
      </div>
    );
  }

  if (error || !videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white">
        <div className="text-center">
          <X className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p className="text-red-400">Erro ao carregar vídeo</p>
          <p className="text-sm text-gray-400 mt-2">{error}</p>
          <div className="mt-4 text-xs text-gray-500">
            <p>Ficheiro: {filePath}</p>
            <p className="mt-1">Verifique se o ficheiro foi carregado corretamente</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <video
      src={videoUrl}
      controls
      autoPlay
      className="w-full h-full"
      controlsList="nodownload"
      onError={(e) => {
        console.error('Erro no elemento de vídeo:', e);
        setError('Erro ao reproduzir vídeo');
      }}
      onLoadStart={() => console.log('Vídeo começou a carregar')}
      onCanPlay={() => console.log('Vídeo pronto para reproduzir')}
    >
      O seu navegador não suporta o elemento de vídeo.
    </video>
  );
};

export default VideoPlayer;