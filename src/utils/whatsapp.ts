import { Order } from '../types';

export const WHATSAPP_PHONE_NUMBER = '5568992827744';
export const WHATSAPP_FORMATTED_DISPLAY = '(68) 99282-7744';

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

  let msg = `🍕 *NOVO PEDIDO - PIZZARIA DO CHEFINHO* 🍕\n`;
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

  msg += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `✨ _Pedido gerado pelo Cardápio Digital da Pizzaria do Chefinho_\n`;

  return msg;
}

export function openWhatsAppKitchen(order: Order) {
  const message = buildKitchenWhatsAppMessage(order);
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${encoded}`;
  window.open(url, '_blank');
}

export function openWhatsAppDirectHelp() {
  const text = encodeURIComponent('Olá Pizzaria do Chefinho! Gostaria de tirar uma dúvida sobre o cardápio.');
  window.open(`https://wa.me/${WHATSAPP_PHONE_NUMBER}?text=${text}`, '_blank');
}
