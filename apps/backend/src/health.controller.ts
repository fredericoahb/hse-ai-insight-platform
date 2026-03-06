import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'hse-ai-insight-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
