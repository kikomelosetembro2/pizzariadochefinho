import React, { useEffect, useRef, useState } from 'react';
import { Pizza, Plus, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { formatPriceBRL } from '../utils/whatsapp';

interface ProductCardProps {
  product: Product;
}

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col justify-between rounded-2xl bg-[#262C29] border border-white/5 overflow-hidden shadow-sm"
    >
      {/* Italian Tricolor Animated Loading Top Bar (#008C45, #FAF8F5, #C8102E) */}
      <div className="h-[3px] w-full skeleton-tricolor-bar" />

      <div>
        {/* Image Slot Skeleton */}
        <div className="relative aspect-[4/3] w-full skeleton-italian-surface flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 opacity-60">
            <div className="w-10 h-10 rounded-full border-2 border-[#008C45]/50 border-t-[#C8102E] animate-spin flex items-center justify-center">
              <Pizza className="w-4 h-4 text-[#FAF8F5]" />
            </div>
          </div>
          {/* Popular tag placeholder */}
          <div className="absolute top-2.5 left-2.5 h-5 w-24 rounded-md skeleton-italian-line" />
        </div>

        {/* Content Body Skeleton */}
        <div className="p-4 space-y-2.5">
          <div className="h-4 w-3/4 rounded-md skeleton-italian-line" />
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded skeleton-italian-line" />
            <div className="h-3 w-5/6 rounded skeleton-italian-line" />
          </div>
        </div>
      </div>

      {/* Footer Price & Action Skeleton */}
      <div className="p-4 pt-2 flex items-center justify-between border-t border-white/5 mt-2">
        <div className="space-y-1">
          <div className="h-2.5 w-14 rounded skeleton-italian-line" />
          <div className="h-4 w-20 rounded skeleton-italian-line" />
        </div>
        <div className="h-8 w-24 rounded-xl skeleton-italian-line border border-[#008C45]/25" />
      </div>
    </div>
  );
};

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { setSelectedProductForModal, setActiveModal, addToCart } = useApp();
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImgLoaded(true);
    } else {
      setImgLoaded(false);
    }
  }, [product.image]);

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
        {/* Product Image Slot with Italian Skeleton Loader */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1D221F]">
          {!imgLoaded && (
            <div
              aria-hidden="true"
              className="absolute inset-0 z-10 skeleton-italian-surface flex flex-col justify-between"
            >
              <div className="h-[3px] w-full skeleton-tricolor-bar" />
              <div className="flex-1 flex items-center justify-center">
                <div className="w-9 h-9 rounded-full border-2 border-[#008C45]/60 border-t-[#C8102E] border-r-[#FAF8F5] animate-spin flex items-center justify-center">
                  <Pizza className="w-4 h-4 text-[#FAF8F5] opacity-80" />
                </div>
              </div>
            </div>
          )}

          <img
            ref={imgRef}
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.dataset.fallbackApplied) {
                target.dataset.fallbackApplied = '1';
                target.src = '/images/hero_pizzaria_oven_1794456659172.jpg';
              } else {
                setImgLoaded(true);
              }
            }}
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Popular Tag (San Marzano Red Badge) */}
          {product.isPopular && product.available && (
            <div className="absolute top-2.5 left-2.5 z-20 px-2 py-0.5 rounded-md bg-[#C8102E] text-white text-[11px] font-bold flex items-center gap-1 shadow-md">
              <Sparkles className="w-3 h-3" />
              <span>Mais Pedido</span>
            </div>
          )}

          {!product.available && (
            <div className="absolute inset-0 z-20 bg-black/75 flex items-center justify-center p-2">
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
