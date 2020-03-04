import {
  AbstractClient,
  ClientInterface,
  Stream,
  VerifyConfigurationResult,
} from "codeclimate-connector-sdk"

import { DiscoverStreams } from "./DiscoverStreams"

export class Client extends AbstractClient implements ClientInterface {
  verifyConfiguration(): Promise<VerifyConfigurationResult> {
    this.logger.debug("TODO - implement verifyConfiguration")
    return Promise.resolve({ isValid: true })
  }

  discoverStreams(): Promise<void> {
    const runner = new DiscoverStreams(
      this.configuration,
      this.recordProducer,
      this.logger,
    )

    return runner.run()
  }

  syncStream(stream: Stream, earliestDataCutoff: Date): Promise<void> {
    this.logger.debug(`TODO - implement syncStream. Got ${stream.id}, ${earliestDataCutoff}`)
    return Promise.resolve()
  }
}
