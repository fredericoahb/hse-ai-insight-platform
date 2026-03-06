'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import styles from './page.module.css';

type Summary = {
  totalIncidents: number;
  processedReports: number;
  highSeverityIncidents: number;
  daysSinceLastAccident: number;
};

type TrendPoint = { date: string; incidents: number };
type SeverityPoint = { severity: string; total: number };

type Incident = {
  id: string;
  reportText: string;
  status: string;
  classification?: string;
  severity?: string;
  equipment?: string;
  location?: string;
  injuryType?: string;
  probableRootCause?: string;
  aiSummary?: string;
  tags?: string[];
  createdAt: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

export default function HomePage() {
  const [reportText, setReportText] = useState('Technician observed a gas detector alarm near compressor station C2 after a valve inspection. No injury was reported, the area was isolated, and a loose fitting is suspected.');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [severityBreakdown, setSeverityBreakdown] = useState<SeverityPoint[]>([]);
  const [recent, setRecent] = useState<Incident[]>([]);
  const [error, setError] = useState('');

  const latestProcessed = useMemo(
    () => recent.find((item) => item.status === 'PROCESSED') ?? recent[0],
    [recent],
  );

  async function refresh() {
    try {
      const [summaryData, trendData, recentData] = await Promise.all([
        getJson<Summary>('/api/dashboard/summary'),
        getJson<{ incidentsByDay: TrendPoint[]; severityBreakdown: SeverityPoint[] }>('/api/dashboard/trends?days=14'),
        getJson<Incident[]>('/api/reports/recent?limit=8'),
      ]);

      setSummary(summaryData);
      setTrends(trendData.incidentsByDay);
      setSeverityBreakdown(trendData.severityBreakdown);
      setRecent(recentData);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, []);

  async function submitReport() {
    setSubmitting(true);
    setSubmitMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportText }),
      });

      if (!response.ok) {
        throw new Error(`Submit failed: ${response.status}`);
      }

      const payload = await response.json();
      setSubmitMessage(payload.message ?? 'Report queued successfully.');
      setReportText('');
      await refresh();
    } catch (err) {
      setSubmitMessage(err instanceof Error ? err.message : 'Could not submit report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Oil & Gas · HSE Analytics</p>
          <h1>HSE-AI Insight Platform</h1>
          <p className={styles.subtitle}>
            Convert unstructured incident narratives into structured risk intelligence.
          </p>
        </div>
        <div className={styles.badge}>Local LLM · RabbitMQ · OpenSearch</div>
      </section>

      {error ? <div className={styles.errorBanner}>Dashboard refresh error: {error}</div> : null}

      <section className={styles.grid}>
        <aside className={styles.leftPanel}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Incident Intake</h2>
              <span>Async AI processing</span>
            </div>
            <textarea
              className={styles.textarea}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Paste a free-text HSE incident report..."
            />
            <p className={styles.fieldHint}>
              Write in plain language. The AI will extract entities, classify the event, and estimate severity.
            </p>
            <button
              className={styles.primaryButton}
              onClick={submitReport}
              disabled={submitting || reportText.trim().length < 20}
            >
              {submitting ? 'Analyzing...' : 'Analyze Report'}
            </button>
            {submitMessage ? <p className={styles.submitMessage}>{submitMessage}</p> : null}
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Latest AI Tags</h2>
              <span>{latestProcessed?.status ?? 'No data'}</span>
            </div>
            <div className={styles.tagCloud}>
              {(latestProcessed?.tags ?? []).map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
              {!(latestProcessed?.tags?.length) ? <span className={styles.muted}>No tags yet.</span> : null}
            </div>
            {latestProcessed ? (
              <div className={styles.analysisMeta}>
                <div><strong>Classification:</strong> {latestProcessed.classification ?? 'Pending'}</div>
                <div><strong>Severity:</strong> {latestProcessed.severity ?? 'Pending'}</div>
                <div><strong>Equipment:</strong> {latestProcessed.equipment ?? 'Pending'}</div>
                <div><strong>Location:</strong> {latestProcessed.location ?? 'Pending'}</div>
                <div><strong>Root Cause:</strong> {latestProcessed.probableRootCause ?? 'Pending'}</div>
              </div>
            ) : null}
          </div>
        </aside>

        <section className={styles.rightPanel}>
          <div className={styles.kpiGrid}>
            <KpiCard title="Total Incidents" value={summary?.totalIncidents ?? 0} />
            <KpiCard title="Processed Reports" value={summary?.processedReports ?? 0} />
            <KpiCard title="High Severity" value={summary?.highSeverityIncidents ?? 0} />
            <KpiCard title="Days Since Last Accident" value={summary?.daysSinceLastAccident ?? 0} />
          </div>

          <div className={styles.chartGrid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Incident Trend</h2>
                <span>Last 14 days</span>
              </div>
              <div className={styles.chartArea}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#9db0c6', fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#9db0c6', fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="incidents" stroke="#38bdf8" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Severity Mix</h2>
                <span>Current distribution</span>
              </div>
              <div className={styles.chartArea}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={severityBreakdown} dataKey="total" nameKey="severity" outerRadius={90} innerRadius={45} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>Recent Incidents</h2>
              <span>Live polling every 5s</span>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Classification</th>
                    <th>Severity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className={styles.incidentCell}>
                        <div className={styles.incidentExcerpt} title={item.reportText}>{item.reportText}</div>
                      </td>
                      <td>{item.classification ?? 'Pending'}</td>
                      <td>{item.severity ?? 'Pending'}</td>
                      <td>{item.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function KpiCard({ title, value }: { title: string; value: number }) {
  return (
    <div className={styles.kpiCard}>
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}
