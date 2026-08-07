import { ListOptionsDemo } from './list-options-demo';

export default function DemoPage() {
	return (
		<div className="container py-8">
			<h1 className="text-2xl font-bold mb-6">Demo: Opções de Lista sem Tabela</h1>
			<p className="text-muted mb-8">
				Clique nas abas para alternar entre as 3 opções e veja como fica para Categorias e Variantes.
			</p>
			<ListOptionsDemo />
		</div>
	);
}

