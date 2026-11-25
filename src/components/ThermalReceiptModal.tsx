import React from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  MessageCircle,
  Printer,
  Receipt,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order } from '../types';
import {
  formatPriceBRL,
  getWhatsAppPaymentProofUrl,
  getWhatsAppReceiptUrl,
  getWhatsAppSupportUrl,
  WHATSAPP_FORMATTED_DISPLAY,
} from '../utils/whatsapp';

export const ThermalReceiptModal: React.FC = () => {
  const { activeModal, setActiveModal, activeReceiptOrder, setActiveReceiptOrder } = useApp();
  const [copied, setCopied] = React.useState(false);

  const order: Order | null = activeReceiptOrder;

  if (activeModal !== 'receipt' || !order) return null;

  const isDelivery = order.orderType === 'delivery';

  const dateFormatted = new Date(order.createdAt).toLocaleString('pt-BR', {
    timeZone: 'America/Rio_Branco',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summary = `Pedido #${order.orderNumber} - Pizzaria do Chefinho\nTotal: ${formatPriceBRL(
      order.total
    )}\nWhatsApp: ${WHATSAPP_FORMATTED_DISPLAY}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setActiveModal(null);
    setActiveReceiptOrder(null);
  };

  const paymentLabels: Record<string, string> = {
    pix: 'PIX (Chave Celular)',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    dinheiro: 'Dinheiro à Vista',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg my-6 flex flex-col items-center">
        {/* Action Controls Bar */}
        <div className="w-full mb-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#008C45]" />
            <span className="font-bold text-sm">Comanda PDV · Cupom Térmico</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
              title="Imprimir Comanda em Impressora Térmica"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 80mm Authentic Thermal Receipt Container */}
        <div
          id="thermal-receipt-print"
          className="w-full max-w-[360px] bg-[#FFFDF5] text-black font-mono text-[12px] leading-snug p-6 rounded-sm shadow-2xl border border-gray-300 relative select-text"
        >
          {/* Serrated Top Edge visual */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[radial-gradient(circle,_transparent_3px,_#FFFDF5_3px)] bg-[length:8px_8px] -mt-1" />

          {/* Header */}
          <div className="text-center pb-2 border-b-2 border-dashed border-black">
            <h1 className="text-base font-black uppercase tracking-wider font-sans">
              PIZZARIA DO CHEFINHO
            </h1>
            <p className="text-[11px] font-sans">FORNO A LENHA & PIZZA ARTESANAL</p>
            <p className="text-[11px] mt-0.5">Bairro Cidade do Povo, Rio Branco - AC</p>
            <p className="text-[11px]">WhatsApp: {WHATSAPP_FORMATTED_DISPLAY}</p>
            <p className="text-[10px] mt-1 text-gray-600">CNPJ: 45.123.890/0001-44</p>
          </div>

          {/* Order Details Header */}
          <div className="py-2 border-b border-dashed border-black space-y-0.5">
            <div className="flex justify-between items-center text-sm font-black">
              <span>PEDIDO #{order.orderNumber}</span>
              <span className="uppercase text-[11px] px-1 bg-black text-white">
                {isDelivery ? 'DELIVERY' : 'BALCÃO'}
              </span>
            </div>
            <div className="text-[11px] text-gray-700">Data: {dateFormatted} (Rio Branco)</div>
            <div className="text-[11px] text-gray-700">
              Status:{' '}
              {
                {
                  pendente: 'PENDENTE COZINHA',
                  preparando: 'EM PREPARO',
                  em_entrega: 'SAIU PARA ENTREGA',
                  pronto_retirada: 'PRONTO P/ RETIRADA',
                  concluido: 'CONCLUÍDO',
                  cancelado: 'CANCELADO',
                }[order.status]
              }
            </div>
          </div>

          {/* Customer Info */}
          <div className="py-2 border-b border-dashed border-black space-y-0.5">
            <div className="font-bold uppercase text-[11px]">CLIENTE:</div>
            <div>{order.customer.name}</div>
            <div>Tel: {order.customer.phone}</div>
            {isDelivery && order.customer.address ? (
              <div className="pt-0.5">
                <div>
                  End: {order.customer.address.street}, Nº {order.customer.address.number}
                  {order.customer.address.complement && ` (${order.customer.address.complement})`}
                </div>
                <div>Bairro: {order.customer.address.neighborhood}</div>
                <div>Ref: {order.customer.address.referencePoint}</div>
                <div>Cidade: {order.customer.address.city}</div>
              </div>
            ) : (
              <div className="italic text-gray-700">Retirada no Balcão da Pizzaria</div>
            )}
          </div>

          {/* Items Header */}
          <div className="py-2 border-b-2 border-black">
            <div className="flex justify-between font-bold text-[11px] pb-1 uppercase border-b border-black">
              <span>QTD ITEM</span>
              <span>TOTAL</span>
            </div>

            <div className="space-y-2 pt-1.5">
              {order.items.map((item, index) => (
                <div key={index} className="text-[11px]">
                  <div className="flex justify-between font-bold">
                    <span>
                      {item.quantity}x {item.name}{' '}
                      {item.size && item.size !== 'U' && `(${item.size === 'G' ? 'Grande' : 'Média'})`}
                    </span>
                    <span>{formatPriceBRL(item.totalPrice)}</span>
                  </div>

                  {item.crust && item.crust.price > 0 && (
                    <div className="pl-3 text-[10px] text-gray-800">
                      + Borda: {item.crust.name} ({formatPriceBRL(item.crust.price)})
                    </div>
                  )}

                  {item.extras && item.extras.length > 0 && (
                    <div className="pl-3 text-[10px] text-gray-800">
                      + Extras: {item.extras.map((e) => e.name).join(', ')}
                    </div>
                  )}

                  {item.notes && (
                    <div className="pl-3 text-[10px] italic text-gray-700 font-sans">
                      Obs: "{item.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Calculations */}
          <div className="py-2 border-b-2 border-dashed border-black space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>SUBTOTAL DOS ITENS:</span>
              <span>{formatPriceBRL(order.subtotal)}</span>
            </div>

            {isDelivery && (
              <div className="flex justify-between text-[11px]">
                <span>TAXA DE ENTREGA:</span>
                <span>{formatPriceBRL(order.deliveryFee)}</span>
              </div>
            )}

            {order.discountLoyalty > 0 && (
              <div className="flex justify-between text-[11px] font-bold">
                <span>DESC. FIDELIDADE (10%):</span>
                <span>-{formatPriceBRL(order.discountLoyalty)}</span>
              </div>
            )}

            {order.discountReferral > 0 && (
              <div className="flex justify-between text-[11px] font-bold">
                <span>DESC. INDICAÇÃO (5%):</span>
                <span>-{formatPriceBRL(order.discountReferral)}</span>
              </div>
            )}

            <div className="flex justify-between font-black text-sm pt-1 border-t border-black">
              <span>TOTAL DO PEDIDO:</span>
              <span>{formatPriceBRL(order.total)}</span>
            </div>
          </div>

          {/* Payment & Change Info */}
          <div className="py-2 border-b border-dashed border-black text-[11px] space-y-0.5">
            <div className="flex justify-between font-bold">
              <span>FORMA PGTO:</span>
              <span>{paymentLabels[order.paymentMethod] || order.paymentMethod}</span>
            </div>

            {order.paymentMethod === 'dinheiro' && (
              <>
                {order.changeFor && order.changeFor > order.total ? (
                  <>
                    <div className="flex justify-between">
                      <span>VALOR PAGO EM DINHEIRO:</span>
                      <span>{formatPriceBRL(order.changeFor)}</span>
                    </div>
                    <div className="flex justify-between font-black bg-black text-white px-1">
                      <span>LEVAR DE TROCO:</span>
                      <span>{formatPriceBRL(order.changeReturn || order.changeFor - order.total)}</span>
                    </div>
                  </>
                ) : (
                  <div className="italic">Troco: Não precisa de troco (valor exato)</div>
                )}
              </>
            )}

            {order.paymentMethod === 'pix' && order.pixProof && (
              <div className="pt-1 text-[10px] space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>COMPROVANTE PIX:</span>
                  <span className="px-1 bg-black text-white uppercase">
                    {order.pixProof.status === 'validado' ? 'VALIDADO' : 'ANEXADO'}
                  </span>
                </div>
                {order.pixProof.bankName && (
                  <div>Banco: {order.pixProof.bankName}</div>
                )}
                {order.pixProof.transactionId && (
                  <div className="break-all">E2E: {order.pixProof.transactionId}</div>
                )}
                {order.pixProof.fileName && (
                  <div className="truncate">Arq: {order.pixProof.fileName}</div>
                )}
              </div>
            )}

            {order.notes && (
              <div className="pt-1 text-[10px] font-sans">
                <strong>OBS GERAL:</strong> {order.notes}
              </div>
            )}
          </div>

          {/* Simulated Barcode */}
          <div className="pt-4 text-center space-y-1">
            <div className="font-mono text-xs tracking-[4px] font-black">
              ||| | ||||| || |||| ||| |||| |
            </div>
            <div className="text-[9px] tracking-widest text-gray-600">
              *CHEFINHO-{order.orderNumber}-{order.id.slice(-4)}*
            </div>
            <p className="text-[10px] font-sans text-gray-700 pt-2">
              Agradecemos a sua preferência!<br />
              Volte sempre à Pizzaria do Chefinho.
            </p>
          </div>
        </div>

        {/* Action Buttons Below Ticket */}
        <div className="w-full max-w-[360px] mt-4 space-y-2">
          <a
            href={getWhatsAppReceiptUrl(order)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Enviar Comanda e Comprovante ({WHATSAPP_FORMATTED_DISPLAY})</span>
          </a>

          <a
            href={getWhatsAppPaymentProofUrl(order)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-[#008C45]/20 hover:bg-[#008C45]/30 border border-[#008C45]/40 text-[#FAF8F5] font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            <Receipt className="w-4 h-4 text-[#008C45]" />
            <span>Enviar Comprovante PIX / Pagamento</span>
          </a>

          <div className="flex gap-2">
            <button
              onClick={handleCopySummary}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar Resumo'}</span>
            </button>

            <button
              onClick={handleClose}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#008C45] hover:bg-[#007338] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir Pedido</span>
            </button>
          </div>
          <a
            href={getWhatsAppSupportUrl(`Olá! Preciso de atendimento sobre meu Pedido #${order.orderNumber} na Pizzaria do Chefinho.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 text-center text-[11px] font-semibold text-stone-300 hover:text-[#25D366] transition block"
          >
            Precisa de ajuda? Falar com Atendimento ({WHATSAPP_FORMATTED_DISPLAY})
          </a>
        </div>
      </div>
    </div>
  );
};
