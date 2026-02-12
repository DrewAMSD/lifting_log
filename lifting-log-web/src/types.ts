export type serverUrlProps = {
  url: string
}

export type HTTPException = {
  detail: string
}

export type User = {
  username: string,
  access_token: string,
  token_type: string
}