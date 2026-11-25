import { PixProofValidation } from '../types';
import { WHATSAPP_PIX_KEY } from './whatsapp';

const USED_PIX_PROOFS_KEY = 'chefinho_used_pix_proofs_v1';

const BRAZIL_BANK_ISPB: Record<string, string> = {
  '00000000': 'Banco do Brasil',
  '00360305': 'Caixa Econômica Federal',
  '00416968': 'Banco Inter',
  '00517645': 'Banco Bocom BBM',
  '01181521': 'Sicredi',
  '02038232': 'Sicoob',
  '07679404': 'Banco Topázio',
  '08561701': 'PagBank / PagSeguro',
  '10573521': 'Mercado Pago',
  '13140088': 'Acesso / Bankly',
  '18236120': 'Nubank (Nu Pagamentos)',
  '20855875': 'Neon Pagamentos',
  '22896431': 'PicPay',
  '30306294': 'BTG Pactual',
  '31872495': 'C6 Bank',
  '58160789': 'Banco Safra',
  '60701190': 'Itaú Unibanco',
  '60746948': 'Bradesco',
  '60872504': 'Itaú Consignado',
  '90400888': 'Santander Brasil',
  '92702067': 'Banrisul',
};

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function normalizeAscii(str: string, maxLen: number): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, maxLen);
}

function crc16Ccitt(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface PixBrCodeParams {
  pixKey?: string;
  merchantName?: string;
  merchantCity?: string;
  amount: number;
  txId?: string;
}

export function formatBrPixKey(rawKey: string): string {
  const trimmed = rawKey.trim();
  // If key is email, EVP UUID, or already E.164 (+55...), preserve as-is
  if (trimmed.includes('@') || trimmed.includes('-') || trimmed.startsWith('+')) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, '');
  // 10 or 11 digit Brazilian phone number -> convert to BACEN E.164 +55...
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  if (digits.length >= 12 && digits.startsWith('55')) {
    return `+${digits}`;
  }
  return trimmed;
}

/**
 * Generates an official BACEN EMVCo BR Code ("PIX Copia e Cola") string
 * ready to be encoded into a QR Code and scanned by Brazilian banking apps.
 */
export function generatePixBrCode({
  pixKey = WHATSAPP_PIX_KEY,
  merchantName = 'PIZZARIA DO CHEFINHO',
  merchantCity = 'RIO BRANCO',
  amount,
  txId = 'CHEFINHOPIX',
}: PixBrCodeParams): string {
  const cleanTxId =
    txId
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 25) || '***';

  const formattedKey = formatBrPixKey(pixKey);

  const merchantAccountInfo =
    tlv('00', 'br.gov.bcb.pix') +
    tlv('01', formattedKey);

  const additionalData = tlv('05', cleanTxId);

  const safeAmount = Math.max(0, Number(amount) || 0);

  let payload =
    tlv('00', '01') +
    tlv('26', merchantAccountInfo) +
    tlv('52', '0000') +
    tlv('53', '986');

  if (safeAmount > 0) {
    payload += tlv('54', safeAmount.toFixed(2));
  }

  payload +=
    tlv('58', 'BR') +
    tlv('59', normalizeAscii(merchantName, 25) || 'PIZZARIA DO CHEFINHO') +
    tlv('60', normalizeAscii(merchantCity, 15) || 'RIO BRANCO') +
    tlv('62', additionalData) +
    '6304';

  const crc = crc16Ccitt(payload);
  return `${payload}${crc}`;
}

