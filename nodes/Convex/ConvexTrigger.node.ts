/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  IPollFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';
import { ConvexDataClient, createConvexClient, ConvexClientOptions } from './transport';

// Emit licensing notice on load
const LICENSING_NOTICE = `[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`;

console.warn(LICENSING_NOTICE);

interface TriggerState {
  lastPoolCount?: number;
  lastTvl?: number;
  lastCvxPrice?: number;
  lastCvxCrvRatio?: number;
  lastProposalId?: string;
  lastApy?: Record<string, number>;
  lastPoolApys?: Record<string, number>;
}

export class ConvexTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Convex Trigger',
    name: 'convexTrigger',
    icon: 'file:convex.svg',
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["event"]}}',
    description: 'Trigger workflows on Convex Finance events',
    defaults: {
      name: 'Convex Trigger',
    },
    inputs: [],
    outputs: ['main'],
    credentials: [
      {
        name: 'convexApi',
        required: true,
      },
    ],
    polling: true,
    properties: [
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        options: [
          {
            name: 'Pool APY Changed',
            value: 'poolApyChanged',
            description: 'Trigger when pool yield changes significantly',
          },
          {
            name: 'New Pool Added',
            value: 'newPoolAdded',
            description: 'Trigger when a new Curve pool is added to Convex',
          },
          {
            name: 'Pool TVL Changed',
            value: 'poolTvlChanged',
            description: 'Trigger on significant TVL movement',
          },
          {
            name: 'cvxCRV APR Changed',
            value: 'cvxCrvAprChanged',
            description: 'Trigger when staking yield updates',
          },
          {
            name: 'cvxCRV Peg Alert',
            value: 'cvxCrvPegAlert',
            description: 'Trigger when cvxCRV/CRV ratio deviates',
          },
          {
            name: 'New Proposal Created',
            value: 'newProposal',
            description: 'Trigger on new governance proposals',
          },
          {
            name: 'CVX Price Alert',
            value: 'cvxPriceAlert',
            description: 'Trigger on CVX price threshold',
          },
          {
            name: 'Protocol TVL Changed',
            value: 'protocolTvlChanged',
            description: 'Trigger on protocol-wide TVL changes',
          },
        ],
        default: 'poolApyChanged',
      },
      // Pool APY Changed options
      {
        displayName: 'Pool ID',
        name: 'poolId',
        type: 'string',
        default: '',
        description: 'Specific pool to monitor (leave empty for all)',
        displayOptions: {
          show: {
            event: ['poolApyChanged'],
          },
        },
      },
      {
        displayName: 'APY Change Threshold (%)',
        name: 'apyThreshold',
        type: 'number',
        default: 5,
        description: 'Minimum APY change to trigger (in percentage points)',
        displayOptions: {
          show: {
            event: ['poolApyChanged', 'cvxCrvAprChanged'],
          },
        },
      },
      // TVL change options
      {
        displayName: 'TVL Change Threshold (%)',
        name: 'tvlThreshold',
        type: 'number',
        default: 10,
        description: 'Minimum TVL change percentage to trigger',
        displayOptions: {
          show: {
            event: ['poolTvlChanged', 'protocolTvlChanged'],
          },
        },
      },
      // Price alert options
      {
        displayName: 'Price Condition',
        name: 'priceCondition',
        type: 'options',
        options: [
          { name: 'Above', value: 'above' },
          { name: 'Below', value: 'below' },
          { name: 'Change', value: 'change' },
        ],
        default: 'change',
        displayOptions: {
          show: {
            event: ['cvxPriceAlert'],
          },
        },
      },
      {
        displayName: 'Price Threshold ($)',
        name: 'priceThreshold',
        type: 'number',
        default: 5,
        description: 'Price threshold in USD',
        displayOptions: {
          show: {
            event: ['cvxPriceAlert'],
            priceCondition: ['above', 'below'],
          },
        },
      },
      {
        displayName: 'Price Change Threshold (%)',
        name: 'priceChangeThreshold',
        type: 'number',
        default: 10,
        description: 'Price change percentage to trigger',
        displayOptions: {
          show: {
            event: ['cvxPriceAlert'],
            priceCondition: ['change'],
          },
        },
      },
      // cvxCRV peg options
      {
        displayName: 'Peg Deviation Threshold (%)',
        name: 'pegThreshold',
        type: 'number',
        default: 2,
        description: 'Trigger when cvxCRV/CRV deviates from 1:1 by this percentage',
        displayOptions: {
          show: {
            event: ['cvxCrvPegAlert'],
          },
        },
      },
    ],
  };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    const webhookData = this.getWorkflowStaticData('node') as TriggerState;
    const event = this.getNodeParameter('event') as string;

    // Get credentials and create client
    const credentials = await this.getCredentials('convexApi');
    const options: ConvexClientOptions = {
      dataSource: (credentials.dataSource as ConvexClientOptions['dataSource']) || 'DefiLlama',
      network: (credentials.network as string) || 'Ethereum',
      subgraphUrl: credentials.subgraphUrl as string | undefined,
      apiKey: credentials.apiKey as string | undefined,
    };
    const client = createConvexClient(options);

    const returnData: INodeExecutionData[] = [];

    try {
      switch (event) {
        case 'poolApyChanged':
          await handlePoolApyChanged(this, client, webhookData, returnData);
          break;
        case 'newPoolAdded':
          await handleNewPoolAdded(client, webhookData, returnData);
          break;
        case 'poolTvlChanged':
          await handlePoolTvlChanged(this, client, webhookData, returnData);
          break;
        case 'cvxCrvAprChanged':
          await handleCvxCrvAprChanged(this, client, webhookData, returnData);
          break;
        case 'cvxCrvPegAlert':
          await handleCvxCrvPegAlert(this, client, webhookData, returnData);
          break;
        case 'newProposal':
          await handleNewProposal(client, webhookData, returnData);
          break;
        case 'cvxPriceAlert':
          await handleCvxPriceAlert(this, client, webhookData, returnData);
          break;
        case 'protocolTvlChanged':
          await handleProtocolTvlChanged(this, client, webhookData, returnData);
          break;
      }
    } catch (error) {
      console.error('Convex Trigger error:', error);
    }

    if (returnData.length === 0) {
      return null;
    }

    return [returnData];
  }
}

