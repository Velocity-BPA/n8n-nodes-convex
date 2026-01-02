/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import { GraphQLClient, gql } from 'graphql-request';
import { SUBGRAPH_ENDPOINTS, SNAPSHOT_API, SNAPSHOT_SPACE } from '../constants/protocols';

/**
 * Subgraph pool data types
 */
export interface SubgraphPool {
  id: string;
  name: string;
  lpToken: string;
  gauge: string;
  crvRewardsPool: string;
  stash: string;
  shutdown: boolean;
  tvl: string;
  baseApr: string;
  crvApr: string;
  cvxApr: string;
  extraRewardsApr: string;
  totalApr: string;
}

export interface SubgraphStakingStats {
  totalStaked: string;
  apr: string;
  rewardRate: string;
}

export interface SubgraphVotingStats {
  totalLocked: string;
  lockedSupply: string;
  averageLockDuration: string;
}

export interface SnapshotProposal {
  id: string;
  title: string;
  body: string;
  choices: string[];
  start: number;
  end: number;
  snapshot: string;
  state: string;
  author: string;
  scores: number[];
  scores_total: number;
  votes: number;
  quorum?: number;
  space?: { id: string };
}

export interface SnapshotVote {
  id: string;
  voter: string;
  vp: number;
  vp_by_strategy: number[];
  choice: number | number[];
  created: number;
}

/**
 * Subgraph client for Convex data
 */
export class SubgraphClient {
  private convexClient: GraphQLClient;
  private snapshotClient: GraphQLClient;
  // apiKey stored for future use

  constructor(options: { subgraphUrl?: string; apiKey?: string; network?: string } = {}) {
    const network = options.network?.toLowerCase() || 'ethereum';
    const endpoints = SUBGRAPH_ENDPOINTS[network as keyof typeof SUBGRAPH_ENDPOINTS];
    const baseUrl = options.subgraphUrl || endpoints?.convex || SUBGRAPH_ENDPOINTS.ethereum.convex;

    // Add API key to URL if provided
    let url = baseUrl;
    if (options.apiKey) {
      // this.apiKey = options.apiKey;
      // For The Graph hosted service
      if (url.includes('api.thegraph.com')) {
        url = url.replace('api.thegraph.com', `gateway.thegraph.com/api/${options.apiKey}`);
      }
    }

    this.convexClient = new GraphQLClient(url, {
      headers: options.apiKey
        ? {
            Authorization: `Bearer ${options.apiKey}`,
          }
        : {},
    });

    this.snapshotClient = new GraphQLClient(SNAPSHOT_API);
  }

  /**
   * Get all Convex pools from subgraph
   */
  async getPools(first: number = 100, skip: number = 0): Promise<SubgraphPool[]> {
    const query = gql`
      query GetPools($first: Int!, $skip: Int!) {
        pools(first: $first, skip: $skip, orderBy: tvl, orderDirection: desc) {
          id
          name
          lpToken
          gauge
          crvRewardsPool
          stash
          shutdown
          tvl
          baseApr
          crvApr
          cvxApr
          extraRewardsApr
          totalApr
        }
      }
    `;

    try {
      const data = await this.convexClient.request<{ pools: SubgraphPool[] }>(query, {
        first,
        skip,
      });
      return data.pools;
    } catch (error) {
      // Fallback to empty array if subgraph is unavailable
      console.warn('Subgraph query failed, falling back to empty result:', error);
      return [];
    }
  }

  /**
   * Get pool by ID
   */
  async getPoolById(poolId: string): Promise<SubgraphPool | null> {
    const query = gql`
      query GetPool($id: ID!) {
        pool(id: $id) {
          id
          name
          lpToken
          gauge
          crvRewardsPool
          stash
          shutdown
          tvl
          baseApr
          crvApr
          cvxApr
          extraRewardsApr
          totalApr
        }
      }
    `;

    try {
      const data = await this.convexClient.request<{ pool: SubgraphPool | null }>(query, {
        id: poolId,
      });
      return data.pool;
    } catch (error) {
      console.warn('Subgraph query failed:', error);
      return null;
    }
  }

