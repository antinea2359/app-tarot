import React, { useState, useCallback, useRef, useEffect } from 'react';
import { drawTarotReading, generateCardImage, editCardImage } from './services/geminiService';
import { TarotState } from './types';
import { CardView } from './components/CardView';
import { Spinner } from './components/Spinner';

export default function App() {
  const [state, setState] = useState<TarotState>({
    isLoading: false,
    cardData: null,
    imageUrl: null,
    error: null,
    mode: 'idle'
  });

  const [editPrompt, setEditPrompt] = useState("");
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  // Handle the drawing process
  const handleDraw = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, mode: 'drawing', imageUrl: null, cardData: null }));

      // 1. Get Text Reading
      const data = await drawTarotReading();
      setState(prev => ({ ...prev, cardData: data }));

      // 2. Generate Image
      const img = await generateCardImage(data.visualDescription, data.name);
      setState(prev => ({ 
        ...prev, 
        imageUrl: img, 
        isLoading: false, 
        mode: 'viewing' 
      }));

    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err.message || "Une erreur mystique est survenue.",
        mode: 'idle'
      }));
    }
  }, []);

  // Handle Image Editing (Nano banana feature)
  const handleEditImage = useCallback(async () => {
    if (!state.imageUrl || !editPrompt.trim()) return;

    try {
      setIsEditingImage(true);
      const newImage = await editCardImage(state.imageUrl, editPrompt);
      setState(prev => ({ ...prev, imageUrl: newImage }));
      setEditPrompt(""); // Clear input after success
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ ...prev, error: "Impossible de modifier l'image: " + err.message }));
    } finally {
      setIsEditingImage(false);
    }
  }, [state.imageUrl, editPrompt]);

  // Handle Sharing (Facebook & others)
  const handleShare = useCallback(async () => {
    if (!state.cardData || !state.imageUrl) return;

    const text = `🔮 Oraculum Tarot\n\nCarte: ${state.cardData.name}\n\n"${state.cardData.spiritualMessage}"\n\n#Oraculum #Tarot #IA`;
    const title = "Mon Tirage Oraculum";

    try {
      // Try Web Share API
      if (navigator.share) {
        // Convert Base64 to Blob/File for sharing the actual image
        const response = await fetch(state.imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "oraculum-card.png", { type: blob.type });
        
        const shareData = {
          title: title,
          text: text,
          files: [file]
        };

        // Check if the browser supports sharing files (common on mobile, rare on desktop)
        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          // Fallback: Share only text and URL
          await navigator.share({
            title: title,
            text: text,
            url: window.location.href
          });
        }
      } else {
        // Fallback for browsers without navigator.share (Desktop mostly): Open Facebook Share URL
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`;
        window.open(fbUrl, '_blank', 'width=600,height=500');
      }
    } catch (err) {
      console.log("Partage annulé ou erreur:", err);
    }
  }, [state.cardData, state.imageUrl]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start p-4 sm:p-8 overflow-x-hidden relative">
      
      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col items-center justify-center mb-10 z-10">
        <h1 className="text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 drop-shadow-lg mb-2 text-center">
          ORACULUM
        </h1>
        <p className="text-indigo-200 text-sm sm:text-base font-light tracking-widest uppercase text-center">
          Le Tarot de l'IA Spirituelle
        </p>
        {deferredPrompt && (
          <button 
            onClick={handleInstallClick}
            className="mt-4 text-xs border border-amber-500/50 text-amber-200 px-3 py-1 rounded-full hover:bg-amber-500/20 transition-colors flex items-center gap-1"
          >
            <span className="material-icons text-sm">download</span>
            Installer l'application
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-6xl flex flex-col lg:flex-row items-start justify-center gap-8 z-10">
        
        {/* Left Column: Card Display */}
        <div className="w-full lg:w-1/3 flex flex-col items-center">
          <div className="w-full relative group perspective-1000">
             <CardView 
                imageUrl={state.imageUrl} 
                isLoading={state.isLoading || isEditingImage} 
                name={state.cardData?.name || null} 
             />
          </div>

          {/* Action Button (Draw) */}
          <div className="mt-8 w-full flex justify-center">
            <button
              onClick={handleDraw}
              disabled={state.isLoading || isEditingImage}
              className={`
                relative px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-full 
                transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.5)] hover:shadow-[0_0_30px_rgba(217,119,6,0.8)]
                disabled:opacity-50 disabled:cursor-not-allowed text-lg cinzel tracking-wider flex items-center gap-2
              `}
            >
              {state.isLoading ? (
                <>
                  <Spinner className="w-5 h-5" /> 🔮 Divination en cours...
                </>
              ) : (
                <>
                   {state.mode === 'idle' ? "Tirer une Carte" : "Nouveau Tirage"}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Interpretation & Editing */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {state.error && (
             <div className="glass-panel p-4 rounded-lg border-l-4 border-red-500 text-red-100 animate-bounce">
                <strong>Erreur:</strong> {state.error}
             </div>
          )}

          {state.cardData && (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl animate-[fadeIn_1s_ease-in-out]">
              <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-6">
                <h2 className="text-3xl font-bold text-amber-400 cinzel">
                  {state.cardData.name}
                </h2>
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 bg-blue-900/50 hover:bg-blue-800 text-blue-100 px-3 py-1 rounded-lg text-sm transition-colors border border-blue-700/30"
                  title="Partager sur Facebook / Réseaux sociaux"
                >
                  <span className="material-icons text-sm">share</span>
                  Partager
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-indigo-300 text-sm uppercase tracking-wider font-bold mb-2">Signification</h3>
                  <p className="text-gray-200 leading-relaxed text-lg">
                    {state.cardData.meaning}
                  </p>
                </div>

                <div className="bg-indigo-950/50 p-6 rounded-xl border border-indigo-500/30">
                  <h3 className="text-amber-300 text-sm uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                    ✨ Message Spirituel
                  </h3>
                  <p className="text-indigo-100 italic font-serif text-lg leading-relaxed">
                    "{state.cardData.spiritualMessage}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Image Editor (Feature: Nano banana powered app) */}
          {state.imageUrl && (
            <div className="glass-panel p-6 rounded-2xl mt-4">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="material-icons">image_edit</span>
                Modification Visuelle (Gemini 2.5 Flash Image)
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Utilisez la puissance de l'IA pour transformer l'apparence de votre carte. 
                Essayez: "Ajoute un filtre rétro", "Rends-le cyberpunk", "Style peinture à l'huile".
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Ex: Ajoute une aura mystique dorée..."
                  className="flex-1 bg-black/40 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleEditImage()}
                  disabled={isEditingImage}
                />
                <button
                  onClick={handleEditImage}
                  disabled={isEditingImage || !editPrompt.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2 min-w-[140px]"
                >
                  {isEditingImage ? <Spinner /> : "Transformer"}
                </button>
              </div>
            </div>
          )}
          
          {!state.cardData && !state.isLoading && (
            <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center h-64 opacity-70">
              <p className="text-2xl cinzel text-gray-400 mb-2">Le voile est clos.</p>
              <p className="text-gray-500">Cliquez sur "Tirer une Carte" pour révéler votre destinée.</p>
            </div>
          )}

        </div>
      </main>
      
      {/* Background decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 bg-purple-900/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-1/2 h-1/2 bg-amber-900/10 rounded-full blur-[100px]"></div>
        <div className="absolute top-[20%] right-[20%] w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]"></div>
      </div>

    </div>
  );
}