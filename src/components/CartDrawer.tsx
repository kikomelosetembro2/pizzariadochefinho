import React, { useEffect } from 'react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatPriceBRL } from '../utils/whatsapp';

export const CartDrawer: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    cart,
    cartCount,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    currentUser,
  } = useApp();

  useEffect(() => {
    if (activeModal !== 'cart') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, setActiveModal]);

  if (activeModal !== 'cart') return null;

  const handleProceedToCheckout = () => {
    if (!currentUser) {
      setActiveModal('auth');
    } else {
      setActiveModal('checkout');
    }
  };

  return (
    <div
      onClick={() => setActiveModal(null)}
      className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md h-full bg-[#1F2421] border-l border-white/10 shadow-2xl flex flex-col justify-between text-left animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Italian 3px Tricolor Header Accent */}
        <div className="h-[3px] w-full grid grid-cols-3">
          <div className="bg-[#008C45]" />
          <div className="bg-[#FAF8F5]" />
          <div className="bg-[#C8102E]" />
        </div>

        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#171B19]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#008C45]/20 flex items-center justify-center text-[#008C45]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FAF8F5]">Meu Pedido</h2>
              <span className="text-xs text-stone-400">
                {cartCount} {cartCount === 1 ? 'item selecionado' : 'itens selecionados'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-stone-400 hover:text-red-400 transition flex items-center gap-1 p-1"
                title="Esvaziar carrinho"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}
            <button
              onClick={() => setActiveModal(null)}
              className="text-stone-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-stone-500 mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#FAF8F5]">Seu pedido está vazio</h3>
              <p className="mt-1 text-xs text-stone-400 max-w-xs">
                Navegue pelas pizzas artesanais, calzones, esfihas ou bebidas e adicione seus itens favoritos!
              </p>
              <button
                onClick={() => setActiveModal(null)}
                className="mt-5 px-5 py-2.5 rounded-xl bg-[#C8102E] text-white text-xs font-bold shadow-lg shadow-[#C8102E]/25 hover:bg-[#A90D26] transition"
              >
                Ver Cardápio
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="p-3.5 rounded-xl bg-[#262C29] border border-white/5 space-y-2 text-left"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#FAF8F5] leading-snug">
                      {item.quantity}x {item.name}
                    </h4>
                    {item.size && item.size !== 'U' && (
                      <span className="text-[11px] text-[#008C45] font-bold block">
                        Tamanho: {item.size === 'G' ? 'Grande (8 fatias)' : 'Média (6 fatias)'}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-[#C8102E] tabular-nums shrink-0">
                    {formatPriceBRL(item.totalPrice)}
                  </span>
                </div>

                {/* Crust & Extras Summary */}
                {(item.crust || (item.extras && item.extras.length > 0)) && (
                  <div className="text-[11px] text-stone-300 space-y-0.5 bg-black/20 p-2 rounded-lg">
                    {item.crust && item.crust.price > 0 && (
                      <div>
                        ↳ Borda: <span className="text-white">{item.crust.name}</span> (+
                        {formatPriceBRL(item.crust.price)})
                      </div>
                    )}
                    {item.extras && item.extras.length > 0 && (
                      <div>
                        ↳ Extras:{' '}
                        <span className="text-white">
                          {item.extras.map((e) => e.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {item.notes && (
                  <div className="text-[11px] text-amber-300 italic">
                    ↳ Obs: "{item.notes}"
                  </div>
                )}

                {/* Actions: Stepper + Delete */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <div className="flex items-center gap-1.5 bg-[#1F2421] rounded-lg p-0.5 border border-white/5">
                    <button
                      onClick={() => updateCartQuantity(item.cartItemId, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-white tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.cartItemId, 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="text-[11px] text-red-400/80 hover:text-red-400 p-1"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer Checkout Button */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-white/10 bg-[#171B19] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-300">Subtotal dos Itens:</span>
              <span className="font-extrabold text-[#FAF8F5] tabular-nums text-base">
                {formatPriceBRL(cartSubtotal)}
              </span>
            </div>

            <button
              onClick={handleProceedToCheckout}
              className="w-full py-3.5 px-4 rounded-xl bg-[#C8102E] hover:bg-[#A90D26] text-white font-bold text-sm shadow-xl shadow-[#C8102E]/25 active:scale-[0.98] transition-all flex items-center justify-between"
            >
              <span>Avançar para Pagamento</span>
              <div className="flex items-center gap-1">
                <span className="tabular-nums font-extrabold">{formatPriceBRL(cartSubtotal)}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
