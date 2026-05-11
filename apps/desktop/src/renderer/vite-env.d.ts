/// <reference types="vite/client" />

declare const __API_URL__: string;

interface Window {
  musicPlatform: {
    app: {
      getVersion: () => Promise<string>;
    };
    library: {
      selectFolder: () => Promise<string | null>;
    };
  };
}
