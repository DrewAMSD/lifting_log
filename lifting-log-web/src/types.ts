export type serverUrlProps = {
  url: string
}

export type HTTPException = {
  detail: string
}

export type TokenResponse = {
  access_token: string,
  token_type: number
}

export type TokenPayload = {
  sub: string,
  exp: number
}

export type AccessToken = {
  token: string,
  exp: number // currently in seconds
}

export type User = {
  username: string,
  access_token: AccessToken
}