  /**
   * Get active Snapshot proposals
   */
  async getActiveProposals(): Promise<SnapshotProposal[]> {
    const query = gql`
      query GetProposals($space: String!, $state: String!) {
        proposals(
          first: 20
          skip: 0
          where: { space: $space, state: $state }
          orderBy: "created"
          orderDirection: desc
        ) {
          id
          title
          body
          choices
          start
          end
          snapshot
          state
          author
          scores
          scores_total
          votes
        }
      }
    `;

    try {
      const data = await this.snapshotClient.request<{ proposals: SnapshotProposal[] }>(query, {
        space: SNAPSHOT_SPACE,
        state: 'active',
      });
      return data.proposals;
    } catch (error) {
      console.warn('Snapshot query failed:', error);
      return [];
    }
  }

  /**
   * Get all proposals (including closed)
   */
  async getAllProposals(
    first: number = 20,
    skip: number = 0,
    state?: string,
  ): Promise<SnapshotProposal[]> {
    const query = gql`
      query GetProposals($space: String!, $first: Int!, $skip: Int!) {
        proposals(
          first: $first
          skip: $skip
          where: { space: $space }
          orderBy: "created"
          orderDirection: desc
        ) {
          id
          title
          body
          choices
          start
          end
          snapshot
          state
          author
          scores
          scores_total
          votes
        }
      }
    `;

    try {
      let data = await this.snapshotClient.request<{ proposals: SnapshotProposal[] }>(query, {
        space: SNAPSHOT_SPACE,
        first,
        skip,
      });

      // Filter by state if provided
      if (state) {
        data.proposals = data.proposals.filter((p) => p.state === state);
      }

      return data.proposals;
    } catch (error) {
      console.warn('Snapshot query failed:', error);
      return [];
    }
  }

  /**
   * Get proposal by ID
   */
  async getProposalById(proposalId: string): Promise<SnapshotProposal | null> {
    const query = gql`
      query GetProposal($id: String!) {
        proposal(id: $id) {
          id
          title
          body
          choices
          start
          end
          snapshot
          state
          author
          scores
          scores_total
          votes
        }
      }
    `;

    try {
      const data = await this.snapshotClient.request<{ proposal: SnapshotProposal | null }>(query, {
        id: proposalId,
      });
      return data.proposal;
    } catch (error) {
      console.warn('Snapshot query failed:', error);
      return null;
    }
  }

  /**
   * Get votes for a proposal
   */
  async getProposalVotes(proposalId: string, first: number = 100): Promise<SnapshotVote[]> {
    const query = gql`
      query GetVotes($proposalId: String!, $first: Int!) {
        votes(first: $first, where: { proposal: $proposalId }, orderBy: "vp", orderDirection: desc) {
          id
          voter
          vp
          vp_by_strategy
          choice
          created
        }
      }
    `;

    try {
      const data = await this.snapshotClient.request<{ votes: SnapshotVote[] }>(query, {
        proposalId,
        first,
      });
      return data.votes;
    } catch (error) {
      console.warn('Snapshot votes query failed:', error);
      return [];
    }
  }

  /**
   * Get gauge weight vote proposals (bi-weekly)
   */
  async getGaugeWeightVotes(first: number = 10): Promise<SnapshotProposal[]> {
    const allProposals = await this.getAllProposals(50, 0);
    // Filter for gauge weight votes (typically have specific naming convention)
    return allProposals
      .filter(
        (p) =>
          p.title.toLowerCase().includes('gauge') ||
          p.title.toLowerCase().includes('weight') ||
          p.title.toLowerCase().includes('vote'),
      )
      .slice(0, first);
  }
}

/**
 * Create a new Subgraph client instance
 */
export function createSubgraphClient(
  options: { subgraphUrl?: string; apiKey?: string; network?: string } = {},
): SubgraphClient {
  return new SubgraphClient(options);
}
