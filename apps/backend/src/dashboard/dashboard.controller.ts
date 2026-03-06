import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary() {
    return this.dashboardService.getSummary();
  }

  @Get('trends')
  trends(@Query('days') days?: string) {
    const parsedDays = Number(days ?? 14);
    return this.dashboardService.getTrends(Number.isFinite(parsedDays) ? parsedDays : 14);
  }
}
