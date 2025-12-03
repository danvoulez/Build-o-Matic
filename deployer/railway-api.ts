/**
 * Typed Railway API stub with endpoints ready to be wired to real HTTP requests.
 * For MVP, returns mocked responses. Replace TODOs with fetch calls to Railway API.
 */
export type Project = { id: string; name: string };
export type Service = { id: string; url: string; name: string };
export type Postgres = { id: string; url: string; host: string; port: number; user: string; password: string };

export class RailwayAPI {
  constructor(private token: string) {}

  async createProject(params: { name: string }): Promise<Project> {
    // TODO: HTTP POST to Railway: /projects
    return { id: 'proj_' + Date.now(), name: params.name };
  }

  async addPostgres(projectId: string): Promise<Postgres> {
    // TODO: HTTP POST to Railway plugin creation
    return {
      id: 'db_' + Date.now(),
      url: 'postgresql://user:pass@host:5432/db',
      host: 'host',
      port: 5432,
      user: 'user',
      password: 'pass',
    };
  }

  async createServiceFromPackage(projectId: string, name: string, artifact: Buffer): Promise<Service> {
    // TODO: Upload artifact and create service, return URL
    const slug = name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    return { id: 'svc_' + Date.now(), url: `https://${slug}.up.railway.app`, name };
  }

  async setEnvironmentVariables(projectId: string, envVars: Record<string, string>): Promise<void> {
    // TODO: HTTP PUT to Railway environment variables endpoint
    return;
  }

  async getDeploymentStatus(projectId: string): Promise<'success' | 'failed' | 'pending'> {
    // TODO: Poll Railway deployment status
    return 'success';
  }
}