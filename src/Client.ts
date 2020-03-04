import {
  AbstractClient,
  ClientInterface,
  Stream,
  VerifyConfigurationResult,
} from "codeclimate-connector-sdk"

import { DiscoverStreams } from "./DiscoverStreams"
import { SyncStream } from "./SyncStream"
import { VerifyConfiguration } from "./VerifyConfiguration"

export class Client extends AbstractClient implements ClientInterface {
  verifyConfiguration(): Promise<VerifyConfigurationResult> {
    const verifier = new VerifyConfiguration(this.configuration, this.logger)

    return verifier.run()
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
    const syncer = new SyncStream(
      this.configuration,
      stream,
      this.recordProducer,
      this.stateManager,
      this.logger,
      earliestDataCutoff,
    )

    return syncer.run()
  }
}
