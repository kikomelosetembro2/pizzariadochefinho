import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CRUST_OPTIONS,
  EXTRA_INGREDIENTS,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
} from '../data/initialData';
import {
  CartItem,
  CrustOption,
  CustomerUser,
  ExtraIngredient,
  Order,
  OrderStatus,
  OrderType,
  PaymentMethod,
  Product,
  ProductCategory,
} from '../types';
import { checkBusinessHours, getOperatingHoursOverride, setOperatingHoursOverride } from '../utils/businessHours';

interface CreateOrderParams {
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  changeFor?: number;
  deliveryFee: number;
  notes?: string;
  useLoyaltyDiscount: boolean;
  useReferralDiscount: boolean;
}

export interface FCMNotification {
  id: string;
  orderNumber: number;
  title: string;
  body: string;
  timestamp: string;
}

interface AppContextType {
  products: Product[];
  crustOptions: CrustOption[];
  extraIngredients: ExtraIngredient[];
  orders: Order[];
  currentUser: CustomerUser | null;
  registeredUsers: CustomerUser[];
  cart: CartItem[];
  cartCount: number;
  cartSubtotal: number;
  isBusinessOpen: boolean;
  businessStatusText: string;
  businessDetailText: string;
  isSimulatedOpen: boolean | null;
  setSimulatedOpen: (open: boolean | null) => void;
  // FCM Notification
  fcmNotification: FCMNotification | null;
  dismissFcmNotification: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  // Cart Actions
  addToCart: (item: Omit<CartItem, 'cartItemId' | 'totalPrice'>) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  // Auth & Customer Actions
  loginWithGooglePrompt: () => void;
  completeCustomerRegistration: (data: {
    email: string;
    name: string;
    phone: string;
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
    referencePoint: string;
    referredByCode?: string;
  }) => { success: boolean; isExistingLinked: boolean; message: string };
  logout: () => void;
  // Order Actions
  createOrder: (params: CreateOrderParams) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  // Admin Product CRUD Actions
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  toggleProductAvailability: (id: string) => void;
  updateCrustPrice: (id: string, price: number) => void;
  updateExtraPrice: (id: string, price: number) => void;
  // Modals & Catalog Filter state
  activeModal: 'auth' | 'cart' | 'checkout' | 'product' | 'receipt' | 'profile' | 'admin' | null;
  setActiveModal: (modal: 'auth' | 'cart' | 'checkout' | 'product' | 'receipt' | 'profile' | 'admin' | null) => void;
  selectedProductForModal: Product | null;
  setSelectedProductForModal: (p: Product | null) => void;
  activeReceiptOrder: Order | null;
  setActiveReceiptOrder: (o: Order | null) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: ProductCategory | 'todas';
  setSelectedCategory: (category: ProductCategory | 'todas') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'chefinho_products_v1',
  CRUSTS: 'chefinho_crusts_v1',
  EXTRAS: 'chefinho_extras_v1',
  ORDERS: 'chefinho_orders_v1',
  USERS: 'chefinho_users_v1',
  CURRENT_USER: 'chefinho_current_user_v1',
  CART: 'chefinho_cart_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (!saved) return INITIAL_PRODUCTS;
      const parsed: Product[] = JSON.parse(saved);
      return parsed.map((p) => ({
        ...p,
        image: p.image?.startsWith('/src/assets/images/')
          ? p.image.replace('/src/assets/images/', '/images/')
          : p.image,
      }));
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Crusts
  const [crustOptions, setCrustOptions] = useState<CrustOption[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CRUSTS);
      return saved ? JSON.parse(saved) : CRUST_OPTIONS;
    } catch {
      return CRUST_OPTIONS;
    }
  });

  // Extras
  const [extraIngredients, setExtraIngredients] = useState<ExtraIngredient[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXTRAS);
      return saved ? JSON.parse(saved) : EXTRA_INGREDIENTS;
    } catch {
      return EXTRA_INGREDIENTS;
    }
  });

  // Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  // Registered Customers
  const [registeredUsers, setRegisteredUsers] = useState<CustomerUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  });

  // Current Logged In Customer
  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
      // Pre-authenticate demo customer (user-demo-1) for immediate friendly test experience
      return INITIAL_CUSTOMERS[0];
    } catch {
      return INITIAL_CUSTOMERS[0];
    }
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals & Navigation state
  const [activeModal, setActiveModal] = useState<'auth' | 'cart' | 'checkout' | 'product' | 'receipt' | 'profile' | 'admin' | null>(null);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'todas'>('todas');

  // FCM Cloud Messaging Notification State
  const [fcmNotification, setFcmNotification] = useState<FCMNotification | null>(null);

  // Business Hours status
  const [businessStatus, setBusinessStatus] = useState(() => checkBusinessHours());
  const [simulatedOpen, setSimulatedOpenState] = useState<boolean | null>(() => getOperatingHoursOverride());

  useEffect(() => {
    const timer = setInterval(() => {
      setBusinessStatus(checkBusinessHours());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const setSimulatedOpen = (open: boolean | null) => {
    setOperatingHoursOverride(open);
    setSimulatedOpenState(open);
    setBusinessStatus(checkBusinessHours());
  };

  // Sync state to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch {}
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CRUSTS, JSON.stringify(crustOptions));
    } catch {}
  }, [crustOptions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EXTRAS, JSON.stringify(extraIngredients));
    } catch {}
  }, [extraIngredients]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch {}
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(registeredUsers));
    } catch {}
  }, [registeredUsers]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // Cart calculations
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);

  const addToCart = (itemData: Omit<CartItem, 'cartItemId' | 'totalPrice'>) => {
    const itemTotal = itemData.unitPrice * itemData.quantity;
    const newItem: CartItem = {
      ...itemData,
      cartItemId: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      totalPrice: itemTotal,
    };
    setCart((prev) => [...prev, newItem]);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...item,
              quantity: newQty,
              totalPrice: item.unitPrice * newQty,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const loginWithGooglePrompt = () => {
    setActiveModal('auth');
  };

  const completeCustomerRegistration = (data: {
    email: string;
    name: string;
    phone: string;
    street: string;
    number: string;
    neighborhood: string;
    complement?: string;
    referencePoint: string;
    referredByCode?: string;
  }) => {
    // Normalization
    const cleanPhone = data.phone.trim();
    const cleanEmail = data.email.trim().toLowerCase();

    // Duplicate Check: Email or Phone
    const existingUser = registeredUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.phone.replace(/\D/g, '') === cleanPhone.replace(/\D/g, '')
    );

    if (existingUser) {
      // Update existing user with latest address/name while keeping their history & loyalty
      const updatedUser: CustomerUser = {
        ...existingUser,
        name: data.name.trim(),
        phone: cleanPhone,
        address: {
          street: data.street.trim(),
          number: data.number.trim(),
          neighborhood: data.neighborhood.trim(),
          complement: data.complement?.trim() || '',
          referencePoint: data.referencePoint.trim(),
          city: 'Rio Branco - AC',
        },
      };

      setRegisteredUsers((prev) =>
        prev.map((u) => (u.uid === existingUser.uid ? updatedUser : u))
      );
      setCurrentUser(updatedUser);

      return {
        success: true,
        isExistingLinked: true,
        message: `Cadastro já existente encontrado para ${existingUser.name}! Seus dados, histórico e cartão fidelidade foram vinculados com sucesso.`,
      };
    }

    // New User registration
    const newUid = `user-${Date.now()}`;
    const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newReferralCode = `CHEFINHO-${codeSuffix}`;

    // Validate if referral code provided exists
    let hasReferralBonus = false;
    if (data.referredByCode && data.referredByCode.trim()) {
      const referrer = registeredUsers.find(
        (u) => u.referralCode.toUpperCase() === data.referredByCode?.trim().toUpperCase()
      );
      if (referrer) {
        hasReferralBonus = true;
        // Grant bonus to referrer as well
        setRegisteredUsers((prev) =>
          prev.map((u) =>
            u.uid === referrer.uid ? { ...u, referralBonusAvailable: true } : u
          )
        );
      }
    }

    const newUser: CustomerUser = {
      uid: newUid,
      email: cleanEmail,
      name: data.name.trim(),
      phone: cleanPhone,
      address: {
        street: data.street.trim(),
        number: data.number.trim(),
        neighborhood: data.neighborhood.trim(),
        complement: data.complement?.trim() || '',
        referencePoint: data.referencePoint.trim(),
        city: 'Rio Branco - AC',
      },
      city: 'Rio Branco - AC',
      completedOrdersCount: 0,
      loyaltyDiscountAvailable: false,
      referralCode: newReferralCode,
      referralBonusAvailable: hasReferralBonus,
      referredByCode: data.referredByCode?.trim(),
      createdAt: new Date().toISOString(),
    };

    setRegisteredUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);

    return {
      success: true,
      isExistingLinked: false,
      message: `Bem-vindo à Pizzaria do Chefinho, ${newUser.name}! Seu cadastro foi realizado com sucesso.`,
    };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const createOrder = (params: CreateOrderParams): Order => {
    const nextOrderNum =
      orders.length > 0 ? Math.max(...orders.map((o) => o.orderNumber)) + 1 : 1053;

    let discountLoyalty = 0;
    let discountReferral = 0;

    if (params.useLoyaltyDiscount && currentUser?.loyaltyDiscountAvailable) {
      discountLoyalty = Number((cartSubtotal * 0.1).toFixed(2));
    }

    if (params.useReferralDiscount && currentUser?.referralBonusAvailable) {
      discountReferral = Number((cartSubtotal * 0.05).toFixed(2));
    }

    const deliveryFee = params.orderType === 'delivery' ? params.deliveryFee : 0;
    const finalTotal = Math.max(
      0,
      cartSubtotal + deliveryFee - discountLoyalty - discountReferral
    );

    let changeReturn: number | undefined = undefined;
    if (params.paymentMethod === 'dinheiro' && params.changeFor && params.changeFor > finalTotal) {
      changeReturn = Number((params.changeFor - finalTotal).toFixed(2));
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: nextOrderNum,
      createdAt: new Date().toISOString(),
      customer: {
        uid: currentUser?.uid || 'guest-user',
        name: currentUser?.name || 'Cliente Balcão',
        phone: currentUser?.phone || '(68) 99282-7744',
        email: currentUser?.email || 'cliente@chefinho.com.br',
        address: params.orderType === 'delivery' ? currentUser?.address : undefined,
      },
      orderType: params.orderType,
      items: [...cart],
      subtotal: cartSubtotal,
      deliveryFee,
      discountLoyalty,
      discountReferral,
      total: Number(finalTotal.toFixed(2)),
      paymentMethod: params.paymentMethod,
      changeFor: params.paymentMethod === 'dinheiro' ? params.changeFor : undefined,
      changeReturn,
      status: 'pendente',
      notes: params.notes,
    };

    // Save order
    setOrders((prev) => [newOrder, ...prev]);

    // Update customer loyalty status
    if (currentUser) {
      const newOrdersCount = currentUser.completedOrdersCount + 1;
      // Cycle resets when reaching 10 if used, or unlocks at 10
      let newLoyaltyAvailable = currentUser.loyaltyDiscountAvailable;

      if (params.useLoyaltyDiscount) {
        newLoyaltyAvailable = false;
      } else if (newOrdersCount % 10 === 0) {
        newLoyaltyAvailable = true;
      }

      const updatedUser: CustomerUser = {
        ...currentUser,
        completedOrdersCount: newOrdersCount,
        loyaltyDiscountAvailable: newLoyaltyAvailable,
        referralBonusAvailable: params.useReferralDiscount
          ? false
          : currentUser.referralBonusAvailable,
      };

      setCurrentUser(updatedUser);
      setRegisteredUsers((prev) =>
        prev.map((u) => (u.uid === currentUser.uid ? updatedUser : u))
      );
    }

    // Clear cart and show thermal receipt modal
    clearCart();
    setActiveReceiptOrder(newOrder);
    setActiveModal('receipt');

    return newOrder;
  };

  const dismissFcmNotification = () => {
    setFcmNotification(null);
  };

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      } catch {
        return false;
      }
    }
    return false;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    // FCM Notification Trigger: When status changes to 'em_entrega' (Saiu para Entrega)
    if (newStatus === 'em_entrega' && targetOrder) {
      const title = `🛵 Saiu para Entrega! Pedido #${targetOrder.orderNumber}`;
      const destination = targetOrder.customer.address?.street
        ? `${targetOrder.customer.address.street}, Nº ${targetOrder.customer.address.number} - ${targetOrder.customer.address.neighborhood}`
        : 'Rio Branco - AC';
      const body = `O motoboy da Pizzaria do Chefinho está a caminho com sua pizza quentinha! Destino: ${destination}.`;

      setFcmNotification({
        id: `fcm-${Date.now()}`,
        orderNumber: targetOrder.orderNumber,
        title,
        body,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });

      // Browser Web Notification API (FCM Client integration)
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
          });
        } catch {}
      }
    }
  };

  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...p,
      id: `prod-${Date.now()}`,
    };
    setProducts((prev) => [newProduct, ...prev]);
  };

  const updateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const toggleProductAvailability = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, available: !p.available } : p))
    );
  };

  const updateCrustPrice = (id: string, price: number) => {
    setCrustOptions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, price } : c))
    );
  };

  const updateExtraPrice = (id: string, price: number) => {
    setExtraIngredients((prev) =>
      prev.map((e) => (e.id === id ? { ...e, price } : e))
    );
  };

  return (
    <AppContext.Provider
      value={{
        products,
        crustOptions,
        extraIngredients,
        orders,
        currentUser,
        registeredUsers,
        cart,
        cartCount,
        cartSubtotal,
        isBusinessOpen: businessStatus.isOpen,
        businessStatusText: businessStatus.statusText,
        businessDetailText: businessStatus.statusDetail,
        isSimulatedOpen: simulatedOpen,
        setSimulatedOpen,
        fcmNotification,
        dismissFcmNotification,
        requestNotificationPermission,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        loginWithGooglePrompt,
        completeCustomerRegistration,
        logout,
        createOrder,
        updateOrderStatus,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductAvailability,
        updateCrustPrice,
        updateExtraPrice,
        activeModal,
        setActiveModal,
        selectedProductForModal,
        setSelectedProductForModal,
        activeReceiptOrder,
        setActiveReceiptOrder,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
