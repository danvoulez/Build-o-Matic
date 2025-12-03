import { describe, it, expect } from 'vitest';
import { deployTool } from '../deployer/orchestrator';
import { Generator } from '../generator/core';

describe('Battle: Deployment Orchestrator', () => {
  const generator = new Generator();

  async function genTool(target: 'railway' | 'render' | 'docker') {
    return generator.generate({
      templateId: 'hr-onboarding',
      answers: {
        industry: 'saas',
        users: 5,
        features: ['checklist', 'documents'],
        integrations: ['email'],
        deployTarget: target,
        companyName: 'HR Co',
      },
      userId: 'u',
      deployTarget: target,
    });
  }

  it('deploys docker with status ready', async () => {
    const tool = await genTool('docker');
    const dep = await deployTool(tool, 'docker');
    expect(dep.status).toBe('ready');
    expect(Array.isArray(dep.instructions)).toBe(true);
  });

  it('deploys railway with URLs (mocked)', async () => {
    const tool = await genTool('railway');
    const dep = await deployTool(tool, 'railway');
    expect(dep.status).toBe('deployed');
    expect(dep.url).toMatch(/railway\.app|up\.railway\.app/i);
    expect(dep.apiUrl).toMatch(/railway\.app|up\.railway\.app/i);
  });

  it('deploys render with plausible url', async () => {
    const tool = await genTool('render');
    const dep = await deployTool(tool, 'render');
    expect(dep.status).toBe('deployed');
    expect(dep.url).toMatch(/onrender\.com/);
  });
});