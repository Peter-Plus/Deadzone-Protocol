import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({ root: fileURLToPath(new URL('./src/previewer', import.meta.url)), build: { outDir: '../../dist', emptyOutDir: true } });
