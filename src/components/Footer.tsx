import React from 'react';
import { Clock, Heart, MapPin, MessageCircle, Phone, Sliders } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getWhatsAppSupportUrl, WHATSAPP_FORMATTED_DISPLAY } from '../utils/whatsapp';

export const Footer: React.FC = () => {
  const { setActiveModal, isBusinessOpen, businessStatusText } = useApp();

  return (
    <footer className="mt-16 border-t border-white/10 bg-[#161A18] text-gray-400 text-xs">
      {/* Subtle Italian 3px tricolor bar atop footer */}
      <div className="w-full h-[3px] flex">
        <div className="flex-1 bg-[#008C45]" />
        <div className="flex-1 bg-[#FAF8F5]" />
        <div className="flex-1 bg-[#C8102E]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#008C45]/40 shadow bg-[#1F2421]">
                <img
                  src="/images/chefinho_artisan_logo_1794456662442.jpg"
                  alt="Pizzaria do Chefinho"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-lg font-extrabold text-[#FAF8F5] font-display block">
                  Pizzaria do Chefinho
                </span>
                <span className="text-xs text-[#008C45] font-semibold flex items-center gap-1">
                  Tradição Italiana & Forno a Lenha
                </span>
              </div>
            </div>
            <p className="text-xs text-stone-300 max-w-md leading-relaxed">
              Massa de fermentação natural lenta (48h), farinha italiana importada, molho de tomate San Marzano artesanal e queijos selecionados. Feito com amor e paixão no coração da Cidade do Povo em Rio Branco - AC.
            </p>
          </div>

          {/* Horários & Status */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#008C45]" />
              <span>Funcionamento</span>
            </h4>
            <div className="space-y-1 text-xs">
              <div className="text-[#FAF8F5] font-semibold">Quinta a Domingo</div>
              <div className="text-stone-300">18:00 às 23:00 (Rio Branco/AC)</div>
              <div className="text-stone-400 text-[11px] pt-1">
                Segunda a Quarta: Fechado para descanso e preparo das massas
              </div>
              <div className="pt-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                    isBusinessOpen
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {businessStatusText}
                </span>
              </div>
            </div>
          </div>

          {/* Contato & Localização */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#C8102E]" />
              <span>Onde Estamos</span>
            </h4>
            <div className="space-y-1 text-xs">
              <div className="text-[#FAF8F5]">Bairro Cidade do Povo</div>
              <div className="text-stone-300">Rio Branco - Acre, AC</div>
              <a
                href={getWhatsAppSupportUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-[#25D366] hover:underline font-bold"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Atendimento: {WHATSAPP_FORMATTED_DISPLAY}</span>
              </a>
              <div className="pt-2">
                <button
                  onClick={() => setActiveModal('admin')}
                  className="flex items-center gap-1 text-stone-400 hover:text-white transition text-[11px]"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Painel Administrativo & PDV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Web Desenvolvedor por: Francisco Araujo (Kiko) - (68) 99282-7744 */}
        <div
          className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 text-[10px] sm:text-[11px] text-stone-400 text-center sm:text-left"
          data-developer="Web Desenvolvedor por: Francisco Araujo (Kiko) - (68) 99282-7744"
        >
          <div className="space-y-1">
            <div>
              © {new Date().getFullYear()} Pizzaria do Chefinho. Todos os direitos reservados. Rio Branco - AC.
            </div>
            <p className="text-[10px] text-stone-500 tracking-wide">
              Web Desenvolvedor por:{' '}
              <span className="text-stone-400 font-medium">Francisco Araujo (Kiko)</span> -{' '}
              <a
                href="tel:+5568992827744"
                className="hover:text-[#008C45] transition-colors tabular-nums"
              >
                (68) 99282-7744
              </a>
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-end gap-0.5 text-[10px] sm:text-[11px]">
            <div className="flex items-center gap-1">
              <span>Autêntica receita italiana ·</span>
              <span className="text-[#008C45] font-semibold">Pizzaria do Chefinho</span>
            </div>
            <span className="text-[10px] text-stone-500">
              © {new Date().getFullYear()} Copyright
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
