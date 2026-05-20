import { PaintBoardIcon } from '@hugeicons/core-free-icons';
import { ImageUploader } from '@/components/ui/image-uploader';
import { SystemAccordion } from '@/components/ui/system-accordion';
import { UploadFolder } from '@/types/enums';

interface TemplateMediaStepProps {
	defaultExpanded: boolean;
	thumbnailUrl: string[];
	onThumbnailUrlChange: (value: string[]) => void;
	previewImages: string[];
	onPreviewImagesChange: (value: string[]) => void;
}

export function TemplateMediaStep({
	defaultExpanded,
	thumbnailUrl,
	onThumbnailUrlChange,
	previewImages,
	onPreviewImagesChange,
}: TemplateMediaStepProps) {
	return (
		<SystemAccordion
			id="template-images"
			icon={PaintBoardIcon}
			color="accent"
			title="Imagens"
			summary="Thumbnail e imagens de preview do template"
			defaultExpanded={defaultExpanded}
		>
			<ImageUploader
				folder={UploadFolder.Checkouts}
				isAdmin
				label="Thumbnail"
				description="Imagem principal do template (aparece na listagem)"
				maxFiles={1}
				value={thumbnailUrl}
				onChange={onThumbnailUrlChange}
			/>

			<ImageUploader
				folder={UploadFolder.Checkouts}
				isAdmin
				label="Imagens de preview"
				description="Imagens adicionais para mostrar o template em detalhes"
				maxFiles={6}
				value={previewImages}
				onChange={onPreviewImagesChange}
			/>
		</SystemAccordion>
	);
}