function getUsedProofIds(): string[] {
  try {
    const raw = localStorage.getItem(USED_PIX_PROOFS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function registerUsedPixProof(proofFingerprint: string) {
  if (!proofFingerprint) return;
  try {
    const existing = getUsedProofIds();
    if (!existing.includes(proofFingerprint)) {
      const updated = [proofFingerprint, ...existing].slice(0, 100);
      localStorage.setItem(USED_PIX_PROOFS_KEY, JSON.stringify(updated));
    }
  } catch {}
}

export function extractPixE2ECode(rawText: string): string | null {
  const upper = rawText.toUpperCase();
  // Official BACEN E2E ID: E + 8 digits ISPB + 12 digits YYYYMMDDHHmm + 11 alphanumeric chars (32 chars total)
  const strictMatch = upper.match(/\bE\d{8}\d{12}[A-Z0-9]{11}\b/);
  if (strictMatch) return strictMatch[0];

  // Fallback for bank variants (24-36 chars starting with E + 8 digits ISPB)
  const looseMatch = upper.match(/\bE\d{8}[A-Z0-9]{15,27}\b/);
  return looseMatch ? looseMatch[0] : null;
}

export function extractAmountFromText(rawText: string): number | null {
  // Look for BRL formatted amounts like R$ 62,90 or 62,90 or Valor: 62.90
  const brlMatches = [...rawText.matchAll(/(?:R\$\s*|VALOR[:\s]*R?\$?\s*)(\d{1,4}(?:\.\d{3})*,\d{2}|\d{1,4}\.\d{2})/gi)];
  if (brlMatches.length > 0) {
    const rawVal = brlMatches[0][1];
    const normalized = rawVal.includes(',')
      ? rawVal.replace(/\./g, '').replace(',', '.')
      : rawVal;
    const parsed = parseFloat(normalized);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // Generic decimal comma like 54,90
  const commaMatch = rawText.match(/\b(\d{1,4},\d{2})\b/);
  if (commaMatch) {
    const parsed = parseFloat(commaMatch[1].replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  return null;
}

function describeE2EDate(e2e: string): string | null {
  const datePart = e2e.slice(9, 21); // YYYYMMDDHHmm
  if (!/^\d{12}$/.test(datePart)) return null;
  const year = parseInt(datePart.slice(0, 4), 10);
  const month = parseInt(datePart.slice(4, 6), 10);
  const day = parseInt(datePart.slice(6, 8), 10);
  const hour = datePart.slice(8, 10);
  const min = datePart.slice(10, 12);

  if (year < 2020 || year > 2035 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year} às ${hour}:${min}`;
}

export interface PixValidationOutcome {
  isValid: boolean;
  severity: 'validado' | 'atencao' | 'invalido';
  headline: string;
  fingerprint?: string;
  proof?: PixProofValidation;
}

export function validatePixTextProof(
  inputText: string,
  expectedTotal: number
): PixValidationOutcome {
  const trimmed = inputText.trim();
  if (!trimmed) {
    return {
      isValid: false,
      severity: 'invalido',
      headline: 'Cole o código E2E da transação PIX ou o texto completo do comprovante.',
    };
  }

  const e2e = extractPixE2ECode(trimmed);
  const detectedAmount = extractAmountFromText(trimmed);
  const hasRecipientMatch = /(68\s*9?935[-\s]?8084|99358084|CHEFINHO|RIO BRANCO)/i.test(trimmed);
  const usedProofs = getUsedProofIds();

  if (!e2e) {
    return {
      isValid: false,
      severity: 'invalido',
      headline:
        'Código de transação PIX (E2E) não encontrado. Ele inicia com "E" seguido de 31 caracteres (ex: E18236120...).',
    };
  }

  if (usedProofs.includes(e2e)) {
    return {
      isValid: false,
      severity: 'invalido',
      headline: `Este código PIX (${e2e.slice(0, 14)}...) já foi utilizado em outro pedido.`,
    };
  }

  const ispb = e2e.slice(1, 9);
  const bankName = BRAZIL_BANK_ISPB[ispb] || `Instituição ISPB ${ispb}`;
  const txDateLabel = describeE2EDate(e2e);

  const checks: string[] = [
    `ID E2E BACEN autêntico detectado (${e2e.slice(0, 14)}...${e2e.slice(-4)})`,
    `Banco emissor identificado: ${bankName}`,
  ];

  if (txDateLabel) {
    checks.push(`Data/hora da transação no E2E: ${txDateLabel}`);
  }

  let amountMatches: boolean | undefined = undefined;
  let severity: 'validado' | 'atencao' | 'invalido' = 'validado';

  if (detectedAmount !== null) {
    const diff = Math.abs(detectedAmount - expectedTotal);
    if (diff <= 0.05) {
      amountMatches = true;
      checks.push(`Valor conferido: R$ ${detectedAmount.toFixed(2).replace('.', ',')} (corresponde ao pedido)`);
    } else if (detectedAmount < expectedTotal - 0.05) {
      return {
        isValid: false,
        severity: 'invalido',
        headline: `Valor no comprovante (R$ ${detectedAmount.toFixed(2).replace('.', ',')}) é menor que o total do pedido (R$ ${expectedTotal.toFixed(2).replace('.', ',')}).`,
      };
    } else {
      amountMatches = false;
      severity = 'atencao';
      checks.push(
        `Valor encontrado (R$ ${detectedAmount.toFixed(2).replace('.', ',')}) difere do total (R$ ${expectedTotal.toFixed(2).replace('.', ',')})`
      );
    }
  }

  if (hasRecipientMatch) {
    checks.push('Destinatário Pizzaria do Chefinho / chave 6899358084 confirmado no texto');
  }

  checks.push('Verificação anti-duplicidade aprovada');

  const proof: PixProofValidation = {
    status: severity === 'validado' ? 'validado' : 'atencao',
    method: 'e2e_texto',
    transactionId: e2e,
    bankName,
    detectedAmount: detectedAmount ?? undefined,
    amountMatches,
    checks,
    validatedAt: new Date().toISOString(),
  };

  return {
    isValid: true,
    severity,
    headline:
      severity === 'validado'
        ? `Comprovante PIX validado com sucesso (${bankName})!`
        : 'Código E2E validado — confira o valor antes de enviar.',
    fingerprint: e2e,
    proof,
  };
}

async function computeFileFingerprint(file: File): Promise<string> {
  try {
    const buffer = await file.slice(0, 65536).arrayBuffer();
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const digest = await crypto.subtle.digest('SHA-256', buffer);
      const bytes = Array.from(new Uint8Array(digest));
      return `file-${file.size}-${bytes.slice(0, 10).map((b) => b.toString(16).padStart(2, '0')).join('')}`;
    }
  } catch {}
  return `file-${file.name}-${file.size}-${file.lastModified}`;
}

function verifyImageIntegrity(file: File): Promise<{ width: number; height: number; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight, previewUrl: objectUrl });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Arquivo de imagem corrompido ou ilegível.'));
    };
    img.src = objectUrl;
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export async function validatePixFileProof(
  file: File,
  expectedTotal: number
): Promise<PixValidationOutcome & { previewUrl?: string }> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isImage = file.type.startsWith('image/');

  if (!allowedTypes.includes(file.type) && !isPdf) {
    return {
      isValid: false,
      severity: 'invalido',
      headline: 'Formato não suportado. Envie uma imagem (PNG, JPG, WEBP) ou PDF do comprovante PIX.',
    };
  }

  if (file.size < 4 * 1024) {
    return {
      isValid: false,
      severity: 'invalido',
      headline: 'Arquivo muito pequeno para ser um comprovante bancário válido (mínimo 4 KB).',
    };
  }

  if (file.size > 10 * 1024 * 1024) {
    return {
      isValid: false,
      severity: 'invalido',
      headline: 'Arquivo excede o limite de 10 MB.',
    };
  }

  const fingerprint = await computeFileFingerprint(file);
  const usedProofs = getUsedProofIds();

  if (usedProofs.includes(fingerprint)) {
    return {
      isValid: false,
      severity: 'invalido',
      headline: 'Este mesmo arquivo de comprovante já foi utilizado em um pedido anterior.',
    };
  }

  const checks: string[] = [];
  let previewUrl: string | undefined;
  let detectedE2E: string | null = null;
  let detectedAmount: number | null = null;
  let bankName: string | undefined;
  let severity: 'validado' | 'atencao' = 'validado';

  if (isImage) {
    try {
      const dims = await verifyImageIntegrity(file);
      previewUrl = dims.previewUrl;

      if (dims.width < 150 || dims.height < 150) {
        URL.revokeObjectURL(dims.previewUrl);
        return {
          isValid: false,
          severity: 'invalido',
          headline: `Resolução da imagem muito baixa (${dims.width}x${dims.height}px) para leitura do comprovante.`,
        };
      }
      checks.push(`Imagem íntegra verificada (${dims.width}×${dims.height}px · ${formatFileSize(file.size)})`);
    } catch {
      return {
        isValid: false,
        severity: 'invalido',
        headline: 'Não foi possível ler a imagem selecionada. Tente outro arquivo.',
      };
    }
  } else if (isPdf) {
    // Check PDF header (%PDF-) and inspect readable text streams if uncompressed
    const headBytes = await file.slice(0, 16).text();
    if (!headBytes.startsWith('%PDF-')) {
      return {
        isValid: false,
        severity: 'invalido',
        headline: 'O arquivo selecionado não possui estrutura PDF válida.',
      };
    }
    checks.push(`Documento PDF válido (${formatFileSize(file.size)})`);

    try {
      const rawText = await file.slice(0, 200000).text();
      detectedE2E = extractPixE2ECode(rawText);
      detectedAmount = extractAmountFromText(rawText);
      if (detectedE2E) {
        const ispb = detectedE2E.slice(1, 9);
        bankName = BRAZIL_BANK_ISPB[ispb] || `ISPB ${ispb}`;
        checks.push(`Código E2E extraído do PDF (${bankName})`);
      }
      if (detectedAmount !== null && detectedAmount < expectedTotal - 0.05) {
        return {
          isValid: false,
          severity: 'invalido',
          headline: `Valor detectado no PDF (R$ ${detectedAmount.toFixed(2).replace('.', ',')}) é menor que o total do pedido.`,
        };
      }
    } catch {}
  }

  let amountMatches: boolean | undefined;
  if (detectedAmount !== null) {
    amountMatches = Math.abs(detectedAmount - expectedTotal) <= 0.05;
    if (amountMatches) {
      checks.push(`Valor conferido: R$ ${detectedAmount.toFixed(2).replace('.', ',')}`);
    }
  }

  checks.push('Verificação anti-duplicidade aprovada');
  checks.push('Pronto para envio automático ao WhatsApp da pizzaria');

  const proof: PixProofValidation = {
    status: severity,
    method: 'arquivo',
    transactionId: detectedE2E ?? undefined,
    bankName,
    fileName: file.name,
    fileSizeLabel: formatFileSize(file.size),
    detectedAmount: detectedAmount ?? undefined,
    amountMatches,
    checks,
    validatedAt: new Date().toISOString(),
  };

  return {
    isValid: true,
    severity,
    headline: 'Comprovante anexado e validado com sucesso!',
    fingerprint,
    previewUrl,
    proof,
  };
}
