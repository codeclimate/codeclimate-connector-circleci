import * as nock from "nock"

import { ApiClient, ResponseError } from "../ApiClient"

describe(ApiClient, () => {
  beforeAll(() => nock.disableNetConnect())
  afterEach(() => nock.cleanAll())

  describe(".get", () => {
    test("basic request/response works", () => {
      nock("https://circleci.com").
        get("/api/v2/me?foo=bar").
        reply(
          200,
          JSON.stringify({
            incidents: [
              { id: "abc123" },
            ],
          }),
        )

      const client = new ApiClient("fake-token")

      return client.get("me", { foo: "bar" }).then((resp) => {
        expect(resp["incidents"]).toEqual([
          { id: "abc123" },
        ])
      })
    })

    test("it throws on bad response", () => {
      nock("https://circleci.com").
        get("/api/v2/project/gh/foo/bar").
        reply(
          500,
          ""
        )

      const client = new ApiClient("fake-token")

      return expect(client.get("project/gh/foo/bar")).rejects.toBeInstanceOf(ResponseError)
    })
  })
})
