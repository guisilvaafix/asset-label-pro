// AfixControl API Service
const API_BASE_URL = 'https://afixcontrol.afixgraf.com.br/api';
const API_TOKEN = 'fc_api_token_381928371293';

export interface ClientInfo {
    codigo: number;
    cnpj_cpf: string;
    natureza: string;
    razaoSocial: string;
    nomeComercial: string;
    inscricaoEstadual: string;
    inscricaoMunicipal: string;
}

export interface ClientResponse {
    cliente_id: string;
    cliente_codigo: string;
    cliente_info: string; // JSON string
    cliente_endereco_entrega: string;
    cliente_endereco_faturamento: string;
    cliente_contatos: string;
    cliente_representante: string;
    cliente_rdid: string;
    cliente_data: string;
}

export interface ParsedClient {
    id: string;
    codigo: string;
    info: ClientInfo;
    raw: ClientResponse;
}

/**
 * Busca cliente por código
 */
export async function getClientByCode(code: string): Promise<ParsedClient | null> {
    try {
        const response = await fetch(
            `${API_BASE_URL}/clients?code=${code}&token=${API_TOKEN}`
        );

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`API Error: ${response.status}`);
        }

        const data: ClientResponse = await response.json();

        // Parse o JSON string do cliente_info
        const info: ClientInfo = JSON.parse(data.cliente_info);

        return {
            id: data.cliente_id,
            codigo: data.cliente_codigo,
            info,
            raw: data,
        };
    } catch (error) {
        console.error('Error fetching client:', error);
        throw error;
    }
}

/**
 * Busca lista de clientes (com busca opcional)
 */
export async function searchClients(query?: string, limit: number = 50): Promise<ParsedClient[]> {
    try {
        const params = new URLSearchParams({
            token: API_TOKEN,
            limit: limit.toString(),
        });

        if (query) {
            params.append('q', query);
        }

        const response = await fetch(`${API_BASE_URL}/clients?${params}`);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data: ClientResponse[] = await response.json();

        return data.map((client) => ({
            id: client.cliente_id,
            codigo: client.cliente_codigo,
            info: JSON.parse(client.cliente_info),
            raw: client,
        }));
    } catch (error) {
        console.error('Error searching clients:', error);
        throw error;
    }
}
