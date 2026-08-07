'use client';

import { TextField, Label, Input, TextArea } from '@heroui/react';
import type { BasicInfoTabProps } from './types';

export function BasicInfoTab({
	name,
	setName,
	description,
	setDescription,
	externalId,
	setExternalId,
	disabled,
}: BasicInfoTabProps) {
	return (
		<div className="flex flex-col gap-6">
			<TextField isDisabled={disabled} variant="secondary" isRequired>
				<Label>Nome do Produto</Label>
				<Input
					variant="secondary"
					placeholder="Ex: Camiseta Premium"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
			</TextField>

			<TextField variant="secondary" isDisabled={disabled}>
				<Label>ID Externo</Label>
				<Input
					variant="secondary"
					placeholder="Identificador do seu sistema (opcional)"
					value={externalId}
					onChange={(e) => setExternalId(e.target.value)}
				/>
			</TextField>

			<TextField isDisabled={disabled} variant="secondary">
				<Label>Descrição</Label>
				<TextArea
					variant="secondary"
					placeholder="Descrição do produto (opcional)"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={3}
				/>
			</TextField>
		</div>
	);
}
