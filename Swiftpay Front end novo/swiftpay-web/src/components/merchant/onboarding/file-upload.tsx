'use client';

import { useState, useRef, useCallback, useEffect, useTransition } from 'react';
import { Button, AlertDialog, FieldError, Modal, Spinner } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { toast } from '@heroui/react';
import { uploadMerchantFile } from '@/app/actions/merchant/upload';
import { uploadAdminFile } from '@/app/actions/admin/upload';
import { deleteMerchantFile } from '@/app/actions/merchant/delete-file';
import { deleteFile } from '@/app/actions/files';
import {
	CheckmarkCircle02Icon,
	Delete02Icon,
	UploadCircle01Icon,
	ViewIcon,
	ArrowExpand01Icon,
	File01Icon,
	Alert01Icon,
	CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import type { FileData } from '@/types/merchant/crud';
import type { UploadFolder } from '@/types/enums';
import { TimeRemaining } from '@/components/ui/time-remaining';
import Image from 'next/image';

interface FileUploadProps {
	merchantId?: string;
	isAdmin?: boolean;
	folder: UploadFolder;
	label: string;
	required?: boolean;
	description?: string;
	accept?: string;
	currentFile?: FileData | null;
	showInlinePreview?: boolean;
	error?: string | null;
	onUploadComplete: (fileId: string, fileData: FileData) => void;
	onRemove?: () => void;
}

export function FileUpload({
	merchantId,
	isAdmin = false,
	folder,
	label,
	required = false,
	description,
	accept = '.pdf,.jpg,.jpeg,.png,.webp',
	currentFile,
	showInlinePreview = false,
	error = null,
	onUploadComplete,
	onRemove,
}: FileUploadProps) {
	const [isUploading, setIsUploading] = useState(false);
	const [fileInfo, setFileInfo] = useState<FileData | null>(currentFile ?? null);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
	const [isPreviewLoading, setIsPreviewLoading] = useState(true);
	const [isDeleting, startDeleteTransition] = useTransition();
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setFileInfo(currentFile ?? null);
	}, [currentFile]);

	const handleFileSelect = useCallback(
		async (event: React.ChangeEvent<HTMLInputElement>) => {
			const file = event.target.files?.[0];
			if (!file) return;

			const maxSize = 10 * 1024 * 1024;
			if (file.size > maxSize) {
				toast('Arquivo muito grande', {
					description: 'O arquivo deve ter no máximo 10MB.',
					indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
					variant: 'warning',
				});
				return;
			}

			setIsUploading(true);

			try {
				if (!isAdmin && !merchantId) {
					toast('Erro no upload', {
						description: 'Não foi possível identificar a organização para upload.',
						indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
						variant: 'danger',
					});
					return;
				}

				const response = isAdmin
					? await uploadAdminFile(file, folder, false)
					: await uploadMerchantFile(merchantId!, file, folder);

				if (response.error) {
					toast('Erro no upload', {
						description: response.error.message ?? 'Tente novamente.',
						indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
						variant: 'danger',
					});
					return;
				}

				if (response?.data) {
					setFileInfo(response?.data);
					onUploadComplete(response?.data.id, response?.data);
					toast('Arquivo enviado', {
						description: 'O arquivo foi enviado com sucesso.',
						indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
						variant: 'success',
					});
				}
			} catch {
				toast('Erro no upload', {
					description: 'Ocorreu um erro ao enviar o arquivo.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			} finally {
				setIsUploading(false);
				if (inputRef.current) {
					inputRef.current.value = '';
				}
			}
		},
		[isAdmin, merchantId, folder, onUploadComplete]
	);

	function handleDeleteClick() {
		setIsDeleteDialogOpen(true);
	}

	function handleConfirmDelete() {
		if (!fileInfo?.id) return;

		startDeleteTransition(async () => {
			const response = isAdmin
				? await deleteFile(fileInfo.id)
				: await deleteMerchantFile(fileInfo.id);

			if (response.error) {
				toast('Erro ao deletar', {
					description: response.error.message ?? 'Tente novamente.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			setFileInfo(null);
			onRemove?.();
			setIsDeleteDialogOpen(false);
			toast('Arquivo removido', {
				description: 'O arquivo foi removido com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
		});
	}

	function handleViewFile() {
		if (fileInfo?.url) {
			window.open(fileInfo.url, '_blank');
		}
	}

	const hasFile = !!fileInfo;
	const isImageFile = isImageFileType(fileInfo?.contentType);
	const isPdfFile = isPdfFileType(fileInfo?.contentType);

	return (
		<div className="flex flex-col gap-2">
			<label className="text-small font-medium text-foreground">
				{label}
				{required && <span className="ml-1 text-danger">*</span>}
			</label>
			{description && <p className="text-tiny text-default-500">{description}</p>}

			<input
				ref={inputRef}
				type="file"
				accept={accept}
				onChange={handleFileSelect}
				className="hidden"
				disabled={isUploading}
			/>

			<div className={showInlinePreview && hasFile ? 'min-h-72' : 'h-24'}>
				{hasFile ? (
					<div className={`flex h-full flex-col gap-3 rounded-xl border p-3 ${error ? 'border-danger bg-danger-soft/30' : 'border-accent-soft bg-accent-soft'}`}>
						<div className="flex items-center gap-3">
							<Icon icon={CheckmarkCircle02Icon} className="size-5 shrink-0 text-accent" />
							<div className="min-w-0 flex-1">
								<p className="truncate text-small font-medium text-foreground">{fileInfo.originalFileName}</p>
								<div className="flex items-center gap-2 text-tiny text-default-500">
									<span>{(fileInfo.size / 1024).toFixed(1)} KB</span>
									<TimeRemaining
										expiresAt={fileInfo.expiresAt}
										tooltip="Tempo restante para visualizar o arquivo"
									/>
								</div>
							</div>
							<div className="flex shrink-0 items-center gap-1">
								{showInlinePreview && (
									<Button
										isIconOnly
										size="sm"
										variant="tertiary"
										onPress={() => setIsPreviewModalOpen(true)}
										aria-label="Ampliar preview"
									>
										<Icon icon={ArrowExpand01Icon} className="size-4" />
									</Button>
								)}
								<Button isIconOnly size="sm" variant="tertiary" onPress={handleViewFile}>
									<Icon icon={ViewIcon} className="size-4" />
								</Button>
								<Button isIconOnly size="sm" variant="danger-soft" onPress={handleDeleteClick}>
									<Icon icon={Delete02Icon} className="size-4" />
								</Button>
							</div>
						</div>

						{showInlinePreview && (
							<div className="relative min-h-44 overflow-hidden rounded-lg border border-default bg-surface">
								{isImageFile && (
									<>
										{isPreviewLoading && (
											<div className="absolute inset-0 flex items-center justify-center">
												<Spinner size="sm" />
											</div>
										)}
										<Image
											src={fileInfo.url}
											alt={fileInfo.originalFileName}
											fill
											sizes="(max-width: 768px) 100vw, 500px"
											className={`cursor-pointer object-contain transition-opacity ${isPreviewLoading ? 'opacity-0' : 'opacity-100'}`}
											onLoad={() => setIsPreviewLoading(false)}
											onClick={() => setIsPreviewModalOpen(true)}
										/>
									</>
								)}
								{isPdfFile && (
									<iframe
										src={fileInfo.url}
										title={fileInfo.originalFileName}
										className="h-56 w-full bg-white"
									/>
								)}
								{!isImageFile && !isPdfFile && (
									<div className="flex h-56 flex-col items-center justify-center gap-2">
										<Icon icon={File01Icon} className="size-10 text-muted" />
										<span className="text-xs text-muted">Formato sem preview inline</span>
									</div>
								)}
							</div>
						)}
					</div>
				) : (
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						disabled={isUploading}
						className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-danger bg-danger-soft/20 hover:border-danger hover:bg-danger-soft/30' : 'border-accent-soft hover:border-accent hover:bg-accent-soft'} cursor-pointer`}
					>
						{isUploading ? (
							<>
								<Spinner size="sm" />
								<span className="text-small text-default-500">Enviando...</span>
							</>
						) : (
							<>
								<Icon icon={UploadCircle01Icon} className="size-6 text-accent" />
								<span className="text-small text-accent">Clique para selecionar</span>
								<span className="text-tiny text-default-400">PDF, JPG, JPEG, PNG ou WEBP até 10MB</span>
							</>
						)}
					</button>
				)}
			</div>

			{error && <FieldError>{error}</FieldError>}

			<AlertDialog.Backdrop isOpen={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialog.Container>
					<AlertDialog.Dialog className="sm:max-w-100">
						<AlertDialog.CloseTrigger />
						<AlertDialog.Header>
							<AlertDialog.Icon status="danger" />
							<AlertDialog.Heading>Remover arquivo?</AlertDialog.Heading>
						</AlertDialog.Header>
						<AlertDialog.Body>
							<p>
								Tem certeza que deseja remover o arquivo <strong>{fileInfo?.originalFileName}</strong>?
								Esta ação não pode ser desfeita.
							</p>
						</AlertDialog.Body>
						<AlertDialog.Footer>
							<Button slot="close" variant="tertiary" isDisabled={isDeleting}>
								Cancelar
							</Button>
							<AsyncButton variant="danger" isPending={isDeleting} onPress={handleConfirmDelete}>
								Remover
							</AsyncButton>
						</AlertDialog.Footer>
					</AlertDialog.Dialog>
				</AlertDialog.Container>
			</AlertDialog.Backdrop>

			{hasFile && showInlinePreview && (
				<Modal.Backdrop isOpen={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen} isDismissable>
					<Modal.Container size="cover" placement="center">
						<Modal.Dialog>
							<Modal.CloseTrigger />
							<Modal.Header>
								<Modal.Heading>{fileInfo.originalFileName}</Modal.Heading>
							</Modal.Header>
							<Modal.Body className="p-0">
								<div className="relative min-h-96 bg-black/5">
									{isImageFile && (
										<div className="relative h-[70vh] w-full">
											<Image
												src={fileInfo.url}
												alt={fileInfo.originalFileName}
												fill
												sizes="100vw"
												className="object-contain"
											/>
										</div>
									)}
									{isPdfFile && (
										<iframe
											src={fileInfo.url}
											title={fileInfo.originalFileName}
											className="h-[70vh] w-full"
										/>
									)}
									{!isImageFile && !isPdfFile && (
										<div className="flex h-96 flex-col items-center justify-center gap-4">
											<Icon icon={File01Icon} className="size-16 text-muted" />
											<span className="text-muted">Formato sem preview em tela cheia</span>
										</div>
									)}
								</div>
							</Modal.Body>
							<Modal.Footer>
								<Button variant="secondary" onPress={handleViewFile}>
									<Icon icon={ViewIcon} className="icon-sm" />
									Abrir em nova aba
								</Button>
								<Button onPress={() => setIsPreviewModalOpen(false)}>Fechar</Button>
							</Modal.Footer>
						</Modal.Dialog>
					</Modal.Container>
				</Modal.Backdrop>
			)}
		</div>
	);
}

function isPdfFileType(contentType?: string): boolean {
	return contentType?.toLowerCase().includes('pdf') ?? false;
}

function isImageFileType(contentType?: string): boolean {
	return contentType?.toLowerCase().startsWith('image/') ?? false;
}

