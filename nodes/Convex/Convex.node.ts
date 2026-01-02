/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

// Pool operations
import * as pool from './actions/pool';
// Staking operations
import * as staking from './actions/staking';
// Locking operations
import * as locking from './actions/locking';
// Token operations
import * as token from './actions/token';
// Protocol operations
import * as protocol from './actions/protocol';
// Frax operations
import * as frax from './actions/frax';
// Prisma operations
import * as prisma from './actions/prisma';
// Snapshot operations
import * as snapshot from './actions/snapshot';

// Emit licensing notice on load
const LICENSING_NOTICE = `[Velocity BPA Licensing Notice]

This n8n node is licensed under the Business Source License 1.1 (BSL 1.1).

Use of this node by for-profit organizations in production environments requires a commercial license from Velocity BPA.

For licensing information, visit https://velobpa.com/licensing or contact licensing@velobpa.com.`;

// Log licensing notice once on module load
console.warn(LICENSING_NOTICE);

export class Convex implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Convex',
    name: 'convex',
    icon: 'file:convex.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Convex Finance DeFi protocol for yield optimization on Curve, Frax, Prisma, and f(x) Protocol',
    defaults: {
      name: 'Convex',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'convexApi',
        required: true,
      },
    ],
    properties: [
      // Resource selection
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Pool',
            value: 'pool',
            description: 'Curve pools staked on Convex',
          },
          {
            name: 'Staking',
            value: 'staking',
            description: 'cvxCRV staking operations',
          },
          {
            name: 'Locking',
            value: 'locking',
            description: 'vlCVX (Vote Locked CVX) operations',
          },
          {
            name: 'Token',
            value: 'token',
            description: 'CVX and cvxCRV token data',
          },
          {
            name: 'Protocol',
            value: 'protocol',
            description: 'Convex protocol-wide statistics',
          },
          {
            name: 'Frax',
            value: 'frax',
            description: 'Convex for Frax integration',
          },
          {
            name: 'Prisma',
            value: 'prisma',
            description: 'Convex for Prisma integration',
          },
          {
            name: 'Snapshot',
            value: 'snapshot',
            description: 'Governance and voting data',
          },
        ],
        default: 'pool',
      },

      // Pool operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['pool'],
          },
        },
        options: [
          {
            name: 'Get All Pools',
            value: 'getAllPools',
            description: 'List all Curve pools staked on Convex',
            action: 'Get all pools',
          },
          {
            name: 'Get Pool by ID',
            value: 'getPoolById',
            description: 'Get specific pool details',
            action: 'Get pool by ID',
          },
          {
            name: 'Get Pool APY',
            value: 'getPoolApy',
            description: 'Get pool APY breakdown',
            action: 'Get pool APY',
          },
          {
            name: 'Get Pool TVL',
            value: 'getPoolTvl',
            description: 'Get pool TVL and exposure',
            action: 'Get pool TVL',
          },
          {
            name: 'Get Pool Rewards',
            value: 'getPoolRewards',
            description: 'Get reward breakdown for a pool',
            action: 'Get pool rewards',
          },
          {
            name: 'Get Top Pools by APY',
            value: 'getTopPoolsByApy',
            description: 'Get highest yielding pools',
            action: 'Get top pools by APY',
          },
          {
            name: 'Get Top Pools by TVL',
            value: 'getTopPoolsByTvl',
            description: 'Get largest pools by TVL',
            action: 'Get top pools by TVL',
          },
        ],
        default: 'getAllPools',
      },

      // Staking operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['staking'],
          },
        },
        options: [
          {
            name: 'Get cvxCRV Stats',
            value: 'getCvxCrvStats',
            description: 'Get cvxCRV staking statistics',
            action: 'Get cvxCRV stats',
          },
          {
            name: 'Get cvxCRV Rewards',
            value: 'getCvxCrvRewards',
            description: 'Get cvxCRV reward breakdown',
            action: 'Get cvxCRV rewards',
          },
          {
            name: 'Get Staking APR',
            value: 'getStakingApr',
            description: 'Get current staking returns',
            action: 'Get staking APR',
          },
          {
            name: 'Get cvxCRV/CRV Ratio',
            value: 'getCvxCrvRatio',
            description: 'Get cvxCRV peg status',
            action: 'Get cvxCRV ratio',
          },
          {
            name: 'Get Staking TVL',
            value: 'getStakingTvl',
            description: 'Get total cvxCRV staked',
            action: 'Get staking TVL',
          },
        ],
        default: 'getCvxCrvStats',
      },

      // Locking operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['locking'],
          },
        },
        options: [
          {
            name: 'Get vlCVX Stats',
            value: 'getVlCvxStats',
            description: 'Get vlCVX statistics',
            action: 'Get vlCVX stats',
          },
          {
            name: 'Get Lock APR',
            value: 'getLockApr',
            description: 'Get voting rewards APR',
            action: 'Get lock APR',
          },
          {
            name: 'Get Voting Power',
            value: 'getVotingPower',
            description: 'Get protocol voting stats',
            action: 'Get voting power',
          },
          {
            name: 'Get Lock Schedule',
            value: 'getLockSchedule',
            description: 'Get unlock timeline',
            action: 'Get lock schedule',
          },
          {
            name: 'Get Bribe Revenue',
            value: 'getBribeRevenue',
            description: 'Get voting incentives data',
            action: 'Get bribe revenue',
          },
          {
            name: 'Get Gauge Votes',
            value: 'getGaugeVotes',
            description: 'Get gauge weight vote data',
            action: 'Get gauge votes',
          },
        ],
        default: 'getVlCvxStats',
      },

      // Token operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['token'],
          },
        },
        options: [
          {
            name: 'Get CVX Price',
            value: 'getCvxPrice',
            description: 'Get current CVX price',
            action: 'Get CVX price',
          },
          {
            name: 'Get CVX Supply',
            value: 'getCvxSupply',
            description: 'Get CVX supply metrics',
            action: 'Get CVX supply',
          },
          {
            name: 'Get CVX Emissions',
            value: 'getCvxEmissions',
            description: 'Get emission schedule',
            action: 'Get CVX emissions',
          },
          {
            name: 'Get cvxCRV Supply',
            value: 'getCvxCrvSupply',
            description: 'Get cvxCRV supply data',
            action: 'Get cvxCRV supply',
          },
          {
            name: 'Get Token Holders',
            value: 'getTokenHolders',
            description: 'Get major token holders',
            action: 'Get token holders',
          },
        ],
        default: 'getCvxPrice',
      },

      // Protocol operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['protocol'],
          },
        },
        options: [
          {
            name: 'Get Protocol TVL',
            value: 'getProtocolTvl',
            description: 'Get total Convex TVL',
            action: 'Get protocol TVL',
          },
          {
            name: 'Get Protocol Revenue',
            value: 'getProtocolRevenue',
            description: 'Get fee generation data',
            action: 'Get protocol revenue',
          },
          {
            name: 'Get Fee Structure',
            value: 'getFeeStructure',
            description: 'Get platform fees breakdown',
            action: 'Get fee structure',
          },
          {
            name: 'Get Supported Protocols',
            value: 'getSupportedProtocols',
            description: 'Get Curve, Frax, Prisma, FX info',
            action: 'Get supported protocols',
          },
          {
            name: 'Get Platform Stats',
            value: 'getPlatformStats',
            description: 'Get aggregated metrics',
            action: 'Get platform stats',
          },
        ],
        default: 'getProtocolTvl',
      },

      // Frax operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['frax'],
          },
        },
        options: [
          {
            name: 'Get Frax Pools',
            value: 'getFraxPools',
            description: 'Get FXS pools on Convex',
            action: 'Get Frax pools',
          },
          {
            name: 'Get cvxFXS Stats',
            value: 'getCvxFxsStats',
            description: 'Get staked FXS metrics',
            action: 'Get cvxFXS stats',
          },
          {
            name: 'Get Frax APY',
            value: 'getFraxApy',
            description: 'Get Frax pool yields',
            action: 'Get Frax APY',
          },
          {
            name: 'Get FXS Rewards',
            value: 'getFxsRewards',
            description: 'Get FXS reward distribution',
            action: 'Get FXS rewards',
          },
        ],
        default: 'getFraxPools',
      },

      // Prisma operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['prisma'],
          },
        },
        options: [
          {
            name: 'Get Prisma Pools',
            value: 'getPrismaPools',
            description: 'Get Prisma pools on Convex',
            action: 'Get Prisma pools',
          },
          {
            name: 'Get cvxPRISMA Stats',
            value: 'getCvxPrismaStats',
            description: 'Get staked PRISMA metrics',
            action: 'Get cvxPRISMA stats',
          },
          {
            name: 'Get Prisma APY',
            value: 'getPrismaApy',
            description: 'Get Prisma pool yields',
            action: 'Get Prisma APY',
          },
        ],
        default: 'getPrismaPools',
      },

      // Snapshot operations
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: {
          show: {
            resource: ['snapshot'],
          },
        },
        options: [
          {
            name: 'Get Active Proposals',
            value: 'getActiveProposals',
            description: 'Get current governance votes',
            action: 'Get active proposals',
          },
          {
            name: 'Get Gauge Weight Votes',
            value: 'getGaugeWeightVotes',
            description: 'Get bi-weekly gauge votes',
            action: 'Get gauge weight votes',
          },
          {
            name: 'Get Vote Results',
            value: 'getVoteResults',
            description: 'Get historical vote outcomes',
            action: 'Get vote results',
          },
          {
            name: 'Get Voting Schedule',
            value: 'getVotingSchedule',
            description: 'Get next vote timing',
            action: 'Get voting schedule',
          },
        ],
        default: 'getActiveProposals',
      },

      // Include all operation-specific parameters
      ...pool.getAllPools.description,
      ...pool.getPoolById.description,
      ...pool.getPoolApy.description,
      ...pool.getPoolTvl.description,
      ...pool.getPoolRewards.description,
      ...pool.getTopPoolsByApy.description,
      ...pool.getTopPoolsByTvl.description,

      ...staking.getCvxCrvStats.description,
      ...staking.getCvxCrvRewards.description,
      ...staking.getStakingApr.description,
      ...staking.getCvxCrvRatio.description,
      ...staking.getStakingTvl.description,

      ...locking.getVlCvxStats.description,
      ...locking.getLockApr.description,
      ...locking.getVotingPower.description,
      ...locking.getLockSchedule.description,
      ...locking.getBribeRevenue.description,
      ...locking.getGaugeVotes.description,

      ...token.getCvxPrice.description,
      ...token.getCvxSupply.description,
      ...token.getCvxEmissions.description,
      ...token.getCvxCrvSupply.description,
      ...token.getTokenHolders.description,

      ...protocol.getProtocolTvl.description,
      ...protocol.getProtocolRevenue.description,
      ...protocol.getFeeStructure.description,
      ...protocol.getSupportedProtocols.description,
      ...protocol.getPlatformStats.description,

      ...frax.getFraxPools.description,
      ...frax.getCvxFxsStats.description,
      ...frax.getFraxApy.description,
      ...frax.getFxsRewards.description,

      ...prisma.getPrismaPools.description,
      ...prisma.getCvxPrismaStats.description,
      ...prisma.getPrismaApy.description,

      ...snapshot.getActiveProposals.description,
      ...snapshot.getGaugeWeightVotes.description,
      ...snapshot.getVoteResults.description,
      ...snapshot.getVotingSchedule.description,
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const resource = this.getNodeParameter('resource', 0) as string;
    const operation = this.getNodeParameter('operation', 0) as string;

    for (let i = 0; i < items.length; i++) {
      try {
        let result: INodeExecutionData[] = [];

        // Route to appropriate handler
        switch (resource) {
          case 'pool':
            switch (operation) {
              case 'getAllPools':
                result = await pool.getAllPools.execute.call(this, i);
                break;
              case 'getPoolById':
                result = await pool.getPoolById.execute.call(this, i);
                break;
              case 'getPoolApy':
                result = await pool.getPoolApy.execute.call(this, i);
                break;
              case 'getPoolTvl':
                result = await pool.getPoolTvl.execute.call(this, i);
                break;
              case 'getPoolRewards':
                result = await pool.getPoolRewards.execute.call(this, i);
                break;
              case 'getTopPoolsByApy':
                result = await pool.getTopPoolsByApy.execute.call(this, i);
                break;
              case 'getTopPoolsByTvl':
                result = await pool.getTopPoolsByTvl.execute.call(this, i);
                break;
            }
            break;

          case 'staking':
            switch (operation) {
              case 'getCvxCrvStats':
                result = await staking.getCvxCrvStats.execute.call(this, i);
                break;
              case 'getCvxCrvRewards':
                result = await staking.getCvxCrvRewards.execute.call(this, i);
                break;
              case 'getStakingApr':
                result = await staking.getStakingApr.execute.call(this, i);
                break;
              case 'getCvxCrvRatio':
                result = await staking.getCvxCrvRatio.execute.call(this, i);
                break;
              case 'getStakingTvl':
                result = await staking.getStakingTvl.execute.call(this, i);
                break;
            }
            break;

          case 'locking':
            switch (operation) {
              case 'getVlCvxStats':
                result = await locking.getVlCvxStats.execute.call(this, i);
                break;
              case 'getLockApr':
                result = await locking.getLockApr.execute.call(this, i);
                break;
              case 'getVotingPower':
                result = await locking.getVotingPower.execute.call(this, i);
                break;
              case 'getLockSchedule':
                result = await locking.getLockSchedule.execute.call(this, i);
                break;
              case 'getBribeRevenue':
                result = await locking.getBribeRevenue.execute.call(this, i);
                break;
              case 'getGaugeVotes':
                result = await locking.getGaugeVotes.execute.call(this, i);
                break;
            }
            break;

          case 'token':
            switch (operation) {
              case 'getCvxPrice':
                result = await token.getCvxPrice.execute.call(this, i);
                break;
              case 'getCvxSupply':
                result = await token.getCvxSupply.execute.call(this, i);
                break;
              case 'getCvxEmissions':
                result = await token.getCvxEmissions.execute.call(this, i);
                break;
              case 'getCvxCrvSupply':
                result = await token.getCvxCrvSupply.execute.call(this, i);
                break;
              case 'getTokenHolders':
                result = await token.getTokenHolders.execute.call(this, i);
                break;
            }
            break;

          case 'protocol':
            switch (operation) {
              case 'getProtocolTvl':
                result = await protocol.getProtocolTvl.execute.call(this, i);
                break;
              case 'getProtocolRevenue':
                result = await protocol.getProtocolRevenue.execute.call(this, i);
                break;
              case 'getFeeStructure':
                result = await protocol.getFeeStructure.execute.call(this, i);
                break;
              case 'getSupportedProtocols':
                result = await protocol.getSupportedProtocols.execute.call(this, i);
                break;
              case 'getPlatformStats':
                result = await protocol.getPlatformStats.execute.call(this, i);
                break;
            }
            break;

          case 'frax':
            switch (operation) {
              case 'getFraxPools':
                result = await frax.getFraxPools.execute.call(this, i);
                break;
              case 'getCvxFxsStats':
                result = await frax.getCvxFxsStats.execute.call(this, i);
                break;
              case 'getFraxApy':
                result = await frax.getFraxApy.execute.call(this, i);
                break;
              case 'getFxsRewards':
                result = await frax.getFxsRewards.execute.call(this, i);
                break;
            }
            break;

          case 'prisma':
            switch (operation) {
              case 'getPrismaPools':
                result = await prisma.getPrismaPools.execute.call(this, i);
                break;
              case 'getCvxPrismaStats':
                result = await prisma.getCvxPrismaStats.execute.call(this, i);
                break;
              case 'getPrismaApy':
                result = await prisma.getPrismaApy.execute.call(this, i);
                break;
            }
            break;

          case 'snapshot':
            switch (operation) {
              case 'getActiveProposals':
                result = await snapshot.getActiveProposals.execute.call(this, i);
                break;
              case 'getGaugeWeightVotes':
                result = await snapshot.getGaugeWeightVotes.execute.call(this, i);
                break;
              case 'getVoteResults':
                result = await snapshot.getVoteResults.execute.call(this, i);
                break;
              case 'getVotingSchedule':
                result = await snapshot.getVotingSchedule.execute.call(this, i);
                break;
            }
            break;

          default:
            throw new Error(`Unknown resource: ${resource}`);
        }

        returnData.push(...result);
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
