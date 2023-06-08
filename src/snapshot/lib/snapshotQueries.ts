/* eslint-disable @typescript-eslint/no-var-requires */
const axios = require('axios')

export class SnapshotQueries {
  private url = 'https://hub.snapshot.org/graphql'

  getSpace = async (spaceId: string) => {
    try {
      const result = await axios.post(`${this.url}`, null, {
        params: {
          query: `
          query {
            space(id: "${spaceId}") {
              id
              name
              about
              network
              symbol
              members
            }
          }`,
        },
      })
      return result.data
    } catch (err) {
      return err
    }
  }

  getActiveProposals = async (spaceId: string) => {
    try {
      const result = await axios.post(`${this.url}`, null, {
        params: {
          operationName: 'Proposals',
          query: `query Proposals {
                proposals (
                  first: 20,
                  skip: 0,
                  where: {
                    space_in: ["${spaceId}"],
                    state: "active"
                  },
                  orderBy: "created",
                  orderDirection: desc
                ) {
                    id
                    type
                    title
                    body
                    choices
                    start
                    end
                    snapshot
                    state
                    choices
                    start
                    end
                    scores
                    scores_by_strategy
                    scores_total
                    author
                  space {
                    id
                    name
                  }
                }
              }`,
        },
      })
      return result.data
    } catch (err) {
      return err
    }
  }

  getProposal = async (proposalId: string) => {
    try {
      const result = await axios.post(`${this.url}`, null, {
        params: {
          operationName: 'Proposal',
          query: `
          query Proposal {
            proposal(id:"${proposalId}") {
              id
              title
              body
              choices
              start
              end
              snapshot
              state
              author
              created
              scores
              scores_by_strategy
              scores_total
              scores_updated
              plugins
              network
              type
              strategies {
                name
                network
                params
              }
              space {
                id
                name
              }
            }
          }`,
        },
      })
      return result.data.proposal
    } catch (err) {
      return err
    }
  }

  getRecentProposals = async (spaceId: string) => {
    try {
      const result = await axios.post(`${this.url}`, null, {
        params: {
          operationName: 'Proposals',
          query: `query Proposals {
                proposals (
                  first: 20,
                  skip: 0,
                  where: {
                    space_in: ["${spaceId}"],
                  },
                  orderBy: "created",
                  orderDirection: desc
                ) {
                    id
                    type
                    title
                    body
                    choices
                    start
                    end
                    snapshot
                    state
                    choices
                    start
                    end
                    scores
                    scores_by_strategy
                    scores_total
                    author
                  space {
                    id
                    name
                  }
                }
              }`,
        },
      })
      return result.data
    } catch (err) {
      return err
    }
  }
}
