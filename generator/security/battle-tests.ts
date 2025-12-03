/**
 * BATTLE TESTS - Testes de Resistência e Segurança
 * 
 * Testes para validar o hardening de segurança.
 */

import { SecurityValidator } from './validator';
import { RateLimiter } from './rate-limiter';

export class BattleTests {
  /**
   * Testa validação de inputs maliciosos
   */
  static testMaliciousInputs(): { passed: number; failed: number; errors: string[] } {
    let passed = 0;
    let failed = 0;
    const errors: string[] = [];

    console.log('🧪 Testando inputs maliciosos...\n');

    // Teste 1: Path traversal
    const pathTraversalTests = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32',
      '../../root/.ssh/id_rsa',
      'normal/path/../../../etc/passwd'
    ];

    pathTraversalTests.forEach(path => {
      const result = SecurityValidator.sanitizeFilePath(path);
      if (result.valid) {
        failed++;
        errors.push(`Path traversal não detectado: ${path}`);
      } else {
        passed++;
      }
    });

    // Teste 2: XSS em company name
    const xssTests = [
      '<script>alert("xss")</script>',
      'Company<script>',
      'Company<img src=x onerror=alert(1)>',
      'Company\' OR \'1\'=\'1'
    ];

    xssTests.forEach(name => {
      const result = SecurityValidator.validateCompanyName(name);
      if (result.valid && result.sanitized.includes('<')) {
        failed++;
        errors.push(`XSS não sanitizado: ${name}`);
      } else {
        passed++;
      }
    });

