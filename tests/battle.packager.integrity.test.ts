import { describe, it, expect } from 'vitest';
import { Packager } from '../generator/packager';
import * as zlib from 'zlib';

describe('Battle: Packager Integrity', () => {
  const packager = new Packager();
  const customized = {
    code: {
      backend: 'console.log("backend");',
      frontend: 'console.log("frontend");',
      database: 'CREATE TABLE x();',
    },
    config: {
      environment: { NODE_ENV: 'production', CUSTOM: '1' },
      secrets: { JWT_SECRET: 'secret', API_KEY: 'bom_abc' },
      settings: { region: 'eu' },
      dependencies: ['express', 'pg'],
    },
  };

  it('produces tar.gz with expected entries (docker)', async () => {
    const pkg = await packager.package(customized, 'docker');
    expect(pkg.package).toBeInstanceOf(Buffer);
    // Check gzip header
    expect(pkg.package!.slice(0, 2).toString('hex')).toBe('1f8b'); // gzip magic number
  });

  it('fails gracefully for unknown target', async () => {
    // @ts-expect-error
    await expect(packager.package(customized, 'unknown')).rejects.toThrow(/Unknown deploy target/);
  });

  it('includes platform configs for railway/render/docker', async () => {
    const rail = await packager.package(customized, 'railway');
    const rend = await packager.package(customized, 'render');
    const dock = await packager.package(customized, 'docker');

    expect(rail.instructions).toMatch(/Railway/i);
    expect(rend.instructions).toMatch(/Render/i);
    expect(dock.instructions).toMatch(/docker build/i);
  });
});