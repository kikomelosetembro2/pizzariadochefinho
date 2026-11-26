/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ArrowRight, MessageCircle, ShoppingBag } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { FCMNotificationBanner } from './components/FCMNotificationBanner';
import { Footer } from './components/Footer';
import { GoogleDriveModal } from './components/GoogleDriveWorkspace';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { MenuTabs } from './components/MenuTabs';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ProductModal } from './components/ProductModal';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { AppProvider, useApp } from './context/AppContext';
import { formatPriceBRL, getWhatsAppSupportUrl, WHATSAPP_FORMATTED_DISPLAY } from './utils/whatsapp';

function MainLayout() {
  const { cartCount, cartSubtotal, setActiveModal } = useApp();

  // Check URL query parameters for referral or admin route
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;

    if (params.get('admin') === 'true' || path === '/admin') {
      setActiveModal('admin');
    }

    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('chefinho_referred_by', ref.toUpperCase());
    }
  }, [setActiveModal]);

  return (
    <div className="min-h-screen bg-[#1F2421] text-[#FAF8F5] flex flex-col font-sans selection:bg-[#C8102E] selection:text-white">
      {/* Real-time FCM Notification Banner */}
      <FCMNotificationBanner />

      {/* Fixed Header */}
      <Header />

      {/* Main Content Sections */}
      <main className="flex-1">
        <HeroBanner />
        <MenuTabs />
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Bottom Cart CTA for Mobile (shows only when cart has items) */}
      {cartCount > 0 && (
        <div className="sm:hidden fixed bottom-4 inset-x-4 z-30 animate-in slide-in-from-bottom-4 duration-200">
          <button
            onClick={() => setActiveModal('cart')}
            className="w-full h-12 px-4 rounded-xl bg-gradient-to-r from-[#C8102E] to-[#990B20] text-white font-extrabold text-xs shadow-2xl shadow-black/80 flex items-center justify-between active:scale-[0.98] transition-all border border-white/20"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>Ver Pedido ({cartCount} {cartCount === 1 ? 'item' : 'itens'})</span>
            </div>
            <div className="flex items-center gap-1.5 tabular-nums">
              <span>{formatPriceBRL(cartSubtotal)}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      )}

      {/* Floating WhatsApp Atendimento Button */}
      <a
        href={getWhatsAppSupportUrl()}
        target="_blank"
        rel="noopener noreferrer"
        title={`Atendimento WhatsApp ${WHATSAPP_FORMATTED_DISPLAY}`}
        className={`fixed right-4 sm:right-6 z-30 flex items-center gap-2 px-4 py-3 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs sm:text-sm shadow-2xl shadow-black/60 border border-white/20 active:scale-95 transition-all ${
          cartCount > 0 ? 'bottom-20 sm:bottom-6' : 'bottom-5 sm:bottom-6'
        }`}
      >
        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
        <span>Atendimento</span>
      </a>

      {/* Modals & Overlays */}
      <ProductModal />
      <CartDrawer />
      <CheckoutModal />
      <ThermalReceiptModal />
      <AuthModal />
      <CustomerProfileModal />
      <AdminDashboard />
      <GoogleDriveModal />

      {/* PWA Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
