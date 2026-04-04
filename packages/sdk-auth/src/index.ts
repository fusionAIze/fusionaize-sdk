// Authentication abstraction for fusionAIze SDK
// v1 auth model with providers, token refresh, and credential management

import type { ClientConfig } from "@fusionaize/sdk-config";
import { AuthenticationError, AuthorizationError } from "@fusionaize/sdk-errors";

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Authentication credentials
 * @stable
 */
export interface Credentials {
  /** Credential type */
  type: 'apiKey' | 'bearerToken' | 'session';
  /** The actual credential value */
  value: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
  /** When these credentials expire (ISO timestamp) */
  expiresAt?: string;
  /** When these credentials were issued (ISO timestamp) */
  issuedAt?: string;
}

/**
 * Authentication provider interface
 * Abstracts different authentication methods
 * @stable
 */
export interface AuthProvider {
  /** Get authentication headers for a request */
  getHeaders(): Promise<Record<string, string>>;
  
  /** Refresh credentials if supported (returns true if refreshed) */
  refresh?(): Promise<boolean>;
  
  /** Check if credentials are valid and not expired */
  isValid?(): Promise<boolean>;
  
  /** Get credential type */
  getType(): string;
  
  /** Get credential metadata */
  getMetadata?(): Record<string, unknown>;
}

/**
 * Credential store for managing authentication credentials
 * @beta
 */
export interface CredentialStore {
  /** Store credentials for a service */
  set(service: string, credentials: Credentials): Promise<void>;
  
  /** Get credentials for a service */
  get(service: string): Promise<Credentials | null>;
  
  /** Delete credentials for a service */
  delete(service: string): Promise<void>;
  
  /** List all stored services */
  list(): Promise<string[]>;
}

// ============================================================================
// CREDENTIAL STORES
// ============================================================================

/**
 * In-memory credential store (non-persistent)
 * @stable
 */
export class InMemoryCredentialStore implements CredentialStore {
  private store = new Map<string, Credentials>();

  async set(service: string, credentials: Credentials): Promise<void> {
    this.store.set(service, credentials);
  }

  async get(service: string): Promise<Credentials | null> {
    return this.store.get(service) || null;
  }

  async delete(service: string): Promise<void> {
    this.store.delete(service);
  }

  async list(): Promise<string[]> {
    return Array.from(this.store.keys());
  }
}

/**
 * Environment variable credential store
 * Reads credentials from environment variables
 * @stable
 */
export class EnvironmentCredentialStore implements CredentialStore {
  private readonly envMapping: Record<string, string>;

  constructor(mapping: Record<string, string> = {
    'fusionaize': 'FUSIONAIZE_API_KEY',
    'fusionaize-token': 'FUSIONAIZE_TOKEN',
    'fusionaize-session': 'FUSIONAIZE_SESSION_ID',
  }) {
    this.envMapping = mapping;
  }

  async set(): Promise<void> {
    throw new AuthenticationError('Environment credential store is read-only');
  }

  async get(service: string): Promise<Credentials | null> {
    const envVar = this.envMapping[service];
    if (!envVar) return null;

    const value = process.env[envVar];
    if (!value) return null;

    // Determine credential type from service name
    let type: Credentials['type'] = 'apiKey';
    if (service.includes('token')) type = 'bearerToken';
    if (service.includes('session')) type = 'session';

    return {
      type,
      value,
    };
  }

  async delete(): Promise<void> {
    throw new AuthenticationError('Environment credential store is read-only');
  }

  async list(): Promise<string[]> {
    return Object.keys(this.envMapping);
  }
}

// ============================================================================
// AUTHENTICATION PROVIDERS
// ============================================================================

/**
 * Base authentication provider with common functionality
 * @stable
 */
export abstract class BaseAuthProvider implements AuthProvider {
  protected credentials: Credentials;
  
  constructor(credentials: Credentials) {
    this.credentials = credentials;
  }

  abstract getHeaders(): Promise<Record<string, string>>;
  
  getType(): string {
    return this.credentials.type;
  }
  
  getMetadata(): Record<string, unknown> {
    return this.credentials.metadata || {};
  }
  
  async isValid(): Promise<boolean> {
    if (!this.credentials.expiresAt) return true;
    
    const expiresAt = new Date(this.credentials.expiresAt);
    const now = new Date();
    return now < expiresAt;
  }
  
