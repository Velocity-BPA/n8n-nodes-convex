/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { DEFILLAMA_ENDPOINTS, CONVEX_DEFILLAMA_SLUG } from '../constants/protocols';

/**
 * DefiLlama API response types
 */
export interface DefiLlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number | null;
  apyReward: number | null;
  apy: number | null;
  rewardTokens: string[] | null;
  pool: string;
  apyPct1D: number | null;
  apyPct7D: number | null;
  apyPct30D: number | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  poolMeta: string | null;
  underlyingTokens: string[] | null;
  volumeUsd1d: number | null;
  volumeUsd7d: number | null;
  apyBase7d: number | null;
  apyMean30d: number | null;
  predictedClass: string | null;
  predictedProbability: number | null;
  binnedConfidence: number | null;
}

export interface DefiLlamaProtocol {
  id: string;
  name: string;
  address: string | null;
  symbol: string;
  url: string;
  description: string;
  chain: string;
  logo: string;
  audits: string;
  audit_note: string | null;
  gecko_id: string;
  cmcId: string;
  category: string;
  chains: string[];
  module: string;
  twitter: string;
  forkedFrom: string[];
  oracles: string[];
  listedAt: number;
  methodology: string;
  slug: string;
  tvl: number;
  chainTvls: Record<string, number>;
  change_1h: number;
  change_1d: number;
  change_7d: number;
  tokenBreakdowns: Record<string, unknown>;
  mcap: number | null;
  currentChainTvls: Record<string, number>;
  raises: unknown[];
  metrics: unknown;
  hallmarks: unknown[];
  defillamaId?: string;
}

export interface DefiLlamaPriceResponse {
  coins: Record<
    string,
    {
      decimals: number;
      symbol: string;
      price: number;
      timestamp: number;
      confidence: number;
    }
  >;
}

/**
 * DefiLlama API client for Convex Finance data
 */
export class DefiLlamaClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown, operation: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        throw new Error(
          `DefiLlama API error during ${operation}: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`,
        );
      } else if (axiosError.request) {
        throw new Error(`DefiLlama API request failed during ${operation}: No response received`);
      }
    }
    throw new Error(`DefiLlama API error during ${operation}: ${String(error)}`);
  }

  /**
   * Get Convex protocol data
   */
  async getProtocolData(): Promise<DefiLlamaProtocol> {
    try {
      const response = await this.client.get<DefiLlamaProtocol>(
        `${DEFILLAMA_ENDPOINTS.protocol}/${CONVEX_DEFILLAMA_SLUG}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'getProtocolData');
    }
  }

  /**
   * Get Convex TVL
   */
  async getTvl(): Promise<number> {
    try {
      const response = await this.client.get<number>(
        `${DEFILLAMA_ENDPOINTS.tvl}/${CONVEX_DEFILLAMA_SLUG}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'getTvl');
    }
  }

  /**
   * Get all yield pools
   */
  async getAllPools(): Promise<DefiLlamaPool[]> {
    try {
      const response = await this.client.get<{ data: DefiLlamaPool[] }>(DEFILLAMA_ENDPOINTS.yields);
      return response.data.data;
    } catch (error) {
      this.handleError(error, 'getAllPools');
    }
  }

  /**
   * Get Convex pools only
   */
  async getConvexPools(): Promise<DefiLlamaPool[]> {
    const allPools = await this.getAllPools();
    return allPools.filter(
      (pool) => pool.project.toLowerCase() === 'convex-finance' && pool.chain === 'Ethereum',
    );
  }

  /**
   * Get pools filtered by project
   */
  async getPoolsByProject(project: string): Promise<DefiLlamaPool[]> {
    const allPools = await this.getAllPools();
    return allPools.filter((pool) => pool.project.toLowerCase() === project.toLowerCase());
  }

  /**
   * Get pool by ID (pool address or identifier)
   */
  async getPoolById(poolId: string): Promise<DefiLlamaPool | null> {
    const pools = await this.getConvexPools();
    return pools.find((pool) => pool.pool.toLowerCase() === poolId.toLowerCase()) || null;
  }

  /**
   * Get top pools by APY
   */
  async getTopPoolsByApy(limit: number = 10): Promise<DefiLlamaPool[]> {
    const pools = await this.getConvexPools();
    return pools
      .filter((pool) => pool.apy !== null && pool.apy > 0)
      .sort((a, b) => (b.apy || 0) - (a.apy || 0))
      .slice(0, limit);
  }

  /**
   * Get top pools by TVL
   */
  async getTopPoolsByTvl(limit: number = 10): Promise<DefiLlamaPool[]> {
    const pools = await this.getConvexPools();
    return pools
      .filter((pool) => pool.tvlUsd > 0)
      .sort((a, b) => b.tvlUsd - a.tvlUsd)
      .slice(0, limit);
  }

  /**
   * Get token prices
   */
  async getTokenPrices(tokens: string[]): Promise<DefiLlamaPriceResponse> {
    try {
      const tokenString = tokens.join(',');
      const response = await this.client.get<DefiLlamaPriceResponse>(
        `${DEFILLAMA_ENDPOINTS.prices}/${tokenString}`,
      );
      return response.data;
    } catch (error) {
      this.handleError(error, 'getTokenPrices');
    }
  }

  /**
   * Get CVX token price
   */
  async getCvxPrice(): Promise<number> {
    const prices = await this.getTokenPrices(['ethereum:0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B']);
    const cvxKey = 'ethereum:0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B';
    return prices.coins[cvxKey]?.price || 0;
  }

  /**
   * Get CRV token price
   */
  async getCrvPrice(): Promise<number> {
    const prices = await this.getTokenPrices(['ethereum:0xD533a949740bb3306d119CC777fa900bA034cd52']);
    const crvKey = 'ethereum:0xD533a949740bb3306d119CC777fa900bA034cd52';
    return prices.coins[crvKey]?.price || 0;
  }

  /**
   * Get multiple token prices by chain and address
   */
  async getMultipleTokenPrices(
    tokens: Array<{ chain: string; address: string }>,
  ): Promise<Record<string, number>> {
    const tokenStrings = tokens.map((t) => `${t.chain}:${t.address}`);
    const prices = await this.getTokenPrices(tokenStrings);

    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(prices.coins)) {
      result[key] = value.price;
    }
    return result;
  }

  /**
   * Get token prices by coingecko IDs
   */
  async getTokenPricesByCoingecko(geckoIds: string[]): Promise<Record<string, number>> {
    try {
      const tokenString = geckoIds.map((id) => `coingecko:${id}`).join(',');
      const response = await this.client.get<DefiLlamaPriceResponse>(
        `${DEFILLAMA_ENDPOINTS.prices}/${tokenString}`,
      );
      
      const result: Record<string, number> = {};
      for (const id of geckoIds) {
        const key = `coingecko:${id}`;
        result[id] = response.data.coins[key]?.price || 0;
      }
      return result;
    } catch (error) {
      this.handleError(error, 'getTokenPricesByCoingecko');
    }
  }
}

/**
 * Create a new DefiLlama client instance
 */
export function createDefiLlamaClient(): DefiLlamaClient {
  return new DefiLlamaClient();
}
