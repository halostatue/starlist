import gleam/dynamic/decode
import gleam/http/request.{type Request}
import gleam/json
import squall

pub type User {
  User(login: String)
}

pub fn user_decoder() -> decode.Decoder(User) {
  use login <- decode.field("login", decode.string)
  decode.success(User(login: login))
}

pub fn user_to_json(input: User) -> json.Json {
  json.object([#("login", json.string(input.login))])
}

pub type IdentityResponse {
  IdentityResponse(viewer: User)
}

pub fn identity_response_decoder() -> decode.Decoder(IdentityResponse) {
  use viewer <- decode.field("viewer", user_decoder())
  decode.success(IdentityResponse(viewer: viewer))
}

pub fn identity_response_to_json(input: IdentityResponse) -> json.Json {
  json.object([#("viewer", user_to_json(input.viewer))])
}

pub fn identity(client: squall.Client) -> Result(Request(String), String) {
  squall.prepare_request(
    client,
    "query Identity {\n  viewer {\n    login\n  }\n}\n",
    json.object([]),
  )
}

pub fn parse_identity_response(body: String) -> Result(IdentityResponse, String) {
  squall.parse_response(body, identity_response_decoder())
}
