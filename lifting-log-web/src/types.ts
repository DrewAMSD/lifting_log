export type HTTPException = {
  detail: string
};

export type TokenResponse = {
  access_token: string,
  refresh_token: string,
  token_type: string
};

export type AccessTokenResponse = {
  access_token: string,
  token_type: string
}

export type TokenPayload = {
  sub: string,
  exp: number // in seconds
};

export type Token = {
  token: string,
  exp: number // in seconds
};

export type RefreshToken = {
  refresh_token: string,
  token_type: string
}

export type User = {
  username: string,
  access_token: Token,
  refresh_token: Token
};