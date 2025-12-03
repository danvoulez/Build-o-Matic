/**
 * UBL Integration Helper
 * 
 * Funções para integrar com Universal Business Ledger após geração.
 */

export interface RealmRegistration {
  id: string;
  name: string;
  agreements: string; // JSON string or code
  metadata?: Record<string, any>;
}

/**
 * Registra um Realm no UBL após geração de ferramenta
 */
export async function registerRealmInUBL(
  realm: RealmRegistration,
  ublAntennaUrl: string = process.env.UBL_ANTENNA_URL || 'http://localhost:3000'
): Promise<{ success: boolean; realmId: string; error?: string }> {
  try {
    const response = await fetch(`${ublAntennaUrl}/realms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.UBL_API_KEY && {
          'Authorization': `Bearer ${process.env.UBL_API_KEY}`
        })
      },
      body: JSON.stringify({
        id: realm.id,
        name: realm.name,
        agreements: realm.agreements,
        metadata: realm.metadata || {}
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.warn(`Failed to register realm ${realm.id} in UBL:`, error);
      return {
        success: false,
        realmId: realm.id,
        error: error || `HTTP ${response.status}`
      };
    }

    const data = await response.json();
    return {
      success: true,
      realmId: data.id || realm.id
    };
  } catch (error: any) {
    console.warn(`Error registering realm ${realm.id} in UBL:`, error.message);
    return {
      success: false,
      realmId: realm.id,
      error: error.message
    };
  }
}

/**
 * Verifica se UBL está disponível
 */
export async function checkUBLAvailability(
  ublAntennaUrl: string = process.env.UBL_ANTENNA_URL || 'http://localhost:3000'
): Promise<{ available: boolean; error?: string }> {
  try {
    const response = await fetch(`${ublAntennaUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5s timeout
    });

    if (!response.ok) {
      return {
        available: false,
        error: `HTTP ${response.status}`
      };
    }

    return { available: true };
  } catch (error: any) {
    return {
      available: false,
      error: error.message || 'Connection failed'
    };
  }
}

/**
 * Gera Realm ID único baseado no tool ID
 */
export function generateRealmId(toolId: string): string {
  return `realm-${toolId}`;
}

