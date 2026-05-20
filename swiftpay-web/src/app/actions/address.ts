'use server';

export interface ViaCepResponse {
	cep: string;
	logradouro: string;
	complemento: string;
	unidade: string;
	bairro: string;
	localidade: string;
	uf: string;
	estado: string;
	regiao: string;
	ibge: string;
	gia: string;
	ddd: string;
	siafi: string;
	erro?: boolean;
}

export interface AddressFromCep {
	address: string;
	neighborhood: string;
	city: string;
	state: string;
	complement: string | null;
}

export async function fetchAddressByCep(
	cep: string
): Promise<{ success: true; data: AddressFromCep } | { success: false; error: string }> {
	const cleanCep = cep.replace(/\D/g, '');

	if (cleanCep.length !== 8) {
		return { success: false, error: 'CEP deve ter 8 dígitos' };
	}

	try {
		const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
			next: { revalidate: 86400 },
		});

		if (!response.ok) {
			return { success: false, error: 'CEP inválido' };
		}

		const data: ViaCepResponse = await response.json();

		if (data.erro) {
			return { success: false, error: 'CEP não encontrado' };
		}

		return {
			success: true,
			data: {
				address: data.logradouro,
				neighborhood: data.bairro,
				city: data.localidade,
				state: data.uf,
				complement: data.complemento || null,
			},
		};
	} catch {
		return { success: false, error: 'Erro ao buscar CEP' };
	}
}
