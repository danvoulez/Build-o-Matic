/**
 * UBL Client for Build-o-Matic Generated Tools
 */

export interface LedgerClientConfig {
  url: string;
  realm: string;
  apiKey?: string;
  timeout?: number; // Timeout em milissegundos (padrão: 30000ms = 30s)
}

export interface IntentRequest {
  intent: string;
  agreementType?: string;
  parties?: Array<{ entityId: string; role: string }>;
  terms?: Record<string, any>;
  payload?: Record<string, any>;
}

export class LedgerClient {
  private config: LedgerClientConfig;
  private baseUrl: string;
  private defaultTimeout: number;

  constructor(config: LedgerClientConfig) {
    this.config = config;
    this.baseUrl = config.url.replace(/\/$/, '');
    this.defaultTimeout = config.timeout || 30000; // 30 segundos por padrão
  }

  /**
   * Realiza uma requisição com timeout usando AbortController
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs: number = this.defaultTimeout
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      // Check for AbortError more robustly - works for both Error and DOMException
      if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  async proposeIntent(request: IntentRequest, timeoutMs?: number) {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/intend`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          intent: request.intent,
          realm: this.config.realm,
          payload: {
            agreementType: request.agreementType,
            parties: request.parties,
            terms: request.terms,
            ...request.payload
          }
        })
      },
      timeoutMs
    );

    if (!response.ok) {
      throw new Error(`Intent failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async query(type: string, filters?: Record<string, any>, timeoutMs?: number) {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          type,
          filters,
          realm: this.config.realm
        })
      },
      timeoutMs
    );

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async chat(message: string, sessionId?: string, timeoutMs?: number) {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          message,
          sessionId,
          startSession: !sessionId
        })
      },
      timeoutMs
    );

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

export function createLedgerClient(config: LedgerClientConfig): LedgerClient {
  return new LedgerClient(config);
}
