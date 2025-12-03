/**
 * 10-Second Deployment Engine — Core Types
 * Inspired by the reference spec: multi-target, pre-warmed pools, parallel stages.
 */

export type TargetType = 'ledger-cloud' | 'aws' | 'azure' | 'gcp' | 'docker' | 'kubernetes';

export interface Credentials {
  type: 'api-key' | 'oauth' | 'service-account' | 'ssh-key';
  data: Record<string, string>;
}

export interface DeploymentTarget {
  type: TargetType;
  config: {
    credentials?: Credentials;
    region?: string;
    project?: string;
    namespace?: string;
  };
  requirements: {
    cpu: string; // e.g., "500m" or "0.5"
    memory: string; // e.g., "512Mi"
    storage: string; // e.g., "1Gi"
    ports: number[]; // e.g., [80, 443, 3000]
  };
}

export interface VolumeMount {
  name: string;
  mountPath: string;
  size: string; // "1Gi"
}

export interface LogConfig {
  path: string;
  pattern?: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
}

export interface NetworkConfig {
  public: boolean;
  domain?: string;
  subdomainPrefix?: string; // e.g., "bom-"
  tls?: 'auto' | 'none' | 'custom';
}

export interface ToolPackage {
  id: string;
  name: string;
  version: string;
  artifacts: {
    dockerfile?: string;
    docker_image?: string;
    helm_chart?: string;
    cloudformation?: string;
    terraform?: string;
    kubernetes?: string;
  };
  config: {
    env: Record<string, string>;
    secrets: Record<string, string>;
    volumes: VolumeMount[];
    network: NetworkConfig;
  };
  monitoring: {
    health_check: string; // e.g., "/health"
    metrics: string[]; // e.g., ["/metrics"]
    logs: LogConfig[];
  };
  requirements?: DeploymentTarget['requirements'];
}

export interface DeploymentStep {
  name: string;
  duration: number; // ms budget
  target: 'network' | 'compute' | 'container' | 'routing' | 'verification' | 'storage' | 'database';
}

export interface DeploymentPlan {
  id: string;
  target: TargetType;
  steps: DeploymentStep[];
  estimatedDuration: number;
  rollbackSteps: DeploymentStep[];
}

export interface ProvisionedResources {
  id: string;
  target: TargetType;
  controlPlaneUrl?: string;
  config?: Record<string, any>;
  endpoints?: { internal?: string; external?: string };
}

export interface Deployment {
  id: string;
  toolId: string;
  endpoint: string;
  artifactHash?: string;
  config: Record<string, any>;
}

export interface VerifiedDeployment {
  id: string;
  url: string;
  ready: boolean;
  duration: number;
  adminCredentials?: { email: string; password: string };
}

export interface DeploymentSnapshot {
  id: string;
  deploymentId: string;
  artifactHash?: string;
  configHash: string;
  timestamp: number;
  size: number;
}