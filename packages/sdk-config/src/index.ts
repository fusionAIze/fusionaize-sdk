// Configuration loading and profile resolution for fusionAIze SDK
// v1 config model with multiple sources, profiles, validation, and endpoint resolution

import type { JsonObject } from "@fusionaize/sdk-core";
import { ValidationError } from "@fusionaize/sdk-errors";

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Client configuration for fusionAIze SDK
 * @stable
 */
export interface ClientConfig {
  // Connection settings
  /** Gate API endpoint (default: http://localhost:8090) */
  gateEndpoint?: string;
  /** API key for authentication */
  apiKey?: string;
  /** Bearer token for authentication (alternative to apiKey) */
  token?: string;
  /** Session ID for authentication */
  sessionId?: string;

  // Request settings
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Number of retries for failed requests (default: 3) */
  retries?: number;
  /** Base delay between retries in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Maximum delay between retries in milliseconds (default: 10000) */
  maxRetryDelay?: number;

  // Feature flags
  /** Enable/disable tracing (default: true) */
  tracingEnabled?: boolean;
  /** Enable/disable request logging (default: false) */
  requestLogging?: boolean;
  /** Enable/disable response logging (default: false) */
  responseLogging?: boolean;

  // Profile and metadata
  /** Active profile name */
  profile?: string;
  /** Environment name (e.g., "development", "production") */
  environment?: string;
  /** Additional provider-specific configuration */
  providerConfig?: JsonObject;
  /** User-provided metadata */
  metadata?: JsonObject;
}

/**
 * Configuration profile with optional inheritance
 * @stable
 */
export interface ConfigProfile {
  /** Profile name */
  name: string;
  /** Profile description */
  description?: string;
  /** Configuration values for this profile */
  config: Partial<ClientConfig>;
  /** Parent profile to inherit from */
  extends?: string;
}

/**
 * Configuration source definition
 * @beta
 */
export interface ConfigSource {
  /** Source name for debugging */
  name: string;
  /** Load configuration from this source */
  load(): Promise<Partial<ClientConfig>>;
  /** Priority (higher = more important) */
  priority?: number;
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default configuration values
 * @stable
 */
export const DEFAULT_CONFIG: Required<Pick<ClientConfig,
  | 'gateEndpoint'
  | 'timeout'
  | 'retries'
  | 'retryDelay'
  | 'maxRetryDelay'
  | 'tracingEnabled'
  | 'requestLogging'
  | 'responseLogging'
  | 'environment'
>> = {
  gateEndpoint: 'http://localhost:8090',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  maxRetryDelay: 10000,
  tracingEnabled: true,
  requestLogging: false,
  responseLogging: false,
  environment: 'development',
};

// ============================================================================
// CONFIGURATION SOURCES
// ============================================================================

/**
 * Environment variable configuration source
 * Maps environment variables to config fields
 * @stable
 */
export class EnvConfigSource implements ConfigSource {
  readonly name = 'environment';
  readonly priority = 100;

  private readonly envMapping = {
    FUSIONAIZE_GATE_ENDPOINT: 'gateEndpoint',
    FUSIONAIZE_API_KEY: 'apiKey',
    FUSIONAIZE_TOKEN: 'token',
    FUSIONAIZE_SESSION_ID: 'sessionId',
    FUSIONAIZE_TIMEOUT: 'timeout',
    FUSIONAIZE_RETRIES: 'retries',
    FUSIONAIZE_RETRY_DELAY: 'retryDelay',
    FUSIONAIZE_MAX_RETRY_DELAY: 'maxRetryDelay',
    FUSIONAIZE_TRACING_ENABLED: 'tracingEnabled',
    FUSIONAIZE_REQUEST_LOGGING: 'requestLogging',
    FUSIONAIZE_RESPONSE_LOGGING: 'responseLogging',
    FUSIONAIZE_PROFILE: 'profile',
    FUSIONAIZE_ENVIRONMENT: 'environment',
    NODE_ENV: 'environment',
  } as const;

