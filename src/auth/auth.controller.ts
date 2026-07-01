import { Controller, Post, Body, UseGuards, Request, BadRequestException, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { username: string; password: string; employeeId: string; roleId: string }
  ) {
    if (!body.username || !body.password || !body.employeeId || !body.roleId) {
      throw new BadRequestException('Missing required fields: username, password, employeeId, roleId');
    }
    return this.authService.register(body.username, body.password, body.employeeId, body.roleId);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Request() req) {
    return {
      user: req.user,
    };
  }
}
