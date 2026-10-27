import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const payload = await req.json().catch(() => ({}));
    const email = String(payload?.email || '').trim().toLowerCase();

    if (!email) return Response.json({ error: 'Enter the email address you used when you ran the scan.' }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });

    const base44 = createClientFromRequest(req);

    const reports = await base44.asServiceRole.entities.CodeScanReport.filter(
      { client_email: email },
      { sort: '-scan_date', limit: 30 }
    );

    return Response.json({ reports: reports.items || [] });
  } catch (error) {
    return Response.json({ error: error?.message || 'Your code reports could not be loaded.' }, { status: 500 });
  }
}