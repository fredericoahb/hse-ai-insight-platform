/**
 * Spec: specs/api/openapi.yaml — GET /dashboard/summary, GET /dashboard/trends
 */
import { Test, TestingModule } from '@nestjs/testing';
import { DashboardController } from '../src/dashboard/dashboard.controller';
import { DashboardService } from '../src/dashboard/dashboard.service';

const mockSummary = {
  totalIncidents: 42,
  processedReports: 38,
  highSeverityIncidents: 5,
  daysSinceLastAccident: 7,
};

const mockTrends = {
  days: 14,
  incidentsByDay: [
    { date: '2024-01-01', incidents: 3 },
    { date: '2024-01-02', incidents: 1 },
  ],
  severityBreakdown: [
    { severity: 'High', total: 5 },
    { severity: 'Medium', total: 20 },
    { severity: 'Low', total: 17 },
  ],
};

const mockDashboardService = {
  getSummary: jest.fn().mockResolvedValue(mockSummary),
  getTrends: jest.fn().mockResolvedValue(mockTrends),
};

describe('DashboardController — spec: specs/api/openapi.yaml', () => {
  let controller: DashboardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [{ provide: DashboardService, useValue: mockDashboardService }],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
  });

  describe('GET /dashboard/summary', () => {
    it('returns all four KPI fields defined in the spec', async () => {
      const result = await controller.summary() as any;
      expect(result).toHaveProperty('totalIncidents');
      expect(result).toHaveProperty('processedReports');
      expect(result).toHaveProperty('highSeverityIncidents');
      expect(result).toHaveProperty('daysSinceLastAccident');
    });

    it('all KPI values are non-negative integers', async () => {
      const result = await controller.summary() as any;
      for (const key of ['totalIncidents', 'processedReports', 'highSeverityIncidents', 'daysSinceLastAccident']) {
        expect(typeof result[key]).toBe('number');
        expect(result[key]).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('GET /dashboard/trends', () => {
    it('returns days, incidentsByDay and severityBreakdown', async () => {
      const result = await controller.trends('14') as any;
      expect(result).toHaveProperty('days');
      expect(result).toHaveProperty('incidentsByDay');
      expect(result).toHaveProperty('severityBreakdown');
    });

    it('incidentsByDay entries have date and incidents fields', async () => {
      const result = await controller.trends('14') as any;
      for (const point of result.incidentsByDay) {
        expect(point).toHaveProperty('date');
        expect(point).toHaveProperty('incidents');
        expect(typeof point.incidents).toBe('number');
      }
    });

    it('severityBreakdown entries have severity and total fields', async () => {
      const result = await controller.trends('14') as any;
      for (const point of result.severityBreakdown) {
        expect(point).toHaveProperty('severity');
        expect(point).toHaveProperty('total');
      }
    });

    it('falls back to 14 days when argument is non-numeric', async () => {
      await controller.trends('abc');
      expect(mockDashboardService.getTrends).toHaveBeenCalledWith(14);
    });
  });
});
