import { defineConfig } from 'vite';

// Built site is served from https://dlsteve.github.io/make-steve-rich-web/,
// so production assets need the repo-name prefix. Dev keeps the root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/make-steve-rich-web/' : '/',
}));