  async refresh(): Promise<boolean> {
    // Base implementation doesn't support refresh
    return false;
  }
}

/**
 * Static API key authentication provider
 * @stable
 */
export class ApiKeyAuthProvider extends BaseAuthProvider {
  constructor(apiKey: string) {
    super({
      type: 'apiKey',
      value: apiKey,
    });
  }

  async getHeaders(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${this.credentials.value}` };
  }
}

/**
 * Bearer token authentication provider with optional refresh
 * @stable
 */
export class BearerTokenAuthProvider extends BaseAuthProvider {
  private refreshCallback?: () => Promise<Credentials>;

  constructor(
    token: string,
    options?: {
      expiresAt?: string;
      refreshCallback?: () => Promise<Credentials>;
    }
  ) {
    super({
      type: 'bearerToken',
      value: token,
      expiresAt: options?.expiresAt,
    });
    this.refreshCallback = options?.refreshCallback;
  }

  async getHeaders(): Promise<Record<string, string>> {
    // Check if token needs refresh
    if (await this.needsRefresh()) {
      await this.refresh();
    }

    return { Authorization: `Bearer ${this.credentials.value}` };
  }

  async refresh(): Promise<boolean> {
    if (!this.refreshCallback) return false;

    try {
      const newCredentials = await this.refreshCallback();
      this.credentials = newCredentials;
      return true;
    } catch (error) {
      throw new AuthenticationError('Failed to refresh token', {
        cause: error,
      });
    }
  }

  private async needsRefresh(): Promise<boolean> {
    if (!this.credentials.expiresAt) return false;
    
    const expiresAt = new Date(this.credentials.expiresAt);
    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 minutes buffer
    
    return now.getTime() + bufferMs >= expiresAt.getTime();
  }
}

/**
 * Session-based authentication provider
 * @stable
 */
export class SessionAuthProvider extends BaseAuthProvider {
  constructor(sessionId: string) {
    super({
      type: 'session',
      value: sessionId,
    });
  }

  async getHeaders(): Promise<Record<string, string>> {
    return { 'X-Session-Id': this.credentials.value };
  }
}

/**
 * Composite authentication provider that tries multiple providers
 * @beta
 */
export class CompositeAuthProvider implements AuthProvider {
  private providers: AuthProvider[];
  private currentProvider?: AuthProvider;

  constructor(providers: AuthProvider[]) {
    this.providers = providers;
  }

  async getHeaders(): Promise<Record<string, string>> {
    // Try providers in order until one works
    for (const provider of this.providers) {
      try {
        if (provider.isValid && !(await provider.isValid())) {
          continue;
        }
        
        const headers = await provider.getHeaders();
        this.currentProvider = provider;
        return headers;
      } catch {
        // Try next provider
        continue;
      }
    }

    throw new AuthenticationError('No valid authentication provider found');
  }

  async refresh(): Promise<boolean> {
    if (!this.currentProvider?.refresh) return false;
    return this.currentProvider.refresh();
  }

  async isValid(): Promise<boolean> {
    if (!this.currentProvider?.isValid) return true;
    return this.currentProvider.isValid();
  }

  getType(): string {
    return this.currentProvider?.getType() || 'composite';
  }

  getMetadata(): Record<string, unknown> {
    return this.currentProvider?.getMetadata?.() || {};
  }
}

// ============================================================================
// AUTHENTICATION RESOLVER
// ============================================================================

/**
 * Resolve authentication provider from configuration
 * @stable
 */
export class AuthResolver {
  private credentialStore?: CredentialStore;

  constructor(options?: {
    credentialStore?: CredentialStore;
  }) {
    this.credentialStore = options?.credentialStore;
  }

  /**
   * Resolve authentication provider from configuration
   */
  async resolve(config: ClientConfig): Promise<AuthProvider> {
    const providers: AuthProvider[] = [];

    // Try API key from config
    if (config.apiKey) {
      providers.push(new ApiKeyAuthProvider(config.apiKey));
    }

    // Try token from config
    if (config.token) {
      providers.push(new BearerTokenAuthProvider(config.token));
    }

    // Try session ID from config
    if (config.sessionId) {
      providers.push(new SessionAuthProvider(config.sessionId));
    }

    // Try credential store
    if (this.credentialStore) {
      const storeProviders = await this.getProvidersFromStore();
      providers.push(...storeProviders);
    }

    // Try environment variables as last resort
    const envProviders = await this.getProvidersFromEnvironment();
    providers.push(...envProviders);

    if (providers.length === 0) {
      throw new AuthenticationError('No authentication configured');
    }

    // If only one provider, return it directly
    if (providers.length === 1) {
      return providers[0];
    }

    // Otherwise use composite provider
    return new CompositeAuthProvider(providers);
  }

  private async getProvidersFromStore(): Promise<AuthProvider[]> {
    if (!this.credentialStore) return [];

    const providers: AuthProvider[] = [];
    const services = await this.credentialStore.list();

    for (const service of services) {
      const credentials = await this.credentialStore.get(service);
      if (!credentials) continue;

      providers.push(this.createProviderFromCredentials(credentials));
    }

    return providers;
  }

  private async getProvidersFromEnvironment(): Promise<AuthProvider[]> {
    const providers: AuthProvider[] = [];

    // Check for API key
    if (process.env.FUSIONAIZE_API_KEY) {
      providers.push(new ApiKeyAuthProvider(process.env.FUSIONAIZE_API_KEY));
    }

    // Check for token
    if (process.env.FUSIONAIZE_TOKEN) {
      providers.push(new BearerTokenAuthProvider(process.env.FUSIONAIZE_TOKEN));
    }

    // Check for session ID
    if (process.env.FUSIONAIZE_SESSION_ID) {
      providers.push(new SessionAuthProvider(process.env.FUSIONAIZE_SESSION_ID));
    }

    return providers;
  }

  private createProviderFromCredentials(credentials: Credentials): AuthProvider {
    switch (credentials.type) {
      case 'apiKey':
        return new ApiKeyAuthProvider(credentials.value);
      case 'bearerToken':
        return new BearerTokenAuthProvider(credentials.value, {
          expiresAt: credentials.expiresAt,
        });
      case 'session':
        return new SessionAuthProvider(credentials.value);
      default:
        throw new AuthenticationError(`Unsupported credential type: ${credentials.type}`);
    }
  }
}

// ============================================================================
// HEADER UTILITIES
// ============================================================================

/**
 * Create authentication headers from a provider
 * @stable
 */
export async function createAuthHeaders(provider: AuthProvider): Promise<Record<string, string>> {
  return provider.getHeaders();
}

/**
 * Create authentication headers from configuration
 * @stable
 */
export async function createAuthHeadersFromConfig(
  config: ClientConfig,
  options?: {
    credentialStore?: CredentialStore;
  }
): Promise<Record<string, string>> {
  const resolver = new AuthResolver(options);
  const provider = await resolver.resolve(config);
  return provider.getHeaders();
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Default authentication resolver
 */
const defaultResolver = new AuthResolver();

/**
 * Resolve authentication provider from configuration using default resolver
 * @stable
 */
export async function resolveAuth(config: ClientConfig): Promise<AuthProvider> {
  return defaultResolver.resolve(config);
}

/**
 * Check if configuration has authentication
 * @stable
 */
export function hasAuth(config: ClientConfig): boolean {
  return !!(config.apiKey || config.token || config.sessionId) ||
    !!(process.env.FUSIONAIZE_API_KEY || process.env.FUSIONAIZE_TOKEN || process.env.FUSIONAIZE_SESSION_ID);
}

/**
 * Create a credential store with default configuration
 * @stable
 */
export function createDefaultCredentialStore(): CredentialStore {
  return new InMemoryCredentialStore();
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for AuthProvider
 * @stable
 */
export function isAuthProvider(obj: unknown): obj is AuthProvider {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'getHeaders' in obj &&
    typeof (obj as any).getHeaders === 'function' &&
    'getType' in obj &&
    typeof (obj as any).getType === 'function'
  );
}

/**
 * Type guard for CredentialStore
 * @stable
 */
export function isCredentialStore(obj: unknown): obj is CredentialStore {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'set' in obj &&
    typeof (obj as any).set === 'function' &&
    'get' in obj &&
    typeof (obj as any).get === 'function' &&
    'delete' in obj &&
    typeof (obj as any).delete === 'function' &&
    'list' in obj &&
    typeof (obj as any).list === 'function'
  );
}