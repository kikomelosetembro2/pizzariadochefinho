import React, { useState } from 'react';
import { Check, Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CrustOption, ExtraIngredient, ProductSize } from '../types';
import { formatPriceBRL } from '../utils/whatsapp';

export const ProductModal: React.FC = () => {
  const {
    selectedProductForModal,
    setSelectedProductForModal,
    setActiveModal,
    crustOptions,
    extraIngredients,
    addToCart,
  } = useApp();

  const product = selectedProductForModal;

  const isPizza =
    product?.category === 'pizzas_tradicionais' || product?.category === 'pizzas_especiais';
  const isCalzone = product?.category === 'calzones';

  // State
  const [selectedSize, setSelectedSize] = useState<ProductSize>(isPizza ? 'G' : 'U');
  const [selectedCrust, setSelectedCrust] = useState<CrustOption>(
    crustOptions[0] || { id: 'sem_borda', name: 'Massa Tradicional (Sem Borda)', price: 0 }
  );
  const [selectedExtras, setSelectedExtras] = useState<ExtraIngredient[]>([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  // Calculate Base Price
  const basePrice =
    isPizza && selectedSize === 'G' && product.priceLarge ? product.priceLarge : product.price;

  // Crust price
  const crustPrice = isPizza ? selectedCrust.price : 0;

  // Extras total price
  const extrasTotal = selectedExtras.reduce((sum, item) => sum + item.price, 0);

  // Unit price and Total price
  const unitPrice = basePrice + crustPrice + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const toggleExtra = (extra: ExtraIngredient) => {
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      if (exists) {
        return prev.filter((e) => e.id !== extra.id);
      } else {
        return [...prev, extra];
      }
    });
  };

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      category: product.category,
      size: isPizza ? selectedSize : 'U',
      crust: isPizza ? selectedCrust : undefined,
      extras: selectedExtras,
      notes: notes.trim() || undefined,
      unitPrice,
      quantity,
    });

    handleClose();
  };

  const handleClose = () => {
    setSelectedProductForModal(null);
    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#1F2421] border border-white/10 shadow-2xl text-left my-6 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Sticky Header with Close Button */}
        <div className="relative aspect-[16/9] w-full shrink-0 bg-[#262C29] overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/hero_pizzaria_oven_1794456659172.jpg';
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F2421] via-transparent to-black/40" />
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Title & Description */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#FAF8F5] font-display">
              {product.name}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-300 leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* 1. Size Selection (Pizzas Only) */}
          {isPizza && product.priceLarge && (
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#008C45]">
                1. Escolha o Tamanho da Pizza *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSize('M')}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedSize === 'M'
                      ? 'border-[#008C45] bg-[#008C45]/15 text-[#FAF8F5] shadow-md'
                      : 'border-white/5 bg-[#262C29] text-stone-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Média (6 fatias)</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedSize === 'M'
                          ? 'border-[#008C45] bg-[#008C45]'
                          : 'border-stone-500'
                      }`}
                    >
                      {selectedSize === 'M' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <span className="mt-2 text-xs text-stone-400">Ideal para 2 pessoas</span>
                  <span className="mt-1 font-extrabold text-[#C8102E] text-sm tabular-nums">
                    {formatPriceBRL(product.price)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedSize('G')}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedSize === 'G'
                      ? 'border-[#008C45] bg-[#008C45]/15 text-[#FAF8F5] shadow-md'
                      : 'border-white/5 bg-[#262C29] text-stone-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">Grande (8 fatias)</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selectedSize === 'G'
                          ? 'border-[#008C45] bg-[#008C45]'
                          : 'border-stone-500'
                      }`}
                    >
                      {selectedSize === 'G' && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                  <span className="mt-2 text-xs text-stone-400">Ideal para 3 a 4 pessoas</span>
                  <span className="mt-1 font-extrabold text-[#C8102E] text-sm tabular-nums">
                    {formatPriceBRL(product.priceLarge)}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 2. Stuffed Crust Selection (Pizzas Only) */}
          {isPizza && (
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#008C45]">
                2. Borda Recheada Artesanal
              </label>
              <div className="space-y-2">
                {crustOptions.map((crust) => {
                  const isSelected = selectedCrust.id === crust.id;
                  return (
                    <button
                      key={crust.id}
                      type="button"
                      onClick={() => setSelectedCrust(crust)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                        isSelected
                          ? 'border-[#008C45] bg-[#008C45]/15 text-[#FAF8F5]'
                          : 'border-white/5 bg-[#262C29] text-stone-300 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? 'border-[#008C45] bg-[#008C45]' : 'border-stone-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{crust.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[#008C45] tabular-nums shrink-0 ml-2">
                        {crust.price > 0 ? `+ ${formatPriceBRL(crust.price)}` : 'Grátis'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Extra Ingredients (Aditivos) */}
          {(isPizza || isCalzone) && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#008C45]">
                  3. Ingredientes Adicionais Extras
                </label>
                <span className="text-[11px] text-stone-400">Opcional</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {extraIngredients.map((extra) => {
                  const isChecked = selectedExtras.some((e) => e.id === extra.id);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => toggleExtra(extra)}
                      className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                        isChecked
                          ? 'border-[#008C45] bg-[#008C45]/15 text-[#FAF8F5]'
                          : 'border-white/5 bg-[#262C29] text-stone-300 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isChecked ? 'border-[#008C45] bg-[#008C45]' : 'border-stone-500'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-xs truncate">{extra.name}</span>
                      </div>
                      <span className="text-xs font-bold text-[#008C45] tabular-nums shrink-0 ml-1">
                        + {formatPriceBRL(extra.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Observações do Item */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[#008C45]">
              Observações do Item
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Tirar cebola, massa bem crocante, gelo e limão à parte..."
              maxLength={150}
              rows={2}
              className="w-full rounded-xl bg-[#262C29] border border-white/10 px-3.5 py-2.5 text-xs text-[#FAF8F5] placeholder-stone-500 focus:outline-none focus:border-[#008C45] transition"
            />
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 sm:p-5 bg-[#171B19] border-t border-white/10 shrink-0 flex items-center justify-between gap-4">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-2 bg-[#262C29] border border-white/10 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-7 text-center font-bold text-sm text-white tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-white hover:bg-white/5 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart CTA with San Marzano Red */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 py-3 px-4 rounded-xl bg-[#C8102E] hover:bg-[#A90D26] text-white font-bold text-sm shadow-lg shadow-[#C8102E]/25 active:scale-[0.98] transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Adicionar ao Pedido</span>
            </div>
            <span className="tabular-nums font-extrabold text-base">
              {formatPriceBRL(totalPrice)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
