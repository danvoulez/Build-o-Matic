import { describe, it, expect } from 'vitest';
import { Packager } from '../generator/packager';

describe('Packager', () => {
  const packager = new Packager();

  const customized = {
    code: {
      backend: 'console.log("backend");',
      frontend: 'console.log("frontend");',
      database: 'CREATE TABLE x();',
    },
    config: {
      environment: { NODE_ENV: 'production' },
      secrets: { JWT_SECRET: 'secret' },
      settings: {},
      dependencies: ['express'],
    },
  };

  it('packages for docker', async () => {
    const pkg = await packager.package(customized, 'docker');
    expect(pkg.type).toBe('docker');
    expect(pkg.package).toBeInstanceOf(Buffer);
    expect(pkg.instructions).toContain('docker build');
  });

  it('packages for railway', async () => {
    const pkg = await packager.package(customized, 'railway');
    expect(pkg.type).toBe('railway');
    expect(pkg.package).toBeInstanceOf(Buffer);
  });

  it('packages for render', async () => {
    const pkg = await packager.package(customized, 'render');
    expect(pkg.type).toBe('render');
    expect(pkg.package).toBeInstanceOf(Buffer);
  });
});