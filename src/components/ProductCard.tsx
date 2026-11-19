import React from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { formatPriceBRL } from '../utils/whatsapp';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { setSelectedProductForModal, setActiveModal, addToCart } = useApp();

  const isPizza =
    product.category === 'pizzas_tradicionais' || product.category === 'pizzas_especiais';

  const handleCardClick = () => {
    if (!product.available) return;
    setSelectedProductForModal(product);
    setActiveModal('product');
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.available) return;

    if (isPizza) {
      setSelectedProductForModal(product);
      setActiveModal('product');
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      category: product.category,
      size: 'U',
      extras: [],
      unitPrice: product.price,
      quantity: 1,
    });
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between rounded-2xl bg-[#262C29] border border-white/5 overflow-hidden transition-all duration-200 text-left cursor-pointer ${
        product.available
          ? 'hover:border-[#008C45]/50 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-0.5'
          : 'opacity-60 cursor-not-allowed'
      }`}
    >
      <div>
        {/* Product Image Slot */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1D221F]">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/hero_pizzaria_oven_1794456659172.jpg';
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Popular Tag (San Marzano Red Badge) */}
          {product.isPopular && product.available && (
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#C8102E] text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3" />
              <span>Mais Pedido</span>
            </div>
          )}

          {!product.available && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-2">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Esgotado no momento
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-[#FAF8F5] group-hover:text-[#008C45] transition-colors leading-snug">
              {product.name}
            </h3>
          </div>

          <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
      </div>

      {/* Footer Price & Add Button */}
      <div className="p-4 pt-0 flex items-center justify-between border-t border-white/5 mt-2">
        <div className="text-left">
          {product.priceLarge ? (
            <div>
              <span className="text-[11px] text-stone-400 block">A partir de</span>
              <span className="text-base font-extrabold text-[#C8102E] tabular-nums">
                {formatPriceBRL(product.price)}
              </span>
            </div>
          ) : (
            <div>
              <span className="text-base font-extrabold text-[#C8102E] tabular-nums">
                {formatPriceBRL(product.price)}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleQuickAdd}
          disabled={!product.available}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
            product.available
              ? 'bg-[#008C45]/15 text-[#008C45] group-hover:bg-[#008C45] group-hover:text-white shadow-sm'
              : 'bg-white/5 text-stone-500 cursor-not-allowed'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isPizza ? 'Personalizar' : 'Pedir'}</span>
        </button>
      </div>
    </div>
  );
};
