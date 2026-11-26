import React, { useEffect, useRef, useState } from 'react';
import { Gift, Leaf, Pizza, Search, Truck, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatPriceBRL } from '../utils/whatsapp';

const CATEGORY_LABELS: Record<string, string> = {
  pizzas_tradicionais: 'Pizza Tradicional',
  pizzas_especiais: 'Pizza Especial',
  esfihas_fechadas: 'Esfiha Fechada',
  calzones: 'Calzone',
  sucos: 'Suco Natural',
  refrigerantes: 'Bebida',
};

export const HeroBanner: React.FC = () => {
  const {
    products,
    currentUser,
    setActiveModal,
    setSelectedProductForModal,
    searchTerm,
    setSearchTerm,
    setSelectedCategory,
  } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [heroImgLoaded, setHeroImgLoaded] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (heroImgRef.current && heroImgRef.current.complete && heroImgRef.current.naturalWidth > 0) {
      setHeroImgLoaded(true);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToMenu = () => {
    const el = document.getElementById('cardapio-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const trimmedQuery = searchTerm.trim().toLowerCase();
  const quickMatches = trimmedQuery
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(trimmedQuery) ||
            p.description.toLowerCase().includes(trimmedQuery)
        )
        .slice(0, 6)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedCategory('todas');
    setIsDropdownOpen(false);
    scrollToMenu();
  };

  const handleSelectQuickProduct = (productId: string) => {
    const found = products.find((p) => p.id === productId);
    if (!found || !found.available) return;
    setSelectedProductForModal(found);
    setActiveModal('product');
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative overflow-x-clip bg-gradient-to-b from-[#171B19] via-[#1C211E] to-[#1F2421] border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Brand Message & Highlights */}
          <div className="lg:col-span-7 space-y-5 text-left">
            {/* Ambient tag line with basil green */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#008C45] tracking-wide uppercase">
              <Leaf className="w-4 h-4 text-[#008C45] shrink-0" />
              <span>Forno a Lenha Rústico · Fermentação Lenta Italiana 48h</span>
            </div>

            {/* Main Brand & Headline */}
            <div className="space-y-2.5 max-w-2xl">
              <h1 className="font-display tracking-tight leading-[1.06]">
                <span className="block text-3xl sm:text-5xl lg:text-6xl font-black text-[#FAF8F5]">
                  Pizzaria do <span className="text-[#C8102E]">Chefinho</span>
                </span>
                <span className="mt-2 block text-lg sm:text-2xl lg:text-3xl font-bold text-stone-200 leading-snug">
                  A verdadeira pizza artesanal em{' '}
                  <span className="text-[#008C45]">Rio Branco</span>.
                </span>
              </h1>
              <div className="h-[3px] w-28 rounded-full grid grid-cols-3 overflow-hidden">
                <div className="bg-[#008C45]" />
                <div className="bg-[#FAF8F5]" />
                <div className="bg-[#C8102E]" />
              </div>
            </div>

            {/* Subtext */}
            <p className="text-sm sm:text-base text-stone-300 max-w-xl leading-relaxed">
              Tradição italiana com ingredientes nobres: molho de tomate San Marzano, queijos artesanais, massa aerada e assada na brasa viva. Entrega rápida no <strong>Bairro Cidade do Povo</strong> e em toda Rio Branco - AC.
            </p>

            {/* Quick Search Bar for Pizzas & Drinks */}
            <div ref={searchWrapperRef} className="relative max-w-xl z-20">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center rounded-xl bg-[#262C29] border border-white/15 focus-within:border-[#008C45] focus-within:ring-2 focus-within:ring-[#008C45]/25 shadow-lg transition-all p-1"
              >
                <div className="pl-3 pr-2 text-stone-400">
                  <Search className="w-4 h-4 text-[#008C45]" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedCategory('todas');
                    setIsDropdownOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsDropdownOpen(false);
                  }}
                  placeholder="Encontre pizzas ou bebidas por nome (ex: Calabresa, Coca-Cola)..."
                  aria-label="Pesquisar pizzas ou bebidas por nome"
                  className="flex-1 bg-transparent py-2.5 text-xs sm:text-sm text-[#FAF8F5] placeholder-stone-400 focus:outline-none min-w-0"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setIsDropdownOpen(false);
                    }}
                    aria-label="Limpar pesquisa"
                    className="p-1.5 text-stone-400 hover:text-white transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3.5 sm:px-4 py-2 rounded-lg bg-[#C8102E] hover:bg-[#A90D26] text-white font-bold text-xs transition shrink-0 ml-1"
                >
                  Buscar
                </button>
              </form>

              {/* Quick Match Dropdown */}
              {isDropdownOpen && trimmedQuery.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 rounded-xl bg-[#1F2421] border border-white/15 shadow-2xl overflow-hidden z-30">
                  {quickMatches.length > 0 ? (
                    <>
                      <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                        {quickMatches.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            disabled={!item.available}
                            onClick={() => handleSelectQuickProduct(item.id)}
                            className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-3 text-left transition ${
                              item.available
                                ? 'hover:bg-[#262C29] cursor-pointer'
                                : 'opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.image}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  if (!target.dataset.fallbackApplied) {
                                    target.dataset.fallbackApplied = '1';
                                    target.src = '/images/hero_pizzaria_oven_1794456659172.jpg';
                                  }
                                }}
                                className="w-10 h-10 rounded-lg object-cover bg-[#262C29] shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-bold text-[#FAF8F5] truncate">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-[#008C45] font-medium">
                                  {CATEGORY_LABELS[item.category] || 'Cardápio'}
                                  {!item.available && ' · Indisponível'}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs sm:text-sm font-extrabold text-[#FAF8F5] tabular-nums shrink-0">
                              {formatPriceBRL(item.price)}
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDropdownOpen(false);
                          scrollToMenu();
                        }}
                        className="w-full py-2 px-3 bg-[#262C29] hover:bg-[#2E3632] border-t border-white/10 text-[11px] font-bold text-[#008C45] text-center transition"
                      >
                        Ver resultados no cardápio ↓
                      </button>
                    </>
                  ) : (
                    <div className="p-4 text-center text-xs text-stone-400">
                      Nenhum item encontrado para "<strong className="text-[#FAF8F5]">{searchTerm}</strong>".
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
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
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-xs text-stone-300">
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
            <div className="relative rounded-2xl overflow-hidden border border-[#FAF8F5]/20 shadow-2xl group bg-[#FAF8F5]">
              {/* Tricolor Italian Accent Top Bar */}
              <div className="w-full h-[3px] flex">
                <div className="flex-1 bg-[#008C45]" />
                <div className="flex-1 bg-[#FAF8F5]" />
                <div className="flex-1 bg-[#C8102E]" />
              </div>

              <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden bg-[#1D221F]">
                {!heroImgLoaded && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 z-10 skeleton-italian-surface flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-[#008C45]/60 border-t-[#C8102E] border-r-[#FAF8F5] animate-spin flex items-center justify-center">
                      <Pizza className="w-5 h-5 text-[#FAF8F5] opacity-85" />
                    </div>
                  </div>
                )}
                <img
                  ref={heroImgRef}
                  src="/images/pizza_italia_vintage_1795068133486.jpg"
                  alt="Ilustração artística em estilo Itália vintage da pizza artesanal da Pizzaria do Chefinho"
                  referrerPolicy="no-referrer"
                  onLoad={() => setHeroImgLoaded(true)}
                  onError={() => setHeroImgLoaded(true)}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
                    heroImgLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>

              {/* Scrim Overlay */}
              <div className="hero-image-scrim absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#1F2421]/95 via-[#1F2421]/60 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#008C45] uppercase tracking-wider block">
                      Itália Vintage · Arte Artesanal
                    </span>
                    <span className="text-sm font-bold text-[#FAF8F5]">
                      Massa Italiana & Forno a Lenha
                    </span>
                  </div>
                  <button
                    onClick={scrollToMenu}
                    className="px-3 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#A90D26] text-white text-xs font-semibold shadow-md transition"
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
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#FAF8F5] flex flex-wrap items-center gap-2">
                <span>Programa Fidelidade & Indicação</span>
                <span className="text-[11px] text-[#008C45] font-bold">10 pedidos = 10% OFF</span>
              </div>
              {currentUser ? (
                <div className="mt-1 space-y-1.5 max-w-md">
                  <div className="text-xs text-stone-300">
                    {currentUser.loyaltyDiscountAvailable ? (
                      <span className="text-[#008C45] font-bold">
                        🎉 Cupom de 10% OFF desbloqueado e pronto para uso!
                      </span>
                    ) : (
                      <span>
                        <strong>{currentUser.completedOrdersCount % 10}/10</strong> pedidos ·{' '}
                        <strong className="text-[#FAF8F5]">
                          {10 - (currentUser.completedOrdersCount % 10) === 1
                            ? 'Falta apenas 1 pedido'
                            : `Faltam ${10 - (currentUser.completedOrdersCount % 10)} pedidos`}
                        </strong>{' '}
                        para seu cupom de 10% OFF
                      </span>
                    )}
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#191E1B] border border-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#008C45] to-[#C8102E] transition-all duration-500"
                      style={{
                        width: `${
                          currentUser.loyaltyDiscountAvailable
                            ? 100
                            : Math.max((currentUser.completedOrdersCount % 10) * 10, 6)
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="text-xs text-stone-300">
                  Cadastre-se com seu Google Gmail para acumular carimbos digitais e indicar amigos para ganhar 5% de desconto.
                </div>
              )}
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
