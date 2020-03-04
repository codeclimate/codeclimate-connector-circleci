import * as nock from "nock"
import { Stream } from "codeclimate-connector-sdk"
import {
  buildFakeRecordProducer,
  buildFakeStateManager,
  buildFakeLogger,
} from "codeclimate-connector-sdk/lib/TestHelpers"

import { SyncStream } from "../SyncStream"

nock.disableNetConnect()

describe(SyncStream, () => {
  test("it syncs some pipelines", () => {
    const stream = new Stream({
      _type: "Stream",
      id: "gh/owner/repo",
      self: "https://github.com/owner/repo",
      name: "owner/repo"
    })

    // get the project
    nock("https://circleci.com").
      get("/api/v2/project/gh/owner/repo").
      reply(
        200,
        JSON.stringify({
          slug: "gh/owner/repo",
          organization_name: "owner",
          name: "repo",
          vcs_info: {
            vcs_url: "https://github.com/owner/repo",
            default_branch: "master"
          }
        }),
      )

    // get the pipelines - 2 pages
    nock("https://circleci.com").
      get("/api/v2/project/gh/owner/repo/pipeline").
      reply(
        200,
        JSON.stringify({
          next_page_token: "next-page",
          items: [
            {
              id: "pipeline-1",
              created_at: new Date().toISOString(),
              vcs: { revision: "a1b2c3" }
            }
          ]
        }),
      )

    nock("https://circleci.com").
      get("/api/v2/project/gh/owner/repo/pipeline?page-token=next-page").
      reply(
        200,
        JSON.stringify({
          items: [
            {
              id: "pipeline-2",
              created_at: new Date().toISOString(),
              vcs: { revision: "d4e5f6" }
            }
          ]
        }),
      )

    // get the workflows/jobs of pipeline 1
    nock("https://circleci.com").
      get("/api/v2/pipeline/pipeline-1/workflow").
      reply(
        200,
        JSON.stringify({
          items: [
            {
              id: "workflow-1",
              name: "build-and-test",
              status: "canceled",
              created_at: new Date().toISOString(),
              finished_at: null,
            }
          ]
        }),
      )

    nock("https://circleci.com").
      get("/api/v2/workflow/workflow-1/job").
      reply(
        200,
        JSON.stringify({
          items: [
            {
              id: "w-1-job-1",
              name: "build",
              status: "success",
              started_at: new Date().toISOString(),
              finished_at: new Date().toISOString(),
            },
            {
              id: "w-1-job-2",
              name: "test",
              status: "failed",
              started_at: new Date().toISOString(),
              finished_at: new Date().toISOString(),
            }
          ]
        }),
      )

    // get the workflows/jobs of pipeline 2
    nock("https://circleci.com").
      get("/api/v2/pipeline/pipeline-2/workflow").
      reply(
        200,
        JSON.stringify({
          items: [
            {
              id: "workflow-2",
              name: "build-and-test",
              status: "success",
              created_at: new Date().toISOString(),
              finished_at: new Date().toISOString(),
            }
          ]
        }),
      )

    nock("https://circleci.com").
      get("/api/v2/workflow/workflow-2/job").
      reply(
        200,
        JSON.stringify({
          items: [
            {
              id: "w-2-job-1",
              name: "build",
              status: "success",
              started_at: new Date().toISOString(),
              finished_at: new Date().toISOString(),
            },
            {
              id: "w-2-job-2",
              name: "test",
              status: "success",
              started_at: new Date().toISOString(),
              finished_at: new Date().toISOString(),
            }
          ]
        }),
      )

    const recordProducer = buildFakeRecordProducer()
    const stateManager = buildFakeStateManager()
    const syncer = new SyncStream(
      new Map([["apiToken", "fake-token"]]),
      stream,
      recordProducer,
      stateManager,
      buildFakeLogger(),
      new Date(new Date().valueOf() - 100_000_000),
    )

    return syncer.run().then(() => {
      // 1 repo + 2 workflows (1 per pipeline) & 2 jobs per workflow = 7
      expect(recordProducer.records.length).toBe(7)
    })
  })
})
