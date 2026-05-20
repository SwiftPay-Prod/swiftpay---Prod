'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button, FieldError, Spinner, Modal } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Delete02Icon, UploadCircle01Icon, ViewIcon, Alert01Icon, CancelCircleIcon, CheckmarkCircle02Icon, File01Icon } from '@hugeicons/core-free-icons';
import { uploadMerchantFile } from '@/app/actions/merchant/upload';
import { uploadAdminFile } from '@/app/actions/admin/upload';
import { deleteMerchantFile } from '@/app/actions/merchant/delete-file';
import { deleteFile } from '@/app/actions/files';
import { toast } from '@heroui/react';
import Image from 'next/image';
import type { UploadFolder } from '@/types/enums';
import type { FileData } from '@/types/merchant/crud';

interface BaseImageUploaderProps {
	folder: UploadFolder;
	label: string;
	labelContent?: ReactNode;
	description?: string;
	maxFiles: number;
	value: string[];
	onChange: (value: string[]) => void;
	fileValue?: FileData[];
	onFileValueChange?: (value: FileData[]) => void;
	isDisabled?: boolean;
	isPublic?: boolean;
	onlyView?: boolean;
	itemWidth?: string;
	itemHeight?: string;
	objectFit?: 'cover' | 'contain';
	compact?: boolean;
	orientation?: 'row' | 'col';
	accept?: string;
	required?: boolean;
	error?: string | null;
	sensitivePreview?: boolean;
}

interface MerchantImageUploaderProps extends BaseImageUploaderProps {
	isAdmin?: false;
	merchantId: string;
}

interface AdminImageUploaderProps extends BaseImageUploaderProps {
	isAdmin: true;
	merchantId?: never;
}

type ImageUploaderProps = MerchantImageUploaderProps | AdminImageUploaderProps;

