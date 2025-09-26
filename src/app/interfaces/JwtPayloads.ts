export interface JwtPayloads {
  sub: string; 
  username: string;
  name: string;
  exp: number;
  iat: number;
}