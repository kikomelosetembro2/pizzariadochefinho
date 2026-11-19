import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#C8102E] px-3.5 py-2 text-xs font-semibold text-white shadow-xl animate-bounce border border-white/20">
      <WifiOff className="w-4 h-4" />
      <span>Modo Offline — O cardápio em cache continua disponível!</span>
    </div>
  );
};
