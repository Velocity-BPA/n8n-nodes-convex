/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

/**
 * Convex Finance contract addresses across supported networks
 */

export interface ContractAddresses {
  booster: string;
  cvx: string;
  cvxCrv: string;
  cvxCrvStaking: string;
  vlCvx: string;
  crv: string;
  cvxFxs?: string;
  cvxPrisma?: string;
  cvxRewardPool?: string;
}

/**
 * Ethereum Mainnet contract addresses
 */
export const ETHEREUM_CONTRACTS: ContractAddresses = {
  booster: '0xF403C135812408BFbE8713b5A23a04b3D48AAE31',
  cvx: '0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B',
  cvxCrv: '0x62B9c7356A2Dc64a1969e19C23e4f579F9810Aa7',
  cvxCrvStaking: '0x3Fe65692bfCD0e6CF84Cb1E7d24108E434A7587e',
  vlCvx: '0x72a19342e8F1838460eBFCCEf09F6585e32db86E',
  crv: '0xD533a949740bb3306d119CC777fa900bA034cd52',
  cvxFxs: '0xFEEf77d3f69374f66429C91d732A244f074bdf74',
  cvxPrisma: '0x34635280737b5BFe6c7DC2FC3065D60d66e78185',
  cvxRewardPool: '0xCF50b810E57Ac33B91dCF525C6ddd9881B139332',
};

/**
 * Arbitrum contract addresses
 */
export const ARBITRUM_CONTRACTS: ContractAddresses = {
  booster: '0xF403C135812408BFbE8713b5A23a04b3D48AAE31',
  cvx: '0xaAFcFD42c9954C6689ef1901e03db742520829c5',
  cvxCrv: '0x0000000000000000000000000000000000000000', // Not available on Arbitrum
  cvxCrvStaking: '0x0000000000000000000000000000000000000000',
  vlCvx: '0x0000000000000000000000000000000000000000',
  crv: '0x11cDb42B0EB46D95f990BeDD4695A6e3fA034978',
};

/**
 * Fraxtal contract addresses
 */
export const FRAXTAL_CONTRACTS: ContractAddresses = {
  booster: '0x0000000000000000000000000000000000000000', // Update when available
  cvx: '0x0000000000000000000000000000000000000000',
  cvxCrv: '0x0000000000000000000000000000000000000000',
  cvxCrvStaking: '0x0000000000000000000000000000000000000000',
  vlCvx: '0x0000000000000000000000000000000000000000',
  crv: '0x0000000000000000000000000000000000000000',
};

/**
 * Get contract addresses for a specific network
 */
export function getContractAddresses(network: string): ContractAddresses {
  switch (network.toLowerCase()) {
    case 'ethereum':
      return ETHEREUM_CONTRACTS;
    case 'arbitrum':
      return ARBITRUM_CONTRACTS;
    case 'fraxtal':
      return FRAXTAL_CONTRACTS;
    default:
      return ETHEREUM_CONTRACTS;
  }
}

/**
 * Supported networks
 */
export const SUPPORTED_NETWORKS = ['Ethereum', 'Arbitrum', 'Fraxtal'] as const;

export type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[number];

/**
 * Alias for backward compatibility
 */
export const CONTRACTS = ETHEREUM_CONTRACTS;

/**
 * Named network exports
 */
export const CONTRACT_ADDRESSES = {
  ETHEREUM: ETHEREUM_CONTRACTS,
  ARBITRUM: ARBITRUM_CONTRACTS,
  FRAXTAL: FRAXTAL_CONTRACTS,
} as const;
