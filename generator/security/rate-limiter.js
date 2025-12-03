/**
 * RATE LIMITER - Proteção contra abuso
 *
 * Limita a taxa de geração de ferramentas por usuário/IP.
 */
export class RateLimiter {
    constructor(windowMs = 60 * 1000, // 1 minuto
    maxRequests = 10, // 10 requisições por minuto
    blockDurationMs = 5 * 60 * 1000 // Bloqueio de 5 minutos
    ) {
        this.limits = new Map();
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.blockDurationMs = blockDurationMs;
    }
    /**
     * Verifica se uma requisição é permitida
     */
    isAllowed(identifier) {
        const now = Date.now();
        const entry = this.limits.get(identifier);
        // Limpar entradas expiradas
        this.cleanup(now);
        // Verificar se está bloqueado
        if (entry?.blocked && entry.blockUntil && entry.blockUntil > now) {
            const remainingBlock = Math.ceil((entry.blockUntil - now) / 1000);
            return {
                allowed: false,
                remaining: 0,
                resetAt: entry.blockUntil,
                error: `Rate limit exceeded. Blocked for ${remainingBlock} seconds.`
            };
        }
        // Se não existe entrada ou expirou, criar nova
        if (!entry || entry.resetAt <= now) {
            this.limits.set(identifier, {
                count: 1,
                resetAt: now + this.windowMs,
                blocked: false
            });
            return {
                allowed: true,
                remaining: this.maxRequests - 1,
                resetAt: now + this.windowMs
            };
        }
        // Incrementar contador
        entry.count++;
        // Verificar se excedeu o limite
        if (entry.count > this.maxRequests) {
            // Bloquear
            entry.blocked = true;
            entry.blockUntil = now + this.blockDurationMs;
            return {
                allowed: false,
                remaining: 0,
                resetAt: entry.blockUntil,
                error: `Rate limit exceeded. Maximum ${this.maxRequests} requests per ${this.windowMs / 1000} seconds.`
            };
        }
        return {
            allowed: true,
            remaining: this.maxRequests - entry.count,
            resetAt: entry.resetAt
        };
    }
    /**
     * Limpa entradas expiradas
     */
    cleanup(now) {
        for (const [key, entry] of this.limits.entries()) {
            // Remover se expirado e não bloqueado
            if (entry.resetAt <= now && (!entry.blocked || (entry.blockUntil && entry.blockUntil <= now))) {
                this.limits.delete(key);
            }
        }
    }
    /**
     * Reseta o limite para um identificador
     */
    reset(identifier) {
        this.limits.delete(identifier);
    }
    /**
     * Obtém estatísticas de rate limit
     */
    getStats(identifier) {
        const entry = this.limits.get(identifier);
        if (!entry) {
            return null;
        }
        const now = Date.now();
        if (entry.resetAt <= now) {
            return null;
        }
        return {
            count: entry.count,
            remaining: Math.max(0, this.maxRequests - entry.count),
            resetAt: entry.resetAt,
            blocked: entry.blocked && (entry.blockUntil ? entry.blockUntil > now : false)
        };
    }
}
// Instância global (singleton)
export const globalRateLimiter = new RateLimiter(60 * 1000, // 1 minuto
10, // 10 requisições
5 * 60 * 1000 // Bloqueio de 5 minutos
);