  async load(): Promise<Partial<ClientConfig>> {
    const config: Partial<ClientConfig> = {};

    for (const [envVar, configKey] of Object.entries(this.envMapping)) {
      const value = process.env[envVar];
      if (value === undefined) continue;

      switch (configKey) {
        case 'timeout':
        case 'retries':
        case 'retryDelay':
        case 'maxRetryDelay':
          const num = Number.parseInt(value, 10);
          if (!Number.isNaN(num)) {
            (config[configKey] as number) = num;
          }
          break;

        case 'tracingEnabled':
        case 'requestLogging':
        case 'responseLogging':
          (config[configKey] as boolean) = value.toLowerCase() === 'true';
          break;

        default:
          (config[configKey] as string) = value;
          break;
      }
    }

    // Special handling for NODE_ENV
    if (process.env.NODE_ENV && !config.environment) {
      config.environment = process.env.NODE_ENV;
    }

    return config;
  }
}

/**
 * Profile-based configuration source
 * Loads profiles from a JSON file or object
 * @beta
 */
export class ProfileConfigSource implements ConfigSource {
  readonly name = 'profiles';

  constructor(
    private profiles: Record<string, ConfigProfile> = {},
    private activeProfile?: string,
  ) {}

  async load(): Promise<Partial<ClientConfig>> {
    const profileName = this.activeProfile || 
      process.env.FUSIONAIZE_PROFILE || 
      'default';

    const profile = this.profiles[profileName];
    if (!profile) {
      return { profile: profileName };
    }

    // Resolve inheritance chain
    const resolvedConfig = this.resolveProfile(profile);
    return { ...resolvedConfig, profile: profileName };
  }

  private resolveProfile(profile: ConfigProfile): Partial<ClientConfig> {
    let config = { ...profile.config };

    // Handle inheritance
    if (profile.extends && this.profiles[profile.extends]) {
      const parentConfig = this.resolveProfile(this.profiles[profile.extends]!);
      config = { ...parentConfig, ...config };
    }

    return config;
  }
}

// ============================================================================
// CONFIGURATION LOADER
// ============================================================================

/**
 * Configuration loader with multiple sources and validation
 * @stable
 */
export class ConfigLoader {
  private sources: ConfigSource[] = [];

  constructor() {
    // Add default sources
    this.addSource(new EnvConfigSource());
  }

  /**
   * Add a configuration source
   */
  addSource(source: ConfigSource): this {
    this.sources.push(source);
    // Sort by priority (higher first)
    this.sources.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return this;
  }

  /**
   * Load configuration from all sources
   */
  async load(options?: {
    profile?: string;
    overrides?: Partial<ClientConfig>;
  }): Promise<ClientConfig> {
    // Start with defaults
    let config: Partial<ClientConfig> = { ...DEFAULT_CONFIG };

    // Load from all sources
    for (const source of this.sources) {
      try {
        const sourceConfig = await source.load();
        config = this.mergeConfigs(config, sourceConfig);
      } catch (error) {
        // Log but continue with other sources
        console.warn(`Failed to load config from source ${source.name}:`, error);
      }
    }

    // Apply profile if specified
    if (options?.profile) {
      config.profile = options.profile;
    }

    // Apply overrides (highest priority)
    if (options?.overrides) {
      config = this.mergeConfigs(config, options.overrides);
    }

    // Ensure required fields
    const finalConfig = this.applyDefaults(config);

    // Validate
    const errors = this.validateConfig(finalConfig);
    if (errors.length > 0) {
      throw new ValidationError('Configuration validation failed', {
        errors,
        config: finalConfig,
      });
    }

    return finalConfig as ClientConfig;
  }

  /**
   * Merge two configurations (later overrides earlier)
   */
  private mergeConfigs(
    base: Partial<ClientConfig>,
    overrides: Partial<ClientConfig>,
  ): Partial<ClientConfig> {
    return { ...base, ...overrides };
  }

