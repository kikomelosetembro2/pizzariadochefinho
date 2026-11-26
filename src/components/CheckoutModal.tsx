import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Check,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Gift,
  Leaf,
  MapPin,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { OrderType, PaymentMethod } from '../types';
import { copyTextToClipboard } from '../utils/clipboard';
import {
  generatePixBrCode,
  PixValidationOutcome,
  registerUsedPixProof,
  validatePixFileProof,
  validatePixTextProof,
} from '../utils/pix';
import {
  formatPriceBRL,
  openWhatsAppKitchen,
  WHATSAPP_FORMATTED_DISPLAY,
  WHATSAPP_PIX_KEY,
} from '../utils/whatsapp';

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

  // PIX QR Code Copia-e-Cola, Countdown Timer & Receipt Validator state
  const PIX_PAYMENT_DURATION_SECONDS = 10 * 60; // 10 minutos
  const [pixSessionRef, setPixSessionRef] = useState<string>(
    () => `CHEF${Date.now().toString().slice(-8)}`
  );
  const [pixSecondsLeft, setPixSecondsLeft] = useState<number>(PIX_PAYMENT_DURATION_SECONDS);
  const [pixQrDataUrl, setPixQrDataUrl] = useState<string>('');
  const [copiedPixCode, setCopiedPixCode] = useState<'brcode' | 'key' | null>(null);
  const [pixValidatorTab, setPixValidatorTab] = useState<'arquivo' | 'codigo'>('arquivo');
  const [pixTextInput, setPixTextInput] = useState<string>('');
  const [pixValidating, setPixValidating] = useState<boolean>(false);
  const [pixValidation, setPixValidation] = useState<
    (PixValidationOutcome & { previewUrl?: string }) | null
  >(null);
  const [pixSubmitError, setPixSubmitError] = useState<string | null>(null);
  const pixFileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Automatically build BACEN EMVCo BR Code ("PIX Copia e Cola") using WHATSAPP_PIX_KEY and order total
  const pixBrCode = useMemo(() => {
    return generatePixBrCode({
      pixKey: WHATSAPP_PIX_KEY,
      amount: finalTotal,
      txId: pixSessionRef,
    });
  }, [finalTotal, pixSessionRef]);

  // Countdown timer while PIX payment is active in Checkout
  useEffect(() => {
    if (activeModal !== 'checkout' || paymentMethod !== 'pix' || pixSecondsLeft <= 0) {
      return;
    }
    const interval = setInterval(() => {
      setPixSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeModal, paymentMethod, pixSecondsLeft]);

  // Render QR Code image automatically whenever PIX is selected or total changes
  useEffect(() => {
    if (activeModal !== 'checkout' || paymentMethod !== 'pix') return;
    if (finalTotal <= 0) {
      setPixQrDataUrl('');
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(pixBrCode, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1F2421',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (!cancelled) setPixQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPixQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [activeModal, paymentMethod, pixBrCode, finalTotal]);

  // Cleanup any object URL preview when cleared or unmounted
  useEffect(() => {
    const currentPreview = pixValidation?.previewUrl;
    return () => {
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, [pixValidation?.previewUrl]);

  // Sync loyalty/referral defaults and reset transient checkout state when opening checkout
  useEffect(() => {
    if (activeModal !== 'checkout') return;
    setApplyLoyalty(Boolean(currentUser?.loyaltyDiscountAvailable));
    setApplyReferral(Boolean(currentUser?.referralBonusAvailable));
    setCashError(null);
    setPixSubmitError(null);
    setCashChangeFor('');
    setOrderNotes('');
    setPixValidation(null);
    setPixTextInput('');
    setPixSessionRef(`CHEF${Date.now().toString().slice(-8)}`);
    setPixSecondsLeft(PIX_PAYMENT_DURATION_SECONDS);

    let initialFriendCode = '';
    let autoValidFriend = false;
    let autoFeedback: string | null = null;
    try {
      const storedRef = localStorage.getItem('chefinho_referred_by')?.trim().toUpperCase() || '';
      if (storedRef && !currentUser?.referredByCode && !currentUser?.referralBonusAvailable) {
        initialFriendCode = storedRef;
        const referrer = registeredUsers.find(
          (u) => u.referralCode.toUpperCase() === storedRef && u.uid !== currentUser?.uid
        );
        if (referrer) {
          autoValidFriend = true;
          autoFeedback = `Código de indicação de ${referrer.name} aplicado automaticamente (5% OFF)!`;
        }
      }
    } catch {}

    setFriendReferralCode(initialFriendCode);
    setHasValidReferralFriend(autoValidFriend);
    setReferralFeedback(autoFeedback);
  }, [
    activeModal,
    currentUser?.uid,
    currentUser?.loyaltyDiscountAvailable,
    currentUser?.referralBonusAvailable,
    currentUser?.referredByCode,
    registeredUsers,
  ]);

  // Escape key to return to cart
  useEffect(() => {
    if (activeModal !== 'checkout') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal('cart');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, setActiveModal]);

  if (activeModal !== 'checkout') return null;

  // Cash change calculation
  const numericCashFor = parseFloat(cashChangeFor.replace(',', '.')) || 0;
  const changeReturnAmount =
    paymentMethod === 'dinheiro' && numericCashFor > finalTotal
      ? Number((numericCashFor - finalTotal).toFixed(2))
      : 0;

  const handleApplyFriendCode = () => {
    const clean = friendReferralCode.trim().toUpperCase();
    if (!clean) return;

    if (currentUser?.referredByCode) {
      setReferralFeedback('Você já utilizou um código de indicação anteriormente.');
      setHasValidReferralFriend(false);
      return;
    }

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

  const handleCopyPix = async (value: string, type: 'brcode' | 'key') => {
    const ok = await copyTextToClipboard(value);
    if (ok) {
      setCopiedPixCode(type);
      setTimeout(() => setCopiedPixCode(null), 2200);
    }
  };

  const handleRegeneratePixCode = () => {
    setPixSessionRef(`CHEF${Date.now().toString().slice(-8)}`);
    setPixSecondsLeft(PIX_PAYMENT_DURATION_SECONDS);
    setPixSubmitError(null);
  };

  const pixMinutes = Math.floor(pixSecondsLeft / 60);
  const pixSeconds = pixSecondsLeft % 60;
  const pixCountdownFormatted = `${String(pixMinutes).padStart(2, '0')}:${String(pixSeconds).padStart(2, '0')}`;
  const pixCountdownPercent = Math.max(0, Math.min(100, (pixSecondsLeft / PIX_PAYMENT_DURATION_SECONDS) * 100));
  const isPixExpiringSoon = pixSecondsLeft > 0 && pixSecondsLeft <= 120;
  const isPixExpired = pixSecondsLeft === 0;

  const handleClearPixProof = () => {
    setPixValidation(null);
    setPixTextInput('');
    setPixSubmitError(null);
    if (pixFileInputRef.current) {
      pixFileInputRef.current.value = '';
    }
  };

  const handlePixFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPixValidating(true);
    setPixSubmitError(null);
    const outcome = await validatePixFileProof(file, finalTotal);
    setPixValidation(outcome);
    setPixValidating(false);
  };

  const handleValidatePixText = (overrideText?: string) => {
    const textToValidate = overrideText ?? pixTextInput;
    setPixValidating(true);
    setPixSubmitError(null);
    const outcome = validatePixTextProof(textToValidate, finalTotal);
    setPixValidation(outcome);
    setPixValidating(false);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      setActiveModal('cart');
      return;
    }

    if (!currentUser) {
      setActiveModal('auth');
      return;
    }

    if (orderType === 'delivery' && !currentUser.address) {
      setActiveModal('auth');
      return;
    }

    // Reject if PIX countdown expired before attaching a valid proof
    if (paymentMethod === 'pix' && isPixExpired && !pixValidation?.isValid) {
      setPixSubmitError(
        'O tempo do código PIX expirou. Clique em "Gerar Novo Código" acima para atualizar antes de confirmar.'
      );
      return;
    }

    // Reject if user attached an explicitly invalid PIX proof without clearing/fixing it
    if (paymentMethod === 'pix' && pixValidation && !pixValidation.isValid) {
      setPixSubmitError(
        'O comprovante PIX anexado não passou na validação. Envie um comprovante válido ou remova-o para enviar depois pelo WhatsApp.'
      );
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
    setPixSubmitError(null);

    if (paymentMethod === 'pix' && pixValidation?.isValid && pixValidation.fingerprint) {
      registerUsedPixProof(pixValidation.fingerprint);
    }

    // Create order
    const created = createOrder({
      orderType,
      paymentMethod,
      pixProof:
        paymentMethod === 'pix' && pixValidation?.isValid ? pixValidation.proof : undefined,
      changeFor:
        paymentMethod === 'dinheiro' && numericCashFor > finalTotal ? numericCashFor : undefined,
      deliveryFee,
      notes: orderNotes.trim() || undefined,
      useLoyaltyDiscount: applyLoyalty,
      useReferralDiscount: applyReferral || hasValidReferralFriend,
      friendReferralCode: hasValidReferralFriend ? friendReferralCode.trim().toUpperCase() : undefined,
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
    <div
      onClick={() => setActiveModal('cart')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-2xl bg-[#1F2421] border border-white/10 shadow-2xl text-left my-6 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
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

            {/* PIX QR Code Copia-e-Cola Automático + Contagem Regressiva + Validador */}
            {paymentMethod === 'pix' && (
              <div className="p-4 rounded-xl bg-[#262C29] border border-[#008C45]/35 space-y-4">
                {/* Header & Valor Exato */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#008C45]">
                    <QrCode className="w-4 h-4 shrink-0" />
                    <span>PIX Automático · QR Code & Copia-e-Cola</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#008C45]/15 border border-[#008C45]/30 text-xs font-extrabold text-[#008C45] tabular-nums">
                    Valor: {formatPriceBRL(finalTotal)}
                  </span>
                </div>

                {/* Visual Countdown Timer Bar */}
                <div
                  className={`p-3 rounded-xl border space-y-2 transition-colors ${
                    isPixExpired
                      ? 'bg-red-950/40 border-red-500/40'
                      : isPixExpiringSoon
                      ? 'bg-amber-950/30 border-amber-500/40'
                      : 'bg-[#1F2421] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-stone-300">
                      <Clock
                        className={`w-3.5 h-3.5 ${
                          isPixExpired
                            ? 'text-red-400'
                            : isPixExpiringSoon
                            ? 'text-amber-400 animate-pulse'
                            : 'text-[#008C45]'
                        }`}
                      />
                      <span>
                        {isPixExpired
                          ? 'Tempo do código PIX expirado'
                          : 'Tempo restante para pagamento PIX:'}
                      </span>
                    </div>

                    {isPixExpired ? (
                      <button
                        type="button"
                        onClick={handleRegeneratePixCode}
                        className="px-2.5 py-1 rounded-lg bg-[#C8102E] hover:bg-[#A90D26] text-white text-[11px] font-bold flex items-center gap-1 transition"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Gerar Novo Código</span>
                      </button>
                    ) : (
                      <span
                        className={`font-mono font-extrabold text-sm tabular-nums ${
                          isPixExpiringSoon ? 'text-amber-300' : 'text-[#008C45]'
                        }`}
                      >
                        {pixCountdownFormatted}
                      </span>
                    )}
                  </div>

                  <div
                    role="progressbar"
                    aria-valuenow={pixSecondsLeft}
                    aria-valuemin={0}
                    aria-valuemax={PIX_PAYMENT_DURATION_SECONDS}
                    aria-label="Contagem regressiva para pagamento via PIX"
                    className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden"
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                        isPixExpired
                          ? 'bg-red-500'
                          : isPixExpiringSoon
                          ? 'bg-amber-400'
                          : 'bg-gradient-to-r from-[#008C45] to-emerald-400'
                      }`}
                      style={{ width: `${pixCountdownPercent}%` }}
                    />
                  </div>
                </div>

                {/* QR Code + Key & Copia-e-Cola Grid */}
                <div className={`flex flex-col sm:flex-row items-center gap-4 ${isPixExpired ? 'opacity-50 pointer-events-none' : ''}`}>
                  {/* Scannable QR Code Frame */}
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-36 h-36 rounded-xl bg-white p-2 shadow-md flex items-center justify-center">
                      {pixQrDataUrl ? (
                        <img
                          src={pixQrDataUrl}
                          alt={`QR Code PIX de ${formatPriceBRL(finalTotal)}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <QrCode className="w-16 h-16 text-stone-400 animate-pulse" />
                      )}
                    </div>
                    <span className="mt-1.5 text-[10px] text-stone-400 font-medium">
                      Escaneie no app do banco
                    </span>
                  </div>

                  {/* PIX Key & Copia-e-Cola Payload */}
                  <div className="flex-1 w-full space-y-2.5 text-left">
                    <div>
                      <div className="text-[11px] font-semibold text-stone-400 mb-1">
                        Código PIX Copia e Cola (com valor exato preenchido):
                      </div>
                      <div className="p-2 rounded-lg bg-[#1F2421] border border-white/10 font-mono text-[10px] text-stone-300 break-all max-h-16 overflow-y-auto select-all">
                        {pixBrCode}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPix(pixBrCode, 'brcode')}
                        className="mt-2 w-full py-2 px-3 rounded-lg bg-[#008C45] hover:bg-[#00753a] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
                      >
                        {copiedPixCode === 'brcode' ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Código Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Código</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px]">
                      <div className="text-stone-400 truncate">
                        Chave Celular:{' '}
                        <strong className="text-[#FAF8F5] font-mono select-all">
                          {WHATSAPP_PIX_KEY}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPix(WHATSAPP_PIX_KEY, 'key')}
                        className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white transition shrink-0"
                      >
                        {copiedPixCode === 'key' ? 'Copiada!' : 'Copiar Chave'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validador de Comprovante PIX */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#FAF8F5]">
                      <ShieldCheck className="w-4 h-4 text-[#008C45]" />
                      <span>Validador de Comprovante PIX</span>
                    </div>

                    <div className="flex items-center rounded-lg bg-[#1F2421] p-0.5 border border-white/10 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setPixValidatorTab('arquivo')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          pixValidatorTab === 'arquivo'
                            ? 'bg-[#008C45] text-white'
                            : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        Imagem / PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setPixValidatorTab('codigo')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition ${
                          pixValidatorTab === 'codigo'
                            ? 'bg-[#008C45] text-white'
                            : 'text-stone-400 hover:text-white'
                        }`}
                      >
                        Código E2E / Texto
                      </button>
                    </div>
                  </div>

                  {pixValidatorTab === 'arquivo' ? (
                    <div className="space-y-2">
                      <input
                        ref={pixFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,application/pdf"
                        onChange={handlePixFileSelected}
                        className="hidden"
                        id="pix-proof-file-input"
                      />
                      <label
                        htmlFor="pix-proof-file-input"
                        className="flex flex-col sm:flex-row items-center justify-center gap-2.5 p-3.5 rounded-xl border border-dashed border-[#008C45]/50 bg-[#1F2421] hover:bg-[#2E3632] cursor-pointer transition text-center sm:text-left"
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#008C45]/15 text-[#008C45] flex items-center justify-center shrink-0">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="text-xs">
                          <div className="font-bold text-[#FAF8F5]">
                            {pixValidating
                              ? 'Validando comprovante...'
                              : 'Anexar comprovante PIX (Print PNG/JPG ou PDF)'}
                          </div>
                          <div className="text-[11px] text-stone-400">
                            Verificação automática de integridade, formato e anti-duplicidade
                          </div>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={pixTextInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPixTextInput(val);
                          if (/^E\d{8}\d{12}[A-Za-z0-9]{11}$/.test(val.trim().toUpperCase())) {
                            handleValidatePixText(val);
                          }
                        }}
                        rows={2}
                        placeholder="Cole o ID da Transação PIX (ex: E18236120202611251032...) ou o texto do comprovante..."
                        className="w-full rounded-xl bg-[#1F2421] border border-white/10 px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#008C45] font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleValidatePixText()}
                        disabled={!pixTextInput.trim() || pixValidating}
                        className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-40 text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#008C45]" />
                        <span>Validar Código / Comprovante PIX</span>
                      </button>
                    </div>
                  )}

                  {/* Validation Result Feedback Box */}
                  {pixValidation && (
                    <div
                      className={`p-3 rounded-xl border text-xs space-y-2 ${
                        pixValidation.severity === 'validado'
                          ? 'bg-[#008C45]/15 border-[#008C45]/40 text-[#008C45]'
                          : pixValidation.severity === 'atencao'
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                          : 'bg-red-950/40 border-red-500/40 text-red-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 font-bold">
                          {pixValidation.severity === 'validado' ? (
                            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#008C45]" />
                          ) : pixValidation.severity === 'atencao' ? (
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                          )}
                          <span>{pixValidation.headline}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearPixProof}
                          title="Remover comprovante"
                          className="p-1 rounded hover:bg-white/10 text-stone-400 hover:text-white shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Thumbnail Preview if image uploaded */}
                      {pixValidation.previewUrl && (
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-[#1F2421] border border-white/10">
                          <img
                            src={pixValidation.previewUrl}
                            alt="Prévia do comprovante PIX"
                            className="w-12 h-12 rounded object-cover shrink-0 border border-white/10"
                          />
                          <div className="text-[11px] text-stone-300 min-w-0">
                            <div className="font-bold text-[#FAF8F5] truncate">
                              {pixValidation.proof?.fileName}
                            </div>
                            <div className="text-stone-400">
                              {pixValidation.proof?.fileSizeLabel}
                            </div>
                          </div>
                        </div>
                      )}

                      {!pixValidation.previewUrl && pixValidation.proof?.fileName && (
                        <div className="flex items-center gap-2 text-[11px] text-stone-300">
                          <FileText className="w-4 h-4 text-[#008C45] shrink-0" />
                          <span className="truncate font-semibold">
                            {pixValidation.proof.fileName} ({pixValidation.proof.fileSizeLabel})
                          </span>
                        </div>
                      )}

                      {pixValidation.proof?.checks && pixValidation.proof.checks.length > 0 && (
                        <ul className="space-y-1 text-[11px] text-stone-300 pt-1">
                          {pixValidation.proof.checks.map((chk, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-[#008C45] shrink-0" />
                              <span>{chk}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {pixSubmitError && (
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300 font-medium">
                      {pixSubmitError}
                    </div>
                  )}

                  <p className="text-[11px] text-stone-400">
                    Ao finalizar, sua comanda e o status da validação seguem direto para o WhatsApp {WHATSAPP_FORMATTED_DISPLAY}.
                  </p>
                </div>
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
                    min="0"
                    step="any"
                    value={cashChangeFor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith('-')) return;
                      setCashChangeFor(val);
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
            <span>
              Enviar automaticamente pedido e comprovante para o WhatsApp ({WHATSAPP_FORMATTED_DISPLAY})
            </span>
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
            className="w-full py-3.5 px-4 rounded-xl bg-[#C8102E] hover:bg-[#A90D26] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm sm:text-base shadow-xl shadow-[#C8102E]/25 active:scale-[0.98] transition-all flex items-center justify-between"
          >
            <span>Confirmar Pedido & Gerar Comanda</span>
            <span className="tabular-nums font-extrabold">{formatPriceBRL(finalTotal)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
