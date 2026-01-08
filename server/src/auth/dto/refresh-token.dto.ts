import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Data transfer object for token refresh requests
 */
export class RefreshTokenDto {
  /**
   * The refresh token to exchange for new tokens
   * @example "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   */
  @IsString({ message: 'Refresh token must be a string' })
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}
