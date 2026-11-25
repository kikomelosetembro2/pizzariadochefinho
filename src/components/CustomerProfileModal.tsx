import React, { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  Copy,
  Gift,
  Leaf,
  LogOut,
  MapPin,
  MessageCircle,
  Pizza,
  Receipt,
  Share2,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatPriceBRL,
  getWhatsAppPaymentProofUrl,
  getWhatsAppSupportUrl,
  WHATSAPP_FORMATTED_DISPLAY,
} from '../utils/whatsapp';

export const CustomerProfileModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    currentUser,
    logout,
    orders,
    setActiveReceiptOrder,
    requestNotificationPermission,
  } = useApp();

  const [copiedLink, setCopiedLink] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  useEffect(() => {
    if (activeModal === 'profile' && typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationEnabled(Notification.permission === 'granted');
    }
  }, [activeModal]);

  if (activeModal !== 'profile' || !currentUser) return null;

  // Filter orders of this customer
  const myOrders = orders.filter(
    (o) =>
      o.customer.email.toLowerCase() === currentUser.email.toLowerCase() ||
      o.customer.uid === currentUser.uid
  );

  // Loyalty calculations
  const progress10 = currentUser.completedOrdersCount % 10;
  const stampsCount = currentUser.loyaltyDiscountAvailable ? 10 : progress10;
  const is10Unlocked = currentUser.loyaltyDiscountAvailable;
  const remainingOrders = is10Unlocked ? 0 : 10 - stampsCount;
  const progressPercent = Math.min(100, Math.round((stampsCount / 10) * 100));

  const handleGoToMenu = () => {
    setActiveModal(null);
    setTimeout(() => {
      document.getElementById('cardapio-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const referralUrl = `${window.location.origin}?ref=${currentUser.referralCode}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(
      `Peça sua pizza na Pizzaria do Chefinho com meu código ${currentUser.referralCode} e ganhe 5% de desconto no seu primeiro pedido! Acesse: ${referralUrl}`
    );
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `🍕 Ei! Peça uma pizza artesanal no forno a lenha na Pizzaria do Chefinho! Use meu código *${currentUser.referralCode}* e nós dois ganhamos *5% de desconto*! Acesse o cardápio: ${referralUrl}`
  )}`;

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationEnabled(granted);
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#008C45]/20 flex items-center justify-center text-[#008C45] font-bold text-base border border-[#008C45]/40">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#FAF8F5] font-display">
                {currentUser.name}
              </h2>
              <span className="text-xs text-stone-400">{currentUser.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                logout();
                setActiveModal(null);
              }}
              className="text-xs text-stone-400 hover:text-red-400 flex items-center gap-1 p-1.5 transition"
              title="Sair da Conta"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="text-stone-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* FCM Push Notification Preferences Banner */}
          <div className="p-3.5 rounded-xl bg-[#262C29] border border-[#008C45]/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#008C45]/20 flex items-center justify-center text-[#008C45] shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-[#FAF8F5] block">
                  Notificações de Entrega (FCM)
                </span>
                <span className="text-[11px] text-stone-300">
                  {notificationEnabled
                    ? 'Ativas: você recebe alertas quando a pizza sai para entrega!'
                    : 'Ative para saber na hora quando o entregador sair da pizzaria.'}
                </span>
              </div>
            </div>

            {!notificationEnabled && (
              <button
                onClick={handleEnableNotifications}
                className="px-3 py-1.5 rounded-lg bg-[#008C45] hover:bg-[#00753a] text-white font-bold text-[11px] transition shrink-0"
              >
                Ativar
              </button>
            )}
          </div>

          {/* 1. Cartão Fidelidade Digital & Barra de Progresso (10 Pedidos) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#262C29] via-[#212724] to-[#1C211E] border border-[#008C45]/40 shadow-lg space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#008C45]" />
                <h3 className="text-sm font-bold text-[#FAF8F5] uppercase tracking-wider">
                  Cartão Fidelidade Chefinho
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#008C45]/20 border border-[#008C45]/40 text-xs font-extrabold text-[#008C45] tabular-nums">
                {stampsCount}/10 pedidos · {progressPercent}%
              </span>
            </div>

            {/* Visual Remaining Orders Counter + Progress Bar */}
            <div className="p-3.5 rounded-xl bg-[#191E1B] border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  {is10Unlocked ? (
                    <div className="text-sm font-extrabold text-[#008C45]">
                      🎉 Recompensa Desbloqueada!
                    </div>
                  ) : (
                    <div className="text-sm font-extrabold text-[#FAF8F5]">
                      {remainingOrders === 1 ? (
                        <>
                          Falta apenas <span className="text-[#C8102E]">1 pedido</span>!
                        </>
                      ) : (
                        <>
                          Faltam <span className="text-[#008C45]">{remainingOrders} pedidos</span>
                        </>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-stone-300 mt-0.5">
                    {is10Unlocked
                      ? 'Seu cupom automático de 10% OFF já está pronto para usar no próximo pedido.'
                      : 'Complete 10 pedidos concluídos para ganhar automaticamente um cupom de 10% OFF.'}
                  </p>
                </div>

                <div className="shrink-0 w-12 h-12 rounded-xl bg-[#262C29] border border-[#008C45]/40 flex flex-col items-center justify-center">
                  <span className="text-base font-black text-[#FAF8F5] leading-none tabular-nums">
                    {remainingOrders}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-stone-400 mt-0.5">
                    {remainingOrders === 1 ? 'falta' : 'faltam'}
                  </span>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="space-y-1.5">
                <div
                  className="w-full h-3.5 rounded-full bg-[#262C29] border border-white/10 overflow-hidden p-0.5"
                  role="progressbar"
                  aria-valuenow={stampsCount}
                  aria-valuemin={0}
                  aria-valuemax={10}
                  aria-label="Progresso para o cupom fidelidade de 10% OFF"
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#008C45] via-emerald-500 to-[#C8102E] transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(progressPercent, stampsCount > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] font-semibold text-stone-400 tabular-nums">
                  <span>0 pedidos</span>
                  <span className={stampsCount >= 5 ? 'text-[#008C45]' : ''}>5/10 Metade</span>
                  <span className="text-[#C8102E] font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    10/10 Cupom 10% OFF
                  </span>
                </div>
              </div>
            </div>

            {/* 10 Visual Stamp Slots */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: 10 }).map((_, index) => {
                const isStamped = index < stampsCount;
                const isTenth = index === 9;
                return (
                  <div
                    key={index}
                    className={`aspect-square rounded-xl border flex flex-col items-center justify-center p-1 text-center transition-all ${
                      isStamped
                        ? 'border-[#008C45] bg-[#008C45] text-white shadow-md shadow-[#008C45]/30'
                        : isTenth
                        ? 'border-[#C8102E]/60 bg-[#C8102E]/15 text-[#C8102E]'
                        : 'border-white/5 bg-[#1F2421] text-stone-500'
                    }`}
                  >
                    {isStamped ? (
                      <Pizza className="w-4 h-4 fill-current" />
                    ) : isTenth ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <span className="text-[11px] font-bold">{index + 1}</span>
                    )}
                    <span className="text-[9px] font-bold mt-0.5">
                      {isTenth ? '10%' : `${index + 1}º`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Status Reward Badge & Recurrence CTA */}
            {is10Unlocked ? (
              <div className="p-3 rounded-xl bg-[#008C45]/20 border border-[#008C45]/40 text-[#008C45] text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>🎉 Cupom de 10% OFF liberado para seu próximo pedido!</span>
                <button
                  type="button"
                  onClick={handleGoToMenu}
                  className="px-3 py-1.5 rounded-lg bg-[#008C45] hover:bg-[#00753a] text-white font-extrabold text-[11px] transition shrink-0"
                >
                  Usar Cupom Agora
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
                <span className="text-[11px] text-stone-300">
                  {remainingOrders === 1
                    ? '🔥 Você está a apenas 1 pedido de liberar seu cupom de 10% OFF!'
                    : `Peça mais ${remainingOrders} vezes para desbloquear 10% de desconto automático.`}
                </span>
                <button
                  type="button"
                  onClick={handleGoToMenu}
                  className="px-3 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#A90D26] text-white font-bold text-[11px] transition shrink-0 self-start sm:self-auto"
                >
                  Fazer Pedido
                </button>
              </div>
            )}
          </div>

          {/* 2. Indique e Ganhe (5% Bônus) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#262C29] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#C8102E]" />
                <h3 className="text-sm font-bold text-[#FAF8F5] uppercase tracking-wider">
                  Indique e Ganhe (5% Bônus)
                </h3>
              </div>
              {currentUser.referralBonusAvailable && (
                <span className="text-[10px] font-extrabold text-white bg-[#008C45] px-2 py-0.5 rounded">
                  BÔNUS 5% DISPONÍVEL
                </span>
              )}
            </div>

            <p className="text-xs text-stone-300 leading-relaxed">
              Compartilhe seu código exclusivo. Quando um amigo fizer o primeiro pedido com o seu código,{' '}
              <strong className="text-white">ambos ganham 5% de desconto</strong> para o próximo pedido!
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#1F2421] border border-white/10 font-mono text-sm font-extrabold text-[#008C45] select-all flex items-center justify-between">
                <span>{currentUser.referralCode}</span>
                <span className="text-[10px] text-stone-400 font-sans">Seu código</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyReferral}
                  className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-[#008C45]" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>

                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-[#008C45] hover:bg-[#00753a] text-xs font-bold text-white flex items-center justify-center gap-1.5 shadow transition"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* 3. Endereço e Dados Cadastrados */}
          <div className="p-4 rounded-xl bg-[#262C29] border border-white/5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#FAF8F5] uppercase tracking-wider text-[11px]">
                Endereço de Entrega Cadastrado
              </span>
              <button
                onClick={() => setActiveModal('auth')}
                className="text-[#C8102E] font-semibold hover:underline"
              >
                Editar
              </button>
            </div>

            <div className="text-stone-300">
              <div>
                {currentUser.address.street}, Nº {currentUser.address.number}{' '}
                {currentUser.address.complement && `(${currentUser.address.complement})`}
              </div>
              <div className="text-stone-400">
                Bairro: {currentUser.address.neighborhood} · {currentUser.city}
              </div>
              <div className="text-[#008C45]">Ref: {currentUser.address.referencePoint}</div>
              <div className="text-stone-400 pt-0.5">WhatsApp: {currentUser.phone}</div>
            </div>
          </div>

          {/* 4. Histórico de Pedidos */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#FAF8F5] uppercase tracking-wider">
              Meus Pedidos Recentes ({myOrders.length})
            </h3>

            {myOrders.length === 0 ? (
              <p className="text-xs text-stone-500 italic">
                Nenhum pedido realizado ainda. Faça seu primeiro pedido para estrear o cartão fidelidade!
              </p>
            ) : (
              <div className="space-y-2.5">
                {myOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl bg-[#262C29] border border-white/5 text-xs text-left flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>Pedido #{ord.orderNumber}</span>
                        <span className="text-[10px] text-stone-400 font-normal">
                          {new Date(ord.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-extrabold ${
                            ord.status === 'concluido'
                              ? 'bg-[#008C45]/20 text-[#008C45]'
                              : ord.status === 'em_entrega'
                              ? 'bg-[#C8102E]/20 text-[#C8102E]'
                              : 'bg-amber-950/40 text-amber-300'
                          }`}
                        >
                          {ord.status === 'em_entrega' ? 'Saiu para Entrega' : ord.status}
                        </span>
                      </div>
                      <div className="text-stone-400 text-[11px] mt-0.5">
                        {ord.items.length} {ord.items.length === 1 ? 'item' : 'itens'} ·{' '}
                        {ord.orderType === 'delivery' ? 'Delivery' : 'Balcão'}
                      </div>
                      <div className="font-extrabold text-[#C8102E] tabular-nums mt-1">
                        {formatPriceBRL(ord.total)}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                      <a
                        href={getWhatsAppPaymentProofUrl(ord)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 text-[11px] font-bold flex items-center gap-1 transition"
                        title={`Enviar comprovante para ${WHATSAPP_FORMATTED_DISPLAY}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        <span>Comprovante</span>
                      </a>

                      <button
                        onClick={() => {
                          setActiveReceiptOrder(ord);
                          setActiveModal('receipt');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Comanda</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Botão de Atendimento WhatsApp */}
          <a
            href={getWhatsAppSupportUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Atendimento WhatsApp · {WHATSAPP_FORMATTED_DISPLAY}</span>
          </a>
        </div>
      </div>
    </div>
  );
};
