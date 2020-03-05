import {
  ClientConfiguration,
  Logger,
  RecordProducer,
  StateManager,
  Stream,
} from "codeclimate-connector-sdk"

import { ApiClient } from "./ApiClient"

interface Response {
  next_page_token?: string | null
  items: object[]
}

interface Repository {
  id: string
  self: string
}

// these don't really map to any record we emit
interface Project {
  slug: string
  name: string
  organization_name: string
  vcs_info: {
    vcs_url: string
    default_branch: string
  }
}

// these don't really map to any record we emit
interface Pipeline {
  id: string
  created_at: string
  vcs: {
    revision: string
  }
}

// these map to DeliveryBuild records
interface Workflow {
  id: string
  name: string
  status: string
  created_at: string
  stopped_at: string | null
}

interface Job {
  id: string
  name: string
  status: string
  job_number: number
  started_at: string | null
  stopped_at: string | null
}

function assertIsString(val: any, message: string): asserts val is string {
  if (typeof val !== "string") {
    throw new TypeError(message)
  }
}

export class SyncStream {
  apiClient: ApiClient

  constructor(
    public configuration: ClientConfiguration,
    public stream: Stream,
    public recordProducer: RecordProducer,
    public stateManager: StateManager,
    public logger: Logger,
    public earliestDataCutoff: Date
  ) {
    assertIsString(configuration.get("apiToken"), "apiToken should be in config")

    this.apiClient = new ApiClient(configuration.get("apiToken"))
  }

  /* API ref:  https://circleci.com/docs/api/v2/#get-all-pipelines
   *
   * First we request the project itself & emit a Repository record we can then
   * refer to by URL later.
   *
   * We're treating "workflows" as the "build". There's no API endpoint to get a
   * projects workflows directly, so we request pipelines, then get the
   * pipelines workflows, and so on.
   */
  public run(): Promise<void> {
    return this.apiClient.get(`project/${this.stream.id}`).then((project) => {
      let proj: Project = project as Project

      const repo = {
        _type: "Repository",
        id: proj.slug,
        self: proj.vcs_info.vcs_url,
        name: proj.name,
        owner: {
          id: proj.organization_name,
          name: proj.organization_name,
          // type is not necessarily accurate, we may need to loosen the schema,
          // and make this optional?  circle doesn't give enough details,
          // it seems, for us to know this accurately
          type: "organization"
        },
        htmlUrl: proj.vcs_info.vcs_url,
        defaultBranch: proj.vcs_info.default_branch,
      }

      this.recordProducer.produce({ record: repo })

      return this.syncRepoPipelines(repo)
    })
  }

  // use id as the slug for API URLs, self as the repository reference for
  // emitted workflows & jobs
  private syncRepoPipelines(repository: Repository, params = {}) {
    return this.apiClient.get(
      `project/${repository.id}/pipeline`, params
    ).then((resp) => {
      // pass this as page-token query param to get next page, if present
      const nextPageToken = (resp as Response).next_page_token
      const pipelines = (resp as Response).items as Pipeline[]
      let lastSeenTime: Date | null = null

      return Promise.all(
        pipelines.map((pipeline) => {
          lastSeenTime = new Date(pipeline.created_at)
          if (lastSeenTime >= this.earliestDataCutoff) {
            return this.processPipeline(repository, pipeline)
          } else {
            return null
          }
        })
      ).then(() => {
        // TODO - set page token in state & use it to init params in run if present
        this.stateManager.set({ checkpointTime: lastSeenTime })
        if (nextPageToken && pipelines.length > 0 && lastSeenTime && lastSeenTime >= this.earliestDataCutoff) {
          return this.syncRepoPipelines(
            repository,
            { "page-token": nextPageToken },
          )
        }
      })
    })
  }

  private processPipeline(repository: Repository, pipeline: Pipeline): Promise<void> {
    // TODO - handle potentially > 1 page of workflows for a pipeline, though
    // that seems pretty unusual
    return this.apiClient.get(`pipeline/${pipeline.id}/workflow`).then((resp) => {
      return Promise.all(
        ((resp as Response).items as Workflow[]).map(
          (workflow) => this.processWorkflow(repository, pipeline, workflow)
        )
      ).then(() => {})
    })
  }

  processWorkflow(repository: Repository, pipeline: Pipeline, workflow: Workflow): Promise<void> {
    // emit the record for this workflow as a build
    const workflowUrl = `https://circleci.com/workflow-run/${workflow.id}`
    this.recordProducer.produce({
      record: {
        _type: "DeliveryBuild",
        id: workflow.id,
        self: workflowUrl,
        htmlUrl: workflowUrl,
        repository: repository.self,
        commitOid: pipeline.vcs.revision,
        state: this.mapCircleStatus(workflow.status),
        createdAt: workflow.created_at,
        finishedAt: workflow.stopped_at,
      }
    })

    // fetch & emit jobs in this workflow
    return this.apiClient.get(`workflow/${workflow.id}/job`).then((resp) => {
      ((resp as Response).items as Job[]).forEach((job) => {
        // Circle's API reports jobs before they have started with a null
        // started_at, but we require a created_at, so we skip those.
        // We should be able to get them on a later sync when they'll have that
        // set.
        if (job.started_at) {
          const jobUrl = `https://circleci.com/${repository.id}/${job.job_number}`
          this.recordProducer.produce({
            record: {
              _type: "DeliveryJob",
              id: job.id,
              self: jobUrl,
              htmlUrl: jobUrl,
              build: workflowUrl,
              name: job.name,
              createdAt: job.started_at,
              finishedAt: job.stopped_at,
              state: this.mapCircleStatus(job.status),
            }
          })
        }
      })
    })
  }

  // map circle's build/job statuses to what we recognize
  private mapCircleStatus(status: string): string {
    switch (status) {
      case "canceled":
        return "canceled"
        break
      case "success":
        return "complete"
        break
      case "failed":
        return "errored"
        break
      case "created":
        return "created"
        break
      case "running":
        return "running"
        break
      default:
        throw `Don't know how to map status '${status}'`
    }
  }
}
