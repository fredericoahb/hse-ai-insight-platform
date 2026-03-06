import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() body: CreateReportDto) {
    return this.reportsService.createReport(body);
  }

  @Get('recent')
  recent(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit ?? 10);
    return this.reportsService.getRecent(Number.isFinite(parsedLimit) ? parsedLimit : 10);
  }

  @Get(':id')
  async byId(@Param('id') id: string) {
    const incident = await this.reportsService.getById(id);
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    return incident;
  }
}
