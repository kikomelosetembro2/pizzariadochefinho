import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Lock, MapPin, Phone, User, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    currentUser,
    completeCustomerRegistration,
    registeredUsers,
  } = useApp();

  const [googleAuthStep, setGoogleAuthStep] = useState<'pick_google' | 'fill_data'>(
    currentUser ? 'fill_data' : 'pick_google'
  );

  const [email, setEmail] = useState(currentUser?.email || 'kikomelosetembro2@gmail.com');
  const [name, setName] = useState(currentUser?.name || 'Francisco Kiko Melo');
  const [phone, setPhone] = useState(currentUser?.phone || '(68) 99988-1234');
  const [street, setStreet] = useState(currentUser?.address?.street || 'Rua das Mangueiras');
  const [number, setNumber] = useState(currentUser?.address?.number || '142');
  const [neighborhood, setNeighborhood] = useState(currentUser?.address?.neighborhood || 'Cidade do Povo');
  const [complement, setComplement] = useState(currentUser?.address?.complement || '');
  const [referencePoint, setReferencePoint] = useState(
    currentUser?.address?.referencePoint || 'Próximo à Praça Principal da Cidade do Povo'
  );
  const [referredByCode, setReferredByCode] = useState(currentUser?.referredByCode || '');

  const [alertFeedback, setAlertFeedback] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (activeModal !== 'auth') return;
    setAlertFeedback(null);

    if (currentUser) {
      setGoogleAuthStep('fill_data');
      setEmail(currentUser.email);
      setName(currentUser.name);
      setPhone(currentUser.phone);
      setStreet(currentUser.address?.street || '');
      setNumber(currentUser.address?.number || '');
      setNeighborhood(currentUser.address?.neighborhood || '');
      setComplement(currentUser.address?.complement || '');
      setReferencePoint(currentUser.address?.referencePoint || '');
      setReferredByCode(currentUser.referredByCode || '');
    } else {
      setGoogleAuthStep('pick_google');
      setEmail('');
      setName('');
      setPhone('');
      setStreet('');
      setNumber('');
      setNeighborhood('');
      setComplement('');
      setReferencePoint('');
      try {
        setReferredByCode(localStorage.getItem('chefinho_referred_by') || '');
      } catch {
        setReferredByCode('');
      }
    }
  }, [activeModal, currentUser]);

  if (activeModal !== 'auth') return null;

  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    let formatted = '';

    if (raw.length <= 2) {
      formatted = raw.length > 0 ? `(${raw}` : '';
    } else if (raw.length <= 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    } else {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7, 11)}`;
    }

    setPhone(formatted);
  };

  const handleSimulateGoogleLogin = (chosenEmail: string, chosenName: string) => {
    setEmail(chosenEmail);
    setName(chosenName);

    const existing = registeredUsers.find(
      (u) => u.email.toLowerCase() === chosenEmail.toLowerCase()
    );

    if (existing) {
      setName(existing.name);
      setPhone(existing.phone);
      if (existing.address) {
        setStreet(existing.address.street);
        setNumber(existing.address.number);
        setNeighborhood(existing.address.neighborhood);
        setComplement(existing.address.complement || '');
        setReferencePoint(existing.address.referencePoint);
      }
      setAlertFeedback({
        type: 'info',
        text: `Conta Google reconhecida! Dados vinculados automaticamente.`,
      });
    }

    setGoogleAuthStep('fill_data');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !street.trim() || !number.trim() || !neighborhood.trim() || !referencePoint.trim()) {
      setAlertFeedback({
        type: 'error',
        text: 'Por favor, preencha todos os campos obrigatórios para entrega.',
      });
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setAlertFeedback({
        type: 'error',
        text: 'Digite um número de WhatsApp válido com DDD (ex: (68) 9XXXX-XXXX).',
      });
      return;
    }

    const result = completeCustomerRegistration({
      email,
      name,
      phone,
      street,
      number,
      neighborhood,
      complement,
      referencePoint,
      referredByCode: referredByCode.trim() || undefined,
    });

    if (result.isExistingLinked) {
      setAlertFeedback({
        type: 'info',
        text: result.message,
      });
    } else {
      setAlertFeedback({
        type: 'success',
        text: result.message,
      });
    }

    setTimeout(() => {
      setActiveModal(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#1F2421] border border-white/10 shadow-2xl text-left my-6 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
              {currentUser ? 'Meus Dados de Cadastro' : 'Entrar com Google & Cadastro'}
            </h2>
            <span className="text-xs text-stone-400">
              Pizzaria do Chefinho · Rio Branco - AC
            </span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="text-stone-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {alertFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${
                alertFeedback.type === 'success'
                  ? 'bg-[#008C45]/20 text-[#008C45] border border-[#008C45]/40'
                  : alertFeedback.type === 'info'
                  ? 'bg-amber-950/40 text-amber-200 border border-amber-500/30'
                  : 'bg-red-950/40 text-red-300 border border-red-500/30'
              }`}
            >
              {alertFeedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{alertFeedback.text}</span>
            </div>
          )}

          {googleAuthStep === 'pick_google' && !currentUser ? (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#008C45]/20 border border-[#008C45]/30 flex items-center justify-center text-[#008C45] mx-auto">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-[#FAF8F5]">Login Rápido e Seguro</h3>
                <p className="text-xs text-stone-300 max-w-sm mx-auto">
                  Faça login com sua conta do Google (Gmail) para acumular pontos de fidelidade (10 pedidos = 10% OFF) e salvar seus endereços.
                </p>
              </div>

              {/* Google Button */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSimulateGoogleLogin('kikomelosetembro2@gmail.com', 'Francisco Kiko Melo')
                  }
                  className="w-full py-3 px-4 rounded-xl bg-white text-gray-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow hover:bg-gray-100 transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Entrar com kikomelosetembro2@gmail.com</span>
                </button>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ou digite outro Gmail..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#262C29] border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#008C45]"
                  />
                  <button
                    type="button"
                    onClick={() => handleSimulateGoogleLogin(email, name || 'Cliente Google')}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition whitespace-nowrap"
                  >
                    Avançar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Linked Google Account Banner */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs text-stone-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#008C45]" />
                  <span>Google Gmail: <strong className="text-white">{email}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setGoogleAuthStep('pick_google')}
                  className="text-xs text-[#C8102E] font-semibold hover:underline"
                >
                  Trocar
                </button>
              </div>

              {/* 1. Nome Completo */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#FAF8F5]">
                  1. Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome e Sobrenome"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#262C29] border border-white/10 text-xs text-white focus:outline-none focus:border-[#008C45]"
                />
              </div>

              {/* 2. Telefone WhatsApp com Máscara */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#FAF8F5] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#008C45]" />
                    <span>2. Telefone WhatsApp (Rio Branco) *</span>
                  </label>
                  <span className="text-[11px] text-stone-400">DDD 68</span>
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(68) 9XXXX-XXXX"
                  maxLength={15}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#262C29] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-[#008C45]"
                />
              </div>

              {/* 3. Endereço Completo */}
              <div className="space-y-3 pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#008C45] uppercase tracking-wider">
                  <MapPin className="w-4 h-4 text-[#C8102E]" />
                  <span>3. Endereço Completo de Entrega</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] text-stone-400">Rua / Avenida *</label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ex: Rua das Mangueiras"
                      className="w-full px-3 py-2 rounded-xl bg-[#262C29] border border-white/10 text-xs text-white focus:outline-none focus:border-[#008C45]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-stone-400">Número *</label>
                    <input
                      type="text"
                      required
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="142"
                      className="w-full px-3 py-2 rounded-xl bg-[#262C29] border border-white/10 text-xs text-white focus:outline-none focus:border-[#008C45]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] text-stone-400">Bairro *</label>
                    <input
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Ex: Cidade do Povo"
                      className="w-full px-3 py-2 rounded-xl bg-[#262C29] border border-white/10 text-xs text-white focus:outline-none focus:border-[#008C45]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-stone-400">Complemento (opcional)</label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto 102, Casa 02, etc."
                      className="w-full px-3 py-2 rounded-xl bg-[#262C29] border border-white/10 text-xs text-white focus:outline-none focus:border-[#008C45]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-stone-400">Ponto de Referência *</label>
                  <input
                    type="text"
                    required
                    value={referencePoint}
                    onChange={(e) => setReferencePoint(e.target.value)}
                    placeholder="Ex: Próximo à Praça Principal da Cidade do Povo"
                    className="w-full px-3 py-2 rounded-xl bg-[#262C29] border border-white/10 text-xs text-white focus:outline-none focus:border-[#008C45]"
                  />
                </div>

                {/* Geographic Restriction Lock */}
                <div className="space-y-1">
                  <label className="text-[11px] text-stone-400">Cidade & Estado (Restrição Geográfica)</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#171B19] border border-white/10 text-xs text-stone-300">
                    <Lock className="w-3.5 h-3.5 text-[#008C45]" />
                    <span className="font-bold text-white">Rio Branco - AC</span>
                    <span className="text-[10px] text-stone-400 ml-auto">
                      Atendimento exclusivo para Rio Branco
                    </span>
                  </div>
                </div>

                {/* Referral Code */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] text-stone-400">
                    Código de Indicação de Amigo (opcional)
                  </label>
                  <input
                    type="text"
                    value={referredByCode}
                    onChange={(e) => setReferredByCode(e.target.value)}
                    placeholder="Ex: CHEFINHO-MARI"
                    className="w-full px-3 py-2 rounded-xl bg-[#262C29] border border-white/10 text-xs text-white uppercase focus:outline-none focus:border-[#008C45]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-[#C8102E] hover:bg-[#A90D26] text-white font-bold text-xs sm:text-sm shadow-xl shadow-[#C8102E]/25 active:scale-[0.98] transition-all"
              >
                Salvar Cadastro & Continuar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
