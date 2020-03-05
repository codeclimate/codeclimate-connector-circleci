import * as nock from "nock"
import { buildFakeLogger } from "codeclimate-connector-sdk/lib/TestHelpers"

import { VerifyConfiguration } from "../VerifyConfiguration"

nock.disableNetConnect()

describe(VerifyConfiguration, () => {
  test("says valid config is valid", () => {
    nock("https://circleci.com").
      get("/api/v2/me").
      reply(
        200,
        JSON.stringify({}),
      )

    const verifier = new VerifyConfiguration(
      new Map([
        ["apiToken", "fake-key"],
      ]),
      buildFakeLogger(),
    )

    return verifier.run().then((result) => {
      expect(result.isValid).toBe(true)
    })
  })

  test("says config missing api key is invalid", () => {
    const verifier = new VerifyConfiguration(
      new Map([
        ["apiToken", "fake-key"],
      ]),
      buildFakeLogger(),
    )

    return verifier.run().then((result) => {
      expect(result.isValid).toBe(false)
      expect(result.errorMessages).toBeDefined()
      expect(result.errorMessages!.length).toBe(1)
    })
  })

  test("says config is invalid if API key fails", () => {
    nock("https://circleci.com").
      get("/api/v2/me").
      reply(
        401,
        JSON.stringify({}),
      )

    const verifier = new VerifyConfiguration(
      new Map([
        ["apiToken", "fake-key"],
      ]),
      buildFakeLogger(),
    )

    return verifier.run().then((result) => {
      expect(result.isValid).toBe(false)
      expect(result.errorMessages).toBeDefined()
      expect(result.errorMessages!.length).toBe(1)
    })
  })
})

