import React from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { ReportDocument } from './ReportDocument';
import { ReportData } from './types';

/** Render a report to a PDF Buffer (used by the BullMQ report worker). */
export async function renderReportPdf(data: ReportData): Promise<Buffer> {
  // ReportDocument renders a <Document> at its root; cast to satisfy the
  // renderer's element typing (it expects a top-level Document element).
  const element = React.createElement(ReportDocument, { data }) as React.ReactElement<DocumentProps>;
  return renderToBuffer(element);
}
