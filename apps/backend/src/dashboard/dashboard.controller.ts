import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Fetch aggregated KPI summary' })
  @ApiOkResponse({ description: 'KPI snapshot: total, processed, high-severity counts and days since last accident' })
  summary() {
    return this.dashboardService.getSummary();
  }

  @Get('trends')
  @ApiOperation({ summary: 'Fetch incident trends and severity breakdown' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Lookback window in days (7–90, default 14)' })
  @ApiOkResponse({ description: 'Daily incident counts and severity distribution for the requested window' })
  trends(@Query('days') days?: string) {
    const parsedDays = Number(days ?? 14);
    return this.dashboardService.getTrends(Number.isFinite(parsedDays) ? parsedDays : 14);
  }
}
