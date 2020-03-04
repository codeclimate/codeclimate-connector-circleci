import { Stream } from "codeclimate-connector-sdk"
import {
  buildFakeLogger,
  buildFakeRecordProducer,
  buildFakeStateManager,
} from "codeclimate-connector-sdk/lib/TestHelpers"

import { Client } from "../Client"
import { DiscoverStreams } from "../DiscoverStreams"

jest.mock("../DiscoverStreams")

describe(Client, () => {
  function buildClient(): Client {
    return new Client(
      new Map([
        ["apiToken", "fake-key"],
      ]),
      buildFakeRecordProducer(),
      buildFakeStateManager(),
      buildFakeLogger(),
    )
  }

  describe("verifyConfiguration", () => {
    test.skip("says valid config is valid", () => {
      const client = buildClient()

      return client.verifyConfiguration().then((result) => {
        expect(result.isValid).toBe(true)
      })
    })

    test.skip("says invalid config invalid, with errors", () => {
      const client = new Client(
        new Map(),
        buildFakeRecordProducer(),
        buildFakeStateManager(),
        buildFakeLogger(),
      )

      return client.verifyConfiguration().then((result) => {
        expect(result.isValid).toBe(false)
        expect(result.errorMessages).toBeDefined()
        expect(result.errorMessages!.length).toBeGreaterThan(0)
      })
    })
  })

  describe("discoverStreams", () => {
    test("it calls the relevant runner", () => {
      const client = buildClient();

      (DiscoverStreams as any).mockImplementation(() => {
        return {
          run: () => Promise.resolve()
        }
      })

      return client.discoverStreams().then(() => {
        const mock = (DiscoverStreams as any).mock
        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0]).toEqual([
          client.configuration, client.recordProducer, client.logger
        ])
      })
    })
  })

  describe("syncStream", () => {
    test.skip("it syncs", () => {
      const client = buildClient()

      const stream = new Stream({
        type: "Stream",
        attributes: {
          id: "your-id-here",
          self: "http://example.com/your-uri-here",
          name: "your-name-here",
        }
      })
      const dateCutoff = new Date(new Date().valueOf() - 1_000_000)

      return client.syncStream(stream, dateCutoff).then((_result) => {
        // TODO - check that `client.manager.sentMessages` contains what you
        // expect
      })
    })
  })
})
