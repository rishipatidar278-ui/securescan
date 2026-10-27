import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

function gradeOf(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function (req) {
  try {
    const payload = await req.json();
    const id = String(payload?.id || '').trim();

    if (!id) return Response.json({ error: 'Missing report id.' }, { status: 400 });

    const base44 = createClientFromRequest(req);

    let report = null;
    try {
      report = await base44.asServiceRole.entities.ScanReport.get(id);
    } catch {
      report = null;
    }
    if (!report) return Response.json({ error: 'Report not found.' }, { status: 404 });

    const to = String(report.client_email || '').trim();
    if (!to) return Response.json({ error: 'This report has no email address to send to.' }, { status: 400 });

    const findings = Array.isArray(report.findings) ? report.findings : [];
    const counts = { high: 0, medium: 0, low: 0 };
    for (const finding of findings) {
      if (counts[finding.severity] !== undefined) counts[finding.severity] += 1;
    }
    const score = Math.max(0, Math.min(100, Math.round(report.score || 0)));
    const grade = gradeOf(score);

    const appUrl = String(req.headers.get('x-base44-app-url') || '').replace(/\/+$/, '');
    const reportLink = appUrl ? `${appUrl}/report/${id}` : '';
    const scanDate = report.scan_date ? new Date(report.scan_date).toUTCString() : '';

    const topFindings = findings
      .slice(0, 5)
      .map(
        (finding) =>
          `<li style="margin:6px 0;"><span style="color:${finding.severity === 'high' ? '#f87171' : finding.severity === 'medium' ? '#fbbf24' : '#94a3b8'};font-weight:bold;">${escapeHtml(String(finding.severity || '').toUpperCase())}</span> <span style="color:#e2e8f0;">${escapeHtml(finding.title)}</span></li>`
      )
      .join('');

    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;background:#0b1220;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:28px;color:#e2e8f0;">
    <p style="margin:0;font-size:18px;font-weight:bold;color:#34d399;">SecureScan</p>
    <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Website security report</p>
    <hr style="border:none;border-top:1px solid #1e293b;margin:20px 0;" />
    <p style="margin:0;font-size:13px;color:#94a3b8;">Scanned site</p>
    <p style="margin:2px 0 0;font-size:15px;color:#e2e8f0;word-break:break-all;">${escapeHtml(report.url)}</p>
    <p style="margin:14px 0 0;font-size:13px;color:#94a3b8;">Scan date</p>
    <p style="margin:2px 0 0;font-size:15px;color:#e2e8f0;">${escapeHtml(scanDate)}</p>
    <div style="margin:22px 0;padding:18px;background:#0b1220;border-radius:10px;text-align:center;">
      <p style="margin:0;font-size:34px;font-weight:bold;color:#e2e8f0;">${score}<span style="font-size:14px;color:#94a3b8;"> / 100</span></p>
      <p style="margin:4px 0 0;font-size:14px;font-weight:bold;color:#34d399;">Grade ${grade}</p>
    </div>
    <p style="margin:0;font-size:14px;color:#e2e8f0;">${findings.length} issues found: ${counts.high} high, ${counts.medium} medium, ${counts.low} low.</p>
    ${topFindings ? `<ul style="margin:14px 0 0;padding-left:18px;font-size:13px;">${topFindings}</ul>` : ''}
    ${reportLink ? `<p style="margin:24px 0 0;"><a href="${reportLink}" style="display:inline-block;background:#10b981;color:#06281f;padding:10px 20px;border-radius:8px;font-size:14px;font-weight:bold;text-decoration:none;">View full report</a></p>` : ''}
    <p style="margin:22px 0 0;font-size:11px;color:#64748b;">You are receiving this because a SecureScan report was requested with this email address.</p>
  </div>
</div>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to,
      from_name: 'SecureScan',
      subject: `SecureScan report — ${report.url} (score ${score}, grade ${grade})`,
      html,
    });

    return Response.json({ ok: true, sent_to: to });
  } catch (error) {
    return Response.json({ error: error?.message || 'The email could not be sent.' }, { status: 500 });
  }
}