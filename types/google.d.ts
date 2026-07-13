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
    gapi?: {
      load: (library: string, callback: () => void) => void;
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
}
