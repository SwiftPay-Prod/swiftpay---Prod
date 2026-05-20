import type { ReactNode } from 'react';

interface PrintableBoletoDocumentProps {
	isVisible: boolean;
	lineDigitable: string | null;
	amountLabel: string | null;
	issueDateLabel: string | null;
	dueDateLabel: string | null;
	documentNumber: string | null;
	beneficiary: string | null;
	beneficiaryDocument: string | null;
	payerName: string | null;
	payerDocument: string | null;
	instructions: string[];
	barcodeText: string | null;
	barcodeDataUrl: string | null;
	logoUrl: string | null;
}

function hasText(value: string | null | undefined): value is string {
	return Boolean(value && value.trim());
}

function PrintableField({ label, children }: { label: string; children: ReactNode }) {
	return (
		<div className="print-field">
			<div className="print-label">{label}</div>
			<div className="print-value">{children}</div>
		</div>
	);
}

export function PrintableBoletoDocument({
	isVisible,
	lineDigitable,
	amountLabel,
	issueDateLabel,
	dueDateLabel,
	documentNumber,
	beneficiary,
	beneficiaryDocument,
	payerName,
	payerDocument,
	instructions,
	barcodeText,
	barcodeDataUrl,
	logoUrl,
}: PrintableBoletoDocumentProps) {
	if (!isVisible) {
		return null;
	}

	const hasLogo = hasText(logoUrl);
	const hasLineDigitable = hasText(lineDigitable);

	return (
		<>
			<div className="payment-link-print">
				<div className="print-page">
					<section className="print-boleto-box">
						<div className={`print-header-grid${hasLogo && hasLineDigitable ? '' : ' print-header-grid-single'}`}>
							<div className="print-header-cell print-logo-cell">
								{hasLogo && <img src={logoUrl} alt="Logo" className="print-safefy-logo" />}
							</div>
							{hasLineDigitable && <div className="print-header-cell print-line-digitable">{lineDigitable}</div>}
						</div>

						{hasText(dueDateLabel) && (
							<div className="print-row-grid-single">
								<PrintableField label="Vencimento">{dueDateLabel}</PrintableField>
							</div>
						)}

						{hasText(amountLabel) && (
							<div className="print-row-grid-single">
								<PrintableField label="Valor do documento">{amountLabel}</PrintableField>
							</div>
						)}

						{hasText(beneficiary) && (
							<div className="print-row-grid-single">
								<PrintableField label="Beneficiário">{beneficiary}</PrintableField>
							</div>
						)}

						{hasText(beneficiaryDocument) && (
							<div className="print-row-grid-single">
								<PrintableField label="Documento do beneficiário">{beneficiaryDocument}</PrintableField>
							</div>
						)}

						{hasText(payerName) && (
							<div className="print-row-grid-single">
								<PrintableField label="Pagador">{payerName}</PrintableField>
							</div>
						)}

						{hasText(payerDocument) && (
							<div className="print-row-grid-single">
								<PrintableField label="Documento do pagador">{payerDocument}</PrintableField>
							</div>
						)}

						{hasText(issueDateLabel) && (
							<div className="print-row-grid-single">
								<PrintableField label="Data do documento">{issueDateLabel}</PrintableField>
							</div>
						)}

						{hasText(documentNumber) && (
							<div className="print-row-grid-single">
								<PrintableField label="Número do documento">{documentNumber}</PrintableField>
							</div>
						)}

						{instructions.length > 0 && (
							<div className="print-row-grid-single">
								<PrintableField label="Instruções">
									<div className="print-instructions-list">
										{instructions.map((instruction) => (
											<div key={instruction} className="print-value-normal">
												{instruction}
											</div>
										))}
									</div>
								</PrintableField>
							</div>
						)}

						{(barcodeDataUrl || hasText(barcodeText)) && (
							<>
								<div className="print-mechanical-label">Autenticação Mecânica</div>
								<div className="print-barcode-wrapper">
									{barcodeDataUrl ? (
										<img src={barcodeDataUrl} alt="Código de barras do boleto" className="print-barcode-image" />
									) : (
										<div className="print-barcode-fallback">Código de barras indisponível</div>
									)}
								</div>
								{hasText(barcodeText) && <div className="print-barcode-text">{barcodeText}</div>}
							</>
						)}
					</section>

					{(hasText(lineDigitable) || hasText(dueDateLabel) || hasText(amountLabel)) && (
						<section className="print-boleto-box print-receipt-box">
							<div className="print-receipt-title">Recibo do pagador</div>
							{hasText(amountLabel) && (
								<div className="print-row-grid-single">
									<PrintableField label="Valor cobrado">
										<span className="print-value-normal">{amountLabel}</span>
									</PrintableField>
								</div>
							)}
							{hasText(dueDateLabel) && (
								<div className="print-row-grid-single">
									<PrintableField label="Vencimento">{dueDateLabel}</PrintableField>
								</div>
							)}
							{hasText(lineDigitable) && (
								<div className="print-row-grid-single">
									<PrintableField label="Linha digitável">
										<span className="print-value-normal">{lineDigitable}</span>
									</PrintableField>
								</div>
							)}
						</section>
					)}
				</div>
			</div>

			<style jsx global>{`
				.payment-link-print {
					display: none;
				}

				.print-page {
					max-width: 820px;
					margin: 0 auto;
					padding: 0;
					font-family: Arial, Helvetica, sans-serif;
					color: #000000;
					background: #ffffff;
				}

				.print-boleto-box {
					border: 1px solid #000000;
					width: 100%;
					background: #ffffff;
				}

				.print-receipt-box {
					margin-top: 10px;
				}

				.print-header-grid {
					display: grid;
					grid-template-columns: 180px 1fr;
					border-bottom: 1px solid #000000;
					min-height: 54px;
				}

				.print-header-grid-single {
					grid-template-columns: 1fr;
				}

				.print-header-cell {
					padding: 6px 8px;
					border-right: 1px solid #000000;
					display: flex;
					align-items: center;
					font-size: 12px;
					line-height: 1.2;
				}

				.print-header-cell:last-child {
					border-right: 0;
				}

				.print-logo-cell {
					justify-content: flex-start;
				}

				.print-safefy-logo {
					height: 50px;
					width: auto;
					object-fit: contain;
				}

				.print-line-digitable {
					justify-content: flex-end;
					font-weight: 700;
					font-size: 16px;
					letter-spacing: 0.3px;
				}

				.print-row-grid {
					display: grid;
					grid-template-columns: 1fr 210px;
					border-bottom: 1px solid #000000;
					min-height: 50px;
				}

				.print-row-grid-single {
					display: grid;
					grid-template-columns: 1fr;
					border-bottom: 1px solid #000000;
				}

				.print-row-grid:last-child,
				.print-row-grid-single:last-child {
					border-bottom: 0;
				}

				.print-field {
					border-right: 1px solid #000000;
					padding: 4px 6px 6px;
					display: flex;
					flex-direction: column;
					justify-content: flex-start;
					min-height: 50px;
				}

				.print-row-grid .print-field:last-child,
				.print-row-grid-single .print-field:last-child {
					border-right: 0;
				}

				.print-label {
					font-size: 10px;
					text-transform: uppercase;
					letter-spacing: 0.2px;
					margin-bottom: 3px;
					font-weight: 700;
				}

				.print-value {
					font-size: 14px;
					font-weight: 700;
					line-height: 1.2;
					word-break: break-word;
				}

				.print-value-normal {
					font-size: 13px;
					font-weight: 500;
					line-height: 1.3;
				}

				.print-instructions-list {
					display: grid;
					gap: 2px;
				}

				.print-mechanical-label {
					text-align: right;
					font-size: 11px;
					font-weight: 700;
					margin: 8px 0 4px;
					padding-right: 8px;
				}

				.print-barcode-wrapper {
					height: 84px;
					border-top: 1px solid #000000;
					border-bottom: 1px solid #000000;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 2px 6px;
				}

				.print-barcode-image {
					height: 78px;
					width: 100%;
					object-fit: fill;
				}

				.print-barcode-fallback {
					font-size: 12px;
					font-weight: 700;
					text-transform: uppercase;
				}

				.print-barcode-text {
					text-align: center;
					font-size: 14px;
					letter-spacing: 1px;
					padding: 6px 8px 2px;
					font-weight: 700;
				}

				.print-receipt-title {
					padding: 8px;
					border-bottom: 1px solid #000000;
					font-size: 12px;
					font-weight: 700;
					text-transform: uppercase;
					letter-spacing: 0.2px;
				}

				@media print {
					@page {
						size: A4;
						margin: 0;
					}

					html,
					body {
						margin: 0;
						padding: 0;
						color: #000000;
						font-family: Arial, Helvetica, sans-serif;
						background: #ffffff;
					}

					body[data-printing-boleto='true'] .payment-link-main {
						display: none !important;
					}

					body[data-printing-boleto='true'] .payment-link-print {
						display: block !important;
					}

					.print-page {
						margin: 0;
						padding: 0;
					}
				}
			`}</style>
		</>
	);
}
