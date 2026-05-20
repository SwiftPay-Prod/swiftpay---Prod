'use client';

import { TextField, Input, Label, TextArea } from '@heroui/react';
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
		<div className="flex flex-col gap-4">
			<div className="grid grid-cols-1 gap-4">
				<TextField variant="secondary" isRequired isDisabled={disabled}>
					<Label>Nome</Label>
					<Input variant="secondary"
						placeholder="Nome do serviço"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</TextField>
			</div>

			<TextField variant="secondary" isDisabled={disabled}>
				<Label>ID Externo</Label>
				<Input variant="secondary"
					placeholder="Identificador do seu sistema (opcional)"
					value={externalId}
					onChange={(e) => setExternalId(e.target.value)}
				/>
			</TextField>

			<TextField variant="secondary" isDisabled={disabled}>
				<Label>Descrição</Label>
				<TextArea variant="secondary"
					placeholder="Descrição do serviço (opcional)"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={3}
				/>
			</TextField>
		</div>
	);
}
