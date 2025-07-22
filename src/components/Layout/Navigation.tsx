import React from 'react';
import { BookOpen, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  currentPage: 'dashboard' | 'admin';
  onPageChange: (page: 'dashboard' | 'admin') => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
  const { user } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as const,
      name: 'Capítulos',
      icon: BookOpen,
      description: 'Acesse os vídeos',
    },
  ];

  if (user?.role === 'admin') {
    navItems.push({
      id: 'admin' as const,
      name: 'Admin',
      icon: Settings,
      description: 'Painel de controlo',
    });
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <div className="hidden sm:block">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-400">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;