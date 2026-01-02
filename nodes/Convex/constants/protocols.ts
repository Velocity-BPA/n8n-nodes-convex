/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Supported protocols and their identifiers
 */

export interface ProtocolInfo {
  id: string;
  name: string;
  description: string;
  defiLlamaSlug: string;
  rewardToken: string;
  stakingToken?: string;
}

export const PROTOCOLS: Record<string, ProtocolInfo> = {
  curve: {
    id: 'curve',
    name: 'Curve Finance',
    description: 'Stableswap AMM for low-slippage trading',
    defiLlamaSlug: 'curve-finance',
    rewardToken: 'CRV',
    stakingToken: 'cvxCRV',
  },
  frax: {
    id: 'frax',
    name: 'Frax Finance',
    description: 'Fractional algorithmic stablecoin protocol',
    defiLlamaSlug: 'frax-finance',
    rewardToken: 'FXS',
    stakingToken: 'cvxFXS',
  },
  prisma: {
    id: 'prisma',
    name: 'Prisma Finance',
    description: 'Non-custodial LST-backed stablecoin protocol',
    defiLlamaSlug: 'prisma-finance',
    rewardToken: 'PRISMA',
    stakingToken: 'cvxPRISMA',
  },
  fx: {
    id: 'fx',
    name: 'f(x) Protocol',
    description: 'Leveraged ETH exposure protocol',
    defiLlamaSlug: 'fx-protocol',
    rewardToken: 'FXN',
  },
};

/**
 * Convex protocol identifier for DefiLlama
 */
export const CONVEX_DEFILLAMA_SLUG = 'convex-finance';

/**
 * Subgraph endpoints
 */
export const SUBGRAPH_ENDPOINTS = {
  ethereum: {
    convex: 'https://api.thegraph.com/subgraphs/name/convex-community/curve-pools',
    curve: 'https://api.thegraph.com/subgraphs/name/convex-community/volume-mainnet',
  },
  arbitrum: {
    convex: 'https://api.thegraph.com/subgraphs/name/convex-community/curve-pools-arbitrum',
  },
};

/**
 * DefiLlama API endpoints
 */
export const DEFILLAMA_ENDPOINTS = {
  protocol: 'https://api.llama.fi/protocol',
  tvl: 'https://api.llama.fi/tvl',
  yields: 'https://yields.llama.fi/pools',
  prices: 'https://coins.llama.fi/prices/current',
};

/**
 * Snapshot governance space
 */
export const SNAPSHOT_SPACE = 'cvx.eth';

/**
 * Snapshot API endpoint
 */
export const SNAPSHOT_API = 'https://hub.snapshot.org/graphql';

/**
 * Alias for backward compatibility
 */
export const SUPPORTED_PROTOCOLS = PROTOCOLS;