// Handler functions
async function handlePoolApyChanged(
  pollFunctions: IPollFunctions,
  client: ConvexDataClient,
  state: TriggerState,
  returnData: INodeExecutionData[],
): Promise<void> {
  const poolId = pollFunctions.getNodeParameter('poolId', '') as string;
  const threshold = pollFunctions.getNodeParameter('apyThreshold', 5) as number;

  const pools = await client.defiLlama.getConvexPools();
  const relevantPools = poolId 
    ? pools.filter((p) => p.pool === poolId)
    : pools.slice(0, 50);

  if (!state.lastPoolApys) {
    state.lastPoolApys = {};
    for (const pool of relevantPools) {
      state.lastPoolApys[pool.pool] = pool.apy || 0;
    }
    return;
  }

  for (const pool of relevantPools) {
    const currentApy = pool.apy || 0;
    const lastApy = state.lastPoolApys[pool.pool] || 0;
    const change = Math.abs(currentApy - lastApy);

    if (change >= threshold) {
      returnData.push({
        json: {
          event: 'poolApyChanged',
          poolId: pool.pool,
          symbol: pool.symbol,
          previousApy: lastApy,
          currentApy: currentApy,
          change: currentApy - lastApy,
          tvl: pool.tvlUsd,
          timestamp: new Date().toISOString(),
        },
      });
    }

    state.lastPoolApys[pool.pool] = currentApy;
  }
}

