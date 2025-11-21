import React from 'react';
import { Spinner } from './Spinner';

interface CardViewProps {
  imageUrl: string | null;
  isLoading: boolean;
  name: string | null;
}

export const CardView: React.FC<CardViewProps> = ({ imageUrl, isLoading, name }) => {
  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-4 border-amber-500/30 bg-gray-900 group transition-all duration-500 hover:border-amber-400/50">
      {/* Placeholder / Back of card if no image */}
      {!imageUrl && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-indigo-950">
          <div className="text-center p-6">
            <div className="text-6xl mb-4">🔮</div>
            <p className="cinzel text-amber-200 text-xl font-bold">Oraculum</p>
            <p className="text-indigo-300 text-sm mt-2">Le destin attend...</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
          <Spinner className="w-12 h-12 text-amber-400 mb-4" />
          <p className="text-amber-200 cinzel animate-pulse">Invocation des esprits...</p>
        </div>
      )}

      {/* Generated Image */}
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={name || "Carte de Tarot"} 
          className={`w-full h-full object-cover transition-opacity duration-700 ${isLoading ? 'opacity-50 scale-105' : 'opacity-100 scale-100'}`}
        />
      )}

      {/* Overlay Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"></div>
    </div>
  );
};