  /**
   * Apply default values to configuration
   */
  private applyDefaults(config: Partial<ClientConfig>): Partial<ClientConfig> {
    return { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: Partial<ClientConfig>): string[] {
    const errors: string[] = [];

    // Validate gateEndpoint
    if (config.gateEndpoint) {
      try {
        new URL(config.gateEndpoint);
      } catch {
        errors.push('gateEndpoint must be a valid URL');
      }
    }

    // Validate numeric fields
    if (config.timeout !== undefined && config.timeout < 0) {
      errors.push('timeout must be non-negative');
    }
    if (config.retries !== undefined && config.retries < 0) {
      errors.push('retries must be non-negative');
    }
    if (config.retryDelay !== undefined && config.retryDelay < 0) {
      errors.push('retryDelay must be non-negative');
    }
    if (config.maxRetryDelay !== undefined && config.maxRetryDelay < 0) {
      errors.push('maxRetryDelay must be non-negative');
    }

    // Validate retry delay ordering
    if (config.retryDelay !== undefined && 
        config.maxRetryDelay !== undefined &&
        config.retryDelay > config.maxRetryDelay) {
      errors.push('retryDelay cannot exceed maxRetryDelay');
    }

    return errors;
  }
}

// ============================================================================
// ENDPOINT RESOLUTION
// ============================================================================

/**
 * Resolve service endpoints based on configuration
 * @stable
 */
export class EndpointResolver {
  constructor(private config: ClientConfig) {}

  /**
   * Get the Gate API endpoint with optional path
   */
  getGateEndpoint(path?: string): string {
    const base = this.config.gateEndpoint || DEFAULT_CONFIG.gateEndpoint;
    if (!path) return base;

    // Ensure single slash between base and path
    const baseEndsWithSlash = base.endsWith('/');
    const pathStartsWithSlash = path.startsWith('/');
    
    if (baseEndsWithSlash && pathStartsWithSlash) {
      return base + path.slice(1);
    } else if (!baseEndsWithSlash && !pathStartsWithSlash) {
      return base + '/' + path;
    } else {
      return base + path;
    }
  }

  /**
   * Check if we're connecting to localhost (for development features)
   */
  isLocalhost(): boolean {
    const endpoint = this.config.gateEndpoint || DEFAULT_CONFIG.gateEndpoint;
    try {
      const url = new URL(endpoint);
      return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    } catch {
      return false;
    }
  }

  /**
   * Check if we're using HTTPS
   */
  isSecure(): boolean {
    const endpoint = this.config.gateEndpoint || DEFAULT_CONFIG.gateEndpoint;
    try {
      const url = new URL(endpoint);
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Default configuration loader instance
 */
const defaultLoader = new ConfigLoader();

/**
 * Load configuration using default sources
 * @stable
 */
export async function loadConfig(options?: {
  profile?: string;
  overrides?: Partial<ClientConfig>;
}): Promise<ClientConfig> {
  return defaultLoader.load(options);
}

/**
 * Create a configuration loader with default sources
 * @stable
 */
export function createConfigLoader(): ConfigLoader {
  return new ConfigLoader();
}

/**
 * Create an endpoint resolver for a configuration
 * @stable
 */
export function createEndpointResolver(config: ClientConfig): EndpointResolver {
  return new EndpointResolver(config);
}

/**
 * Validate a configuration object
 * @stable
 */
export function validateConfig(config: Partial<ClientConfig>): string[] {
  const loader = new ConfigLoader();
  return (loader as any).validateConfig(config);
}

/**
 * Merge multiple configurations (later overrides earlier)
 * @stable
 */
export function mergeConfigs(...configs: Partial<ClientConfig>[]): Partial<ClientConfig> {
  return configs.reduce((acc, config) => ({ ...acc, ...config }), {});
}

// ============================================================================
// TYPE GUARDS AND UTILITIES
// ============================================================================

/**
 * Check if a configuration has authentication credentials
 * @stable
 */
export function hasAuth(config: ClientConfig): boolean {
  return !!(config.apiKey || config.token || config.sessionId);
}

/**
 * Get authentication type from configuration
 * @stable
 */
export function getAuthType(config: ClientConfig): 'apiKey' | 'token' | 'session' | 'none' {
  if (config.apiKey) return 'apiKey';
  if (config.token) return 'token';
  if (config.sessionId) return 'session';
  return 'none';
}