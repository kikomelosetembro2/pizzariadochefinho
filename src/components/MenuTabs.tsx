import React from 'react';
import { GlassWater, Leaf, Pizza, Search, Sparkles, Utensils, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProductCategory } from '../types';
import { ProductCard } from './ProductCard';

interface CategoryTabItem {
  id: ProductCategory | 'todas';
  label: string;
  icon: React.ReactNode;
}

const CATEGORY_TABS: CategoryTabItem[] = [
  { id: 'todas', label: 'Cardápio Completo', icon: <Utensils className="w-4 h-4" /> },
  { id: 'pizzas_tradicionais', label: 'Pizzas Tradicionais', icon: <Pizza className="w-4 h-4" /> },
  { id: 'pizzas_especiais', label: 'Pizzas Especiais', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'esfihas_fechadas', label: 'Esfihas Fechadas', icon: <Pizza className="w-4 h-4" /> },
  { id: 'calzones', label: 'Calzones Artesanais', icon: <Leaf className="w-4 h-4" /> },
  { id: 'sucos', label: 'Sucos Naturais', icon: <GlassWater className="w-4 h-4" /> },
  { id: 'refrigerantes', label: 'Bebidas & Refris', icon: <GlassWater className="w-4 h-4" /> },
];

export const MenuTabs: React.FC = () => {
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    searchTerm,
    setSearchTerm,
  } = useApp();

  // Filter products by category and search
  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === 'todas' ? true : product.category === selectedCategory;

    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      term === '' ||
      product.name.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  return (
    <section id="cardapio-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Section Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5">
        <div className="text-left">
          <span className="text-xs font-bold text-[#008C45] uppercase tracking-wider block flex items-center gap-1.5">
            <Leaf className="w-3.5 h-3.5" />
            <span>Tradição & Receitas Artesanais</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#FAF8F5] font-display tracking-tight">
            Cardápio da Pizzaria do Chefinho
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-400">
            Forno a lenha rústico · Bairro Cidade do Povo, Rio Branco - AC
          </p>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por sabor ou ingrediente..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#262C29] border border-white/10 text-xs text-[#FAF8F5] placeholder-stone-500 focus:outline-none focus:border-[#008C45] transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs (Segmented Controls) */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {CATEGORY_TABS.map((tab) => {
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
                isActive
                  ? 'bg-[#C8102E] text-white shadow-md shadow-[#C8102E]/25 scale-[1.02]'
                  : 'bg-[#262C29] text-stone-300 hover:bg-[#2E3632] hover:text-[#FAF8F5] border border-white/5'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Item Counter */}
      <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
        <span>
          Mostrando <strong className="text-[#FAF8F5]">{filteredProducts.length}</strong>{' '}
          {filteredProducts.length === 1 ? 'item' : 'itens'}
        </span>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-[#008C45] font-semibold hover:underline"
          >
            Limpar busca
          </button>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-12 p-10 rounded-2xl bg-[#262C29] border border-white/5 text-center max-w-md mx-auto">
          <Pizza className="w-12 h-12 text-[#C8102E] mx-auto opacity-60" />
          <h3 className="mt-3 text-base font-bold text-[#FAF8F5]">Nenhum item encontrado</h3>
          <p className="mt-1 text-xs text-stone-400">
            Não encontramos nenhum produto correspondente a "{searchTerm}".
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('todas');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#008C45] hover:bg-[#00753a] text-xs font-bold text-white transition"
          >
            Ver Todo o Cardápio
          </button>
        </div>
      )}
    </section>
  );
};
