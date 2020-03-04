import * as nock from "nock"
import {
  buildFakeRecordProducer,
  buildFakeLogger,
} from "codeclimate-connector-sdk/lib/TestHelpers"

import { DiscoverStreams } from "../DiscoverStreams"

nock.disableNetConnect()

describe(DiscoverStreams, () => {
  test("it syncs some projects", () => {
    nock("https://circleci.com").
      get("/api/v1.1/projects").
      reply(
        200,
        JSON.stringify([
          {
            vcs_url: "https://example.com/org/repo1",
            vcs_type: "github",
            reponame: "repo1",
            ownername: "org",
          },
          {
            vcs_url: "https://example.com/org/repo2",
            vcs_type: "github",
            reponame: "repo2",
            ownername: "org",
          }
        ]),
      )

    const recordProducer = buildFakeRecordProducer()
    const syncer = new DiscoverStreams(
      new Map([["apiToken", "fake-token"]]),
      recordProducer,
      buildFakeLogger(),
    )

    return syncer.run().then(() => {
      expect(recordProducer.records.length).toBe(2)
    })
  })
})

