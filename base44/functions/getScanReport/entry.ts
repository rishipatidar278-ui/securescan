import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

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

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error?.message || 'The report could not be loaded.' }, { status: 500 });
  }
}