async function handleNewPoolAdded(
  client: ConvexDataClient,
  state: TriggerState,
  returnData: INodeExecutionData[],
): Promise<void> {
  const pools = await client.defiLlama.getConvexPools();
  const currentCount = pools.length;

  if (state.lastPoolCount === undefined) {
    state.lastPoolCount = currentCount;
    return;
  }

  if (currentCount > state.lastPoolCount) {
    const newPoolsCount = currentCount - state.lastPoolCount;
    const newPools = pools.slice(0, newPoolsCount);

    for (const pool of newPools) {
      returnData.push({
        json: {
          event: 'newPoolAdded',
          poolId: pool.pool,
          symbol: pool.symbol,
          tvl: pool.tvlUsd,
          apy: pool.apy,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  state.lastPoolCount = currentCount;
}

async function handlePoolTvlChanged(
  pollFunctions: IPollFunctions,
  client: ConvexDataClient,
  state: TriggerState,
  returnData: INodeExecutionData[],
): Promise<void> {
  const threshold = pollFunctions.getNodeParameter('tvlThreshold', 10) as number;
  
  const protocolData = await client.defiLlama.getProtocolData();
  const currentTvl = protocolData?.tvl || 0;

  if (state.lastTvl === undefined) {
    state.lastTvl = currentTvl;
    return;
  }

  const changePercent = ((currentTvl - state.lastTvl) / state.lastTvl) * 100;

  if (Math.abs(changePercent) >= threshold) {
    returnData.push({
      json: {
        event: 'poolTvlChanged',
        previousTvl: state.lastTvl,
        currentTvl: currentTvl,
        changeUsd: currentTvl - state.lastTvl,
        changePercent: changePercent,
        timestamp: new Date().toISOString(),
      },
    });
  }

  state.lastTvl = currentTvl;
}

async function handleCvxCrvAprChanged(
  pollFunctions: IPollFunctions,
  client: ConvexDataClient,
  state: TriggerState,
  returnData: INodeExecutionData[],
): Promise<void> {
  const threshold = pollFunctions.getNodeParameter('apyThreshold', 5) as number;
  
  // Get cvxCRV pool APY from pools
  const pools = await client.defiLlama.getConvexPools();
  const cvxCrvPool = pools.find((p) => 
    p.symbol?.toLowerCase().includes('cvxcrv')
  );

  const currentApy = cvxCrvPool?.apy || 0;

  if (!state.lastApy) {
    state.lastApy = {};
  }

  const lastApy = state.lastApy['cvxcrv'] || 0;

  if (state.lastApy['cvxcrv'] === undefined) {
    state.lastApy['cvxcrv'] = currentApy;
    return;
  }

  const change = Math.abs(currentApy - lastApy);

  if (change >= threshold) {
    returnData.push({
      json: {
        event: 'cvxCrvAprChanged',
        previousApr: lastApy,
        currentApr: currentApy,
        change: currentApy - lastApy,
        timestamp: new Date().toISOString(),
      },
    });
  }

  state.lastApy['cvxcrv'] = currentApy;
}

async function handleCvxCrvPegAlert(
  pollFunctions: IPollFunctions,
  client: ConvexDataClient,
  state: TriggerState,
  returnData: INodeExecutionData[],
): Promise<void> {
  const threshold = pollFunctions.getNodeParameter('pegThreshold', 2) as number;
  
  // Get cvxCRV and CRV prices using token addresses
  const prices = await client.defiLlama.getTokenPricesByCoingecko(['convex-crv', 'curve-dao-token']);
  const cvxCrvPrice = prices['convex-crv'] || 0;
  const crvPrice = prices['curve-dao-token'] || 1;
  
  const ratio = crvPrice > 0 ? cvxCrvPrice / crvPrice : 1;
  const deviation = Math.abs(1 - ratio) * 100;

  if (state.lastCvxCrvRatio === undefined) {
    state.lastCvxCrvRatio = ratio;
    return;
  }

  if (deviation >= threshold) {
    returnData.push({
      json: {
        event: 'cvxCrvPegAlert',
        cvxCrvPrice,
        crvPrice,
        ratio,
        deviationPercent: deviation,
        status: ratio < 1 ? 'under-peg' : 'over-peg',
        previousRatio: state.lastCvxCrvRatio,
        timestamp: new Date().toISOString(),
      },
    });
  }

  state.lastCvxCrvRatio = ratio;
}

async function handleNewProposal(
  client: ConvexDataClient,
  state: TriggerState,
  returnData: INodeExecutionData[],
): Promise<void> {
  const proposals = await client.subgraph.getActiveProposals();
  
  if (!proposals || proposals.length === 0) {
    return;
  }

  const latestProposal = proposals[0];

  if (state.lastProposalId === undefined) {
    state.lastProposalId = latestProposal.id;
    return;
  }

  if (latestProposal.id !== state.lastProposalId) {
    // Check for new proposals
    const newProposals = proposals.filter((p) => {
      return p.id !== state.lastProposalId;
    });

    for (const proposal of newProposals) {
      returnData.push({
        json: {
          event: 'newProposal',
          proposalId: proposal.id,
          title: proposal.title,
          author: proposal.author,
          choices: proposal.choices,
          startTime: new Date(proposal.start * 1000).toISOString(),
          endTime: new Date(proposal.end * 1000).toISOString(),
          snapshotUrl: `https://snapshot.org/#/cvx.eth/proposal/${proposal.id}`,
          timestamp: new Date().toISOString(),
        },
      });
    }

    state.lastProposalId = latestProposal.id;
  }
}

async function handleCvxPriceAlert(
  pollFunctions: IPollFunctions,
  client: ConvexDataClient,
  state: TriggerState,
  returnData: INodeExecutionData[],
): Promise<void> {
  const condition = pollFunctions.getNodeParameter('priceCondition', 'change') as string;
  
  const prices = await client.defiLlama.getTokenPricesByCoingecko(['convex-finance']);
  const currentPrice = prices['convex-finance'] || 0;

  if (state.lastCvxPrice === undefined) {
    state.lastCvxPrice = currentPrice;
    return;
  }

  let shouldTrigger = false;
  let triggerReason = '';

  switch (condition) {
    case 'above': {
      const threshold = pollFunctions.getNodeParameter('priceThreshold', 5) as number;
      if (currentPrice > threshold && state.lastCvxPrice <= threshold) {
        shouldTrigger = true;
        triggerReason = `Price crossed above $${threshold}`;
      }
      break;
    }
    case 'below': {
      const threshold = pollFunctions.getNodeParameter('priceThreshold', 5) as number;
      if (currentPrice < threshold && state.lastCvxPrice >= threshold) {
        shouldTrigger = true;
        triggerReason = `Price crossed below $${threshold}`;
      }
      break;
    }
    case 'change': {
      const threshold = pollFunctions.getNodeParameter('priceChangeThreshold', 10) as number;
      const changePercent = ((currentPrice - state.lastCvxPrice) / state.lastCvxPrice) * 100;
      if (Math.abs(changePercent) >= threshold) {
        shouldTrigger = true;
        triggerReason = `Price changed by ${changePercent.toFixed(2)}%`;
      }
      break;
    }
  }

  if (shouldTrigger) {
    returnData.push({
      json: {
        event: 'cvxPriceAlert',
        previousPrice: state.lastCvxPrice,
        currentPrice,
        changeUsd: currentPrice - state.lastCvxPrice,
        changePercent: ((currentPrice - state.lastCvxPrice) / state.lastCvxPrice) * 100,
        condition,
        reason: triggerReason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  state.lastCvxPrice = currentPrice;
}

async function handleProtocolTvlChanged(
  pollFunctions: IPollFunctions,
  client: ConvexDataClient,
  state: TriggerState,
  returnData: INodeExecutionData[],
): Promise<void> {
  const threshold = pollFunctions.getNodeParameter('tvlThreshold', 10) as number;
  
  const protocolData = await client.defiLlama.getProtocolData();
  const currentTvl = protocolData?.tvl || 0;

  if (state.lastTvl === undefined) {
    state.lastTvl = currentTvl;
    return;
  }

  const changePercent = ((currentTvl - state.lastTvl) / state.lastTvl) * 100;

  if (Math.abs(changePercent) >= threshold) {
    returnData.push({
      json: {
        event: 'protocolTvlChanged',
        previousTvl: state.lastTvl,
        currentTvl: currentTvl,
        changeUsd: currentTvl - state.lastTvl,
        changePercent: changePercent,
        direction: changePercent > 0 ? 'increase' : 'decrease',
        timestamp: new Date().toISOString(),
      },
    });
  }

  state.lastTvl = currentTvl;
}
