'use client';

import { ImageUploader } from '@/components/ui/image-uploader';
import { UploadFolder } from '@/types/enums';
import type { ImagesTabProps } from './types';

export function ImagesTab({ imageUrls, setImageUrls, merchantId, disabled }: ImagesTabProps) {
	return (
		<div className="flex flex-col gap-4">
			<ImageUploader
				merchantId={merchantId}
				folder={UploadFolder.Products}
				label="Imagens do serviço"
				value={imageUrls}
				onChange={setImageUrls}
				maxFiles={6}
				isDisabled={disabled}
			/>
		</div>
	);
}
