import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getSummary() {
    const totalResult = await this.db.query<{ total: string }>('SELECT COUNT(*)::text AS total FROM incidents');
    const processedResult = await this.db.query<{ total: string }>(
      "SELECT COUNT(*)::text AS total FROM incidents WHERE status = 'PROCESSED'",
    );
    const highSeverityResult = await this.db.query<{ total: string }>(
      "SELECT COUNT(*)::text AS total FROM incidents WHERE severity = 'High'",
    );
    const lastAccidentResult = await this.db.query<{ days: string }>(
      `
      SELECT COALESCE(
        FLOOR(EXTRACT(EPOCH FROM (NOW() - MAX(created_at))) / 86400)::int,
        0
      )::text AS days
      FROM incidents
      WHERE classification IN ('Serious Incident', 'Minor Accident')
      `,
    );

    return {
      totalIncidents: Number(totalResult.rows[0]?.total ?? 0),
      processedReports: Number(processedResult.rows[0]?.total ?? 0),
      highSeverityIncidents: Number(highSeverityResult.rows[0]?.total ?? 0),
      daysSinceLastAccident: Number(lastAccidentResult.rows[0]?.days ?? 0),
    };
  }

  async getTrends(days = 14) {
    const normalizedDays = Math.min(Math.max(days, 7), 90);

    const trendResult = await this.db.query(
      `
      WITH series AS (
        SELECT generate_series(
          CURRENT_DATE - ($1::int - 1),
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS bucket_date
      )
      SELECT
        s.bucket_date::text AS date,
        COALESCE(COUNT(i.id), 0)::int AS incidents
      FROM series s
      LEFT JOIN incidents i
        ON DATE(i.created_at) = s.bucket_date
      GROUP BY s.bucket_date
      ORDER BY s.bucket_date ASC
      `,
      [normalizedDays],
    );

    const severityResult = await this.db.query(
      `
      SELECT COALESCE(severity, 'Unclassified') AS severity, COUNT(*)::int AS total
      FROM incidents
      GROUP BY COALESCE(severity, 'Unclassified')
      ORDER BY total DESC
      `,
    );

    return {
      days: normalizedDays,
      incidentsByDay: trendResult.rows,
      severityBreakdown: severityResult.rows,
    };
  }
}
