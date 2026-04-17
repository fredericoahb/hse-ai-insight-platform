import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit a free-text incident report' })
  create(@Body() body: CreateReportDto) {
    return this.reportsService.createReport(body);
  }

  @Get('recent')
  @ApiOperation({ summary: 'List the most recent incidents' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of incidents to return (1–50, default 10)' })
  @ApiOkResponse({ description: 'Array of recent incidents ordered by creation date descending' })
  recent(@Query('limit') limit?: string) {
    const parsedLimit = Number(limit ?? 10);
    return this.reportsService.getRecent(Number.isFinite(parsedLimit) ? parsedLimit : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single incident by UUID' })
  @ApiOkResponse({ description: 'Incident found' })
  @ApiNotFoundResponse({ description: 'Incident not found' })
  async byId(@Param('id') id: string) {
    const incident = await this.reportsService.getById(id);
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    return incident;
  }
}
