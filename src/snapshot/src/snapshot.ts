import { Web3Provider } from '@ethersproject/providers'
import snapshot from '@snapshot-labs/snapshot.js'
import { SnapshotQueries } from '../lib/snapshotQueries'

export class Snapshot {
  private queries: SnapshotQueries = new SnapshotQueries()
  private spaceId: string
  private hub = 'https://hub.snapshot.org'

  constructor(spaceId: string) {
    this.spaceId = spaceId
  }

  getSpace = async (): Promise<any> => {
    try {
      const result = await this.queries.getSpace(this.spaceId)
      return result
    } catch (err) {
      return {
        message: "Error while getting space's details",
        error: `Error: ${err}`,
      }
    }
  }

  getActiveProposals = async (): Promise<any> => {
    try {
      const result = await this.queries.getActiveProposals(this.spaceId)
      return result
    } catch (err) {
      return {
        message: "Error while getting space's details",
        error: `Error: ${err}`,
      }
    }
  }

  getRecentProposals = async (): Promise<any> => {
    try {
      const result = await this.queries.getRecentProposals(this.spaceId)
      return result
    } catch (err) {
      return {
        message: "Error while getting space's details",
        error: `Error: ${err}`,
      }
    }
  }

  castVote = async (
    proposalId: string,
    choice: number,
    account: any,
    provider: Web3Provider
  ): Promise<any> => {
    try {
      const client = new snapshot.Client712(this.hub)

      const result = await this.queries.getProposal(proposalId)

      if (result) {
        const space: string = result.space.id
        const proposal: string = proposalId
        const type: string = result.type

        const voteReceipt = await client.vote(provider, account, {
          space: space,
          proposal: proposal,
          choice: choice,
          type: type,
        })

        return voteReceipt
      }
    } catch (err) {
      return {
        message: "Error while getting space's details",
        error: `Error: ${err}`,
      }
    }
  }
}
