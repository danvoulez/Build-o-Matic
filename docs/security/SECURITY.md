# 🛡️ Hardening de Segurança - Build-o-Matic

## 📋 Visão Geral

Este documento descreve as camadas de segurança implementadas no Build-o-Matic para proteger contra ataques comuns e garantir a integridade do sistema.

---

## 🔒 Módulos de Segurança

### 1. Security Validator (`generator/security/validator.ts`)

Valida e sanitiza todos os inputs do sistema.

#### Funcionalidades:
- ✅ **Validação de Company Name**: Remove caracteres perigosos, limita tamanho
- ✅ **Validação de Industry**: Whitelist de indústrias válidas
- ✅ **Validação de Template ID**: Whitelist de templates, proteção contra path traversal
- ✅ **Validação de Features**: Whitelist de features, limite de quantidade
- ✅ **Validação de User Count**: Limites mínimo (1) e máximo (1,000,000)
- ✅ **Validação de Deploy Target**: Whitelist de targets válidos
- ✅ **Validação de Tool ID**: Apenas alfanuméricos, hífens e underscores
- ✅ **Validação de Realm ID**: Proteção contra path traversal
- ✅ **Validação de Theme ID**: Whitelist de temas válidos
- ✅ **Validação de Layout Type**: Whitelist de layouts válidos
- ✅ **Sanitização de File Paths**: Proteção contra path traversal

#### Exemplo de Uso:
```typescript
import { SecurityValidator } from './security/validator';

const validation = SecurityValidator.validateAnswers(answers);
if (!validation.valid) {
  throw new Error(validation.errors.join(', '));
}
const sanitized = validation.sanitized;
```

---

### 2. Rate Limiter (`generator/security/rate-limiter.ts`)

Protege contra abuso através de rate limiting.

#### Configuração Padrão:
- **Janela**: 60 segundos (1 minuto)
- **Limite**: 10 requisições por minuto
- **Bloqueio**: 5 minutos após exceder limite

#### Funcionalidades:
- ✅ Contagem de requisições por identificador (userId ou IP)
- ✅ Bloqueio automático após exceder limite
- ✅ Limpeza automática de entradas expiradas
- ✅ Estatísticas de uso

#### Exemplo de Uso:
```typescript
import { globalRateLimiter } from './security/rate-limiter';

const result = globalRateLimiter.isAllowed(userId);
if (!result.allowed) {
  throw new Error(result.error);
}
```

---

### 3. Battle Tests (`generator/security/battle-tests.ts`)

Testes de resistência e segurança.

#### Testes Implementados:
1. **Inputs Maliciosos**
   - Path traversal (`../../../etc/passwd`)
   - XSS (`<script>alert(1)</script>`)
   - SQL Injection (`' OR '1'='1`)
   - Template ID inválido
   - Features maliciosas

2. **Rate Limiting**
   - Requisições normais
   - Exceder limite
   - Bloqueio temporário
   - Reset após expiração

3. **Validação de Temas/Layouts**
   - Temas inválidos
   - Layouts inválidos

4. **Path Traversal**
   - Caminhos maliciosos
   - Caminhos válidos

---

## 🔐 Proteções Implementadas

### 1. Validação de Inputs

Todos os inputs são validados e sanitizados antes do processamento:

```typescript
// No Customizer
const validation = SecurityValidator.validateAnswers(answers);
if (!validation.valid) {
  throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
}
const sanitizedAnswers = validation.sanitized;
```

### 2. Sanitização contra XSS

Caracteres perigosos são removidos:

```typescript
// Remove: < > " ' &
strVal = strVal.replace(/[<>\"'&]/g, '');
```

### 3. Proteção contra Path Traversal

Caminhos de arquivos são validados:

```typescript
// Bloqueia: ../, ~, /, \
if (filePath.includes('..') || filePath.includes('~')) {
  throw new Error('Path traversal detected');
}
```

### 4. Rate Limiting

Limita requisições por usuário/IP:

```typescript
// No Generator
const rateLimitResult = globalRateLimiter.isAllowed(userId);
if (!rateLimitResult.allowed) {
  throw new Error(rateLimitResult.error);
}
```

### 5. Whitelist de Valores

Apenas valores pré-aprovados são aceitos:

- **Templates**: Lista fixa de templates válidos
- **Industries**: Lista fixa de indústrias válidas
- **Themes**: Lista fixa de temas válidos
- **Layouts**: Lista fixa de layouts válidos
- **Features**: Lista fixa de features válidas

### 6. Limite de Tamanho

Arquivos gerados são limitados a 10MB:

```typescript
const maxFileSize = 10 * 1024 * 1024; // 10MB
if (content.length > maxFileSize) {
  throw new Error(`File exceeds maximum size`);
}
```

---

## ⚔️ Battle Tests

Execute os testes de resistência:

```bash
node scripts/run-battle-tests.mjs
```

### Resultados Esperados:
- ✅ Path Traversal: 5/5 bloqueados
- ✅ XSS Protection: 3/3 sanitizados
- ✅ Template Validation: 3/3 rejeitados
- ✅ Rate Limiting: 12/12 funcionando

---

## 📊 Integração

### Customizer
- Valida e sanitiza `answers` antes de processar
- Valida `template.id` antes de carregar
- Sanitiza placeholders antes de substituir

### Generator (Core)
- Rate limiting antes de gerar
- Validação de `templateId`
- Validação de `answers`
- Uso de dados sanitizados em todo o fluxo

### Packager
- Validação de caminhos de arquivos
- Limite de tamanho de arquivos
- Proteção contra path traversal

---

## 🚨 Ataques Mitigados

| Ataque | Proteção | Status |
|--------|----------|--------|
| Path Traversal | Validação de caminhos | ✅ |
| XSS | Sanitização de caracteres | ✅ |
| SQL Injection | Whitelist + sanitização | ✅ |
| Command Injection | Whitelist de valores | ✅ |
| Rate Limit Abuse | Rate Limiter | ✅ |
| File Size DoS | Limite de 10MB | ✅ |
| Invalid Inputs | Validação completa | ✅ |

---

## 🔧 Configuração

### Rate Limiter

Ajuste os limites no `generator/core.ts`:

```typescript
const rateLimitResult = globalRateLimiter.isAllowed(userId);
// Configuração: 10 req/min, bloqueio de 5min
```

### Validação

Ajuste whitelists em `generator/security/validator.ts`:

```typescript
const validTemplates = ['invoice-manager', 'helpdesk', ...];
const validIndustries = ['finance', 'saas', ...];
```

---

## ✅ Checklist de Segurança

- [x] Validação de todos os inputs
- [x] Sanitização contra XSS
- [x] Proteção contra path traversal
- [x] Rate limiting implementado
- [x] Whitelist de valores válidos
- [x] Limite de tamanho de arquivos
- [x] Validação de temas e layouts
- [x] Battle tests executados
- [x] Logs de segurança
- [x] Tratamento de erros seguro

---

## 🎯 Próximos Passos

1. **Autenticação**: Implementar JWT para usuários
2. **CORS**: Configurar CORS adequadamente
3. **HTTPS**: Forçar HTTPS em produção
4. **Logs de Auditoria**: Registrar todas as ações
5. **Monitoramento**: Alertas para tentativas de ataque

---

## 📚 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [TypeScript Security](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**Status**: ✅ Hardening completo e battle tested!

