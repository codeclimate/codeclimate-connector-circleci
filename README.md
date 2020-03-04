# Code Climate Connector: CircleCI

A Code Climate Connector for [CircleCI](https://circleci.com).

## Configuration

Expects configuration of the following schema:

```json
{
  "apiToken": "your_api_token"
}
```

If you are logged in to your CircleCI account, visit
https://circleci.com/account/api to create a token.

## Running the connector locally

To run the connector in an integration environment, the
[`codeclimate-connector-sdk`][sdk] provides a CLI you can use.

First write valid configuration to `connector-config.json`. Then, there are
several make rules to run different commands easily:

```
# Run this to check the correctness of your connector-config.json
make verify-configuration

# Run this to list your CirclCI projects as Streams
make discover-streams

# Run this to sync data from one of your projects. Write the contents of one of
# the Stream records emitted by discover-streams to stream.json
make sync-stream
```

[sdk]: https://github.com/codeclimate/codeclimate-connector-sdk

## Development

See [`DEVELOPERS.md`](DEVELOPERS.md)
