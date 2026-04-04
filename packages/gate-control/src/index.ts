// Control‑plane/admin‑safe client for fusionAIze Gate

import type { Config } from "@fusionaize/sdk-config";
import { HttpTransport } from "@fusionaize/sdk-transport";

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Array<{ name: string; status: string; details?: unknown }>;
}

export interface RouteInfo {
  id: string;
  pattern: string;
  provider: string;
  priority: number;
  enabled: boolean;
}

export interface ProviderStatus {
  id: string;
  type: string;
  healthy: boolean;
  lastChecked: string;
}

export class ControlClient {
  private transport: HttpTransport;

  constructor(config: Config) {
    const endpoint = config.gateEndpoint || "http://localhost:8090";
    this.transport = new HttpTransport(endpoint);
  }

  async health(): Promise<HealthStatus> {
    const response = await this.transport.request<HealthStatus>({
      method: "GET",
      url: "/health",
    });
    return response.body;
  }

  async routes(): Promise<RouteInfo[]> {
    const response = await this.transport.request<{ routes: RouteInfo[] }>({
      method: "GET",
      url: "/routes",
    });
    return response.body.routes;
  }

  async providers(): Promise<ProviderStatus[]> {
    const response = await this.transport.request<{ providers: ProviderStatus[] }>({
      method: "GET",
      url: "/providers",
    });
    return response.body.providers;
  }

  async reloadProviders(): Promise<void> {
    await this.transport.request({
      method: "POST",
      url: "/admin/providers/reload",
    });
  }

  async updateRoute(routeId: string, updates: Partial<RouteInfo>): Promise<void> {
    await this.transport.request({
      method: "PATCH",
      url: `/admin/routes/${routeId}`,
      body: updates,
    });
  }

  async metrics(): Promise<Record<string, unknown>> {
    const response = await this.transport.request<Record<string, unknown>>({
      method: "GET",
      url: "/metrics",
    });
    return response.body;
  }
}

export async function controlFromConfig(config: Config): Promise<ControlClient> {
  // Auth resolution optional for control endpoints
  return new ControlClient(config);
}
