/**
 * Documentation Engine - Generates personalized USER_GUIDE.md
 *
 * Creates comprehensive, tool-specific documentation based on:
 * - Template selected
 * - Features enabled
 * - Integrations configured
 * - Industry vertical
 */

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  questions?: Array<{ id: string; question: string; type: string }>;
  features?: {
    available?: Array<{ id: string; name: string; description?: string }>;
  };
}

export interface DocsConfig {
  template: TemplateDefinition;
  answers: Record<string, any>;
  metadata?: {
    deploymentUrl?: string;
    realmId?: string;
    generatedAt?: string;
  };
}

export class DocsEngine {
  /**
   * Generate complete USER_GUIDE.md
   */
  generate(config: DocsConfig): string {
    const { template, answers, metadata } = config;
    const companyName = answers.companyName || 'Your Company';
    const features = (answers.features || []) as string[];
    const integrations = (answers.integrations || []) as string[];
    const industry = answers.industry || 'General';

    const sections: string[] = [];

    // Header
    sections.push(this.generateHeader(companyName, template.name));

    // Quick Start
    sections.push(this.generateQuickStart(metadata?.deploymentUrl));

    // Features Documentation
    if (features.length > 0) {
      sections.push(this.generateFeaturesSection(features, template, industry));
    }

    // Integrations Documentation
    if (integrations.length > 0) {
      sections.push(this.generateIntegrationsSection(integrations, metadata?.deploymentUrl));
    }

    // Workflows
    sections.push(this.generateWorkflowsSection(template, answers));

    // Administration
    sections.push(this.generateAdministrationSection());

    // Troubleshooting
    sections.push(this.generateTroubleshootingSection());

    // Footer
    sections.push(this.generateFooter(template, metadata));

    return sections.join('\n\n---\n\n');
  }

  private generateHeader(companyName: string, templateName: string): string {
    return `# ${companyName} - User Guide

## Welcome to Your ${templateName}

This comprehensive guide was automatically generated based on your configuration.
It contains everything you need to get started and master your new tool.

**📖 What's Inside:**
- Quick Start Guide
- Feature Documentation
- Integration Setup
- Best Practices
- Troubleshooting`;
  }

  private generateQuickStart(deploymentUrl?: string): string {
    const url = deploymentUrl || '[YOUR_DEPLOYMENT_URL]';

    return `## 🚀 Quick Start

### Step 1: Access Your Tool

Your tool is deployed at:
\`\`\`
${url}
\`\`\`

Bookmark this URL for easy access!

### Step 2: First Login

1. Navigate to the login page
2. If this is your first time, you'll see a welcome screen
3. Follow the onboarding wizard to set up your profile

### Step 3: Explore the Dashboard

Once logged in, you'll see:
- **Dashboard Overview** - Real-time metrics and key information
- **Navigation Menu** - Access all features from the sidebar
- **Quick Actions** - Frequently used operations available at your fingertips

### Step 4: Start Creating

Click the "+ New" button in the top-right corner to create your first item.`;
  }

