import React, { useEffect, useState } from 'react';
import {
  Clock,
  Leaf,
  MapPin,
  MessageCircle,
  Moon,
  Phone,
  Pizza,
  ShoppingBag,
  Sliders,
  Sparkles,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatPriceBRL, getWhatsAppSupportUrl, WHATSAPP_FORMATTED_DISPLAY } from '../utils/whatsapp';
import { PWAInstallButton } from './PWAInstallButton';

export const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    isBusinessOpen,
    businessStatusText,
    businessDetailText,
    cartCount,
    cartSubtotal,
    currentUser,
    setActiveModal,
    isSimulatedOpen,
    setSimulatedOpen,
  } = useApp();

  const [showHoursModal, setShowHoursModal] = useState(false);

  useEffect(() => {
    if (!showHoursModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowHoursModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showHoursModal]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#1F2421]/95 backdrop-blur-md transition-colors">
        {/* Subtle Italian 3px Decorative Line */}
        <div className="h-[3px] w-full grid grid-cols-3">
          <div className="bg-[#008C45]" title="Verde Itália / Manjericão" />
          <div className="bg-[#FAF8F5]" title="Branco Puro / Marfim" />
          <div className="bg-[#C8102E]" title="Vermelho Tomate San Marzano" />
        </div>

        {/* Top Info Bar on larger screens */}
        <div className="hidden lg:flex items-center justify-between px-6 py-1.5 text-xs text-stone-300 border-b border-white/5 bg-[#171B19]">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-stone-200">
              <MapPin className="w-3.5 h-3.5 text-[#C8102E]" />
              <span>Bairro Cidade do Povo, Rio Branco - AC</span>
            </div>
            <button
              onClick={() => setShowHoursModal(true)}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-left"
            >
              <Clock className="w-3.5 h-3.5 text-[#008C45]" />
              <span>Quinta a Domingo: 18:00 às 23:00 (Fuso Rio Branco UTC-5)</span>
              <span className="text-[10px] text-stone-400 underline ml-1">ver detalhes</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={getWhatsAppSupportUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#008C45] hover:underline font-semibold"
            >
              <Phone className="w-3 h-3" />
              <span>Atendimento WhatsApp: {WHATSAPP_FORMATTED_DISPLAY}</span>
            </a>
            <span className="text-stone-600">·</span>
            <button
              onClick={() => setActiveModal('admin')}
              className="text-stone-400 hover:text-white transition text-[11px]"
            >
              Acesso PDV & Admin
            </button>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
          {/* Brand & Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-[#008C45]/50 shadow-lg bg-[#262C29] shrink-0 group focus:outline-none"
              title="Pizzaria do Chefinho — Voltar ao topo"
            >
              <img
                src="/images/chefinho_artisan_logo_1794456662442.jpg"
                alt="Pizzaria do Chefinho"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/hero_pizzaria_oven_1794456659172.jpg';
                }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </button>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-1.5 sm:gap-2 text-left focus:outline-none group"
              >
                <span className="text-[15px] sm:text-xl lg:text-2xl font-black tracking-tight text-[#FAF8F5] font-display leading-tight truncate">
                  Pizzaria do <span className="text-[#C8102E]">Chefinho</span>
                </span>
                <Leaf className="w-4 h-4 text-[#008C45] hidden sm:inline shrink-0" />
              </button>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs mt-0.5">
                {/* Status Indicator Button */}
                <button
                  type="button"
                  onClick={() => setShowHoursModal(true)}
                  className={`inline-flex items-center gap-1 font-semibold transition-colors shrink-0 ${
                    isBusinessOpen ? 'text-[#008C45]' : 'text-amber-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isBusinessOpen ? 'bg-[#008C45]' : 'bg-amber-500'
                    }`}
                  />
                  <span>{businessStatusText}</span>
                </button>
                <span className="text-stone-600 hidden sm:inline">·</span>
                <span className="text-stone-300 hidden sm:inline truncate max-w-[200px]">
                  Cidade do Povo, Rio Branco
                </span>
              </div>
            </div>
          </div>

          {/* Action Zone: WhatsApp, PWA, User, Cart, Admin */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick WhatsApp Atendimento Button */}
            <a
              href={getWhatsAppSupportUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/40 text-xs font-bold transition-colors shrink-0"
              title={`Atendimento WhatsApp ${WHATSAPP_FORMATTED_DISPLAY}`}
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Atendimento</span>
              <span className="hidden xl:inline text-[11px] font-semibold opacity-90">
                · {WHATSAPP_FORMATTED_DISPLAY}
              </span>
            </a>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* User Profile / Login */}
            <button
              onClick={() => {
                if (currentUser) {
                  setActiveModal('profile');
                } else {
                  setActiveModal('auth');
                }
              }}
              className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 rounded-xl bg-[#262C29] hover:bg-[#2E3632] border border-white/5 text-stone-200 text-xs font-medium transition-colors"
              title={currentUser ? `Perfil de ${currentUser.name}` : 'Entrar com Google'}
            >
              <div className="w-6 h-6 rounded-full bg-[#008C45]/20 flex items-center justify-center text-[#008C45] shrink-0 font-bold">
                {currentUser ? currentUser.name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="hidden lg:block text-left">
                <div className="truncate max-w-[90px] font-semibold text-[#FAF8F5]">
                  {currentUser ? currentUser.name.split(' ')[0] : 'Entrar'}
                </div>
                {currentUser && currentUser.completedOrdersCount > 0 && (
                  <div className="text-[10px] text-[#008C45] font-bold">
                    {currentUser.completedOrdersCount}/10 selos
                  </div>
                )}
              </div>
            </button>

            {/* Cart Button with San Marzano Red CTA */}
            <button
              onClick={() => setActiveModal('cart')}
              className="relative flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#A90D26] text-white font-bold text-xs sm:text-sm shadow-lg shadow-[#C8102E]/25 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              <div className="text-left hidden sm:block">
                <div className="text-[10px] font-normal leading-none text-white/80">Meu Pedido</div>
                <div className="tabular-nums font-bold leading-tight">
                  {cartSubtotal > 0 ? formatPriceBRL(cartSubtotal) : 'Vazio'}
                </div>
              </div>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#FAF8F5] text-[#C8102E] text-[11px] font-extrabold flex items-center justify-center shrink-0 shadow">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Theme Toggle Button (Dark <-> Artisanal Pastel Light) */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Alternar para modo claro pastel' : 'Alternar para modo escuro'}
              title={theme === 'dark' ? 'Ativar Modo Claro Pastel Artesanal' : 'Ativar Modo Escuro'}
              className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-2 rounded-xl bg-[#262C29] hover:bg-[#2E3632] border border-white/10 text-stone-200 text-xs font-semibold transition-all active:scale-95 shrink-0"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-300" />
                  <span className="hidden lg:inline">Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#C8102E]" />
                  <span className="hidden lg:inline">Escuro</span>
                </>
              )}
            </button>

            {/* Admin Switch icon */}
            <button
              onClick={() => setActiveModal('admin')}
              className="p-2 sm:p-2.5 rounded-xl bg-[#262C29] hover:bg-[#2E3632] border border-white/5 text-stone-300 hover:text-white transition-colors"
              title="Painel Administrativo & PDV"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Subheader bar with address & status */}
        <div className="lg:hidden flex items-center justify-between px-4 py-1.5 text-[11px] border-t border-white/5 bg-[#171B19] text-stone-300">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3 h-3 text-[#C8102E] shrink-0" />
            <span className="truncate">Cidade do Povo, Rio Branco - AC</span>
          </div>
          <button
            onClick={() => setShowHoursModal(true)}
            className="flex items-center gap-1 text-[#008C45] font-semibold shrink-0"
          >
            <Clock className="w-3 h-3" />
            <span>Horários</span>
          </button>
        </div>
      </header>

      {/* Business Hours & Testing Modal */}
      {showHoursModal && (
        <div
          onClick={() => setShowHoursModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#1F2421] border border-white/10 p-6 shadow-2xl text-left animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#008C45]" />
                <h3 className="text-lg font-bold text-[#FAF8F5]">Horário de Funcionamento</h3>
              </div>
              <button
                onClick={() => setShowHoursModal(false)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  isBusinessOpen
                    ? 'bg-[#008C45]/15 border-[#008C45]/40 text-[#008C45]'
                    : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{businessStatusText}</span>
                  <span className="text-xs opacity-90">{businessDetailText}</span>
                </div>
              </div>

              <div className="text-xs text-stone-200 space-y-2">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-stone-400">Dias de Funcionamento:</span>
                  <span className="font-semibold text-[#FAF8F5]">Quinta a Domingo</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-stone-400">Horário Noturno:</span>
                  <span className="font-semibold text-[#FAF8F5]">18:00 às 23:00</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-stone-400">Fuso Horário Oficial:</span>
                  <span className="font-semibold text-[#FAF8F5]">Rio Branco/AC (UTC-5)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-stone-400">Segunda a Quarta:</span>
                  <span className="font-semibold text-stone-400">Fechado para descanso e fermentação lenta</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-stone-400">Localização:</span>
                  <span className="font-semibold text-[#FAF8F5]">Bairro Cidade do Povo, Rio Branco - AC</span>
                </div>
              </div>

              {/* Testing / Simulator Override Box */}
              <div className="pt-3 border-t border-white/10">
                <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#008C45]" />
                  <span>Simulador de Testes (Demonstração):</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setSimulatedOpen(true)}
                    className={`py-1.5 px-2 text-xs rounded-lg font-medium transition ${
                      isSimulatedOpen === true
                        ? 'bg-[#008C45] text-white font-bold'
                        : 'bg-white/5 text-stone-300 hover:bg-white/10'
                    }`}
                  >
                    Forçar Aberto
                  </button>
                  <button
                    onClick={() => setSimulatedOpen(false)}
                    className={`py-1.5 px-2 text-xs rounded-lg font-medium transition ${
                      isSimulatedOpen === false
                        ? 'bg-[#C8102E] text-white font-bold'
                        : 'bg-white/5 text-stone-300 hover:bg-white/10'
                    }`}
                  >
                    Forçar Fechado
                  </button>
                  <button
                    onClick={() => setSimulatedOpen(null)}
                    className={`py-1.5 px-2 text-xs rounded-lg font-medium transition ${
                      isSimulatedOpen === null
                        ? 'bg-[#008C45] text-white font-bold'
                        : 'bg-white/5 text-stone-300 hover:bg-white/10'
                    }`}
                  >
                    Tempo Real
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHoursModal(false)}
              className="mt-5 w-full rounded-xl bg-white/10 hover:bg-white/20 py-2.5 text-xs font-semibold text-white transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
