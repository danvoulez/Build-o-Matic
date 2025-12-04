/**
 * UBL Client for Build-o-Matic Generated Tools
 */

export interface LedgerClientConfig {
  url: string;
  realm: string;
  apiKey?: string;
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

  constructor(config: LedgerClientConfig) {
    this.config = config;
    this.baseUrl = config.url.replace(/\/$/, '');
  }

  async proposeIntent(request: IntentRequest) {
    const response = await fetch(`${this.baseUrl}/intent`, {
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
    });

    if (!response.ok) {
      throw new Error(`Intent failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async query(type: string, filters?: Record<string, any>) {
    const response = await fetch(`${this.baseUrl}/query`, {
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
    });

    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async chat(message: string, sessionId?: string) {
    const response = await fetch(`${this.baseUrl}/chat`, {
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
    });

    if (!response.ok) {
      throw new Error(`Chat failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

export function createLedgerClient(config: LedgerClientConfig): LedgerClient {
  return new LedgerClient(config);
}
