export interface QuoteReportConfig {
  totalsPosition: 'top' | 'bottom';
  showBank: boolean;
  showNotes: boolean;
  showConditions: boolean;
  brandColor: string; // hex or css color
  vigenciaDias: number;
}

export const defaultReportConfig: QuoteReportConfig = {
  totalsPosition: 'bottom',
  showBank: true,
  showNotes: true,
  showConditions: true,
  brandColor: '#364FC7',
  vigenciaDias: 15,
};

// Futuras extensiones: order de columnas, formato moneda, logoPosition, etc.