export function ImageUploader({
	merchantId,
	folder,
	label,
	labelContent,
	description,
	maxFiles,
	value,
	onChange,
	isDisabled,
	isPublic = true,
	onlyView = false,
	isAdmin = false,
	itemWidth,
	itemHeight = 'h-24',
	objectFit = 'cover',
	compact,
	orientation = 'row',
	accept = '.jpg,.jpeg,.png,.webp',
	required = false,
	error = null,
	sensitivePreview = false,
	fileValue,
	onFileValueChange,
}: ImageUploaderProps) {
	const isCompact = compact ?? (itemHeight === 'h-16' || itemHeight === 'h-12' || itemHeight === 'h-10' || itemHeight === 'h-8');
	const inputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);
	const [previewItem, setPreviewItem] = useState<{ url: string; contentType?: string; name: string } | null>(null);
	const [isSensitiveVisible, setIsSensitiveVisible] = useState(false);
	const [uploadedUrls, setUploadedUrls] = useState<string[]>(value);
	const [uploadedFiles, setUploadedFiles] = useState<FileData[]>(fileValue ?? []);
	const isFileMode = typeof onFileValueChange === 'function';

	useEffect(() => {
		setUploadedUrls(value);
	}, [value]);

	useEffect(() => {
		setUploadedFiles(fileValue ?? []);
	}, [fileValue]);

	const acceptedFilesLabel = accept
		.split(',')
		.map((item) => item.trim().replace('.', '').toUpperCase())
		.filter(Boolean)
		.join(', ');

	const items = isFileMode
		? uploadedFiles.map((file) => ({ key: file.id, url: file.url, file }))
		: uploadedUrls.map((url) => ({ key: url, url, file: null }));

	async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
		const files = Array.from(event.target.files ?? []);
		if (files.length === 0) return;

		const remainingSlots = maxFiles - items.length;
		if (remainingSlots <= 0) {
			toast('Limite atingido', {
				description: `Você pode enviar no máximo ${maxFiles} imagem${maxFiles > 1 ? 's' : ''}.`,
				indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
				variant: 'warning',
			});
			if (inputRef.current) inputRef.current.value = '';
			return;
		}

		const filesToUpload = files.slice(0, remainingSlots);
		if (files.length > remainingSlots) {
			toast('Algumas imagens foram ignoradas', {
				description: `Você pode enviar no máximo ${maxFiles} imagem${maxFiles > 1 ? 's' : ''}.`,
				indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
				variant: 'warning',
			});
		}

		setIsUploading(true);

		const newUrls: string[] = [];
		for (const file of filesToUpload) {
			const maxSize = 10 * 1024 * 1024;
			if (file.size > maxSize) {
				toast('Arquivo muito grande', {
					description: 'A imagem deve ter no máximo 10MB.',
					indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
					variant: 'warning',
				});
				continue;
			}

			const response = isAdmin
				? await uploadAdminFile(file, folder, isPublic)
				: await uploadMerchantFile(merchantId!, file, folder, isPublic);
			if (response?.error) {
				toast('Erro no upload', {
					description: response.error.message ?? 'Tente novamente.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				continue;
			}

			if (response?.data?.url) {
				if (isFileMode) {
					const nextFiles = [...uploadedFiles, response.data];
					setUploadedFiles(nextFiles);
					onFileValueChange?.(nextFiles);
				} else {
					newUrls.push(response.data.url);
				}
			}
		}

		if (!isFileMode && newUrls.length > 0) {
			const nextUrls = [...uploadedUrls, ...newUrls];
			setUploadedUrls(nextUrls);
			onChange(nextUrls);
			toast('Imagem enviada', {
				description:
					newUrls.length > 1 ? 'As imagens foram enviadas com sucesso.' : 'A imagem foi enviada com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
		} else if (isFileMode && filesToUpload.length > 0) {
			toast('Arquivo enviado', {
				description: filesToUpload.length > 1 ? 'Os arquivos foram enviados com sucesso.' : 'O arquivo foi enviado com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
		}

		setIsUploading(false);

		if (inputRef.current) {
			inputRef.current.value = '';
		}
	}

	async function handleRemove(itemKey: string) {
		if (isFileMode) {
			const selectedFile = uploadedFiles.find((file) => file.id === itemKey);
			if (!selectedFile) return;

			setIsRemoving(true);
			const response = isAdmin ? await deleteFile(selectedFile.id) : await deleteMerchantFile(selectedFile.id);
			setIsRemoving(false);

			if (response.error) {
				toast('Erro ao remover', {
					description: response.error.message ?? 'Tente novamente.',
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
				return;
			}

			const nextFiles = uploadedFiles.filter((file) => file.id !== itemKey);
			setUploadedFiles(nextFiles);
			onFileValueChange?.(nextFiles);
			return;
		}

		const nextUrls = uploadedUrls.filter((item) => item !== itemKey);
		setUploadedUrls(nextUrls);
		onChange(nextUrls);
	}

	function handleView(item: { url: string; file: FileData | null }) {
		setIsSensitiveVisible(false);
		setPreviewItem({
			url: item.url,
			contentType: item.file?.contentType,
			name: item.file?.originalFileName ?? label,
		});
	}

	const isInteractionDisabled = isUploading || isRemoving || isDisabled;
	const canAddMore = items.length < maxFiles;
	const isReadOnly = onlyView;

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-col gap-1">
				<label className="text-small font-medium text-foreground">
					{labelContent ?? label}
					{required && <span className="ml-1 text-danger">*</span>}
				</label>
				{description && <p className="text-tiny text-default-500">{description}</p>}
			</div>

			<input
				ref={inputRef}
				type="file"
				accept={accept}
				multiple={maxFiles > 1}
				onChange={handleFileSelect}
				className="hidden"
				disabled={isInteractionDisabled || isReadOnly}
			/>

			<div className={`flex gap-3 ${orientation === 'col' ? 'flex-col' : 'flex-row flex-wrap'}`}>
				{items.map((item) => (
				<div key={item.key} className={`relative ${itemWidth ?? 'w-full'} ${isInteractionDisabled ? 'opacity-60 pointer-events-none' : ''}`}>
						<button
							type="button"
							onClick={() => handleView(item)}
							disabled={isInteractionDisabled}
							className={`group relative flex ${itemHeight} w-full items-center justify-center overflow-hidden rounded-medium border ${error ? 'border-danger bg-danger-soft/20' : 'border-default bg-surface'} cursor-pointer`}
						>
							{isImageFileType(item.file?.contentType) || !item.file ? (
								<Image
									src={item.url}
									alt={label}
									className={`h-full w-full ${objectFit === 'contain' ? 'object-contain' : 'object-cover'} ${sensitivePreview && !isSensitiveVisible ? 'blur-md' : ''}`}
									fill
								/>
							) : isPdfFileType(item.file?.contentType) ? (
								<iframe
									src={item.url}
									title={item.file?.originalFileName ?? label}
									className={`h-full w-full bg-white ${sensitivePreview && !isSensitiveVisible ? 'blur-md' : ''}`}
								/>
							) : (
								<div className="flex flex-col items-center justify-center gap-1 text-muted">
									<Icon icon={File01Icon} className={isCompact ? 'icon-xs' : 'icon-sm'} />
									{!isCompact && <span className="text-tiny">Sem preview</span>}
								</div>
							)}
							<div
								className={[
									'absolute inset-0 flex flex-col items-center justify-center bg-background/70 transition-opacity',
									sensitivePreview ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
								].join(' ')}
							>
								<Icon icon={ViewIcon} className={isCompact ? 'icon-xs' : 'icon-sm'} />
								{!isCompact && (
									<span className="text-tiny">{sensitivePreview ? 'Clique para visualizar' : 'Visualizar'}</span>
								)}
							</div>
						</button>
						{!isReadOnly && (
							<Button
								isIconOnly
								size="sm"
								variant="danger"
								className="absolute -top-2 -right-2"
								onPress={() => void handleRemove(item.key)}
								isDisabled={isInteractionDisabled}
							>
								<Icon icon={Delete02Icon} className="icon-xs" />
							</Button>
						)}
					</div>
				))}

				{canAddMore && !isReadOnly && (
					<button
						type="button"
						onClick={() => inputRef.current?.click()}
						disabled={isInteractionDisabled}
						className={`flex ${itemHeight} ${itemWidth ?? 'w-full'} flex-col items-center justify-center ${isCompact ? '' : 'gap-1'} rounded-medium border-2 border-dashed ${error ? 'border-danger bg-danger-soft/10' : 'border-default'} text-muted transition-colors hover:border-accent hover:text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-default disabled:hover:text-muted`}
					>
						{isUploading ? <Spinner size="sm" /> : <Icon icon={UploadCircle01Icon} className={isCompact ? 'icon-xs' : 'icon-sm'} />}
						{!isCompact && <span className="text-tiny">Adicionar</span>}
					</button>
				)}
			</div>

			{error && <FieldError>{error}</FieldError>}
			<p className="text-tiny text-default-400">
				Formatos aceitos: {acceptedFilesLabel || 'JPG, JPEG, PNG, WEBP'}
			</p>

			<Modal.Backdrop
				isOpen={!!previewItem}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewItem(null);
						setIsSensitiveVisible(false);
					}
				}}
			>
				<Modal.Container size="lg" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-4xl">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>Visualizar arquivo</Modal.Heading>
							{sensitivePreview && (
								<Button
									size="sm"
									variant="secondary"
									onPress={() => setIsSensitiveVisible((prev) => !prev)}
								>
									{isSensitiveVisible ? 'Ocultar imagem' : 'Visualizar imagem'}
								</Button>
							)}
						</Modal.Header>
						<Modal.Body>
							{previewItem && (
								<div className="relative min-h-96 overflow-hidden rounded-lg bg-content2">
									{isImageFileType(previewItem.contentType) || !previewItem.contentType ? (
										<div className="relative h-[70vh] w-full">
											<Image
												src={previewItem.url}
												alt={previewItem.name}
												className={`object-contain ${sensitivePreview && !isSensitiveVisible ? 'blur-md' : ''}`}
												fill
											/>
										</div>
									) : isPdfFileType(previewItem.contentType) ? (
										<iframe
											src={previewItem.url}
											title={previewItem.name}
											className={`h-[70vh] w-full bg-white ${sensitivePreview && !isSensitiveVisible ? 'blur-md' : ''}`}
										/>
									) : (
										<div className="flex h-96 flex-col items-center justify-center gap-2 text-muted">
											<Icon icon={File01Icon} className="size-10" />
											<span className="text-sm">Formato sem preview</span>
										</div>
									)}
								</div>
							)}
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}

function isPdfFileType(contentType?: string): boolean {
	return contentType?.toLowerCase().includes('pdf') ?? false;
}

function isImageFileType(contentType?: string): boolean {
	return contentType?.toLowerCase().startsWith('image/') ?? false;
}

