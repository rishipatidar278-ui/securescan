import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Deletes the signed-in user's own scan data. The email always comes from the
// authenticated session, never from the request body, so one account can only
// ever remove its own records.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) {
      return Response.json({ error: 'You need to be signed in to delete your account data.' }, { status: 401 });
    }

    const email = String(user.email || '').trim().toLowerCase();
    if (!email) {
      return Response.json({ error: 'Your account has no email address to match records against.' }, { status: 400 });
    }

    const scope = base44.asServiceRole.entities;

    const clients = await scope.Client.deleteMany({ email });
    const siteReports = await scope.ScanReport.deleteMany({ client_email: email });
    const codeReports = await scope.CodeScanReport.deleteMany({ client_email: email });

    return Response.json({
      ok: true,
      email,
      deleted: {
        clients: clients?.deleted ?? clients?.deleted_count ?? null,
        scan_reports: siteReports?.deleted ?? siteReports?.deleted_count ?? null,
        code_reports: codeReports?.deleted ?? codeReports?.deleted_count ?? null,
      },
    });
  } catch (error) {
    return Response.json({ error: error?.message || 'Your account data could not be deleted.' }, { status: 500 });
  }
}