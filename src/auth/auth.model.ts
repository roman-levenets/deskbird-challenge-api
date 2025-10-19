export interface JwtUserPayload {
  sub: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export enum TokenType {
  Access,
  Refresh,
}
