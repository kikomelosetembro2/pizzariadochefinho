import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES: string[] = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});

let isSigningIn = false;
// Access token cached strictly in memory (never in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;

export class DriveAuthRequiredError extends Error {
  constructor(message = 'Sessão do Google Drive expirada ou não autenticada.') {
    super(message);
    this.name = 'DriveAuthRequiredError';
  }
}

export const initGoogleDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentGoogleUser = (): User | null => {
  return auth.currentUser;
};

export const googleSignOut = async () => {
  cachedAccessToken = null;
  await auth.signOut();
};

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
  parents?: string[];
}

async function authorizedDriveFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  if (!token) {
    throw new DriveAuthRequiredError();
  }

  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    cachedAccessToken = null;
    throw new DriveAuthRequiredError();
  }

  if (!response.ok) {
    let errorDetail = `Erro ${response.status} na API do Google Drive.`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errorDetail = errJson.error.message;
      }
    } catch {}
    throw new Error(errorDetail);
  }

  return response;
}

export async function listDriveFiles(params: {
  query?: string;
  folderId?: string;
  pageSize?: number;
} = {}): Promise<DriveFileItem[]> {
  const { query = '', folderId, pageSize = 30 } = params;
  const clauses: string[] = ['trashed = false'];

  if (folderId) {
    const safeFolderId = folderId.replace(/'/g, "\\'");
    clauses.push(`'${safeFolderId}' in parents`);
  }

  if (query.trim()) {
    const escaped = query.trim().replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    clauses.push(`name contains '${escaped}'`);
  }

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', clauses.join(' and '));
  url.searchParams.set('pageSize', String(pageSize));
  url.searchParams.set('orderBy', 'folder,modifiedTime desc');
  url.searchParams.set(
    'fields',
    'files(id,name,mimeType,size,modifiedTime,webViewLink,iconLink,parents)'
  );

  const res = await authorizedDriveFetch(url.toString());
  const data = await res.json();
  return Array.isArray(data.files) ? data.files : [];
}

export async function createDriveFolder(name: string, parentId?: string): Promise<DriveFileItem> {
  const metadata: Record<string, unknown> = {
    name: name.trim(),
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const res = await authorizedDriveFetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,modifiedTime,webViewLink',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    }
  );
  return res.json();
}

export async function uploadDriveFile(params: {
  name: string;
  mimeType: string;
  content: Blob | string;
  folderId?: string;
}): Promise<DriveFileItem> {
  const metadata: Record<string, unknown> = {
    name: params.name.trim(),
    mimeType: params.mimeType || 'application/octet-stream',
  };
  if (params.folderId) {
    metadata.parents = [params.folderId];
  }

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  const fileBlob =
    typeof params.content === 'string'
      ? new Blob([params.content], { type: params.mimeType || 'text/plain' })
      : params.content;
  form.append('file', fileBlob);

  const res = await authorizedDriveFetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink',
    {
      method: 'POST',
      body: form,
    }
  );
  return res.json();
}

export async function updateDriveFileContent(
  fileId: string,
  content: Blob | string,
  mimeType: string
): Promise<DriveFileItem> {
  const res = await authorizedDriveFetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=media&fields=id,name,mimeType,size,modifiedTime,webViewLink`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': mimeType || 'application/octet-stream' },
      body: content,
    }
  );
  return res.json();
}

export async function renameDriveFile(fileId: string, newName: string): Promise<DriveFileItem> {
  const res = await authorizedDriveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,modifiedTime,webViewLink`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    }
  );
  return res.json();
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  await authorizedDriveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
    }
  );
}

export async function downloadDriveFileBlob(fileId: string): Promise<Blob> {
  const res = await authorizedDriveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`
  );
  return res.blob();
}

export async function downloadDriveFileText(fileId: string): Promise<string> {
  const res = await authorizedDriveFetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`
  );
  return res.text();
}
