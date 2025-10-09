import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { UserService } from '../user/user.service';

@Injectable()
export class WsJwtAuthGuard extends AuthGuard('ws-jwt') {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const token = this.extractTokenFromHeader(client);
    
    if (!token) {
      throw new WsException('Unauthorized');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new WsException('User not found');
      }

      // Attach user to client for use in handlers
      client.user = user;
      return true;
    } catch (error) {
      throw new WsException('Invalid token');
    }
  }

  private extractTokenFromHeader(client: any): string | undefined {
    const [type, token] = client.handshake?.auth?.token?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
