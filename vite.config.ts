import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    // Les générateurs PDF et le décodeur QR sont lourds et ne servent qu'à
    // certaines pages : on les isole pour alléger le premier chargement,
    // souvent fait en connexion mobile.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('jspdf')) return 'pdf';
          if (id.includes('@zxing') || id.includes('qrcode')) return 'qr';
          return undefined;
        },
      },
    },
  },
});
