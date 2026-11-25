export type ProductCategory =
  | 'pizzas_tradicionais'
  | 'pizzas_especiais'
  | 'esfihas_fechadas'
  | 'calzones'
  | 'sucos'
  | 'refrigerantes';

export type ProductSize = 'M' | 'G' | 'U';

export interface CrustOption {
  id: string;
  name: string;
  price: number;
}

export interface ExtraIngredient {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number; // For single size or Medium (M)
  priceLarge?: number; // For Large (G) if pizza
  image: string;
  available: boolean;
  isPopular?: boolean;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  category: ProductCategory;
  size?: ProductSize;
  crust?: CrustOption;
  extras: ExtraIngredient[];
  notes?: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export type OrderType = 'delivery' | 'retirada';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro';

export type OrderStatus =
  | 'pendente'
  | 'preparando'
  | 'em_entrega'
  | 'pronto_retirada'
  | 'concluido'
  | 'cancelado';

export interface CustomerAddress {
  street: string;
  number: string;
  neighborhood: string;
  complement?: string;
  referencePoint: string;
  city: 'Rio Branco - AC'; // Statically locked to Rio Branco - AC
}

export interface CustomerUser {
  uid: string;
  email: string;
  name: string;
  phone: string; // (68) 9XXXX-XXXX
  address: CustomerAddress;
  city: 'Rio Branco - AC';
  completedOrdersCount: number;
  loyaltyDiscountAvailable: boolean; // 10% after 10 orders
  referralCode: string; // Unique referral code (e.g., CHEFINHO-87X9)
  referralBonusAvailable: boolean; // 5% bonus for both parties
  referredByCode?: string;
  createdAt: string;
}

export interface PixProofValidation {
  status: 'validado' | 'atencao' | 'pendente';
  method: 'arquivo' | 'e2e_texto';
  transactionId?: string;
  bankName?: string;
  fileName?: string;
  fileSizeLabel?: string;
  detectedAmount?: number;
  amountMatches?: boolean;
  checks: string[];
  validatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: number;
  createdAt: string; // ISO String
  customer: {
    uid: string;
    name: string;
    phone: string;
    email: string;
    address?: CustomerAddress;
  };
  orderType: OrderType;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discountLoyalty: number; // 10% discount value
  discountReferral: number; // 5% discount value
  total: number;
  paymentMethod: PaymentMethod;
  pixProof?: PixProofValidation;
  changeFor?: number; // Valor entregue em dinheiro para troco
  changeReturn?: number; // Quanto o entregador leva de troco
  status: OrderStatus;
  notes?: string;
}

export interface WeeklyFinancialData {
  dayName: string;
  dateStr: string;
  isOperatingDay: boolean; // Quinta a Domingo
  deliveryRevenue: number;
  retiradaRevenue: number;
  deliveryOrdersCount: number;
  retiradaOrdersCount: number;
}
