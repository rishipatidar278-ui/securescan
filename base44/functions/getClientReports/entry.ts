import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const payload = await req.json();
    const email = String(payload?.email || '').trim().toLowerCase();

    if (!email) return Response.json({ error: 'Enter the email address you used when you ran the scan.' }, { status: 400 });
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });

    const base44 = createClientFromRequest(req);

    const clients = await base44.asServiceRole.entities.Client.filter({ email }, { limit: 5 });
    const clientIds = (clients.items || []).map((client) => client.id);
    if (!clientIds.length) return Response.json({ reports: [], clients: [] });

    const reports = await base44.asServiceRole.entities.ScanReport.filter(
      { client_id: { $in: clientIds } },
      { sort: '-scan_date', limit: 30 }
    );

    return Response.json({
      reports: reports.items || [],
      clients: (clients.items || []).map((client) => ({
        name: client.name,
        site_url: client.site_url,
        verification_status: client.verification_status,
      })),
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Your reports could not be loaded.' }, { status: 500 });
  }
}