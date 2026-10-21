export interface PdfReportOptions {
  startDate?: string;
  endDate?: string;
}

/**
 * Membuka halaman laporan resmi TimeCraft di tab / jendela baru
 * menggunakan rute URL '/report' asli (bukan 'about:blank').
 */
export function openPdfReportWindow(opts: PdfReportOptions = {}): void {
  const params = new URLSearchParams();
  if (opts.startDate) params.set('start', opts.startDate);
  if (opts.endDate) params.set('end', opts.endDate);

  const queryString = params.toString();
  const targetUrl = queryString ? `/report?${queryString}` : '/report';

  const w = window.open(targetUrl, '_blank', 'width=1000,height=920');
  if (!w) {
    // Jika popup diblokir oleh browser, alihkan di tab saat ini
    window.location.href = targetUrl;
  }
}
