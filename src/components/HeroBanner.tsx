import React from 'react';
import { Flame, Gift, Leaf, Pizza, Sparkles, Truck, Utensils } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HeroBanner: React.FC = () => {
  const { currentUser, setActiveModal } = useApp();

  const scrollToMenu = () => {
    const el = document.getElementById('cardapio-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#171B19] via-[#1C211E] to-[#1F2421] border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand Message & Highlights */}
          <div className="lg:col-span-7 space-y-5 text-left">
            {/* Ambient tag line with basil green */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#008C45] tracking-wide uppercase">
              <Leaf className="w-4 h-4 text-[#008C45]" />
              <span>Forno a Lenha Rústico & Fermentação Lenta Italiana 48h</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#FAF8F5] font-display leading-[1.1] max-w-2xl">
              A verdadeira pizza artesanal em <span className="text-[#C8102E]">Rio Branco</span>.
            </h1>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-stone-300 max-w-xl leading-relaxed">
              Tradição italiana com ingredientes nobres: molho de tomate San Marzano, queijos artesanais, massa aerada e assada na brasa viva. Entrega rápida no <strong>Bairro Cidade do Povo</strong> e em toda Rio Branco - AC.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={scrollToMenu}
                className="px-6 py-3.5 rounded-xl bg-[#C8102E] hover:bg-[#A90D26] text-white font-bold text-sm shadow-xl shadow-[#C8102E]/25 active:scale-95 transition-all flex items-center gap-2"
              >
                <Pizza className="w-4 h-4" />
                <span>Explorar Cardápio Digital</span>
              </button>

              <button
                onClick={() => {
                  if (currentUser) {
                    setActiveModal('profile');
                  } else {
                    setActiveModal('auth');
                  }
                }}
                className="px-5 py-3.5 rounded-xl bg-[#262C29] hover:bg-[#2E3531] border border-[#008C45]/30 text-[#FAF8F5] text-sm font-semibold transition flex items-center gap-2"
              >
                <Gift className="w-4 h-4 text-[#008C45]" />
                <span>Clube Fidelidade 10% OFF</span>
              </button>
            </div>

            {/* Trust badges row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 text-xs text-stone-300">
              <div className="flex items-center gap-1.5 text-stone-200">
                <Truck className="w-3.5 h-3.5 text-[#C8102E]" />
                <span>Delivery & Retirada Balcão</span>
              </div>
              <span className="text-stone-600">·</span>
              <div className="flex items-center gap-1.5 text-stone-200">
                <Leaf className="w-3.5 h-3.5 text-[#008C45]" />
                <span>Bordas Recheadas Vulcão</span>
              </div>
              <span className="text-stone-600">·</span>
              <div className="flex items-center gap-1.5 text-stone-200">
                <Gift className="w-3.5 h-3.5 text-[#008C45]" />
                <span>Indique & Ganhe 5% Bônus</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Focal Anchor Image */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group bg-[#262C29]">
              <div className="aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden">
                <img
                  src="/src/assets/images/hero_pizzaria_oven_1794456659172.jpg"
                  alt="Pizza artesanal saindo do forno a lenha na Pizzaria do Chefinho"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Scrim Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#008C45] uppercase tracking-wider block">
                      Tradição & Autenticidade
                    </span>
                    <span className="text-sm font-bold text-[#FAF8F5]">
                      Massa Italiana & Forno a Lenha
                    </span>
                  </div>
                  <button
                    onClick={scrollToMenu}
                    className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-sm transition"
                  >
                    Ver Opções
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loyalty & Referral Alert Card */}
        <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-[#262C29] to-[#1E2722] border border-[#008C45]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-[#008C45]/20 border border-[#008C45]/40 flex items-center justify-center text-[#008C45] shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#FAF8F5] flex items-center gap-2">
                <span>Programa Fidelidade & Indicação</span>
                <span className="text-[11px] text-[#008C45] font-bold">10 pedidos = 10% OFF</span>
              </div>
              <div className="text-xs text-stone-300">
                {currentUser ? (
                  <span>
                    Você tem <strong>{currentUser.completedOrdersCount}/10</strong> pedidos concluídos no seu cartão digital!
                  </span>
                ) : (
                  <span>
                    Cadastre-se com seu Google Gmail para acumular carimbos digitais e indicar amigos para ganhar 5% de desconto.
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (currentUser) {
                setActiveModal('profile');
              } else {
                setActiveModal('auth');
              }
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#008C45]/15 hover:bg-[#008C45]/25 text-[#008C45] border border-[#008C45]/30 text-xs font-bold transition whitespace-nowrap shrink-0"
          >
            {currentUser ? 'Ver Meu Cartão Fidelidade' : 'Participar do Clube'}
          </button>
        </div>
      </div>
    </div>
  );
};
