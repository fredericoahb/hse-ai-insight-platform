import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { DatabaseService } from './database/database.service';
import { HealthController } from './health.controller';
import { RabbitMqService } from './messaging/rabbitmq.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';

@Module({
  imports: [],
  controllers: [HealthController, ReportsController, DashboardController],
  providers: [DatabaseService, RabbitMqService, ReportsService, DashboardService],
})
export class AppModule {}
