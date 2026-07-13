'use client';

import { useEffect, useState } from 'react';
import { loadGooglePickerAssets, openGoogleDrivePicker, requestGoogleDriveAccessToken, GoogleDrivePickerResult } from '@/lib/googleDrivePicker';

interface GoogleDrivePickerButtonProps {
  onFileSelected: (result: GoogleDrivePickerResult) => void;
  onError?: (error: string) => void;
  buttonLabel?: string;
}

export default function GoogleDrivePickerButton({ onFileSelected, onError, buttonLabel = 'Upload from Google Drive' }: GoogleDrivePickerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    void loadGooglePickerAssets().catch((error) => {
      console.error(error);
      setStatusMessage('Unable to load Google Picker scripts.');
      onError?.('Unable to load Google Picker scripts.');
    });
  }, [onError]);

  const handleOpenPicker = async () => {
    setStatusMessage('');
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';

    if (!clientId || !apiKey) {
      const errorMessage = 'Google API credentials are not configured.';
      setStatusMessage(errorMessage);
      onError?.(errorMessage);
      return;
    }

    setIsLoading(true);

    try {
      const accessToken = await requestGoogleDriveAccessToken(clientId, 'https://www.googleapis.com/auth/drive.readonly');
      const result = await openGoogleDrivePicker(accessToken, apiKey);

      if (!result) {
        setStatusMessage('No file was selected or file exceeded 10 MB.');
        return;
      }

      onFileSelected(result);
      setStatusMessage(`Selected: ${result.name}`);
    } catch (error: any) {
      console.error(error);
      const message = error?.message || 'Google Drive Picker failed.';
      setStatusMessage(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleOpenPicker}
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
        disabled={isLoading}
      >
        {isLoading ? 'Opening Google Drive…' : buttonLabel}
      </button>
      {statusMessage ? <p className="text-sm text-slate-300">{statusMessage}</p> : null}
    </div>
  );
}
