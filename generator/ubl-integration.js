/**
 * UBL Integration Helper
 *
 * Funções para integrar com Universal Business Ledger após geração.
 */
/**
 * Registra um Realm no UBL após geração de ferramenta
 */
export async function registerRealmInUBL(realm, ublAntennaUrl = process.env.UBL_ANTENNA_URL || 'http://localhost:3000') {
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
    }
    catch (error) {
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
export async function checkUBLAvailability(ublAntennaUrl = process.env.UBL_ANTENNA_URL || 'http://localhost:3000') {
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
    }
    catch (error) {
        return {
            available: false,
            error: error.message || 'Connection failed'
        };
    }
}
/**
 * Gera Realm ID único baseado no tool ID
 */
export function generateRealmId(toolId) {
    return `realm-${toolId}`;
}
