import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  Bell,
  Check,
  Clock,
  DollarSign,
  Edit2,
  Leaf,
  Lock,
  LogOut,
  Package,
  Plus,
  Printer,
  Receipt,
  Search,
  Store,
  Trash2,
  TrendingUp,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderStatus, ProductCategory, Product } from '../types';
import { formatPriceBRL } from '../utils/whatsapp';

export const AdminDashboard: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    orders,
    updateOrderStatus,
    setActiveReceiptOrder,
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductAvailability,
    crustOptions,
    extraIngredients,
    updateCrustPrice,
    updateExtraPrice,
    registeredUsers,
  } = useApp();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'pedidos' | 'produtos' | 'financeiro'>('pedidos');

  // Orders Filter
  const [orderFilter, setOrderFilter] = useState<string>('todos');

  // Product CRUD states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState<boolean>(false);
  const [productSearch, setProductSearch] = useState<string>('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdCat, setNewProdCat] = useState<ProductCategory>('pizzas_tradicionais');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdPriceLarge, setNewProdPriceLarge] = useState('');

  if (activeModal !== 'admin') return null;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin123' || adminPasswordInput === 'chefinho') {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Senha incorreta. A senha padrão de teste é "admin123".');
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === 'todos') return true;
    return o.status === orderFilter;
  });

  // Financial Dashboard Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== 'cancelado' ? o.total : 0), 0);
  const validOrders = orders.filter((o) => o.status !== 'cancelado');
  const totalValidOrdersCount = validOrders.length;
  const averageTicket = totalValidOrdersCount > 0 ? totalRevenue / totalValidOrdersCount : 0;

  // Separation: Delivery vs Retirada
  const deliveryOrders = validOrders.filter((o) => o.orderType === 'delivery');
  const retiradaOrders = validOrders.filter((o) => o.orderType === 'retirada');

  const deliveryRevenue = deliveryOrders.reduce((sum, o) => sum + o.total, 0);
  const retiradaRevenue = retiradaOrders.reduce((sum, o) => sum + o.total, 0);

  const deliveryPercentage = totalRevenue > 0 ? (deliveryRevenue / totalRevenue) * 100 : 0;
  const retiradaPercentage = totalRevenue > 0 ? (retiradaRevenue / totalRevenue) * 100 : 0;

  // Weekly Balance (Segunda a Domingo, highlighting Quinta a Domingo)
  const weekDays = [
    { name: 'Segunda', isOperating: false, short: 'Seg' },
    { name: 'Terça', isOperating: false, short: 'Ter' },
    { name: 'Quarta', isOperating: false, short: 'Qua' },
    { name: 'Quinta', isOperating: true, short: 'Qui' },
    { name: 'Sexta', isOperating: true, short: 'Sex' },
    { name: 'Sábado', isOperating: true, short: 'Sáb' },
    { name: 'Domingo', isOperating: true, short: 'Dom' },
  ];

  const weeklyData = weekDays.map((d, idx) => {
    let dayDeliveryRev = 0;
    let dayRetiradaRev = 0;
    let dayDeliveryCount = 0;
    let dayRetiradaCount = 0;

    if (d.short === 'Qui') {
      dayDeliveryRev = 105.0;
      dayDeliveryCount = 1;
    } else if (d.short === 'Sex') {
      dayRetiradaRev = 64.6;
      dayRetiradaCount = 1;
    } else if (d.short === 'Sáb') {
      dayDeliveryRev = 105.0;
      dayDeliveryCount = 1;
    } else if (d.short === 'Dom') {
      dayDeliveryRev = 97.0;
      dayRetiradaRev = 88.2;
      dayDeliveryCount = 1;
      dayRetiradaCount = 1;
    }

    if (idx === 3 && orders.length > 5) {
      const extraOrders = orders.slice(0, orders.length - 5);
      extraOrders.forEach((eo) => {
        if (eo.status !== 'cancelado') {
          if (eo.orderType === 'delivery') {
            dayDeliveryRev += eo.total;
            dayDeliveryCount++;
          } else {
            dayRetiradaRev += eo.total;
            dayRetiradaCount++;
          }
        }
      });
    }

    const dayTotal = dayDeliveryRev + dayRetiradaRev;
    return {
      ...d,
      deliveryRev: dayDeliveryRev,
      retiradaRev: dayRetiradaRev,
      totalRev: dayTotal,
      deliveryCount: dayDeliveryCount,
      retiradaCount: dayRetiradaCount,
      totalCount: dayDeliveryCount + dayRetiradaCount,
    };
  });

  const maxDayRevenue = Math.max(...weeklyData.map((w) => w.totalRev), 150);

  const handleSaveNewProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;

    const basePriceNum = parseFloat(newProdPrice.replace(',', '.')) || 0;
    const largePriceNum = newProdPriceLarge ? parseFloat(newProdPriceLarge.replace(',', '.')) : undefined;

    addProduct({
      name: newProdName.trim(),
      category: newProdCat,
      description: newProdDesc.trim() || 'Receita italiana da casa preparada artesanalmente.',
      price: basePriceNum,
      priceLarge: largePriceNum,
      image: '/src/assets/images/pizza_calabresa_special_1794456660537.jpg',
      available: true,
    });

    setIsAddingProduct(false);
    setNewProdName('');
    setNewProdDesc('');
    setNewProdPrice('');
    setNewProdPriceLarge('');
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct);
    setEditingProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-[#1F2421] border border-white/10 shadow-2xl text-left my-4 max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Subtle Italian 3px Tricolor Header Accent */}
        <div className="h-[3px] w-full grid grid-cols-3">
          <div className="bg-[#008C45]" />
          <div className="bg-[#FAF8F5]" />
          <div className="bg-[#C8102E]" />
        </div>

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#171B19] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#008C45]/20 flex items-center justify-center text-[#008C45] border border-[#008C45]/40 font-bold">
              PDV
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#FAF8F5] font-display">
                Pizzaria do Chefinho · Painel Administrativo & PDV
              </h2>
              <span className="text-xs text-stone-400">
                Gestão de Pedidos com Notificação FCM, Cardápio e Balanço Financeiro
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-xs text-stone-400 hover:text-white flex items-center gap-1 p-1.5 rounded-lg hover:bg-white/5 transition"
                title="Bloquear Painel"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Bloquear</span>
              </button>
            )}
            <button
              onClick={() => setActiveModal(null)}
              className="text-stone-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 text-center max-w-sm mx-auto my-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#008C45]/20 flex items-center justify-center text-[#008C45] mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#FAF8F5]">Acesso Restrito ao PDV</h3>
            <p className="text-xs text-stone-400">
              Digite a senha de administrador da Pizzaria do Chefinho para gerenciar pedidos e produtos.
            </p>

            <form onSubmit={handleAdminLogin} className="space-y-3 pt-2">
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                placeholder="Senha (Dica de teste: admin123)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#262C29] border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#008C45]"
              />

              {authError && <div className="text-xs text-red-400">{authError}</div>}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#C8102E] hover:bg-[#A90D26] text-white text-xs font-bold transition shadow"
              >
                Entrar no Painel
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Tabs Navigation */}
            <div className="px-4 sm:px-6 pt-3 border-b border-white/10 bg-[#171B19] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setActiveTab('pedidos')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'pedidos'
                    ? 'border-[#008C45] text-[#008C45]'
                    : 'border-transparent text-stone-400 hover:text-white'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Gestão de Pedidos (PDV)</span>
                <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] flex items-center justify-center">
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('produtos')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'produtos'
                    ? 'border-[#008C45] text-[#008C45]'
                    : 'border-transparent text-stone-400 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Gestão do Cardápio (CRUD)</span>
              </button>

              <button
                onClick={() => setActiveTab('financeiro')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  activeTab === 'financeiro'
                    ? 'border-[#008C45] text-[#008C45]'
                    : 'border-transparent text-stone-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Dashboard Financeiro Semanal</span>
              </button>
            </div>

            {/* TAB 1: GESTÃO DE PEDIDOS (PDV) */}
            {activeTab === 'pedidos' && (
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                {/* Orders Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {['todos', 'pendente', 'preparando', 'em_entrega', 'concluido'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setOrderFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                          orderFilter === status
                            ? 'bg-[#008C45] text-white shadow'
                            : 'bg-white/5 text-stone-400 hover:text-white'
                        }`}
                      >
                        {status === 'todos'
                          ? 'Todos'
                          : status === 'em_entrega'
                          ? 'Saiu p/ Entrega'
                          : status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <span className="text-xs text-stone-400">
                    {filteredOrders.length} pedido(s) listado(s)
                  </span>
                </div>

                {/* Orders Grid / Cards */}
                <div className="space-y-3">
                  {filteredOrders.map((ord) => {
                    const isDelivery = ord.orderType === 'delivery';
                    return (
                      <div
                        key={ord.id}
                        className="p-4 rounded-xl bg-[#262C29] border border-white/5 space-y-3 text-left hover:border-white/15 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-base font-extrabold text-[#FAF8F5] font-mono">
                              #{ord.orderNumber}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded font-extrabold uppercase ${
                                isDelivery
                                  ? 'bg-[#C8102E]/20 text-[#C8102E] border border-[#C8102E]/30'
                                  : 'bg-[#008C45]/20 text-[#008C45] border border-[#008C45]/30'
                              }`}
                            >
                              {isDelivery ? '🛵 DELIVERY' : '🏪 RETIRADA'}
                            </span>
                            <span className="text-xs text-stone-400">
                              {new Date(ord.createdAt).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}{' '}
                              · {new Date(ord.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-[#C8102E] tabular-nums">
                              {formatPriceBRL(ord.total)}
                            </span>
                            <button
                              onClick={() => {
                                setActiveReceiptOrder(ord);
                                setActiveModal('receipt');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition"
                              title="Reimprimir Comanda Térmica"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Comanda</span>
                            </button>
                          </div>
                        </div>

                        {/* Customer & Address */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-stone-300">
                          <div>
                            <span className="text-stone-400">Cliente:</span>{' '}
                            <strong className="text-white">{ord.customer.name}</strong> (
                            {ord.customer.phone})
                            {ord.paymentMethod === 'dinheiro' && ord.changeFor && (
                              <div className="text-amber-300 font-bold mt-0.5">
                                ↳ Levar Troco: {formatPriceBRL(ord.changeReturn || ord.changeFor - ord.total)}{' '}
                                (Pago com {formatPriceBRL(ord.changeFor)})
                              </div>
                            )}
                          </div>
                          <div>
                            {isDelivery && ord.customer.address ? (
                              <span>
                                <span className="text-stone-400">Endereço:</span>{' '}
                                {ord.customer.address.street}, {ord.customer.address.number} -{' '}
                                {ord.customer.address.neighborhood} ({ord.customer.address.referencePoint})
                              </span>
                            ) : (
                              <span className="text-[#008C45] italic font-semibold">
                                Retirada no balcão da pizzaria
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Items preview */}
                        <div className="p-2.5 rounded-lg bg-[#1F2421] text-xs text-stone-300 space-y-1">
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>
                                {it.quantity}x {it.name}{' '}
                                {it.size && it.size !== 'U' && `(${it.size})`}
                                {it.crust && it.crust.price > 0 && ` [Borda: ${it.crust.name}]`}
                                {it.extras && it.extras.length > 0 && (
                                  <span className="text-stone-400">
                                    {' '}
                                    + {it.extras.map((e) => e.name).join(', ')}
                                  </span>
                                )}
                              </span>
                              <span className="tabular-nums font-semibold text-stone-400">
                                {formatPriceBRL(it.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Status Pipeline Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <span className="text-xs text-stone-400">
                            Status Atual:{' '}
                            <strong className="text-white uppercase font-bold">
                              {ord.status === 'em_entrega' ? 'Saiu para Entrega (FCM)' : ord.status}
                            </strong>
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateOrderStatus(ord.id, 'preparando')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                ord.status === 'preparando'
                                  ? 'bg-[#C8102E] text-white'
                                  : 'bg-white/5 text-stone-300 hover:bg-white/10'
                              }`}
                            >
                              Em Preparo
                            </button>

                            {/* Status button that triggers FCM notification */}
                            <button
                              onClick={() =>
                                updateOrderStatus(ord.id, isDelivery ? 'em_entrega' : 'pronto_retirada')
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                                ord.status === 'em_entrega' || ord.status === 'pronto_retirada'
                                  ? 'bg-[#008C45] text-white'
                                  : 'bg-white/5 text-stone-300 hover:bg-white/10'
                              }`}
                              title={
                                isDelivery
                                  ? 'Dispara Notificação FCM automática para o cliente!'
                                  : 'Avisa que está pronto'
                              }
                            >
                              <Bell className="w-3 h-3" />
                              <span>{isDelivery ? 'Saiu p/ Entrega (FCM)' : 'Pronto p/ Retirada'}</span>
                            </button>

                            <button
                              onClick={() => updateOrderStatus(ord.id, 'concluido')}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                                ord.status === 'concluido'
                                  ? 'bg-[#008C45] text-white'
                                  : 'bg-white/5 text-stone-300 hover:bg-white/10'
                              }`}
                            >
                              Concluído
                            </button>

                            <button
                              onClick={() => updateOrderStatus(ord.id, 'cancelado')}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-red-400/80 hover:text-red-400 hover:bg-red-950/30 transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: GESTÃO DO CARDÁPIO (CRUD) */}
            {activeTab === 'produtos' && (
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
                {/* Header Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Pesquisar produto..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#262C29] border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#008C45]"
                    />
                  </div>

                  <button
                    onClick={() => setIsAddingProduct(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#008C45] hover:bg-[#00753a] text-white text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Novo Produto</span>
                  </button>
                </div>

                {/* Add Product Form */}
                {isAddingProduct && (
                  <form
                    onSubmit={handleSaveNewProduct}
                    className="p-4 rounded-xl bg-[#262C29] border border-[#008C45]/40 space-y-3 text-left"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <h4 className="text-sm font-bold text-[#FAF8F5]">Cadastrar Novo Produto</h4>
                      <button
                        type="button"
                        onClick={() => setIsAddingProduct(false)}
                        className="text-stone-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-stone-400">Nome do Produto *</label>
                        <input
                          type="text"
                          required
                          value={newProdName}
                          onChange={(e) => setNewProdName(e.target.value)}
                          placeholder="Ex: Pizza Margherita Di Bufala"
                          className="w-full px-3 py-2 rounded-lg bg-[#1F2421] border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-stone-400">Categoria *</label>
                        <select
                          value={newProdCat}
                          onChange={(e) => setNewProdCat(e.target.value as ProductCategory)}
                          className="w-full px-3 py-2 rounded-lg bg-[#1F2421] border border-white/10 text-xs text-white"
                        >
                          <option value="pizzas_tradicionais">Pizzas Tradicionais</option>
                          <option value="pizzas_especiais">Pizzas Especiais</option>
                          <option value="esfihas_fechadas">Esfihas Fechadas</option>
                          <option value="calzones">Calzones</option>
                          <option value="sucos">Sucos</option>
                          <option value="refrigerantes">Refrigerantes</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-stone-400">Descrição / Ingredientes</label>
                      <input
                        type="text"
                        value={newProdDesc}
                        onChange={(e) => setNewProdDesc(e.target.value)}
                        placeholder="Ex: Molho San Marzano, queijo fresco, manjericão..."
                        className="w-full px-3 py-2 rounded-lg bg-[#1F2421] border border-white/10 text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-stone-400">
                          Preço Base / Tamanho M (R$) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={newProdPrice}
                          onChange={(e) => setNewProdPrice(e.target.value)}
                          placeholder="48.00"
                          className="w-full px-3 py-2 rounded-lg bg-[#1F2421] border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-stone-400">
                          Preço Tamanho Grande G (R$) (opcional)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={newProdPriceLarge}
                          onChange={(e) => setNewProdPriceLarge(e.target.value)}
                          placeholder="62.00"
                          className="w-full px-3 py-2 rounded-lg bg-[#1F2421] border border-white/10 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingProduct(false)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-stone-300 text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-[#008C45] text-white text-xs font-bold"
                      >
                        Salvar Produto
                      </button>
                    </div>
                  </form>
                )}

                {/* Edit Product Form */}
                {editingProduct && (
                  <form
                    onSubmit={handleSaveEditProduct}
                    className="p-4 rounded-xl bg-[#262C29] border border-[#008C45]/50 space-y-3 text-left"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <h4 className="text-sm font-bold text-[#FAF8F5]">
                        Editar Produto: {editingProduct.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="text-stone-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] text-stone-400">Nome</label>
                        <input
                          type="text"
                          value={editingProduct.name}
                          onChange={(e) =>
                            setEditingProduct({ ...editingProduct, name: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#1F2421] border border-white/10 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-stone-400">Preço Principal / M (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingProduct.price}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#1F2421] border border-white/10 text-xs text-white"
                        />
                      </div>
                    </div>

                    {editingProduct.priceLarge !== undefined && (
                      <div className="space-y-1">
                        <label className="text-[11px] text-stone-400">Preço Tamanho G (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingProduct.priceLarge}
                          onChange={(e) =>
                            setEditingProduct({
                              ...editingProduct,
                              priceLarge: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-[#1F2421] border border-white/10 text-xs text-white"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[11px] text-stone-400">Descrição</label>
                      <input
                        type="text"
                        value={editingProduct.description}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, description: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg bg-[#1F2421] border border-white/10 text-xs text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 text-stone-300 text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-[#008C45] text-white text-xs font-bold"
                      >
                        Atualizar Produto
                      </button>
                    </div>
                  </form>
                )}

                {/* Products Table */}
                <div className="rounded-xl border border-white/5 overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-300">
                    <thead className="bg-[#171B19] text-stone-400 uppercase text-[10px] tracking-wider border-b border-white/5">
                      <tr>
                        <th className="py-2.5 px-3">Produto</th>
                        <th className="py-2.5 px-3">Categoria</th>
                        <th className="py-2.5 px-3">Preço</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {products
                        .filter(
                          (p) =>
                            !productSearch ||
                            p.name.toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .map((prod) => (
                          <tr key={prod.id} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-3 font-medium text-white max-w-xs truncate">
                              {prod.name}
                            </td>
                            <td className="py-2.5 px-3 text-stone-400 capitalize">
                              {prod.category.replace('_', ' ')}
                            </td>
                            <td className="py-2.5 px-3 font-bold tabular-nums text-[#C8102E]">
                              {formatPriceBRL(prod.price)}
                              {prod.priceLarge ? ` / ${formatPriceBRL(prod.priceLarge)}` : ''}
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => toggleProductAvailability(prod.id)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                                  prod.available
                                    ? 'bg-[#008C45]/20 text-[#008C45] hover:bg-[#008C45]/30'
                                    : 'bg-red-950/40 text-red-300 hover:bg-red-900'
                                }`}
                                title="Clique para alternar disponibilidade"
                              >
                                {prod.available ? 'Ativo' : 'Pausado'}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right space-x-1">
                              <button
                                onClick={() => setEditingProduct(prod)}
                                className="p-1 rounded bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteProduct(prod.id)}
                                className="p-1 rounded bg-white/5 hover:bg-red-950/40 text-red-400"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Preços de Bordas e Ingredientes Extras */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  {/* Bordas */}
                  <div className="p-4 rounded-xl bg-[#262C29] border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold text-[#FAF8F5] uppercase tracking-wider">
                      Preços de Bordas Recheadas
                    </h4>
                    <div className="space-y-2">
                      {crustOptions.map((crust) => (
                        <div key={crust.id} className="flex items-center justify-between text-xs">
                          <span className="text-stone-300 truncate max-w-[200px]">{crust.name}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-stone-500 text-[11px]">R$</span>
                            <input
                              type="number"
                              step="0.5"
                              value={crust.price}
                              onChange={(e) =>
                                updateCrustPrice(crust.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 rounded bg-[#1F2421] border border-white/10 text-right text-xs text-white font-bold"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Adicionais Extras */}
                  <div className="p-4 rounded-xl bg-[#262C29] border border-white/5 space-y-3">
                    <h4 className="text-xs font-bold text-[#FAF8F5] uppercase tracking-wider">
                      Preços de Ingredientes Adicionais
                    </h4>
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                      {extraIngredients.map((extra) => (
                        <div key={extra.id} className="flex items-center justify-between text-xs">
                          <span className="text-stone-300 truncate max-w-[200px]">{extra.name}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-stone-500 text-[11px]">R$</span>
                            <input
                              type="number"
                              step="0.5"
                              value={extra.price}
                              onChange={(e) =>
                                updateExtraPrice(extra.id, parseFloat(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 rounded bg-[#1F2421] border border-white/10 text-right text-xs text-white font-bold"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: DASHBOARD FINANCEIRO SEMANAL */}
            {activeTab === 'financeiro' && (
              <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
                {/* 4 KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-4 rounded-xl bg-[#262C29] border border-white/5 space-y-1 text-left">
                    <span className="text-[11px] font-semibold text-stone-400">
                      Faturamento Total
                    </span>
                    <div className="text-lg sm:text-2xl font-extrabold text-[#008C45] tabular-nums">
                      {formatPriceBRL(totalRevenue)}
                    </div>
                    <span className="text-[10px] text-stone-400 block">
                      {totalValidOrdersCount} pedidos válidos
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#262C29] border border-white/5 space-y-1 text-left">
                    <span className="text-[11px] font-semibold text-stone-400">
                      Faturamento Delivery
                    </span>
                    <div className="text-lg sm:text-2xl font-extrabold text-[#C8102E] tabular-nums">
                      {formatPriceBRL(deliveryRevenue)}
                    </div>
                    <span className="text-[10px] text-red-300/80 block">
                      {deliveryOrders.length} pedidos ({deliveryPercentage.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#262C29] border border-white/5 space-y-1 text-left">
                    <span className="text-[11px] font-semibold text-stone-400">
                      Faturamento Retirada
                    </span>
                    <div className="text-lg sm:text-2xl font-extrabold text-[#008C45] tabular-nums">
                      {formatPriceBRL(retiradaRevenue)}
                    </div>
                    <span className="text-[10px] text-[#008C45]/80 block">
                      {retiradaOrders.length} pedidos ({retiradaPercentage.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-[#262C29] border border-white/5 space-y-1 text-left">
                    <span className="text-[11px] font-semibold text-stone-400">
                      Ticket Médio Geral
                    </span>
                    <div className="text-lg sm:text-2xl font-extrabold text-[#FAF8F5] tabular-nums">
                      {formatPriceBRL(averageTicket)}
                    </div>
                    <span className="text-[10px] text-stone-400 block">
                      Média por pedido
                    </span>
                  </div>
                </div>

                {/* Separação Obrigatória: Delivery vs Retirada */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#262C29] border border-white/5 space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#FAF8F5] uppercase tracking-wider flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-[#C8102E]" />
                        <span>Separação Obrigatória: Delivery vs. Retirada Balcão</span>
                      </h3>
                      <span className="text-xs text-stone-400">
                        Comparativo estrito de faturamento e volume de pedidos
                      </span>
                    </div>
                  </div>

                  {/* Comparative Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="h-4 rounded-full bg-black/40 overflow-hidden flex">
                      <div
                        style={{ width: `${deliveryPercentage}%` }}
                        className="h-full bg-[#C8102E]"
                        title={`Delivery: ${deliveryPercentage.toFixed(1)}%`}
                      />
                      <div
                        style={{ width: `${retiradaPercentage}%` }}
                        className="h-full bg-[#008C45]"
                        title={`Retirada: ${retiradaPercentage.toFixed(1)}%`}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-stone-300 font-medium">
                      <span className="flex items-center gap-1.5 text-[#C8102E]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#C8102E]" />
                        Delivery: {formatPriceBRL(deliveryRevenue)} ({deliveryPercentage.toFixed(1)}%)
                      </span>
                      <span className="flex items-center gap-1.5 text-[#008C45]">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#008C45]" />
                        Retirada Balcão: {formatPriceBRL(retiradaRevenue)} ({retiradaPercentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Comparative Detailed Table */}
                  <div className="rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full text-left text-xs text-stone-300">
                      <thead className="bg-[#171B19] text-stone-400 uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Modalidade</th>
                          <th className="py-2.5 px-3">Volume de Pedidos</th>
                          <th className="py-2.5 px-3">Ticket Médio</th>
                          <th className="py-2.5 px-3 text-right">Faturamento Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-[#C8102E] flex items-center gap-2">
                            <Truck className="w-4 h-4 text-[#C8102E]" />
                            <span>Entrega (Delivery)</span>
                          </td>
                          <td className="py-2.5 px-3 tabular-nums">
                            {deliveryOrders.length} pedidos ({deliveryPercentage.toFixed(1)}%)
                          </td>
                          <td className="py-2.5 px-3 tabular-nums">
                            {deliveryOrders.length > 0
                              ? formatPriceBRL(deliveryRevenue / deliveryOrders.length)
                              : 'R$ 0,00'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-white tabular-nums">
                            {formatPriceBRL(deliveryRevenue)}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3 font-bold text-[#008C45] flex items-center gap-2">
                            <Store className="w-4 h-4 text-[#008C45]" />
                            <span>Retirada no Balcão</span>
                          </td>
                          <td className="py-2.5 px-3 tabular-nums">
                            {retiradaOrders.length} pedidos ({retiradaPercentage.toFixed(1)}%)
                          </td>
                          <td className="py-2.5 px-3 tabular-nums">
                            {retiradaOrders.length > 0
                              ? formatPriceBRL(retiradaRevenue / retiradaOrders.length)
                              : 'R$ 0,00'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-extrabold text-white tabular-nums">
                            {formatPriceBRL(retiradaRevenue)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Balanço Semanal (Segunda a Domingo com destaque Quinta a Domingo) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#262C29] border border-white/5 space-y-4 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#FAF8F5] uppercase tracking-wider flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-[#008C45]" />
                        <span>Balanço Semanal (Segunda a Domingo)</span>
                      </h3>
                      <span className="text-xs text-stone-400">
                        Destacando o movimento nos dias oficiais de forno aceso (Quinta a Domingo)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1.5 text-stone-300">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#C8102E]" />
                        <span>Delivery</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-stone-300">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#008C45]" />
                        <span>Retirada</span>
                      </span>
                    </div>
                  </div>

                  {/* Weekly Bar Chart */}
                  <div className="pt-4 pb-2 grid grid-cols-7 gap-2 items-end h-48 border-b border-white/10">
                    {weeklyData.map((day) => {
                      const heightPercent =
                        day.totalRev > 0 ? Math.min(100, (day.totalRev / maxDayRevenue) * 100) : 4;
                      return (
                        <div key={day.short} className="h-full flex flex-col justify-end items-center gap-1 group">
                          {/* Value tooltip */}
                          <span className="text-[10px] tabular-nums font-bold text-stone-400 group-hover:text-white transition">
                            {day.totalRev > 0 ? formatPriceBRL(day.totalRev) : '-'}
                          </span>

                          {/* Bar Stack */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full max-w-[36px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all ${
                              day.isOperating
                                ? 'bg-white/10 group-hover:brightness-110'
                                : 'bg-white/5 opacity-50'
                            }`}
                          >
                            {day.retiradaRev > 0 && (
                              <div
                                style={{
                                  height: `${(day.retiradaRev / day.totalRev) * 100}%`,
                                }}
                                className="w-full bg-[#008C45]"
                              />
                            )}
                            {day.deliveryRev > 0 && (
                              <div
                                style={{
                                  height: `${(day.deliveryRev / day.totalRev) * 100}%`,
                                }}
                                className="w-full bg-[#C8102E]"
                              />
                            )}
                          </div>

                          {/* Day Label with Operating Indicator */}
                          <div className="text-center pt-1">
                            <span
                              className={`text-[11px] font-bold block ${
                                day.isOperating ? 'text-[#FAF8F5]' : 'text-stone-500'
                              }`}
                            >
                              {day.short}
                            </span>
                            {day.isOperating ? (
                              <span className="text-[9px] text-[#008C45] block leading-none font-semibold">
                                Aberto
                              </span>
                            ) : (
                              <span className="text-[9px] text-stone-600 block leading-none">
                                Folga
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Registered Customers count summary */}
                  <div className="flex items-center justify-between text-xs text-stone-400 pt-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#008C45]" />
                      <span>
                        Total de clientes cadastrados no banco:{' '}
                        <strong className="text-white">{registeredUsers.length}</strong>
                      </span>
                    </div>
                    <span className="text-stone-500">
                      Restrição: 100% Rio Branco - AC
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
