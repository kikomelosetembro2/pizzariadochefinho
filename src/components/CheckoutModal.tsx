import React, { useState } from 'react';
import {
  Banknote,
  CheckCircle,
  CreditCard,
  Flame,
  Gift,
  HelpCircle,
  Leaf,
  MapPin,
  QrCode,
  Store,
  Truck,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { OrderType, PaymentMethod } from '../types';
import { formatPriceBRL, openWhatsAppKitchen } from '../utils/whatsapp';

export const CheckoutModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    cart,
    cartSubtotal,
    currentUser,
    createOrder,
    registeredUsers,
  } = useApp();

  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [cashChangeFor, setCashChangeFor] = useState<string>('');
  const [cashError, setCashError] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [autoOpenWhatsApp, setAutoOpenWhatsApp] = useState<boolean>(true);

  // Loyalty & Referral Discounts
  const [applyLoyalty, setApplyLoyalty] = useState<boolean>(
    currentUser?.loyaltyDiscountAvailable || false
  );
  const [applyReferral, setApplyReferral] = useState<boolean>(
    currentUser?.referralBonusAvailable || false
  );

  // Friend Referral Code input for new customers
  const [friendReferralCode, setFriendReferralCode] = useState<string>('');
  const [referralFeedback, setReferralFeedback] = useState<string | null>(null);
  const [hasValidReferralFriend, setHasValidReferralFriend] = useState<boolean>(false);

  if (activeModal !== 'checkout') return null;

  const deliveryFee = orderType === 'delivery' ? 7.0 : 0.0;

  // Calculate discounts
  const loyaltyDiscountVal =
    applyLoyalty && currentUser?.loyaltyDiscountAvailable
      ? Number((cartSubtotal * 0.1).toFixed(2))
      : 0;

  const referralDiscountVal =
    (applyReferral && currentUser?.referralBonusAvailable) || hasValidReferralFriend
      ? Number((cartSubtotal * 0.05).toFixed(2))
      : 0;

  const finalTotal = Math.max(
    0,
    cartSubtotal + deliveryFee - loyaltyDiscountVal - referralDiscountVal
  );

  // Cash change calculation
  const numericCashFor = parseFloat(cashChangeFor.replace(',', '.')) || 0;
  const changeReturnAmount =
    paymentMethod === 'dinheiro' && numericCashFor > finalTotal
      ? Number((numericCashFor - finalTotal).toFixed(2))
      : 0;

  const handleApplyFriendCode = () => {
    const clean = friendReferralCode.trim().toUpperCase();
    if (!clean) return;

    if (currentUser && currentUser.referralCode.toUpperCase() === clean) {
      setReferralFeedback('Você não pode usar seu próprio código de indicação.');
      setHasValidReferralFriend(false);
      return;
    }

    const found = registeredUsers.find((u) => u.referralCode.toUpperCase() === clean);
    if (found) {
      setHasValidReferralFriend(true);
      setReferralFeedback(`Código válido de ${found.name}! 5% de bônus aplicado no seu pedido.`);
      try {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      } catch {}
    } else {
      setHasValidReferralFriend(false);
      setReferralFeedback('Código de indicação não encontrado. Verifique e tente novamente.');
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      setActiveModal('auth');
      return;
    }

    if (orderType === 'delivery' && !currentUser.address) {
      setActiveModal('auth');
      return;
    }

    // Validate cash change
    if (paymentMethod === 'dinheiro' && cashChangeFor.trim()) {
      if (numericCashFor < finalTotal) {
        setCashError(
          `O valor para troco (${formatPriceBRL(numericCashFor)}) não pode ser menor que o total do pedido (${formatPriceBRL(finalTotal)}).`
        );
        return;
      }
    }

    setCashError(null);

    // Create order
    const created = createOrder({
      orderType,
      paymentMethod,
      changeFor:
        paymentMethod === 'dinheiro' && numericCashFor > finalTotal ? numericCashFor : undefined,
      deliveryFee,
      notes: orderNotes.trim() || undefined,
      useLoyaltyDiscount: applyLoyalty,
      useReferralDiscount: applyReferral || hasValidReferralFriend,
    });

    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch {}

    if (autoOpenWhatsApp) {
      setTimeout(() => {
        openWhatsAppKitchen(created);
      }, 400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#1F2421] border border-white/10 shadow-2xl text-left my-6 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Subtle Italian 3px Tricolor Header Accent */}
        <div className="h-[3px] w-full grid grid-cols-3">
          <div className="bg-[#008C45]" />
          <div className="bg-[#FAF8F5]" />
          <div className="bg-[#C8102E]" />
        </div>

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#171B19] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#FAF8F5] font-display">
              Finalizar Pedido & Pagamento
            </h2>
            <span className="text-xs text-stone-400">
              Pizzaria do Chefinho · Rio Branco - AC
            </span>
          </div>
          <button
            onClick={() => setActiveModal('cart')}
            className="text-stone-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* 1. Modalidade de Pedido: Entrega vs Retirada */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#008C45] flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5" />
              <span>1. Modalidade de Pedido *</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                  orderType === 'delivery'
                    ? 'border-[#C8102E] bg-[#C8102E]/15 text-[#FAF8F5] shadow-md'
                    : 'border-white/5 bg-[#262C29] text-stone-400 hover:border-white/20'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    orderType === 'delivery' ? 'bg-[#C8102E] text-white' : 'bg-white/5 text-stone-400'
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-[#FAF8F5]">Entrega (Delivery)</div>
                  <span className="text-[11px] text-[#C8102E] font-bold block">
                    Taxa: R$ 7,00 (Rio Branco)
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('retirada')}
                className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                  orderType === 'retirada'
                    ? 'border-[#008C45] bg-[#008C45]/15 text-[#FAF8F5] shadow-md'
                    : 'border-white/5 bg-[#262C29] text-stone-400 hover:border-white/20'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    orderType === 'retirada' ? 'bg-[#008C45] text-white' : 'bg-white/5 text-stone-400'
                  }`}
                >
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs sm:text-sm text-[#FAF8F5]">Retirada no Balcão</div>
                  <span className="text-[11px] text-[#008C45] font-bold block">
                    Sem taxa de entrega
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Customer & Address Information */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#008C45]">
                2. Dados de Entrega / Contato *
              </label>
              <button
                type="button"
                onClick={() => setActiveModal('auth')}
                className="text-xs text-[#C8102E] hover:underline font-semibold"
              >
                {currentUser ? 'Alterar Dados' : 'Fazer Login com Google'}
              </button>
            </div>

            {currentUser ? (
              <div className="p-3.5 rounded-xl bg-[#262C29] border border-white/5 text-xs text-stone-300 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#FAF8F5] text-sm">{currentUser.name}</span>
                  <span className="text-[#008C45] font-bold">{currentUser.phone}</span>
                </div>

                {orderType === 'delivery' ? (
                  <div className="flex items-start gap-2 pt-1 border-t border-white/5 text-stone-300">
                    <MapPin className="w-4 h-4 text-[#C8102E] shrink-0 mt-0.5" />
                    <div>
                      <div>
                        {currentUser.address.street}, Nº {currentUser.address.number}{' '}
                        {currentUser.address.complement && `(${currentUser.address.complement})`}
                      </div>
                      <div className="text-stone-400">
                        Bairro: {currentUser.address.neighborhood} · {currentUser.city}
                      </div>
                      <div className="text-[11px] text-[#008C45]">
                        Ponto de Ref.: {currentUser.address.referencePoint}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1 border-t border-white/5 text-[#008C45]">
                    <Store className="w-4 h-4 shrink-0" />
                    <span>Retirada no Balcão: Bairro Cidade do Povo, Rio Branco - AC</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#262C29] border border-[#008C45]/30 text-left">
                <p className="text-xs text-stone-300">
                  Para finalizar seu pedido na <strong>Pizzaria do Chefinho</strong>, precisamos de seu cadastro rápido com Google (Nome, WhatsApp e Endereço em Rio Branco - AC).
                </p>
                <button
                  type="button"
                  onClick={() => setActiveModal('auth')}
                  className="mt-3 w-full py-2.5 rounded-xl bg-[#C8102E] text-white text-xs font-bold hover:bg-[#A90D26] transition"
                >
                  Entrar com Google e Completar Endereço
                </button>
              </div>
            )}
          </div>

          {/* 3. Payment Method */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#008C45]">
              3. Forma de Pagamento *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'pix'
                    ? 'border-[#008C45] bg-[#008C45]/15 text-[#FAF8F5]'
                    : 'border-white/5 bg-[#262C29] text-stone-400 hover:border-white/20'
                }`}
              >
                <QrCode className="w-5 h-5 text-[#008C45]" />
                <span className="text-xs font-bold">PIX Direto</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_credito')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'cartao_credito'
                    ? 'border-[#C8102E] bg-[#C8102E]/15 text-[#FAF8F5]'
                    : 'border-white/5 bg-[#262C29] text-stone-400 hover:border-white/20'
                }`}
              >
                <CreditCard className="w-5 h-5 text-[#C8102E]" />
                <span className="text-xs font-bold">Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_debito')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'cartao_debito'
                    ? 'border-[#008C45] bg-[#008C45]/15 text-[#FAF8F5]'
                    : 'border-white/5 bg-[#262C29] text-stone-400 hover:border-white/20'
                }`}
              >
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold">Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('dinheiro')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'dinheiro'
                    ? 'border-[#008C45] bg-[#008C45]/15 text-[#FAF8F5]'
                    : 'border-white/5 bg-[#262C29] text-stone-400 hover:border-white/20'
                }`}
              >
                <Banknote className="w-5 h-5 text-[#008C45]" />
                <span className="text-xs font-bold">Dinheiro</span>
              </button>
            </div>

            {/* PIX instructions */}
            {paymentMethod === 'pix' && (
              <div className="p-3 rounded-xl bg-[#008C45]/10 border border-[#008C45]/30 text-xs text-[#008C45]">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-[#008C45]" />
                  <span>Chave PIX da Pizzaria do Chefinho:</span>
                </div>
                <div className="mt-1 font-mono text-white select-all bg-black/40 px-2.5 py-1 rounded-lg inline-block">
                  68992827744 (Telefone WhatsApp)
                </div>
                <p className="mt-1 text-[11px] text-stone-300">
                  Ao finalizar, a chave e comprovante poderão ser enviados direto para a cozinha no WhatsApp.
                </p>
              </div>
            )}

            {/* Dinheiro & Calculadora de Troco */}
            {paymentMethod === 'dinheiro' && (
              <div className="p-4 rounded-xl bg-[#262C29] border border-[#008C45]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#FAF8F5] flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-[#008C45]" />
                    <span>Vai precisar de troco para quanto?</span>
                  </label>
                  <span className="text-[11px] text-stone-400">Ex: 50, 100, 150</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-stone-400">R$</span>
                  <input
                    type="number"
                    step="any"
                    value={cashChangeFor}
                    onChange={(e) => {
                      setCashChangeFor(e.target.value);
                      setCashError(null);
                    }}
                    placeholder={`Valor entregue (Total: ${finalTotal.toFixed(2)})`}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#1F2421] border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-[#008C45]"
                  />
                  {cashChangeFor && (
                    <button
                      type="button"
                      onClick={() => setCashChangeFor('')}
                      className="text-xs text-stone-400 hover:text-white px-2"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                {/* Live Troco Feedback */}
                {numericCashFor > 0 && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-semibold ${
                      numericCashFor >= finalTotal
                        ? 'bg-[#008C45]/15 text-[#008C45] border border-[#008C45]/30'
                        : 'bg-red-950/40 text-red-300 border border-red-500/20'
                    }`}
                  >
                    {numericCashFor >= finalTotal ? (
                      <div className="flex items-center justify-between">
                        <span>O entregador levará de troco:</span>
                        <span className="font-extrabold text-sm tabular-nums text-white">
                          {formatPriceBRL(changeReturnAmount)}
                        </span>
                      </div>
                    ) : (
                      <span>
                        Valor insuficiente: você digitou {formatPriceBRL(numericCashFor)}, mas o pedido custa {formatPriceBRL(finalTotal)}.
                      </span>
                    )}
                  </div>
                )}

                {cashError && (
                  <div className="text-xs text-red-400 font-medium">{cashError}</div>
                )}
              </div>
            )}
          </div>

          {/* 4. Fidelidade & Cupons */}
          <div className="space-y-3 p-4 rounded-xl bg-[#262C29] border border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#008C45] uppercase tracking-wider">
              <Gift className="w-4 h-4 text-[#008C45]" />
              <span>Descontos de Fidelidade & Indicação</span>
            </div>

            {/* 10% Loyalty discount option */}
            {currentUser?.loyaltyDiscountAvailable ? (
              <label className="flex items-start gap-3 p-3 rounded-xl bg-[#008C45]/15 border border-[#008C45]/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyLoyalty}
                  onChange={(e) => setApplyLoyalty(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#008C45] focus:ring-0"
                />
                <div className="text-left text-xs">
                  <div className="font-bold text-[#FAF8F5]">
                    Aplicar Desconto Fidelidade de 10% (-{formatPriceBRL(cartSubtotal * 0.1)})
                  </div>
                  <span className="text-[#008C45] text-[11px] font-semibold">
                    Parabéns! Você completou 10 pedidos na Pizzaria do Chefinho!
                  </span>
                </div>
              </label>
            ) : (
              <div className="text-xs text-stone-400 flex items-center justify-between">
                <span>Cartão Fidelidade:</span>
                <span className="text-[#008C45] font-bold">
                  {currentUser ? `${currentUser.completedOrdersCount}/10 pedidos` : 'Cadastre-se para pontuar'}
                </span>
              </div>
            )}

            {/* 5% Referral bonus option */}
            {currentUser?.referralBonusAvailable ? (
              <label className="flex items-start gap-3 p-3 rounded-xl bg-[#C8102E]/15 border border-[#C8102E]/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyReferral}
                  onChange={(e) => setApplyReferral(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#C8102E] focus:ring-0"
                />
                <div className="text-left text-xs">
                  <div className="font-bold text-[#FAF8F5]">
                    Aplicar Bônus de Indicação de 5% (-{formatPriceBRL(cartSubtotal * 0.05)})
                  </div>
                  <span className="text-[#C8102E] text-[11px] font-semibold">
                    Bônus acumulado por indicar um amigo para a Pizzaria do Chefinho!
                  </span>
                </div>
              </label>
            ) : (
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <span className="text-[11px] text-stone-400 block">
                  Tem o código "Indique e Ganhe" de um amigo?
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={friendReferralCode}
                    onChange={(e) => setFriendReferralCode(e.target.value)}
                    placeholder="Ex: CHEFINHO-MARI"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#1F2421] border border-white/10 text-xs text-white uppercase placeholder-stone-500 focus:outline-none focus:border-[#008C45]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyFriendCode}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
                  >
                    Validar
                  </button>
                </div>
                {referralFeedback && (
                  <p
                    className={`text-[11px] font-medium ${
                      hasValidReferralFriend ? 'text-[#008C45]' : 'text-amber-400'
                    }`}
                  >
                    {referralFeedback}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 5. Observações gerais do pedido */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300">
              Observações Gerais do Pedido
            </label>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Ex: Tocar o interfone, embalar separado, trazer máquina de cartão..."
              maxLength={120}
              rows={2}
              className="w-full rounded-xl bg-[#262C29] border border-white/10 px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#008C45]"
            />
          </div>

          {/* WhatsApp Auto-Redirect Checkbox */}
          <label className="flex items-center gap-2.5 text-xs text-stone-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={autoOpenWhatsApp}
              onChange={(e) => setAutoOpenWhatsApp(e.target.checked)}
              className="w-4 h-4 rounded text-[#008C45] focus:ring-0"
            />
            <span>Enviar automaticamente cópia estruturada para a cozinha no WhatsApp</span>
          </label>
        </form>

        {/* Footer Financial Summary & CTA */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#171B19] shrink-0 space-y-3 text-left">
          <div className="space-y-1 text-xs text-stone-400">
            <div className="flex justify-between">
              <span>Subtotal dos Itens:</span>
              <span className="font-semibold text-white tabular-nums">
                {formatPriceBRL(cartSubtotal)}
              </span>
            </div>
            {orderType === 'delivery' && (
              <div className="flex justify-between">
                <span>Taxa de Entrega (Rio Branco):</span>
                <span className="font-semibold text-white tabular-nums">
                  {formatPriceBRL(deliveryFee)}
                </span>
              </div>
            )}
            {loyaltyDiscountVal > 0 && (
              <div className="flex justify-between text-[#008C45] font-bold">
                <span>Desconto Fidelidade (10%):</span>
                <span className="tabular-nums">
                  -{formatPriceBRL(loyaltyDiscountVal)}
                </span>
              </div>
            )}
            {referralDiscountVal > 0 && (
              <div className="flex justify-between text-[#C8102E] font-bold">
                <span>Desconto Indicação (5%):</span>
                <span className="tabular-nums">
                  -{formatPriceBRL(referralDiscountVal)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-[#FAF8F5] pt-2 border-t border-white/5">
              <span>Total a Pagar:</span>
              <span className="text-[#C8102E] tabular-nums text-lg">
                {formatPriceBRL(finalTotal)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmitOrder}
            disabled={cart.length === 0}
            className="w-full py-3.5 px-4 rounded-xl bg-[#C8102E] hover:bg-[#A90D26] text-white font-extrabold text-sm sm:text-base shadow-xl shadow-[#C8102E]/25 active:scale-[0.98] transition-all flex items-center justify-between"
          >
            <span>Confirmar Pedido & Gerar Comanda</span>
            <span className="tabular-nums font-extrabold">{formatPriceBRL(finalTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
