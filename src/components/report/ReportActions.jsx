import { Download, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { generateReportPdf } from "@/lib/pdfReport";

export default function ReportActions({ report }) {
  const [emailing, setEmailing] = useState(false);
  const [note, setNote] = useState(null);

  const sendEmail = async () => {
    if (emailing || !report) return;
    setEmailing(true);
    setNote(null);

    try {
      const response = await base44.functions.invoke("emailReport", { id: report.id });
      const data = response?.data || {};
      if (data.error) throw new Error(data.error);
      setNote({ tone: "signal", text: `Report sent to ${report.client_email}.` });
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || "The email could not be sent.";
      setNote({ tone: "danger", text: message });
    } finally {
      setEmailing(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={sendEmail} disabled={emailing} className="rounded-xl">
          {emailing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          Email me this report
        </Button>
        <Button variant="outline" onClick={() => generateReportPdf(report)} className="rounded-xl">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>
      {note && (
        <p className={`text-xs ${note.tone === "signal" ? "text-signal" : "text-danger"}`}>{note.text}</p>
      )}
    </div>
  );
}