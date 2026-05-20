export interface BoletoData {
  paymentId: string;
  merchantName: string;
  amount: number;
  description: string | null;
  status: string;
  barcode: string | null;
  digitableLine: string | null;
  pdfUrl: string | null;
  boletoUrl: string | null;
  dueDate: string | null;
  isExpired: boolean;
  createdAt: string;
}

