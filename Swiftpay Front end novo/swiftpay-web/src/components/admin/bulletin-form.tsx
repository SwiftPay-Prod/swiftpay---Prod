'use client';

import { useState, useTransition } from 'react';
import { Card, TextField, Label, Input, NumberField, Separator } from '@heroui/react';
import { News01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { AsyncButton } from '@/components/ui/async-button';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toast } from '@heroui/react';
import { createBulletin } from '@/app/actions/admin/users';
import { CancelCircleIcon, Alert01Icon } from '@hugeicons/core-free-icons';

interface BulletinFormProps {
	addLog?: (message: string, type: 'info' | 'success' | 'error') => void;
}

export function BulletinForm({ addLog }: BulletinFormProps) {
	const [isPending, startTransition] = useTransition();
	const [title, setTitle] = useState('');
	const [content, setContent] = useState('');
	const [expiresInDays, setExpiresInDays] = useState(30);

	function handleSubmit() {
		if (!title.trim()) {
			toast('Título obrigatório', {
				description: 'O título do informativo é obrigatório.',
				indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
				variant: 'warning',
			});
			return;
		}

		if (!content.trim() || content === '<p></p>') {
			toast('Conteúdo obrigatório', {
				description: 'O conteúdo do informativo é obrigatório.',
				indicator: <Icon icon={Alert01Icon} className="icon-sm" />,
				variant: 'warning',
			});
			return;
		}

		startTransition(async () => {
			addLog?.(`Criando informativo: ${title}...`, 'info');

			try {
				const createPromise = createBulletin({
					title: title.trim(),
					content,
					expiresInDays,
				}).then((response) => {
					if (response?.error) {
					throw new Error(response.error.message ?? 'Erro ao criar informativo');
				}
				return response;
			});

			toast.promise(createPromise, {
				loading: 'Criando informativo...',
					success: (response) => response?.message ?? 'Informativo criado com sucesso!',
					error: (err) => err.message,
				});

				await createPromise;
				addLog?.('Informativo criado com sucesso!', 'success');
				setTitle('');
				setContent('');
				setExpiresInDays(30);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
				addLog?.(`Erro: ${errorMsg}`, 'error');
				toast('Erro ao criar informativo', {
					description: errorMsg,
					indicator: <Icon icon={CancelCircleIcon} className="icon-sm" />,
					variant: 'danger',
				});
			}
		});
	}

	return (
		<Card>
			<Card.Header>
				<div className="flex items-center gap-2">
					<Icon icon={News01Icon} className="icon-md text-accent" />
					<div>
						<Card.Title>Criar Informativo</Card.Title>
						<Card.Description>Crie informativos que aparecerão como modal para todos os usuários</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Separator />
			<Card.Content className="flex flex-col gap-4">
				<TextField variant="secondary">
					<Label>Título</Label>
					<Input variant="secondary" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do informativo" />
				</TextField>

				<div className="flex flex-col gap-2">
					<Label>Conteúdo</Label>
					<RichTextEditor value={content} onChange={setContent} placeholder="Digite o conteúdo do informativo..." />
					<p className="text-xs text-muted">
						💡 Você pode adicionar imagens via URL ou colando diretamente. Limite recomendado: 1MB por imagem.
					</p>
				</div>

				<NumberField variant="secondary"
					value={expiresInDays}
					onChange={(value) => setExpiresInDays(value ?? 30)}
					minValue={1}
					maxValue={365}
				>
					<Label>Expirar em (dias)</Label>
					<Input variant="secondary" type="text" inputMode="numeric" />
				</NumberField>
				<p className="text-xs text-muted">O informativo ficará visível por este período</p>

				<AsyncButton variant="primary" onPress={handleSubmit} isPending={isPending} className="w-full">
					<Icon icon={News01Icon} className="icon-sm" />
					Criar Informativo
				</AsyncButton>
			</Card.Content>
		</Card>
	);
}

