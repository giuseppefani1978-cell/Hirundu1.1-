import { defineConfig } from 'vite';

function resolveBase() {
  if (process.env.VITE_BASE) {
    return normalizeBase(process.env.VITE_BASE);
  }

  if (process.env.BASE_PATH) {
    return normalizeBase(process.env.BASE_PATH);
  }

  const repository = process.env.GITHUB_REPOSITORY;
  if (process.env.GITHUB_ACTIONS && repository) {
    const [, repo] = repository.split('/');
    if (repo) {
      return `/${repo.replace(/\s+/g, '-')}/`;
    }
  }

  return './';
}

function normalizeBase(value) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '/';
  }

  if (trimmed === '.') {
    return './';
  }

  if (trimmed === '/') {
    return '/';
  }

  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

export default defineConfig({
  base: resolveBase(),
});
