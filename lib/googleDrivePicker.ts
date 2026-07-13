'use client';

export interface GoogleDrivePickerResult {
  fileId: string;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
  shareableLink: string;
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GAPI_SCRIPT_SRC = 'https://apis.google.com/js/api.js';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

let scriptsLoaded: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google scripts can only load in the browser.'));
  }

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing) {
    return existing.hasAttribute('data-loaded') ? Promise.resolve() : new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.setAttribute('data-loaded', 'true');
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

export async function loadGooglePickerAssets(): Promise<void> {
  if (scriptsLoaded) {
    return scriptsLoaded;
  }

  scriptsLoaded = (async () => {
    await loadScript(GIS_SCRIPT_SRC);
    await loadScript(GAPI_SCRIPT_SRC);

    if (!window.gapi?.load) {
      throw new Error('Google APIs script did not load correctly.');
    }

    await new Promise<void>((resolve, reject) => {
      window.gapi.load('client:picker', {
        callback: () => resolve(),
        onerror: () => reject(new Error('Failed to load the Google Picker library.')),
      });
    });
  })();

  return scriptsLoaded;
}

export async function requestGoogleDriveAccessToken(clientId: string, scope: string): Promise<string> {
  if (!clientId) {
    throw new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID is required.');
  }

  await loadGooglePickerAssets();

  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2?.initTokenClient) {
      reject(new Error('Google Identity Services client is not available.'));
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }

        if (!response.access_token) {
          reject(new Error('Unable to obtain Google Drive access token.'));
          return;
        }

        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export async function openGoogleDrivePicker(
  accessToken: string,
  apiKey: string,
): Promise<GoogleDrivePickerResult | null> {
  if (!accessToken) {
    throw new Error('Google Drive access token is missing.');
  }

  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_GOOGLE_API_KEY is required.');
  }

  await loadGooglePickerAssets();

  if (!window.google?.picker) {
    throw new Error('Google Picker is not available.');
  }

  return new Promise((resolve) => {
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
      .setMimeTypes(
        [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.google-apps.document',
          'application/vnd.google-apps.spreadsheet',
          'application/vnd.google-apps.presentation',
        ].join(','),
      )
      .setSelectFolderEnabled(false)
      .setIncludeFolders(false);

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setOrigin(window.location.protocol + '//' + window.location.host)
      .setTitle('Select payment proof from Google Drive')
      .setCallback((data) => {
        if (data.action === window.google.picker.Action.PICKED && Array.isArray(data.docs) && data.docs.length > 0) {
          const doc = data.docs[0];
          const sizeBytes = typeof doc.sizeBytes === 'number' ? doc.sizeBytes : null;

          if (sizeBytes !== null && sizeBytes > MAX_FILE_SIZE_BYTES) {
            resolve(null);
            return;
          }

          resolve({
            fileId: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            sizeBytes,
            shareableLink: `https://drive.google.com/file/d/${doc.id}/view?usp=sharing`,
          });
        }

        if (data.action === window.google.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .build();

    picker.setVisible(true);
  });
}
