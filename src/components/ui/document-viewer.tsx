'use client';

import { useState } from 'react';
import { Button, Card, Modal, Spinner } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { ArrowExpand01Icon, ArrowUpRight01Icon, File01Icon } from '@hugeicons/core-free-icons';
import type { FileData } from '@/types/merchant/crud';
import Image from 'next/image';

interface DocumentViewerProps {
	file: FileData | null;
	title: string;
	description?: string;
	className?: string;
}

function isPdf(contentType: string): boolean {
	return contentType.toLowerCase().includes('pdf');
}

function isImage(contentType: string): boolean {
	return contentType.toLowerCase().startsWith('image/');
}

export function DocumentViewer({ file, title, description, className = '' }: DocumentViewerProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	if (!file) {
		return (
			<Card className={`p-4 ${className}`}>
				<div className="flex flex-col gap-2">
					<span className="text-sm font-medium text-foreground">{title}</span>
					{description && <span className="text-xs text-muted">{description}</span>}
					<div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-muted bg-surface">
						<span className="text-sm text-muted">Documento não enviado</span>
					</div>
				</div>
			</Card>
		);
	}

	const isPdfFile = isPdf(file.contentType);
	const isImageFile = isImage(file.contentType);

	const handleOpenNewTab = () => {
		window.open(file.url, '_blank', 'noopener,noreferrer');
	};

	return (
		<>
			<Card className={`p-4 ${className}`}>
				<div className="flex flex-col gap-2">
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-medium text-foreground">{title}</span>
							{description && <span className="text-xs text-muted">{description}</span>}
						</div>
						<div className="flex gap-1">
							<Button
								size="sm"
								variant="secondary"
								isIconOnly
								onPress={() => setIsModalOpen(true)}
								aria-label="Ampliar documento"
							>
								<Icon icon={ArrowExpand01Icon} className="icon-sm" />
							</Button>
							<Button
								size="sm"
								variant="secondary"
								isIconOnly
								onPress={handleOpenNewTab}
								aria-label="Abrir em nova aba"
							>
								<Icon icon={ArrowUpRight01Icon} className="icon-sm" />
							</Button>
						</div>
					</div>

					<div className="relative h-48 overflow-hidden rounded-lg border border-default bg-surface">
						{isImageFile && (
							<>
								{isLoading && (
									<div className="absolute inset-0 flex items-center justify-center">
										<Spinner size="md" />
									</div>
								)}
								<Image
									src={file.url}
									alt={title}
									fill
									sizes="(max-width: 768px) 100vw, 400px"
									className={`cursor-pointer object-cover transition-opacity ${
										isLoading ? 'opacity-0' : 'opacity-100'
									}`}
									onLoad={() => setIsLoading(false)}
									onClick={() => setIsModalOpen(true)}
								/>
							</>
						)}
						{isPdfFile && (
							<button
								type="button"
								className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 bg-surface transition-colors hover:bg-card"
								onClick={() => setIsModalOpen(true)}
							>
								<Icon icon={File01Icon} className="size-12 text-muted" />
								<span className="text-sm text-muted">{file.originalFileName}</span>
								<span className="text-xs text-muted">Clique para visualizar</span>
							</button>
						)}
						{!isImageFile && !isPdfFile && (
							<button
								type="button"
								className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 bg-surface"
								onClick={handleOpenNewTab}
							>
								<Icon icon={File01Icon} className="size-12 text-muted" />
								<span className="text-sm text-muted">{file.originalFileName}</span>
								<span className="text-xs text-muted">Formato não suportado para preview</span>
							</button>
						)}
					</div>

					<div className="flex items-center justify-between text-xs text-muted">
						<span>{file.originalFileName}</span>
						<span>{formatFileSize(file.size)}</span>
					</div>
				</div>
			</Card>

			<Modal.Backdrop isOpen={isModalOpen} onOpenChange={setIsModalOpen} isDismissable>
				<Modal.Container size="cover" placement="center">
					<Modal.Dialog>
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>{title}</Modal.Heading>
						</Modal.Header>
						<Modal.Body className="p-0">
							<div className="relative min-h-96 bg-black/5">
								{isImageFile && (
									<div className="relative h-[70vh] w-full">
										<Image src={file.url} alt={title} fill sizes="100vw" className="object-contain" />
									</div>
								)}
								{isPdfFile && <iframe src={file.url} className="h-[70vh] w-full" title={title} />}
								{!isImageFile && !isPdfFile && (
									<div className="flex h-96 flex-col items-center justify-center gap-4">
										<Icon icon={File01Icon} className="size-16 text-muted" />
										<span className="text-muted">Formato não suportado para preview</span>
										<Button variant="secondary" onPress={handleOpenNewTab}>
											<Icon icon={ArrowUpRight01Icon} className="icon-sm" />
											Abrir em nova aba
										</Button>
									</div>
								)}
							</div>
						</Modal.Body>
						<Modal.Footer>
							<Button variant="secondary" onPress={handleOpenNewTab}>
								<Icon icon={ArrowUpRight01Icon} className="icon-sm" />
								Abrir em nova aba
							</Button>
							<Button onPress={() => setIsModalOpen(false)}>Fechar</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</>
	);
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const k = 1024;
	const sizes = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

