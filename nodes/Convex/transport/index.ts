/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

export * from './defillama';
export * from './subgraph';

import { DefiLlamaClient, createDefiLlamaClient } from './defillama';
import { SubgraphClient, createSubgraphClient } from './subgraph';

export interface ConvexClientOptions {
  dataSource: 'DefiLlama' | 'TheGraph' | 'Custom';
  network?: string;
  subgraphUrl?: string;
  rpcUrl?: string;
  apiKey?: string;
}

/**
 * Unified Convex data client that abstracts data sources
 */
export class ConvexDataClient {
  private defiLlamaClient: DefiLlamaClient;
  private subgraphClient: SubgraphClient;
  private options: ConvexClientOptions;

  constructor(options: ConvexClientOptions) {
    this.options = options;
    this.defiLlamaClient = createDefiLlamaClient();
    this.subgraphClient = createSubgraphClient({
      subgraphUrl: options.subgraphUrl,
      apiKey: options.apiKey,
      network: options.network,
    });
  }

  /**
   * Get the preferred client based on data source configuration
   */
  get preferredDataSource(): 'DefiLlama' | 'TheGraph' {
    return this.options.dataSource === 'TheGraph' ? 'TheGraph' : 'DefiLlama';
  }

  /**
   * Get DefiLlama client
   */
  get defiLlama(): DefiLlamaClient {
    return this.defiLlamaClient;
  }

  /**
   * Get Subgraph client
   */
  get subgraph(): SubgraphClient {
    return this.subgraphClient;
  }

  /**
   * Get network
   */
  get network(): string {
    return this.options.network || 'Ethereum';
  }

  /**
   * Get data source
   */
  get dataSource(): string {
    return this.options.dataSource;
  }
}

/**
 * Create a unified Convex data client
 */
export function createConvexClient(options: ConvexClientOptions): ConvexDataClient {
  return new ConvexDataClient(options);
}
