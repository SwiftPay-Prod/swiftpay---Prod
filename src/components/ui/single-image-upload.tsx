'use client';

import { useRef, useState } from 'react';
import { Button, Spinner, Modal } from '@heroui/react';
import { Icon } from '@/components/ui/icon';
import { Delete02Icon, UploadCircle01Icon, ViewIcon, Alert01Icon, CancelCircleIcon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { uploadMerchantFile } from '@/app/actions/merchant/upload';
import { deleteFile } from '@/app/actions/files';
import { toast } from '@heroui/react';
import Image from 'next/image';
import type { UploadFolder } from '@/types/enums';

interface SingleImageUploadProps {
	merchantId: string;
	folder: UploadFolder;
	label: string;
	description?: string;
	value: string | null;
	fileId: string | null;
	onChange: (url: string | null, fileId: string | null) => void;
	isDisabled?: boolean;
	aspectRatio?: 'square' | 'landscape' | 'portrait';
	acceptFormats?: string;
}

export function SingleImageUpload({
	merchantId,
	folder,
	label,
	description,
	value,
	fileId,
	onChange,
	isDisabled,
	aspectRatio = 'square',
	acceptFormats = '.jpg,.jpeg,.png,.webp,.ico',
}: SingleImageUploadProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);

	async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		const maxSize = 10 * 1024 * 1024;
		if (file.size > maxSize) {
			toast('Arquivo muito grande', {
				description: 'A imagem deve ter no máximo 10MB.',
				indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
				variant: 'warning',
			});
			if (inputRef.current) inputRef.current.value = '';
			return;
		}

		setIsUploading(true);

		if (fileId) {
			await deleteFile(fileId);
		}

		const response = await uploadMerchantFile(merchantId, file, folder, true);

		setIsUploading(false);

		if (response?.error) {
			toast('Erro no upload', {
				description: response.error.message ?? 'Tente novamente.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			if (inputRef.current) inputRef.current.value = '';
			return;
		}

		if (response?.data) {
			onChange(response.data.url, response.data.id);
			toast('Imagem enviada', {
				description: 'A imagem foi enviada com sucesso.',
				indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
				variant: 'success',
			});
		}

		if (inputRef.current) {
			inputRef.current.value = '';
		}
	}

	async function handleRemove() {
		if (!fileId) {
			onChange(null, null);
			return;
		}

		setIsDeleting(true);

		const response = await deleteFile(fileId);

		setIsDeleting(false);

		if (response?.error) {
			toast('Erro ao remover', {
				description: response.error.message ?? 'Tente novamente.',
				indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
				variant: 'danger',
			});
			return;
		}

		onChange(null, null);
		toast('Imagem removida', {
			description: 'A imagem foi removida com sucesso.',
			indicator: <Icon icon={CheckmarkCircle02Icon} className="icon-sm" />,
			variant: 'success',
		});
	}

	const isInteractionDisabled = isUploading || isDeleting || isDisabled;

	const aspectRatioClasses = {
		square: 'aspect-square',
		landscape: 'aspect-video',
		portrait: 'aspect-[3/4]',
	};

	return (
		<div className="flex flex-col gap-2">
			<div className="flex flex-col gap-1">
				<label className="text-small font-medium text-foreground">{label}</label>
				{description && <p className="text-xs text-muted">{description}</p>}
			</div>

			<input
				ref={inputRef}
				type="file"
				accept={acceptFormats}
				onChange={handleFileSelect}
				className="hidden"
				disabled={isInteractionDisabled}
			/>

			{value ? (
				<div
					className={`relative w-full max-w-64 ${aspectRatioClasses[aspectRatio]} ${isInteractionDisabled ? 'opacity-60 pointer-events-none' : ''}`}
				>
					<button
						type="button"
						onClick={() => setPreviewOpen(true)}
						disabled={isInteractionDisabled}
						className="group relative flex h-full w-full items-center justify-center rounded-xl border border-divider bg-surface overflow-hidden cursor-pointer"
					>
						<Image src={value} alt={label} className="h-full w-full object-cover" fill />
						<div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 opacity-0 transition-opacity group-hover:opacity-100">
							<Icon icon={ViewIcon} className="icon-sm text-foreground" />
							<span className="text-xs">Visualizar</span>
						</div>
					</button>
					<Button
						isIconOnly
						size="sm"
						variant="danger"
						className="absolute -top-2 -right-2"
						onPress={handleRemove}
						isDisabled={isInteractionDisabled}
						isPending={isDeleting}
					>
						<Icon icon={Delete02Icon} className="icon-xs" />
					</Button>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					disabled={isInteractionDisabled}
					className={`flex w-full max-w-64 ${aspectRatioClasses[aspectRatio]} flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-default text-muted transition-colors hover:border-accent hover:text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-default disabled:hover:text-muted`}
				>
					{isUploading ? (
						<Spinner size="sm" />
					) : (
						<>
							<Icon icon={UploadCircle01Icon} className="icon-md" />
							<span className="text-sm">Clique para enviar</span>
						</>
					)}
				</button>
			)}

			<Modal.Backdrop isOpen={previewOpen} onOpenChange={setPreviewOpen}>
				<Modal.Container size="lg" placement="center" scroll="outside">
					<Modal.Dialog className="max-w-4xl">
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>Visualizar imagem</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							{value && (
								<div className="relative w-full overflow-hidden rounded-lg bg-content2" style={{ aspectRatio: '16 / 9' }}>
									<Image src={value} alt={label} className="object-contain" fill />
								</div>
							)}
						</Modal.Body>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</div>
	);
}

