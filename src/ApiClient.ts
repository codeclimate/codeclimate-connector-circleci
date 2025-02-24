import { URL } from "url"
import * as https from "https"

export class ResponseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = ResponseError.name
    Object.setPrototypeOf(this, ResponseError.prototype)
  }
}
export class NotFoundError extends ResponseError {
  constructor(message: string) {
    super(message)
    this.name = NotFoundError.name
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}
export class UnauthorizedError extends ResponseError {
  constructor(message: string) {
    super(message)
    this.name = UnauthorizedError.name
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}
export class ServerError extends ResponseError {
  constructor(message: string) {
    super(message)
    this.name = ServerError.name
    Object.setPrototypeOf(this, ServerError.prototype)
  }
}

const BASE_URL = "https://circleci.com/api/v2/"

export class ApiClient {
  constructor(public apiToken: string) {
  }

  // returns a promise that will resolve to a parsed JSON object
  get(path: string, params?: object): Promise<object> {
    return new Promise((resolve, reject) => {
      https.get(
        this.resolveUrl(path, params),
        {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "Circle-Token": this.apiToken,
          },
        },
        (resp) => {
          if (resp.statusCode && resp.statusCode >= 500) {
            reject(new ServerError("Server error"))
          } else if (resp.statusCode === 401) {
            reject(new UnauthorizedError("Unauthorized"))
          } else if (resp.statusCode === 404) {
            reject(new NotFoundError("Not found"))
          } else if (resp.statusCode !== 200) {
            reject(new ResponseError(`Did not expect ${resp.statusCode} response`))
          }

          let bodyStr = ""

          resp.on("data", (chunk) => bodyStr += chunk)
          resp.on("end", () => {
            if (resp.statusCode === 200) {
              resolve(JSON.parse(bodyStr))
            }
          })
        }
       ).on("error", (err) => {
         reject(new ResponseError(err.toString()))
       })
    })
  }

  private resolveUrl(path: string, params?: object): URL {
    let url = new URL(path, BASE_URL)

    if(params) {
      Object.keys(params).forEach((key) => {
        url.searchParams.set(key, params[key])
      })
    }

    return  url
  }
}
