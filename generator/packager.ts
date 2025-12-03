/**
 * PACKAGER — now includes minimal platform config files.
 */
import * as zlib from 'zlib';
import * as tar from 'tar-stream';

export class Packager {
  async package(customized: any, deployTarget: string) {
    switch (deployTarget) {
      case 'railway':
        return this.packageForRailway(customized);
      case 'render':
        return this.packageForRender(customized);
      case 'docker':
        return this.packageForDocker(customized);
      default:
        throw new Error(`Unknown deploy target: ${deployTarget}`);
    }
  }

  private async packageForRailway(customized: any) {
    const files = this.basicFiles(customized, 'railway');
    files['railway.json'] = JSON.stringify({
      services: [
        { name: 'backend', startCommand: 'npm start', env: { NODE_ENV: 'production' } },
        { name: 'frontend', startCommand: 'npm start', env: { NODE_ENV: 'production' } }
      ]
    }, null, 2);
    const artifact = await this.createTarGz(files);

    return {
      type: 'railway',
      package: artifact,
      instructions: 'Import artifact into Railway or push via CLI; set env vars accordingly.',
      url: '', // will be set by deployer
    };
  }

  private async packageForRender(customized: any) {
    const files = this.basicFiles(customized, 'render');
    files['render.yaml'] = `
services:
  - type: web
    name: backend
    env: node
    plan: starter
    buildCommand: "npm install && npm run build"
    startCommand: "npm start"
  - type: web
    name: frontend
    env: node
    plan: starter
    buildCommand: "npm install && npm run build"
    startCommand: "npm start"
`.trim();
    const artifact = await this.createTarGz(files);

    return {
      type: 'render',
      package: artifact,
      instructions: 'Create services in Render and upload artifact via deploy hook.',
      url: '',
    };
  }

  private async packageForDocker(customized: any) {
    const files = this.basicFiles(customized, 'docker');
    files['Dockerfile'] = this.generateDockerfile(customized);
    files['docker-compose.yml'] = `
version: "3.9"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: \${DATABASE_URL}
`.trim();
    const artifact = await this.createTarGz(files);

    return {
      type: 'docker',
      package: artifact,
      instructions: 'docker build -t buildomatic-tool . && docker run -p 3000:3000 buildomatic-tool',
      url: '',
    };
  }

  private basicFiles(customized: any, target: string) {
    return {
      'backend/index.ts': customized.code.backend,
      'frontend/App.tsx': customized.code.frontend,
      'database/schema.sql': customized.code.database,
      'config/env.json': JSON.stringify(customized.config.environment, null, 2),
      'config/secrets.json': JSON.stringify(customized.config.secrets, null, 2),
      'config/settings.json': JSON.stringify(customized.config.settings ?? {}, null, 2),
      'package.json': JSON.stringify(
        {
          name: 'buildomatic-generated-tool',
          private: false,
          scripts: {
            start: 'node dist/server.js',
            build: 'tsc -p .',
          },
          dependencies: {
            express: '^4.18.2',
            pg: '^8.11.3',
            react: '^18.2.0',
            'react-dom': '^18.2.0',
            ...(this.dependenciesObject(customized.config.dependencies)),
          },
        },
        null,
        2
      ),
      'README.md': `# Build-O-Matic Tool (${target})
      
Instructions:
1. Configure environment variables (see config/env.json)
2. Apply secrets (see config/secrets.json)
3. Build and deploy according to target instructions.
`,
    };
  }

  private dependenciesObject(deps: string[] = []) {
    const out: Record<string, string> = {};
    for (const d of deps) out[d] = 'latest';
    return out;
  }

  private async createTarGz(files: Record<string, string>): Promise<Buffer> {
    const pack = tar.pack();
    for (const [filepath, content] of Object.entries(files)) {
      pack.entry({ name: filepath }, content);
    }
    pack.finalize();

    const chunks: Buffer[] = [];
    const gzip = zlib.createGzip();
    return await new Promise<Buffer>((resolve, reject) => {
      pack.pipe(gzip)
        .on('data', chunk => chunks.push(chunk))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', reject);
    });
  }

  private generateDockerfile(_customized: any): string {
    return `
FROM node:18
WORKDIR /app
COPY package.json .
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
    `.trim();
  }
}