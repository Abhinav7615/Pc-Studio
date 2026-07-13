declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => {
            requestAccessToken: (args: { prompt?: 'consent' }) => void;
          };
        };
      };
      picker?: {
        Action: {
          PICKED: string;
          CANCEL: string;
        };
        DocsView: new (viewId: string) => any;
        PickerBuilder: new () => any;
        ViewId: {
          DOCS: string;
        };
      };
    };
    gapi?: {
      load: (library: string, options: { callback?: () => void; onerror?: () => void }) => void;
    };
  }
}

export {};
