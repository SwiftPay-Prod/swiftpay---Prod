'use client';

import { ImageUploader } from '@/components/ui/image-uploader';
import { UploadFolder } from '@/types/enums';
import type { ImagesTabProps } from './types';

export function ImagesTab({ merchantId, imageUrls, setImageUrls, disabled }: ImagesTabProps) {
	return (
		<div className="flex flex-col gap-6">
			<ImageUploader
				merchantId={merchantId}
				folder={UploadFolder.Products}
				label="Imagens do produto"
				value={imageUrls}
				onChange={setImageUrls}
				maxFiles={6}
				itemWidth="w-24"
				itemHeight="h-24"
				isDisabled={disabled}
			/>
		</div>
	);
}
