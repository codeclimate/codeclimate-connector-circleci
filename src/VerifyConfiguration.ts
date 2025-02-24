import {
  ClientConfiguration,
  Logger,
  VerifyConfigurationResult,
} from "codeclimate-connector-sdk"

import { ApiClient, ResponseError } from "./ApiClient"

export class VerifyConfiguration {
  constructor(
    public configuration: ClientConfiguration,
    public logger: Logger,
  ) {
  }

  run(): Promise<VerifyConfigurationResult> {
    if (!this.apiTokenPresent()) {
      return Promise.resolve({
        isValid: false,
        errorMessages: ["apiToken must be present"],
      })
    }

    return this.buildApiClient().get("me").
      then(() => {
        return { isValid: true }
      }).
      catch((err) => {
        let msg = "An error occurred"

        if (err instanceof ResponseError) {
          msg = err.message
        }

        return {
          isValid: false,
          errorMessages: [msg],
        }
      })
  }

  private apiTokenPresent() {
    return typeof this.configuration.get("apiToken") === "string"
  }

  private buildApiClient() {
    return new ApiClient(this.configuration.get("apiToken") as string)
  }
}

