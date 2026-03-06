import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RabbitMqService } from '../messaging/rabbitmq.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly rabbit: RabbitMqService,
  ) {}

  async createReport(dto: CreateReportDto) {
    const insert = await this.db.query<{
      id: string;
      status: string;
      created_at: string;
    }>(
      `
      INSERT INTO incidents (report_text, status)
      VALUES ($1, 'QUEUED')
      RETURNING id, status, created_at
      `,
      [dto.reportText.trim()],
    );

    const incident = insert.rows[0];

    await this.rabbit.publish({
      incidentId: incident.id,
      reportText: dto.reportText.trim(),
      createdAt: incident.created_at,
    });

    return {
      message: 'Report received and queued for analysis.',
      incidentId: incident.id,
      status: incident.status,
      createdAt: incident.created_at,
    };
  }

  async getRecent(limit = 10) {
    const normalizedLimit = Math.min(Math.max(limit, 1), 50);
    const result = await this.db.query(
      `
      SELECT
        id,
        report_text,
        status,
        classification,
        severity,
        equipment,
        location,
        injury_type,
        probable_root_cause,
        ai_summary,
        tags,
        extracted_entities,
        analyzed_at,
        created_at,
        updated_at
      FROM incidents
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [normalizedLimit],
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      reportText: row.report_text,
      status: row.status,
      classification: row.classification,
      severity: row.severity,
      equipment: row.equipment,
      location: row.location,
      injuryType: row.injury_type,
      probableRootCause: row.probable_root_cause,
      aiSummary: row.ai_summary,
      tags: row.tags ?? [],
      extractedEntities: row.extracted_entities ?? {},
      analyzedAt: row.analyzed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getById(id: string) {
    const result = await this.db.query(
      `
      SELECT
        id,
        report_text,
        status,
        classification,
        severity,
        equipment,
        location,
        injury_type,
        probable_root_cause,
        ai_summary,
        tags,
        extracted_entities,
        analyzed_at,
        created_at,
        updated_at,
        last_error
      FROM incidents
      WHERE id = $1
      LIMIT 1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    const row: any = result.rows[0];
    return {
      id: row.id,
      reportText: row.report_text,
      status: row.status,
      classification: row.classification,
      severity: row.severity,
      equipment: row.equipment,
      location: row.location,
      injuryType: row.injury_type,
      probableRootCause: row.probable_root_cause,
      aiSummary: row.ai_summary,
      tags: row.tags ?? [],
      extractedEntities: row.extracted_entities ?? {},
      analyzedAt: row.analyzed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastError: row.last_error,
    };
  }
}
