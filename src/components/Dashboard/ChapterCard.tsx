import React from 'react';
import { Play, Clock, CheckCircle } from 'lucide-react';
import { Chapter } from '../../types';

interface ChapterCardProps {
  chapter: Chapter;
  isWatched?: boolean;
  onPlay: (chapter: Chapter) => void;
}

const ChapterCard: React.FC<ChapterCardProps> = ({ chapter, isWatched = false, onPlay }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 group">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200">
        {chapter.thumbnail_url ? (
          <img
            src={chapter.thumbnail_url}
            alt={chapter.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <button
            onClick={() => onPlay(chapter)}
            className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-200 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50"
          >
            <Play className="w-6 h-6 text-gray-800 fill-current" />
          </button>
        </div>

        {/* Status Badge */}
        {isWatched && (
          <div className="absolute top-3 right-3 bg-green-500 rounded-full p-1">
            <CheckCircle className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Duration */}
        {chapter.duration && (
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{chapter.duration}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {chapter.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {chapter.description}
        </p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            Capítulo {chapter.order}
          </span>
          
          <button
            onClick={() => onPlay(chapter)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
          >
            Assistir
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChapterCard;