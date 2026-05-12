/// <reference types="vite/client" />

declare const __API_URL__: string;

type LocalAudioFile = {
  filePath: string;
  audioUrl: string;
  title: string | null;
  artistName: string | null;
  coverUrl: string | null;
  durationSeconds: number | null;
};

interface Window {
  musicPlatform: {
    app: {
      getVersion: () => Promise<string>;
    };
    library: {
      selectFolder: () => Promise<string | null>;
      selectAudioFiles: () => Promise<LocalAudioFile[]>;
      readAudioFile: (filePath: string) => Promise<ArrayBuffer>;
    };
  };
}
