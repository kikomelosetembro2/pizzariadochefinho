import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#C8102E] hover:bg-[#A30D25] text-white shadow-md transition-colors"
        title="Instalar App Pizzaria do Chefinho"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#008C45]/60 text-[#008C45] hover:bg-[#008C45]/10 transition-colors"
          title="Instalar no iPhone"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Instalar PWA</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#1F2421] border border-white/10 p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-base font-bold text-white">Instalar no iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-3 text-sm text-stone-200 leading-relaxed">
                Para ter o cardápio da <strong>Pizzaria do Chefinho</strong> direto na sua tela de início sem precisar da App Store:
              </p>
              <ol className="mt-3 space-y-2 text-xs text-stone-300 list-decimal pl-4">
                <li>Toque no botão de <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra do Safari.</li>
                <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
                <li>Toque em <strong>"Adicionar"</strong> no canto superior direito.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#C8102E] py-2.5 text-xs font-bold text-white hover:bg-[#A30D25] transition"
              >
                Entendido!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