  private generateFeaturesSection(
    features: string[],
    template: TemplateDefinition,
    industry: string
  ): string {
    const featureDescriptions: Record<string, string> = {
      'multi-currency': 'Support for multiple currencies with automatic conversion and exchange rate management.',
      'recurring-billing': 'Automate subscription billing with flexible billing cycles and automatic payment processing.',
      'reporting': 'Advanced analytics and custom reports to track performance and make data-driven decisions.',
      'notifications': 'Real-time alerts via email, SMS, and in-app notifications to keep you informed.',
      'api-access': 'RESTful API for integrating with external systems and automating workflows.',
      'audit-logs': 'Complete audit trail of all system actions for compliance and security.',
      'team-collaboration': 'Collaborate with your team through shared workspaces and real-time updates.',
      'custom-fields': 'Extend data models with custom fields specific to your business needs.',
      'bulk-operations': 'Process multiple items at once with batch operations and CSV import/export.',
      'advanced-search': 'Powerful search with filters, saved queries, and full-text search capabilities.',
      'workflow-automation': 'Automate repetitive tasks with custom workflows and business rules.',
      'mobile-app': 'Native mobile apps for iOS and Android for on-the-go access.'
    };

    let section = `## 📋 Available Features

Your ${template.name} includes the following features:

`;

    features.forEach((feature) => {
      const description = featureDescriptions[feature.toLowerCase()] ||
                         'This feature enhances your workflow and productivity.';
      const featureName = feature.split('-').map(w =>
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join(' ');

      section += `### ${featureName}

${description}

**How to use:**
1. Navigate to the "${featureName}" section from the main menu
2. Click "New ${featureName}" to get started
3. Fill in the required fields
4. Click "Save" to complete

**Industry-Specific Tip (${industry}):**
${this.getIndustryTip(feature, industry)}

`;
    });

    return section;
  }

  private getIndustryTip(feature: string, industry: string): string {
    const tips: Record<string, Record<string, string>> = {
      'recurring-billing': {
        'SaaS': 'Use annual billing to improve cash flow and reduce churn.',
        'Healthcare': 'Set up automatic billing for subscription-based patient care programs.',
        'Education': 'Configure academic year billing cycles with automatic renewal.',
        'default': 'Consider offering multiple billing frequencies to meet customer preferences.'
      },
      'reporting': {
        'SaaS': 'Track MRR, ARR, and churn metrics in real-time dashboards.',
        'Healthcare': 'Generate HIPAA-compliant reports for audits and compliance.',
        'Finance': 'Create detailed financial statements with drill-down capabilities.',
        'default': 'Schedule automated reports to be delivered to stakeholders weekly.'
      }
    };

    const featureTips = tips[feature] || {};
    return featureTips[industry] || featureTips['default'] ||
           'Customize this feature to match your specific business requirements.';
  }

  private generateIntegrationsSection(integrations: string[], deploymentUrl?: string): string {
    const url = deploymentUrl || '[YOUR_DEPLOYMENT_URL]';
    let section = `## 🔌 Active Integrations

Your tool is configured with the following integrations:

`;

    const integrationDocs: Record<string, any> = {
      'stripe': {
        name: 'Stripe',
        description: 'Payment processing and subscription management',
        setup: [
          'Get your Stripe API keys from the Stripe Dashboard',
          'Navigate to Settings → Integrations → Stripe',
          'Enter your Publishable Key and Secret Key',
          'Click "Test Connection" to verify',
          'Configure webhook URL: `${url}/webhooks/stripe`'
        ],
        webhooks: true
      },
      'slack': {
        name: 'Slack',
        description: 'Team notifications and alerts',
        setup: [
          'Create a Slack App at api.slack.com/apps',
          'Add Bot Token Scopes: chat:write, channels:read',
          'Install the app to your workspace',
          'Copy the Bot User OAuth Token',
          'Enter the token in Settings → Integrations → Slack'
        ],
        webhooks: false
      },
      'sendgrid': {
        name: 'SendGrid',
        description: 'Transactional email delivery',
        setup: [
          'Create a SendGrid API Key with "Mail Send" permissions',
          'Navigate to Settings → Integrations → SendGrid',
          'Enter your API Key',
          'Configure sender email and name',
          'Test email delivery'
        ],
        webhooks: true
      },
      'quickbooks': {
        name: 'QuickBooks',
        description: 'Accounting and financial sync',
        setup: [
          'Sign up for QuickBooks Online API access',
          'Navigate to Settings → Integrations → QuickBooks',
          'Click "Connect to QuickBooks"',
          'Authorize the connection',
          'Configure sync settings (invoices, payments, customers)'
        ],
        webhooks: true
      }
    };

    integrations.forEach((integration) => {
      const intKey = integration.toLowerCase();
      const intDoc = integrationDocs[intKey] || {
        name: integration,
        description: 'Third-party service integration',
        setup: [`Navigate to Settings → Integrations → ${integration}`, 'Follow the on-screen instructions'],
        webhooks: false
      };

      section += `### ${intDoc.name}

**Purpose:** ${intDoc.description}

**Setup Instructions:**
${intDoc.setup.map((step: string, idx: number) => `${idx + 1}. ${step}`).join('\n')}

`;

      if (intDoc.webhooks) {
        section += `**Webhook Configuration:**
- Webhook URL: \`${url}/webhooks/${intKey}\`
- Events: All supported events are automatically configured
- Verify webhook signature for security

`;
      }
    });

    return section;
  }

  private generateWorkflowsSection(template: TemplateDefinition, answers: Record<string, any>): string {
    return `## 🔄 Common Workflows

### Creating a New Item

1. Click the "+ New" button in the toolbar
2. Fill in the required fields marked with *
3. Optionally add additional details
4. Click "Save" or "Save & Continue"

### Searching and Filtering

1. Use the search bar at the top to find items by name
2. Click "Filters" to narrow results by:
   - Date range
   - Status
   - Category
   - Custom fields
3. Save frequently used filters as "Saved Searches"

### Bulk Operations

1. Select multiple items using checkboxes
2. Click "Bulk Actions" dropdown
3. Choose an operation:
   - Export to CSV
   - Update status
   - Assign to user
   - Delete (with confirmation)

### Sharing and Collaboration

1. Open any item
2. Click the "Share" button
3. Enter collaborator emails
4. Set permissions (View, Edit, Admin)
5. Add an optional message
6. Click "Send Invitations"`;
  }

  private generateAdministrationSection(): string {
    return `## 🛠️ Administration

### User Management

**Adding Users:**
1. Go to Settings → Users → Team
2. Click "Invite User"
3. Enter email address and select role
4. User will receive an invitation email

**User Roles:**
- **Admin** - Full access to all features and settings
- **Manager** - Create, edit, and delete items; cannot change billing
- **Member** - Create and edit own items
- **Viewer** - Read-only access

### Security Settings

**Two-Factor Authentication (2FA):**
1. Go to Settings → Security → 2FA
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
4. Enter verification code

**API Keys:**
1. Navigate to Settings → API → Keys
2. Click "Generate New Key"
3. Name your key (e.g., "Mobile App", "Integration")
4. Copy and securely store the key
5. Set key expiration (recommended: 90 days)

### Backup & Export

**Automated Backups:**
- Daily backups are performed automatically at 2 AM UTC
- Backups are retained for 30 days
- Enterprise plans: 90-day retention

**Manual Export:**
1. Go to Settings → Data → Export
2. Select data types to export
3. Choose format (JSON, CSV, or Excel)
4. Click "Export All Data"
5. Download the generated ZIP file`;
  }

  private generateTroubleshootingSection(): string {
    return `## 🔍 Troubleshooting

### Login Issues

**Problem:** Cannot log in or forgot password
**Solution:**
1. Click "Forgot Password" on login page
2. Check email for reset link (check spam folder)
3. If no email received, contact support

**Problem:** "Account locked" message
**Solution:**
- Wait 15 minutes and try again
- If urgent, contact support to unlock

### Integration Problems

**Problem:** Integration not syncing data
**Solution:**
1. Check Settings → Integrations → [Service]
2. Click "Test Connection"
3. Verify webhook URLs are correct
4. Check integration service status page
5. Review error logs in Settings → Logs

### Performance Issues

**Problem:** Page loading slowly
**Solution:**
- Clear browser cache and cookies
- Try a different browser
- Check internet connection speed
- Reduce number of items displayed per page

### Data Issues

**Problem:** Missing or incorrect data
**Solution:**
1. Check filters - you may have an active filter
2. Verify date range settings
3. Look in Archive or Trash
4. Contact support if data loss suspected

### Getting Help

**Support Channels:**
- **Email:** support@${answers.companyName?.toLowerCase().replace(/\s+/g, '') || 'company'}.com
- **Live Chat:** Available Mon-Fri, 9 AM - 5 PM EST
- **Documentation:** Full docs at [deployment URL]/docs
- **Status Page:** Check system status at status.${answers.companyName?.toLowerCase().replace(/\s+/g, '') || 'company'}.com

**Before Contacting Support:**
1. Check this troubleshooting guide
2. Search the knowledge base
3. Try reproducing the issue in an incognito window
4. Take screenshots of any error messages`;
  }

  private generateFooter(template: TemplateDefinition, metadata?: any): string {
    const date = metadata?.generatedAt
      ? new Date(metadata.generatedAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    return `## 📞 Additional Resources

- **Video Tutorials:** Browse our video library for step-by-step guides
- **API Documentation:** For developers integrating with your tool
- **Community Forum:** Connect with other users and share tips
- **Feature Requests:** Submit ideas for new features
- **Release Notes:** Stay updated on new features and improvements

---

**📄 Document Information**

- **Template:** ${template.name}
- **Generated By:** Build-o-Matic
- **Generated On:** ${date}
- **Version:** 1.0
- **Last Updated:** ${date}

---

*This guide is automatically updated when your configuration changes.
For the latest version, visit your deployment URL and navigate to Help → User Guide.*

**🎉 Congratulations! You're ready to get started with your new tool.**`;
  }
}
