/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
  Icon,
} from 'n8n-workflow';

/**
 * Convex Finance API credentials
 *
 * Supports multiple data sources:
 * - DefiLlama API (public, no auth required)
 * - The Graph Subgraph (optional API key)
 * - Custom RPC endpoint (for direct contract reads)
 */
export class ConvexApi implements ICredentialType {
  name = 'convexApi';
  displayName = 'Convex Finance API';
  documentationUrl = 'https://docs.convexfinance.com';
  icon: Icon = 'file:convex.svg';

  properties: INodeProperties[] = [
    {
      displayName: 'Data Source',
      name: 'dataSource',
      type: 'options',
      options: [
        {
          name: 'DefiLlama',
          value: 'DefiLlama',
          description: 'Use DefiLlama API (public, no authentication required)',
        },
        {
          name: 'The Graph',
          value: 'TheGraph',
          description: 'Use The Graph subgraph for on-chain data',
        },
        {
          name: 'Custom',
          value: 'Custom',
          description: 'Use custom RPC endpoint for direct contract reads',
        },
      ],
      default: 'DefiLlama',
      description: 'Select the data source for Convex Finance data',
    },
    {
      displayName: 'Network',
      name: 'network',
      type: 'options',
      options: [
        {
          name: 'Ethereum',
          value: 'Ethereum',
          description: 'Ethereum Mainnet (primary network)',
        },
        {
          name: 'Arbitrum',
          value: 'Arbitrum',
          description: 'Arbitrum One (Layer 2)',
        },
        {
          name: 'Fraxtal',
          value: 'Fraxtal',
          description: 'Fraxtal network',
        },
      ],
      default: 'Ethereum',
      description: 'Select the blockchain network',
    },
    {
      displayName: 'Subgraph URL',
      name: 'subgraphUrl',
      type: 'string',
      default: '',
      placeholder: 'https://api.thegraph.com/subgraphs/name/convex-community/curve-pools',
      description: 'Custom subgraph URL (optional, used with The Graph data source)',
      displayOptions: {
        show: {
          dataSource: ['TheGraph'],
        },
      },
    },
    {
      displayName: 'The Graph API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      description:
        'API key for The Graph (optional, for higher rate limits). Get one at https://thegraph.com/studio/',
      displayOptions: {
        show: {
          dataSource: ['TheGraph'],
        },
      },
    },
    {
      displayName: 'RPC URL',
      name: 'rpcUrl',
      type: 'string',
      default: '',
      placeholder: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
      description: 'Custom RPC endpoint URL for direct contract reads',
      displayOptions: {
        show: {
          dataSource: ['Custom'],
        },
      },
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {},
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.llama.fi',
      url: '/tvl/convex-finance',
      method: 'GET',
    },
  };
}
