import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useOSStore } from '@/store/osStore';
import { groupOSByClient, filterClientGroups, ClientOSGroup } from '@/utils/dataAnalysis';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ClientCard } from '@/components/clients/ClientCard';
import { ClientOSModal } from '@/components/clients/ClientOSModal';
import { FileText, Search, Users, AlertCircle, Home } from 'lucide-react';

export default function Clients() {
    const { osList } = useOSStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<ClientOSGroup | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    // Agrupar O.S's por cliente
    const clientGroups = useMemo(() => {
        return groupOSByClient(osList);
    }, [osList]);

    // Filtrar por busca
    const filteredClients = useMemo(() => {
        return filterClientGroups(clientGroups, searchQuery);
    }, [clientGroups, searchQuery]);

    const handleClientClick = (client: ClientOSGroup) => {
        setSelectedClient(client);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        // Delay para evitar flash visual
        setTimeout(() => setSelectedClient(null), 200);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-lg">FinalPrint</span>
                        </div>
                        <Button asChild variant="outline" className="gap-2">
                            <Link to="/">
                                <Home className="h-4 w-4" />
                                Voltar para Home
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Título e Busca */}
                <div className="flex flex-col gap-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Users className="h-8 w-8" />
                            Clientes
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Visualize as Ordens de Serviço agrupadas por cliente
                        </p>
                    </div>

                    {clientGroups.length > 0 && (
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por código ou razão social..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    )}
                </div>

                {/* Conteúdo */}
                {clientGroups.length === 0 ? (
                    // Nenhum cliente com O.S
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Users className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Nenhum cliente com O.S</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-md">
                                Crie Ordens de Serviço com informações de cliente para visualizá-las aqui
                            </p>
                            <Button asChild className="gap-2">
                                <Link to="/">
                                    <Home className="h-4 w-4" />
                                    Ir para Home
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : filteredClients.length === 0 ? (
                    // Busca sem resultados
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Search className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
                            <p className="text-muted-foreground text-center mb-6 max-w-sm">
                                Tente ajustar sua busca
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setSearchQuery('')}
                                className="gap-2"
                            >
                                Limpar busca
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Contador */}
                        <div className="mb-4 text-sm text-muted-foreground">
                            {filteredClients.length} {filteredClients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
                        </div>

                        {/* Grid de Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredClients.map((client) => (
                                <ClientCard
                                    key={client.clientCode}
                                    client={client}
                                    onClick={() => handleClientClick(client)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>

            {/* Modal de Detalhes */}
            <ClientOSModal
                client={selectedClient}
                open={modalOpen}
                onOpenChange={handleModalClose}
            />
        </div>
    );
}
