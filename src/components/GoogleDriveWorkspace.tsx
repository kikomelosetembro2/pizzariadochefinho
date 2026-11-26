import React, { useCallback, useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Edit3,
  ExternalLink,
  FileCode,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderPlus,
  HardDrive,
  Loader2,
  LogOut,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  createDriveFolder,
  deleteDriveFile,
  downloadDriveFileBlob,
  downloadDriveFileText,
  DriveAuthRequiredError,
  DriveFileItem,
  getAccessToken,
  getCurrentGoogleUser,
  googleSignIn,
  googleSignOut,
  initGoogleDriveAuth,
  listDriveFiles,
  renameDriveFile,
  updateDriveFileContent,
  uploadDriveFile,
} from '../services/googleDrive';
import { Product } from '../types';
import { GoogleSignInButton } from './GoogleSignInButton';

interface BreadcrumbItem {
  id?: string;
  name: string;
}

type PendingConfirmation =
  | { type: 'delete-single'; file: DriveFileItem }
  | { type: 'delete-bulk'; files: DriveFileItem[] }
  | { type: 'rename'; file: DriveFileItem; newName: string }
  | { type: 'overwrite-backup'; file: DriveFileItem }
  | { type: 'overwrite-text'; file: DriveFileItem; content: string; mimeType: string }
  | { type: 'restore-catalog'; file: DriveFileItem; products: Product[] };

