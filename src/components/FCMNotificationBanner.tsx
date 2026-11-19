import React, { useEffect } from 'react';
import { Bike, Bell, CheckCircle, Navigation, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const FCMNotificationBanner: React.FC = () => {
  const { fcmNotification, dismissFcmNotification, orders, setActiveReceiptOrder, setActiveModal } = useApp();

  useEffect(() => {
    if (!fcmNotification) return;

    // Auto dismiss after 12 seconds
    const timer = setTimeout(() => {
      dismissFcmNotification();
    }, 12000);

    return () => clearTimeout(timer);
  }, [fcmNotification, dismissFcmNotification]);

  if (!fcmNotification) return null;

  const handleOpenReceipt = () => {
    const order = orders.find((o) => o.orderNumber === fcmNotification.orderNumber);
    if (order) {
      setActiveReceiptOrder(order);
      setActiveModal('receipt');
    }
    dismissFcmNotification();
  };

  return (
    <aside
      aria-label="Notificação de Entrega"
      className="fixed top-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-[420px] z-50 animate-in slide-in-from-top-4 duration-300 shadow-2xl"
    >
      <div className="rounded-2xl bg-[#1F2421] border border-[#008C45]/40 text-white shadow-2xl overflow-hidden backdrop-blur-lg">
        {/* Subtle Italian 3px Tricolor Header Accent */}
        <div className="h-[3px] w-full grid grid-cols-3">
          <div className="bg-[#008C45]" />
          <div className="bg-[#FAF8F5]" />
          <div className="bg-[#C8102E]" />
        </div>

        <div className="p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl bg-[#008C45]/20 border border-[#008C45]/40 flex items-center justify-center text-[#008C45] shrink-0">
                <Bike className="w-5 h-5 animate-bounce" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#C8102E] animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#008C45] uppercase tracking-wider">
                    FCM Notificação em Tempo Real
                  </span>
                  <span className="text-[10px] text-stone-400">· {fcmNotification.timestamp}</span>
                </div>
                <h4 className="text-sm font-bold text-[#FAF8F5] leading-tight">
                  {fcmNotification.title}
                </h4>
              </div>
            </div>

            <button
              onClick={dismissFcmNotification}
              className="text-stone-400 hover:text-white p-1 rounded-lg transition"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-stone-300 leading-relaxed pl-11">
            {fcmNotification.body}
          </p>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
            <button
              onClick={handleOpenReceipt}
              className="px-3 py-1.5 rounded-lg bg-[#008C45] hover:bg-[#00753a] text-white text-xs font-bold transition flex items-center gap-1.5 shadow"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Ver Comanda do Pedido</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
