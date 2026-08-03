import Image from 'next/image';
import { Label } from '@heroui/react';
import type { AdminTemplateData } from '@/types/admin/templates';

interface TemplateContentTabProps {
  template: AdminTemplateData;
}

export function TemplateContentTab({ template }: TemplateContentTabProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-divider bg-surface p-4">
      {template.thumbnailUrl ? (
        <div className="flex flex-col gap-2">
          <Label>Thumbnail</Label>
          <div className="relative aspect-video w-full max-w-xl overflow-hidden rounded-lg border border-divider">
            <Image src={template.thumbnailUrl} alt={template.name} fill className="object-cover" />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4">
        <div className="flex flex-col gap-1">
          <Label>Descrição curta</Label>
          <p className="text-sm text-foreground">{template.shortDescription || '-'}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Descrição completa</Label>
          <p className="text-sm text-foreground whitespace-pre-wrap">{template.fullDescription || '-'}</p>
        </div>
        <div className="flex flex-col gap-1">
          <Label>Indicado para</Label>
          <p className="text-sm text-foreground">{template.bestFor || '-'}</p>
        </div>
      </div>

      {template.previewImages.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Label>Imagens de preview</Label>
          <div className="grid grid-cols-2 gap-2">
            {template.previewImages.map((url, index) => (
              <div key={`${url}-${index}`} className="relative aspect-video overflow-hidden rounded-lg border border-divider">
                <Image src={url} alt={`Preview ${index + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
