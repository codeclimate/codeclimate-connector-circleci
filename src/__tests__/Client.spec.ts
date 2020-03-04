import { Stream } from "codeclimate-connector-sdk"
import {
  buildFakeLogger,
  buildFakeRecordProducer,
  buildFakeStateManager,
} from "codeclimate-connector-sdk/lib/TestHelpers"

import { Client } from "../Client"
import { DiscoverStreams } from "../DiscoverStreams"
import { SyncStream } from "../SyncStream"
import { VerifyConfiguration } from "../VerifyConfiguration"

jest.mock("../DiscoverStreams")
jest.mock("../SyncStream")
jest.mock("../VerifyConfiguration")

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
    test("it calls the verifier", () => {
      (VerifyConfiguration as any).mockImplementation(() => {
        return {
          run: () => Promise.resolve()
        }
      })

      const client = buildClient()

      return client.verifyConfiguration().then(() => {
        const mock = (VerifyConfiguration as any).mock
        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0]).toEqual([
          client.configuration, client.logger
        ])
      })
    })
  })

  describe("discoverStreams", () => {
    test("it calls the relevant runner", () => {
      (DiscoverStreams as any).mockImplementation(() => {
        return {
          run: () => Promise.resolve()
        }
      })

      const client = buildClient()

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
      (SyncStream as any).mockImplementation(() => {
        return {
          run: () => Promise.resolve()
        }
      })

      const client = buildClient()

      const stream = new Stream({
        _type: "Stream",
        id: "gh/owner/repo",
        self: "https://github.com/owner/repo",
        name: "owner/repo"
      })
      const cutoff = new Date()

      return client.syncStream(stream, cutoff).then(() => {
        const mock = (SyncStream as any).mock
        expect(mock.calls.length).toBe(1)
        expect(mock.calls[0]).toEqual([
          client.configuration, stream, client.recordProducer, client.stateManager, client.logger, cutoff
        ])
      })
    })
  })
})
