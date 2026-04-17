/**
 * Spec: specs/api/openapi.yaml — POST /reports, GET /reports/recent, GET /reports/:id
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ValidationPipe } from '@nestjs/common';
import { ReportsController } from '../src/reports/reports.controller';
import { ReportsService } from '../src/reports/reports.service';

const mockReport = {
  id: '00000000-0000-0000-0000-000000000001',
  reportText: 'Worker slipped on wet surface near pump station. No injury recorded.',
  status: 'PROCESSED',
  classification: 'Minor Accident',
  severity: 'Low',
  equipment: 'Pump station floor',
  location: 'Pump station A',
  injuryType: 'None',
  probableRootCause: 'Wet surface / poor housekeeping',
  aiSummary: 'Slip on wet floor, no injury.',
  tags: ['slip-trip-fall', 'housekeeping'],
  extractedEntities: {},
  analyzedAt: '2024-01-01T10:00:00Z',
  createdAt: '2024-01-01T09:55:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
  lastError: null,
};

const mockReportsService = {
  createReport: jest.fn().mockResolvedValue({
    message: 'Report received and queued for analysis.',
    incidentId: mockReport.id,
    status: 'QUEUED',
    createdAt: mockReport.createdAt,
  }),
  getRecent: jest.fn().mockResolvedValue([mockReport]),
  getById: jest.fn().mockResolvedValue(mockReport),
};

describe('ReportsController — spec: specs/api/openapi.yaml', () => {
  let controller: ReportsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: mockReportsService }],
    }).compile();

    controller = module.get<ReportsController>(ReportsController);
  });

  describe('POST /reports', () => {
    it('returns incidentId, status QUEUED and a confirmation message', async () => {
      const result = await controller.create({
        reportText: 'Worker slipped on wet surface near pump station. No injury recorded.',
      });

      expect(result).toMatchObject({
        message: expect.any(String),
        incidentId: expect.any(String),
        status: 'QUEUED',
        createdAt: expect.any(String),
      });
    });
  });

  describe('GET /reports/recent', () => {
    it('returns an array of incidents', async () => {
      const result = await controller.recent('10');
      expect(Array.isArray(result)).toBe(true);
    });

    it('each incident has required fields defined in the spec', async () => {
      const [incident] = await controller.recent('1') as any[];
      expect(incident).toHaveProperty('id');
      expect(incident).toHaveProperty('reportText');
      expect(incident).toHaveProperty('status');
      expect(incident).toHaveProperty('createdAt');
    });

    it('clamps limit to 10 when argument is non-numeric', async () => {
      await controller.recent('abc');
      expect(mockReportsService.getRecent).toHaveBeenCalledWith(10);
    });
  });

  describe('GET /reports/:id', () => {
    it('returns the incident when found', async () => {
      const result = await controller.byId(mockReport.id) as any;
      expect(result.id).toBe(mockReport.id);
    });

    it('throws NotFoundException when the incident does not exist', async () => {
      mockReportsService.getById.mockResolvedValueOnce(null);
      await expect(controller.byId('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});

describe('CreateReportDto — validation rules from spec', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true });

  it('rejects reportText shorter than 20 characters', async () => {
    await expect(
      pipe.transform({ reportText: 'Too short' }, { type: 'body', metatype: require('../src/reports/dto/create-report.dto').CreateReportDto }),
    ).rejects.toBeDefined();
  });

  it('accepts a valid reportText', async () => {
    const result = await pipe.transform(
      { reportText: 'Worker slipped on wet surface near pump station. No injury recorded.' },
      { type: 'body', metatype: require('../src/reports/dto/create-report.dto').CreateReportDto },
    );
    expect(result.reportText).toBeDefined();
  });
});
