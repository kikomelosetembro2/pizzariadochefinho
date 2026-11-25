import { Order } from '../types';

export const WHATSAPP_PHONE_NUMBER = '556899358084';
export const WHATSAPP_FORMATTED_DISPLAY = '+55 68 9935-8084';
export const WHATSAPP_PIX_KEY = '6899358084';

export function formatPriceBRL(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function buildKitchenWhatsAppMessage(order: Order): string {
  const isDelivery = order.orderType === 'delivery';
  const typeText = isDelivery ? '🛵 *ENTREGA (DELIVERY)*' : '🏪 *RETIRADA NO BALCÃO*';
  const dateFormatted = new Date(order.createdAt).toLocaleString('pt-BR', {
    timeZone: 'America/Rio_Branco',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentLabels: Record<string, string> = {
    pix: 'PIX (Chave WhatsApp)',
    cartao_credito: 'Cartão de Crédito na Entrega',
    cartao_debito: 'Cartão de Débito na Entrega',
    dinheiro: 'Dinheiro',
  };

  let msg = `🍕 *NOVO PEDIDO E COMPROVANTE - PIZZARIA DO CHEFINHO* 🍕\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🧾 *Pedido:* #${order.orderNumber}\n`;
  msg += `📅 *Data/Hora:* ${dateFormatted} (Rio Branco)\n`;
  msg += `📍 *Modalidade:* ${typeText}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `👤 *DADOS DO CLIENTE*\n`;
  msg += `• *Nome:* ${order.customer.name}\n`;
  msg += `• *WhatsApp:* ${order.customer.phone}\n`;

  if (isDelivery && order.customer.address) {
    const addr = order.customer.address;
    msg += `• *Endereço:* ${addr.street}, Nº ${addr.number}\n`;
    msg += `• *Bairro:* ${addr.neighborhood}\n`;
    if (addr.complement) msg += `• *Complemento:* ${addr.complement}\n`;
    if (addr.referencePoint) msg += `• *Ponto de Ref.:* ${addr.referencePoint}\n`;
    msg += `• *Cidade:* ${addr.city}\n`;
  } else {
    msg += `• *Local de Retirada:* Balcão Chefinho - Bairro Cidade do Povo, Rio Branco - AC\n`;
  }
  msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 *ITENS DO PEDIDO*\n\n`;

  order.items.forEach((item, index) => {
    const sizeLabel = item.size === 'G' ? 'Grande (8 fatias)' : item.size === 'M' ? 'Média (6 fatias)' : '';
    msg += `${index + 1}. *${item.quantity}x ${item.name}* ${sizeLabel ? `(${sizeLabel})` : ''}\n`;

    if (item.crust && item.crust.price > 0) {
      msg += `   ↳ *Borda:* ${item.crust.name} (+${formatPriceBRL(item.crust.price)})\n`;
    }

    if (item.extras && item.extras.length > 0) {
      const extrasStr = item.extras
        .map((e) => `${e.name} (+${formatPriceBRL(e.price)})`)
        .join(', ');
      msg += `   ↳ *Adicionais:* ${extrasStr}\n`;
    }

    if (item.notes && item.notes.trim()) {
      msg += `   ↳ *Obs:* _"${item.notes.trim()}"_\n`;
    }

    msg += `   ↳ *Subtotal Item:* ${formatPriceBRL(item.totalPrice)}\n\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `💰 *RESUMO FINANCEIRO*\n`;
  msg += `• *Subtotal dos Itens:* ${formatPriceBRL(order.subtotal)}\n`;

  if (isDelivery) {
    msg += `• *Taxa de Entrega:* ${formatPriceBRL(order.deliveryFee)}\n`;
  }

  if (order.discountLoyalty > 0) {
    msg += `• *Desconto Fidelidade (10%):* -${formatPriceBRL(order.discountLoyalty)}\n`;
  }

  if (order.discountReferral > 0) {
    msg += `• *Desconto Indicação (5%):* -${formatPriceBRL(order.discountReferral)}\n`;
  }

  msg += `• *VALOR TOTAL A PAGAR:* *${formatPriceBRL(order.total)}*\n`;
  msg += `• *Forma de Pagamento:* ${paymentLabels[order.paymentMethod] || order.paymentMethod}\n`;

  if (order.paymentMethod === 'dinheiro') {
    if (order.changeFor && order.changeFor > order.total) {
      msg += `• *Troco para:* ${formatPriceBRL(order.changeFor)}\n`;
      msg += `• *LEVAR DE TROCO:* *${formatPriceBRL(order.changeReturn || order.changeFor - order.total)}*\n`;
    } else {
      msg += `• *Troco:* Não necessita de troco (valor exato)\n`;
    }
  }

  if (order.paymentMethod === 'pix' && order.pixProof) {
    const statusLabel =
      order.pixProof.status === 'validado'
        ? '✅ VALIDADO NO CHECKOUT'
        : order.pixProof.status === 'atencao'
        ? '⚠️ CONFERIR COMPROVANTE'
        : '⏳ AGUARDANDO ENVIO';
    msg += `• *Status PIX:* ${statusLabel}\n`;
    if (order.pixProof.transactionId) {
      msg += `• *ID Transação (E2E):* ${order.pixProof.transactionId}\n`;
    }
    if (order.pixProof.bankName) {
      msg += `• *Banco Emissor:* ${order.pixProof.bankName}\n`;
    }
    if (order.pixProof.fileName) {
      msg += `• *Arquivo Anexado:* ${order.pixProof.fileName}\n`;
    }
  }

  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📎 _Comprovante/Comanda enviada pelo Cardápio Digital da Pizzaria do Chefinho_\n`;

  return msg;
}

export function buildPaymentProofWhatsAppMessage(order: Order): string {
  const paymentLabels: Record<string, string> = {
    pix: 'PIX',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    dinheiro: 'Dinheiro',
  };

  let msg = `🧾 *COMPROVANTE DE PAGAMENTO / PEDIDO #${order.orderNumber}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `👤 *Cliente:* ${order.customer.name}\n`;
  msg += `📱 *Telefone:* ${order.customer.phone}\n`;
  msg += `💳 *Pagamento:* ${paymentLabels[order.paymentMethod] || order.paymentMethod}\n`;
  msg += `💰 *Valor Total:* ${formatPriceBRL(order.total)}\n`;
  if (order.paymentMethod === 'pix' && order.pixProof) {
    msg += `✅ *Validação:* ${order.pixProof.status === 'validado' ? 'Comprovante validado no checkout' : 'Comprovante anexado'}\n`;
    if (order.pixProof.transactionId) {
      msg += `🔑 *E2E:* ${order.pixProof.transactionId}\n`;
    }
  }
  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📎 Olá! Segue o comprovante referente ao meu pedido #${order.orderNumber} na *Pizzaria do Chefinho*.`;

  return msg;
}

export function getWhatsAppSupportUrl(customText?: string): string {
  const text =
    customText ||
    'Olá! Gostaria de falar com o atendimento da Pizzaria do Chefinho.';
  return `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function getWhatsAppReceiptUrl(order: Order): string {
  const message = buildKitchenWhatsAppMessage(order);
  return `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function getWhatsAppPaymentProofUrl(order: Order): string {
  const message = buildPaymentProofWhatsAppMessage(order);
  return `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
}

function triggerExternalWhatsAppLink(url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function openWhatsAppKitchen(order: Order) {
  triggerExternalWhatsAppLink(getWhatsAppReceiptUrl(order));
}

export function openWhatsAppDirectHelp() {
  triggerExternalWhatsAppLink(getWhatsAppSupportUrl());
}