    // Teste 3: SQL Injection
    const sqlInjectionTests = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin'--",
      "1' UNION SELECT * FROM users--"
    ];

    sqlInjectionTests.forEach(input => {
      const result = SecurityValidator.validateCompanyName(input);
      if (result.valid && result.sanitized.includes("'")) {
        failed++;
        errors.push(`SQL Injection não sanitizado: ${input}`);
      } else {
        passed++;
      }
    });

    // Teste 4: Template ID inválido
    const invalidTemplateTests = [
      '../../templates/secret',
      'invoice-manager; rm -rf /',
      'invoice-manager && cat /etc/passwd',
      'invoice-manager|whoami'
    ];

    invalidTemplateTests.forEach(templateId => {
      const result = SecurityValidator.validateTemplateId(templateId);
      if (result.valid) {
        failed++;
        errors.push(`Template ID inválido aceito: ${templateId}`);
      } else {
        passed++;
      }
    });

    // Teste 5: Features com valores maliciosos
    const maliciousFeatures = [
      ['<script>alert(1)</script>'],
      ['../../../etc/passwd'],
      ['normal', '<img src=x>'],
      Array(100).fill('feature') // Muitas features
    ];

    maliciousFeatures.forEach(features => {
      const result = SecurityValidator.validateFeatures(features);
      if (result.valid && result.sanitized.length > 20) {
        failed++;
        errors.push(`Muitas features aceitas: ${features.length}`);
      } else {
        passed++;
      }
    });

    // Teste 6: User count com valores extremos
    const extremeUserCounts = [
      -1,
      0,
      Number.MAX_SAFE_INTEGER,
      '999999999999999999',
      'not-a-number',
      Infinity
    ];

    extremeUserCounts.forEach(users => {
      const result = SecurityValidator.validateUserCount(users);
      if (result.valid && (result.sanitized < 1 || result.sanitized > 1000000)) {
        failed++;
        errors.push(`User count inválido aceito: ${users}`);
      } else {
        passed++;
      }
    });

    return { passed, failed, errors };
  }

  /**
   * Testa rate limiting
   */
  static testRateLimiting(): { passed: number; failed: number; errors: string[] } {
    let passed = 0;
    let failed = 0;
    const errors: string[] = [];

    console.log('🧪 Testando rate limiting...\n');

    const limiter = new RateLimiter(1000, 5, 2000); // 5 requisições por segundo, bloqueio de 2s

    // Teste 1: Requisições normais
    for (let i = 0; i < 5; i++) {
      const result = limiter.isAllowed('test-user');
      if (!result.allowed) {
        failed++;
        errors.push(`Requisição ${i + 1} bloqueada incorretamente`);
      } else {
        passed++;
      }
    }

    // Teste 2: Exceder limite
    const exceedResult = limiter.isAllowed('test-user');
    if (exceedResult.allowed) {
      failed++;
      errors.push('Limite não foi aplicado após 5 requisições');
    } else {
      passed++;
    }

    // Teste 3: Bloqueio temporário
    const blockedResult = limiter.isAllowed('test-user');
    if (blockedResult.allowed) {
      failed++;
      errors.push('Usuário não foi bloqueado após exceder limite');
    } else {
      passed++;
    }

    // Teste 4: Reset após expiração
    setTimeout(() => {
      const resetResult = limiter.isAllowed('test-user-2');
      if (!resetResult.allowed) {
        failed++;
        errors.push('Usuário ainda bloqueado após expiração');
      } else {
        passed++;
      }
    }, 1100);

    return { passed, failed, errors };
  }

  /**
   * Testa validação de temas e layouts
   */
  static testThemeLayoutValidation(): { passed: number; failed: number; errors: string[] } {
    let passed = 0;
    let failed = 0;
    const errors: string[] = [];

    console.log('🧪 Testando validação de temas e layouts...\n');

    // Teste 1: Temas inválidos
    const invalidThemes = [
      '../../themes/custom',
      '<script>alert(1)</script>',
      'corporate; rm -rf /',
      'corporate && cat /etc/passwd'
    ];

    invalidThemes.forEach(theme => {
      const result = SecurityValidator.validateThemeId(theme);
      if (result.valid && result.sanitized === theme) {
        failed++;
        errors.push(`Tema inválido aceito: ${theme}`);
      } else {
        passed++;
      }
    });

    // Teste 2: Layouts inválidos
    const invalidLayouts = [
      '../../layouts/custom',
      '<script>alert(1)</script>',
      'dashboard; rm -rf /',
      'dashboard && cat /etc/passwd'
    ];

    invalidLayouts.forEach(layout => {
      const result = SecurityValidator.validateLayoutType(layout);
      if (result.valid && result.sanitized === layout) {
        failed++;
        errors.push(`Layout inválido aceito: ${layout}`);
      } else {
        passed++;
      }
    });

    return { passed, failed, errors };
  }

  /**
   * Testa proteção contra path traversal em arquivos gerados
   */
  static testPathTraversalProtection(): { passed: number; failed: number; errors: string[] } {
    let passed = 0;
    let failed = 0;
    const errors: string[] = [];

    console.log('🧪 Testando proteção contra path traversal...\n');

    const maliciousPaths = [
      '../../../etc/passwd',
      '..\\..\\windows\\system32',
      '../../root/.ssh/id_rsa',
      'normal/../../../etc/passwd',
      '~/.ssh/id_rsa',
      '/etc/passwd',
      'C:\\Windows\\System32'
    ];

    maliciousPaths.forEach(path => {
      const result = SecurityValidator.sanitizeFilePath(path);
      if (result.valid) {
        failed++;
        errors.push(`Path traversal não detectado: ${path}`);
      } else {
        passed++;
      }
    });

    // Teste de caminhos válidos
    const validPaths = [
      'frontend/App.tsx',
      'frontend/components/Button.tsx',
      'package.json',
      'tailwind.config.js'
    ];

    validPaths.forEach(path => {
      const result = SecurityValidator.sanitizeFilePath(path);
      if (!result.valid) {
        failed++;
        errors.push(`Caminho válido rejeitado: ${path}`);
      } else {
        passed++;
      }
    });

    return { passed, failed, errors };
  }

  /**
   * Executa todos os testes de battle test
   */
  static runAllTests(): { totalPassed: number; totalFailed: number; results: any } {
    console.log('⚔️  BATTLE TESTS - Testes de Resistência e Segurança\n');
    console.log('='.repeat(60) + '\n');

    const maliciousInputs = this.testMaliciousInputs();
    const rateLimiting = this.testRateLimiting();
    const themeLayout = this.testThemeLayoutValidation();
    const pathTraversal = this.testPathTraversalProtection();

    const totalPassed = maliciousInputs.passed + rateLimiting.passed + themeLayout.passed + pathTraversal.passed;
    const totalFailed = maliciousInputs.failed + rateLimiting.failed + themeLayout.failed + pathTraversal.failed;

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESULTADOS DOS TESTES:\n');

    console.log(`1. Inputs Maliciosos: ${maliciousInputs.passed} ✅ / ${maliciousInputs.failed} ❌`);
    if (maliciousInputs.errors.length > 0) {
      maliciousInputs.errors.slice(0, 3).forEach(err => console.log(`   - ${err}`));
    }

    console.log(`\n2. Rate Limiting: ${rateLimiting.passed} ✅ / ${rateLimiting.failed} ❌`);
    if (rateLimiting.errors.length > 0) {
      rateLimiting.errors.slice(0, 3).forEach(err => console.log(`   - ${err}`));
    }

    console.log(`\n3. Validação Temas/Layouts: ${themeLayout.passed} ✅ / ${themeLayout.failed} ❌`);
    if (themeLayout.errors.length > 0) {
      themeLayout.errors.slice(0, 3).forEach(err => console.log(`   - ${err}`));
    }

    console.log(`\n4. Path Traversal: ${pathTraversal.passed} ✅ / ${pathTraversal.failed} ❌`);
    if (pathTraversal.errors.length > 0) {
      pathTraversal.errors.slice(0, 3).forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`\n📈 TOTAL: ${totalPassed} ✅ / ${totalFailed} ❌\n`);

    if (totalFailed === 0) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Sistema seguro! 🛡️\n');
    } else {
      console.log('⚠️  Alguns testes falharam. Revisar implementação.\n');
    }

    return {
      totalPassed,
      totalFailed,
      results: {
        maliciousInputs,
        rateLimiting,
        themeLayout,
        pathTraversal
      }
    };
  }
}

