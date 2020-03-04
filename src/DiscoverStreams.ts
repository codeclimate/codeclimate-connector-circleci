import {
  ClientConfiguration,
  Logger,
  RecordProducer,
} from "codeclimate-connector-sdk"

import { ApiClient } from "./ApiClient"

function assertIsString(val: any, message: string): asserts val is string {
  if (typeof val !== "string") {
    throw new TypeError(message)
  }
}

export class DiscoverStreams {
  apiClient: ApiClient

  constructor(
    public configuration: ClientConfiguration,
    public recordProducer: RecordProducer,
    public logger: Logger,
  ) {
    assertIsString(configuration.get("apiToken"), "apiToken should be in config")

    this.apiClient = new ApiClient(configuration.get("apiToken"))
  }

  public run(): Promise<void> {
    return this.apiClient.get(
      // this is only available on the v1 API, doesn't seem to have pagination
      "/api/v1.1/projects",
    ).then((resp) => {
      // resp is array of objects
      if (Array.isArray(resp)) {
        resp.forEach(this.processProject)
      } else {
        throw "Unexpected API response from circle /api/v1.1/projects"
      }
    })
  }

  private processProject = (project) => {
    const url = project.vcs_url as string
    const repoName = project.reponame as string
    const ownerName = project.username as string
    const vcsType = project.vcs_type as string
    let v2Prefix = ""

    switch (vcsType) {
      case "github":
        v2Prefix = "gh"
        break
      case "bitbucket":
        v2Prefix = "bb"
        break
      default:
        this.logger.warn(`Unknown vcs_type ${vcsType} for ${ownerName}/${repoName}`)
        return
    }

    this.recordProducer.produce({
      record: {
        _type: "Stream",
        id: `${v2Prefix}/${ownerName}/${repoName}`,
        self: url,
        name: `${ownerName}/${repoName}`,
      }
    })
  }
}