function formatBytes(size?: string): string {
  const bytes = Number(size);
  if (!bytes || isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDriveDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function getFileIcon(mimeType: string) {
  if (mimeType === 'application/vnd.google-apps.folder') {
    return <Folder className="w-4 h-4 text-amber-400 shrink-0" />;
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv')) {
    return <FileSpreadsheet className="w-4 h-4 text-[#008C45] shrink-0" />;
  }
  if (mimeType.includes('json') || mimeType.includes('javascript')) {
    return <FileCode className="w-4 h-4 text-sky-400 shrink-0" />;
  }
  return <FileText className="w-4 h-4 text-stone-300 shrink-0" />;
}

export const GoogleDriveWorkspace: React.FC = () => {
  const {
    products,
    crustOptions,
    extraIngredients,
    orders,
    registeredUsers,
    restoreProductsFromBackup,
  } = useApp();

  const [googleUser, setGoogleUser] = useState<User | null>(() => getCurrentGoogleUser());
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ name: 'Meu Drive' }]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showNewFolderForm, setShowNewFolderForm] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');

  const [renamingFile, setRenamingFile] = useState<DriveFileItem | null>(null);
  const [renameInput, setRenameInput] = useState<string>('');

  const [editingTextFile, setEditingTextFile] = useState<{
    file: DriveFileItem;
    content: string;
    originalContent: string;
  } | null>(null);

  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentFolderId = breadcrumbs[breadcrumbs.length - 1]?.id;

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
  }, []);

  const loadFiles = useCallback(
    async (folderId?: string, queryText?: string) => {
      const token = await getAccessToken();
      if (!token) {
        setNeedsAuth(true);
        return;
      }

      setLoadingFiles(true);
      try {
        const items = await listDriveFiles({
          folderId: queryText?.trim() ? undefined : folderId,
          query: queryText,
          pageSize: 50,
        });
        setFiles(items);
        setSelectedIds([]);
        setNeedsAuth(false);
      } catch (err) {
        if (err instanceof DriveAuthRequiredError) {
          setNeedsAuth(true);
          setFiles([]);
        } else {
          showToast(
            'error',
            err instanceof Error ? err.message : 'Erro ao listar arquivos do Google Drive.'
          );
        }
      } finally {
        setLoadingFiles(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    let mounted = true;

    const checkInitial = async () => {
      const token = await getAccessToken();
      const user = getCurrentGoogleUser();
      if (!mounted) return;
      if (token && user) {
        setGoogleUser(user);
        setNeedsAuth(false);
        void loadFiles(currentFolderId, searchQuery);
      } else {
        setNeedsAuth(true);
      }
    };

    void checkInitial();

    const unsubscribe = initGoogleDriveAuth(
      (user) => {
        if (!mounted) return;
        setGoogleUser(user);
        setNeedsAuth(false);
      },
      () => {
        if (!mounted) return;
        setGoogleUser(null);
        setNeedsAuth(true);
        setFiles([]);
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignIn = async () => {
    setAuthLoading(true);
    setFeedback(null);
    try {
      const { user } = await googleSignIn();
      setGoogleUser(user);
      setNeedsAuth(false);
      await loadFiles(currentFolderId, searchQuery);
      showToast('success', `Conectado ao Google Drive como ${user.email || user.displayName}.`);
    } catch (err) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Não foi possível concluir o login com o Google.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    try {
      await googleSignOut();
      setGoogleUser(null);
      setNeedsAuth(true);
      setFiles([]);
      setSelectedIds([]);
      setBreadcrumbs([{ name: 'Meu Drive' }]);
      showToast('success', 'Desconectado do Google Drive.');
    } catch {
      showToast('error', 'Falha ao encerrar sessão do Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void loadFiles(currentFolderId, searchQuery);
  };

  const handleOpenFolder = (folder: DriveFileItem) => {
    setSearchQuery('');
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    void loadFiles(folder.id, '');
  };

  const handleBreadcrumbClick = (index: number) => {
    const target = breadcrumbs[index];
    setSearchQuery('');
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    void loadFiles(target.id, '');
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setBusyAction('Criando pasta...');
    try {
      const created = await createDriveFolder(newFolderName.trim(), currentFolderId);
      setNewFolderName('');
      setShowNewFolderForm(false);
      showToast('success', `Pasta "${created.name}" criada no Google Drive.`);
      await loadFiles(currentFolderId, searchQuery);
    } catch (err) {
      if (err instanceof DriveAuthRequiredError) {
        setNeedsAuth(true);
      } else {
        showToast('error', err instanceof Error ? err.message : 'Erro ao criar pasta.');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleUploadLocalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setBusyAction(`Enviando "${file.name}"...`);
    try {
      const uploaded = await uploadDriveFile({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        content: file,
        folderId: currentFolderId,
      });
      showToast('success', `Arquivo "${uploaded.name}" enviado para o Google Drive.`);
      await loadFiles(currentFolderId, searchQuery);
    } catch (err) {
      if (err instanceof DriveAuthRequiredError) {
        setNeedsAuth(true);
      } else {
        showToast('error', err instanceof Error ? err.message : 'Erro ao enviar arquivo.');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const buildBackupPayload = () => {
    return JSON.stringify(
      {
        app: 'Pizzaria do Chefinho',
        city: 'Rio Branco - AC',
        exportedAt: new Date().toISOString(),
        stats: {
          productsCount: products.length,
          ordersCount: orders.length,
          customersCount: registeredUsers.length,
        },
        products,
        crustOptions,
        extraIngredients,
        orders,
      },
      null,
      2
    );
  };

  const handleExportBackupJson = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const fileName = `Pizzaria_Chefinho_Backup_${today}.json`;
    setBusyAction('Exportando backup JSON...');
    try {
      const uploaded = await uploadDriveFile({
        name: fileName,
        mimeType: 'application/json',
        content: buildBackupPayload(),
        folderId: currentFolderId,
      });
      showToast('success', `Backup "${uploaded.name}" salvo no Google Drive.`);
      await loadFiles(currentFolderId, searchQuery);
    } catch (err) {
      if (err instanceof DriveAuthRequiredError) {
        setNeedsAuth(true);
      } else {
        showToast('error', err instanceof Error ? err.message : 'Erro ao exportar backup JSON.');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportOrdersCsv = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const fileName = `Pizzaria_Chefinho_Pedidos_${today}.csv`;
    const escapeCsv = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
    const header = [
      'Numero',
      'Data',
      'Cliente',
      'Telefone',
      'Tipo',
      'Pagamento',
      'Status',
      'Total_BRL',
    ].join(';');
    const rows = orders.map((o) =>
      [
        o.orderNumber,
        new Date(o.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Rio_Branco' }),
        escapeCsv(o.customer.name),
        escapeCsv(o.customer.phone),
        o.orderType,
        o.paymentMethod,
        o.status,
        o.total.toFixed(2).replace('.', ','),
      ].join(';')
    );
    const csvContent = `\uFEFF${[header, ...rows].join('\n')}`;

    setBusyAction('Exportando planilha CSV de pedidos...');
    try {
      const uploaded = await uploadDriveFile({
        name: fileName,
        mimeType: 'text/csv',
        content: csvContent,
        folderId: currentFolderId,
      });
      showToast('success', `Relatório "${uploaded.name}" enviado para o Google Drive.`);
      await loadFiles(currentFolderId, searchQuery);
    } catch (err) {
      if (err instanceof DriveAuthRequiredError) {
        setNeedsAuth(true);
      } else {
        showToast('error', err instanceof Error ? err.message : 'Erro ao exportar CSV de pedidos.');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownloadFile = async (file: DriveFileItem) => {
    if (file.mimeType.startsWith('application/vnd.google-apps.')) {
      showToast(
        'error',
        'Arquivos nativos do Google Docs/Sheets devem ser abertos diretamente no Drive.'
      );
      return;
    }

    setBusyAction(`Baixando "${file.name}"...`);
    try {
      const blob = await downloadDriveFileBlob(file.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('success', `Download de "${file.name}" iniciado.`);
    } catch (err) {
      if (err instanceof DriveAuthRequiredError) {
        setNeedsAuth(true);
      } else {
        showToast('error', err instanceof Error ? err.message : 'Erro ao baixar arquivo.');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpenTextEditor = async (file: DriveFileItem) => {
    setBusyAction(`Abrindo "${file.name}"...`);
    try {
      const text = await downloadDriveFileText(file.id);
      setEditingTextFile({
        file,
        content: text,
        originalContent: text,
      });
    } catch (err) {
      if (err instanceof DriveAuthRequiredError) {
        setNeedsAuth(true);
      } else {
        showToast('error', err instanceof Error ? err.message : 'Erro ao ler conteúdo do arquivo.');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handlePrepareRestoreCatalog = async (file: DriveFileItem) => {
    setBusyAction(`Lendo backup "${file.name}"...`);
    try {
      const text = await downloadDriveFileText(file.id);
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.products) || parsed.products.length === 0) {
        showToast(
          'error',
          `O arquivo "${file.name}" não contém um catálogo de produtos válido da Pizzaria do Chefinho.`
        );
        return;
      }
      setPendingConfirmation({
        type: 'restore-catalog',
        file,
        products: parsed.products as Product[],
      });
    } catch (err) {
      if (err instanceof DriveAuthRequiredError) {
        setNeedsAuth(true);
      } else {
        showToast(
          'error',
          'Não foi possível ler ou interpretar este arquivo JSON como backup do cardápio.'
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleExecuteConfirmedAction = async () => {
    if (!pendingConfirmation) return;
    const action = pendingConfirmation;
    setPendingConfirmation(null);

    try {
      if (action.type === 'delete-single') {
        setBusyAction(`Excluindo "${action.file.name}"...`);
        await deleteDriveFile(action.file.id);
        showToast('success', `Arquivo "${action.file.name}" excluído do Google Drive.`);
      } else if (action.type === 'delete-bulk') {
        setBusyAction(`Excluindo ${action.files.length} arquivo(s)...`);
        for (const f of action.files) {
          await deleteDriveFile(f.id);
        }
        showToast(
          'success',
          `${action.files.length} item(ns) excluído(s) permanentemente do Google Drive.`
        );
      } else if (action.type === 'rename') {
        setBusyAction(`Renomeando "${action.file.name}"...`);
        const updated = await renameDriveFile(action.file.id, action.newName);
        setRenamingFile(null);
        setRenameInput('');
        showToast('success', `Renomeado para "${updated.name}".`);
      } else if (action.type === 'overwrite-backup') {
        setBusyAction(`Atualizando "${action.file.name}"...`);
        await updateDriveFileContent(
          action.file.id,
          buildBackupPayload(),
          'application/json'
        );
        showToast('success', `Arquivo "${action.file.name}" sobrescrito com o snapshot atual.`);
      } else if (action.type === 'overwrite-text') {
        setBusyAction(`Salvando alterações em "${action.file.name}"...`);
        await updateDriveFileContent(action.file.id, action.content, action.mimeType);
        setEditingTextFile(null);
        showToast('success', `Conteúdo de "${action.file.name}" atualizado no Google Drive.`);
      } else if (action.type === 'restore-catalog') {
        restoreProductsFromBackup(action.products);
        showToast(
          'success',
          `Cardápio restaurado com ${action.products.length} item(ns) de "${action.file.name}".`
        );
        return;
      }

      await loadFiles(currentFolderId, searchQuery);
    } catch (err) {
      if (err instanceof DriveAuthRequiredError) {
        setNeedsAuth(true);
      } else {
        showToast('error', err instanceof Error ? err.message : 'Falha na operação com o Drive.');
      }
    } finally {
      setBusyAction(null);
    }
  };

  const toggleSelectFile = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectedFiles = files.filter((f) => selectedIds.includes(f.id));

  if (needsAuth) {
    return (
      <div className="p-6 sm:p-10 text-center max-w-lg mx-auto space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#008C45]/15 border border-[#008C45]/40 flex items-center justify-center text-[#008C45] mx-auto">
          <HardDrive className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-extrabold text-[#FAF8F5] font-display">
            Conectar ao Google Drive
          </h3>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Salve backups do cardápio e pedidos em JSON/CSV, armazene comandas térmicas na nuvem e
            gerencie arquivos diretamente na sua conta Google.
          </p>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs text-left ${
              feedback.type === 'error'
                ? 'bg-red-950/40 border-red-500/40 text-red-300'
                : 'bg-[#008C45]/15 border-[#008C45]/40 text-emerald-300'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="flex justify-center pt-1">
          <GoogleSignInButton
            onClick={handleSignIn}
            disabled={authLoading}
            label={authLoading ? 'Conectando...' : 'Sign in with Google'}
          />
        </div>

        <p className="text-[11px] text-stone-400">
          O token de acesso fica apenas na memória da aba atual e solicita confirmação antes de
          qualquer alteração ou exclusão de arquivos.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 text-left">
      {/* Hidden File Upload Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleUploadLocalFile}
        className="hidden"
      />

      {/* Connected Account & Quick Pizzeria Export Bar */}
      <div className="p-3.5 rounded-xl bg-[#262C29] border border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#008C45]/20 border border-[#008C45]/40 flex items-center justify-center text-[#008C45] shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#FAF8F5] truncate">
              {googleUser?.displayName || 'Conta Google Conectada'}
            </div>
            <div className="text-[11px] text-stone-400 truncate">
              {googleUser?.email || 'Sessão ativa em memória'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={Boolean(busyAction)}
            onClick={handleExportBackupJson}
            className="px-3 py-1.5 rounded-lg bg-[#008C45] hover:bg-[#007338] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition"
            title="Salva um arquivo JSON completo com cardápio, bordas, adicionais e pedidos no Drive"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Backup Completo (JSON)</span>
          </button>

          <button
            type="button"
            disabled={Boolean(busyAction)}
            onClick={handleExportOrdersCsv}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 text-[#FAF8F5] text-xs font-semibold flex items-center gap-1.5 transition"
            title="Exporta todos os pedidos para uma planilha CSV no Google Drive"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#008C45]" />
            <span>Exportar Pedidos (CSV)</span>
          </button>

          <button
            type="button"
            disabled={authLoading}
            onClick={handleSignOut}
            className="px-2.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold flex items-center gap-1 transition"
            title="Desconectar conta Google"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            feedback.type === 'error'
              ? 'bg-red-950/40 border-red-500/40 text-red-300'
              : 'bg-[#008C45]/15 border-[#008C45]/40 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#008C45]" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Drive File Actions Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar arquivos no Google Drive..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#262C29] border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#008C45]"
            />
          </div>
          <button
            type="submit"
            disabled={loadingFiles}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition shrink-0"
          >
            Buscar
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={Boolean(busyAction)}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-[#C8102E] hover:bg-[#A90D26] text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Enviar Arquivo</span>
          </button>

          <button
            type="button"
            disabled={Boolean(busyAction)}
            onClick={() => setShowNewFolderForm((v) => !v)}
            className="px-3 py-2 rounded-xl bg-[#262C29] hover:bg-[#2E3632] border border-white/10 text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Nova Pasta</span>
          </button>

          <button
            type="button"
            disabled={loadingFiles}
            onClick={() => loadFiles(currentFolderId, searchQuery)}
            className="p-2 rounded-xl bg-[#262C29] hover:bg-[#2E3632] border border-white/10 text-stone-300 hover:text-white transition"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loadingFiles ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Create Folder Form */}
      {showNewFolderForm && (
        <form
          onSubmit={handleCreateFolder}
          className="p-3 rounded-xl bg-[#262C29] border border-amber-400/30 flex items-center gap-2"
        >
          <Folder className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            type="text"
            required
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nome da nova pasta (ex: Backups Pizzaria do Chefinho)"
            className="flex-1 px-3 py-1.5 rounded-lg bg-[#1F2421] border border-white/10 text-xs text-white focus:outline-none focus:border-[#008C45]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-[#008C45] text-white text-xs font-bold"
          >
            Criar
          </button>
          <button
            type="button"
            onClick={() => {
              setShowNewFolderForm(false);
              setNewFolderName('');
            }}
            className="px-2.5 py-1.5 rounded-lg bg-white/5 text-stone-300 text-xs"
          >
            Cancelar
          </button>
        </form>
      )}

      {/* Breadcrumbs + Bulk Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center flex-wrap gap-1 text-stone-300">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={`${crumb.id || 'root'}-${idx}`}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-stone-500" />}
              <button
                type="button"
                onClick={() => handleBreadcrumbClick(idx)}
                className={`px-2 py-1 rounded-lg transition ${
                  idx === breadcrumbs.length - 1
                    ? 'bg-white/10 font-bold text-[#FAF8F5]'
                    : 'hover:bg-white/5 text-stone-400'
                }`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
          {searchQuery.trim() && (
            <span className="ml-2 text-[11px] text-[#008C45] font-semibold">
              · Filtro: "{searchQuery.trim()}"
            </span>
          )}
        </div>

        {selectedFiles.length > 0 && (
          <button
            type="button"
            onClick={() =>
              setPendingConfirmation({ type: 'delete-bulk', files: selectedFiles })
            }
            className="px-3 py-1.5 rounded-lg bg-[#C8102E] hover:bg-[#A90D26] text-white text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Excluir Selecionados ({selectedFiles.length})</span>
          </button>
        )}
      </div>

      {/* Busy Status Indicator */}
      {busyAction && (
        <div className="p-2.5 rounded-xl bg-[#262C29] border border-[#008C45]/30 text-xs text-stone-200 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[#008C45]" />
          <span>{busyAction}</span>
        </div>
      )}

      {/* Rename Form */}
      {renamingFile && (
        <div className="p-3 rounded-xl bg-[#262C29] border border-sky-400/40 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs text-stone-300 shrink-0">
            Renomear <strong className="text-white">{renamingFile.name}</strong>:
          </span>
          <input
            type="text"
            value={renameInput}
            onChange={(e) => setRenameInput(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-[#1F2421] border border-white/10 text-xs text-white focus:outline-none focus:border-sky-400"
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!renameInput.trim() || renameInput.trim() === renamingFile.name}
              onClick={() =>
                setPendingConfirmation({
                  type: 'rename',
                  file: renamingFile,
                  newName: renameInput.trim(),
                })
              }
              className="px-3 py-1.5 rounded-lg bg-[#008C45] disabled:opacity-40 text-white text-xs font-bold"
            >
              Confirmar Novo Nome
            </button>
            <button
              type="button"
              onClick={() => {
                setRenamingFile(null);
                setRenameInput('');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 text-stone-300 text-xs"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Inline Text/JSON/CSV Editor */}
      {editingTextFile && (
        <div className="p-4 rounded-xl bg-[#262C29] border border-[#008C45]/40 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-[#FAF8F5]">
                Visualizando / Editando: {editingTextFile.file.name}
              </h4>
              <span className="text-[11px] text-stone-400">
                Salvar alterações solicitará confirmação para sobrescrever o arquivo no Drive.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditingTextFile(null)}
              className="p-1 rounded-lg bg-white/5 text-stone-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={editingTextFile.content}
            onChange={(e) =>
              setEditingTextFile((prev) =>
                prev ? { ...prev, content: e.target.value } : null
              )
            }
            rows={8}
            className="w-full p-3 rounded-lg bg-[#171B19] border border-white/10 text-[11px] font-mono text-stone-200 focus:outline-none focus:border-[#008C45]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingTextFile(null)}
              className="px-3 py-1.5 rounded-lg bg-white/5 text-stone-300 text-xs"
            >
              Fechar
            </button>
            <button
              type="button"
              disabled={editingTextFile.content === editingTextFile.originalContent}
              onClick={() =>
                setPendingConfirmation({
                  type: 'overwrite-text',
                  file: editingTextFile.file,
                  content: editingTextFile.content,
                  mimeType: editingTextFile.file.mimeType || 'text/plain',
                })
              }
              className="px-3.5 py-1.5 rounded-lg bg-[#008C45] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar no Drive</span>
            </button>
          </div>
        </div>
      )}

      {/* Files Table */}
      <div className="rounded-xl border border-white/10 overflow-x-auto bg-[#171B19]/50">
        {loadingFiles ? (
          <div className="p-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#008C45]" />
            <span>Carregando arquivos do Google Drive...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400 space-y-1">
            <p className="font-semibold text-stone-300">Nenhum arquivo encontrado nesta pasta.</p>
            <p>
              Use "Backup Completo (JSON)", "Exportar Pedidos (CSV)" ou "Enviar Arquivo" acima para
              começar.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-[#171B19] text-stone-400 uppercase text-[10px] tracking-wider border-b border-white/5">
              <tr>
                <th className="py-2.5 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={files.length > 0 && selectedIds.length === files.length}
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? files.map((f) => f.id) : [])
                    }
                    className="rounded"
                    aria-label="Selecionar todos"
                  />
                </th>
                <th className="py-2.5 px-3">Nome</th>
                <th className="py-2.5 px-3 hidden sm:table-cell">Modificado</th>
                <th className="py-2.5 px-3 hidden md:table-cell">Tamanho</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {files.map((file) => {
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                const isJson =
                  file.mimeType.includes('json') || file.name.toLowerCase().endsWith('.json');
                const isTextLike =
                  isJson ||
                  file.mimeType.startsWith('text/') ||
                  file.name.toLowerCase().endsWith('.csv') ||
                  file.name.toLowerCase().endsWith('.txt');

                return (
                  <tr key={file.id} className="hover:bg-white/[0.03] transition">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(file.id)}
                        onChange={() => toggleSelectFile(file.id)}
                        className="rounded"
                        aria-label={`Selecionar ${file.name}`}
                      />
                    </td>
                    <td className="py-2.5 px-3 max-w-[230px]">
                      {isFolder ? (
                        <button
                          type="button"
                          onClick={() => handleOpenFolder(file)}
                          className="flex items-center gap-2 font-semibold text-[#FAF8F5] hover:text-[#008C45] transition truncate w-full text-left"
                        >
                          {getFileIcon(file.mimeType)}
                          <span className="truncate">{file.name}</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 font-medium text-[#FAF8F5] truncate">
                          {getFileIcon(file.mimeType)}
                          <span className="truncate" title={file.name}>
                            {file.name}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-stone-400 hidden sm:table-cell whitespace-nowrap">
                      {formatDriveDate(file.modifiedTime)}
                    </td>
                    <td className="py-2.5 px-3 text-stone-400 hidden md:table-cell tabular-nums">
                      {isFolder ? 'Pasta' : formatBytes(file.size)}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        {isJson && (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePrepareRestoreCatalog(file)}
                              className="p-1.5 rounded-lg bg-[#008C45]/15 hover:bg-[#008C45]/30 text-[#008C45]"
                              title="Restaurar cardápio a partir deste backup JSON"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingConfirmation({ type: 'overwrite-backup', file })
                              }
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-amber-300"
                              title="Sobrescrever este arquivo JSON com o snapshot atual"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {isTextLike && !isFolder && (
                          <button
                            type="button"
                            onClick={() => handleOpenTextEditor(file)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-sky-500"
                            title="Visualizar / Editar conteúdo"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!isFolder && !file.mimeType.startsWith('application/vnd.google-apps.') && (
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(file)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-stone-200"
                            title="Baixar arquivo"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-stone-200"
                            title="Abrir no Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setRenamingFile(file);
                            setRenameInput(file.name);
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300"
                          title="Renomear"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setPendingConfirmation({ type: 'delete-single', file })
                          }
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-950/50 text-red-400"
                          title="Excluir do Google Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Mandatory Explicit Confirmation Dialog before ANY mutating/destructive Drive operation */}
      {pendingConfirmation && (
        <div
          onClick={() => setPendingConfirmation(null)}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#1F2421] border border-white/15 p-5 shadow-2xl space-y-4 text-left animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C8102E]/20 border border-[#C8102E]/40 flex items-center justify-center text-[#C8102E] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold text-[#FAF8F5]">
                  {pendingConfirmation.type === 'delete-single' && 'Confirmar Exclusão no Drive'}
                  {pendingConfirmation.type === 'delete-bulk' && 'Confirmar Exclusão em Massa'}
                  {pendingConfirmation.type === 'rename' && 'Confirmar Renomeação no Drive'}
                  {pendingConfirmation.type === 'overwrite-backup' &&
                    'Confirmar Sobrescrita de Backup'}
                  {pendingConfirmation.type === 'overwrite-text' &&
                    'Confirmar Alteração de Arquivo'}
                  {pendingConfirmation.type === 'restore-catalog' &&
                    'Confirmar Restauração do Cardápio'}
                </h4>
                <p className="text-xs text-stone-300 leading-relaxed">
                  {pendingConfirmation.type === 'delete-single' && (
                    <>
                      Deseja realmente excluir{' '}
                      <strong className="text-white">"{pendingConfirmation.file.name}"</strong> do
                      seu Google Drive?
                    </>
                  )}
                  {pendingConfirmation.type === 'delete-bulk' && (
                    <>
                      Deseja excluir{' '}
                      <strong className="text-white">
                        {pendingConfirmation.files.length} arquivo(s)
                      </strong>{' '}
                      selecionado(s):{' '}
                      {pendingConfirmation.files
                        .slice(0, 3)
                        .map((f) => f.name)
                        .join(', ')}
                      {pendingConfirmation.files.length > 3 ? '...' : ''}?
                    </>
                  )}
                  {pendingConfirmation.type === 'rename' && (
                    <>
                      Alterar nome no Google Drive de{' '}
                      <strong className="text-white">"{pendingConfirmation.file.name}"</strong> para{' '}
                      <strong className="text-[#008C45]">"{pendingConfirmation.newName}"</strong>?
                    </>
                  )}
                  {pendingConfirmation.type === 'overwrite-backup' && (
                    <>
                      O conteúdo atual de{' '}
                      <strong className="text-white">"{pendingConfirmation.file.name}"</strong> no
                      Google Drive será substituído pelo snapshot atual da pizzaria. Deseja
                      continuar?
                    </>
                  )}
                  {pendingConfirmation.type === 'overwrite-text' && (
                    <>
                      O conteúdo do arquivo{' '}
                      <strong className="text-white">"{pendingConfirmation.file.name}"</strong> no
                      Google Drive será sobrescrito com suas edições. Confirmar?
                    </>
                  )}
                  {pendingConfirmation.type === 'restore-catalog' && (
                    <>
                      O catálogo local atual será substituído pelos{' '}
                      <strong className="text-white">
                        {pendingConfirmation.products.length} produto(s)
                      </strong>{' '}
                      do arquivo{' '}
                      <strong className="text-white">"{pendingConfirmation.file.name}"</strong>.
                      Confirmar restauração?
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setPendingConfirmation(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirmedAction}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition ${
                  pendingConfirmation.type === 'delete-single' ||
                  pendingConfirmation.type === 'delete-bulk'
                    ? 'bg-[#C8102E] hover:bg-[#A90D26]'
                    : 'bg-[#008C45] hover:bg-[#007338]'
                }`}
              >
                Confirmar Ação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const GoogleDriveModal: React.FC = () => {
  const { activeModal, setActiveModal } = useApp();

  useEffect(() => {
    if (activeModal !== 'drive') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal, setActiveModal]);

  if (activeModal !== 'drive') return null;

  return (
    <div
      onClick={() => setActiveModal(null)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-2xl bg-[#1F2421] border border-white/10 shadow-2xl text-left my-4 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="h-[3px] w-full grid grid-cols-3">
          <div className="bg-[#008C45]" />
          <div className="bg-[#FAF8F5]" />
          <div className="bg-[#C8102E]" />
        </div>

        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#171B19] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#008C45]/20 flex items-center justify-center text-[#008C45] border border-[#008C45]/40">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#FAF8F5] font-display">
                Google Drive · Arquivos & Backups
              </h2>
              <span className="text-xs text-stone-400">
                Pizzaria do Chefinho — Armazenamento em Nuvem
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <GoogleDriveWorkspace />
        </div>
      </div>
    </div>
  );
};
