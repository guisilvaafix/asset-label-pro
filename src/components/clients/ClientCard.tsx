import { ClientOSGroup } from '@/utils/dataAnalysis';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientCardProps {
    client: ClientOSGroup;
    onClick: () => void;
}

export function ClientCard({ client, onClick }: ClientCardProps) {
    return (
        <Card
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 group overflow-hidden"
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span className="font-mono font-semibold text-primary text-sm">
                                {client.clientCode}
                            </span>
                        </div>
                        <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                            {client.clientRazaoSocial}
                        </h3>
                        {client.clientNomeComercial &&
                            client.clientNomeComercial !== client.clientRazaoSocial && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                    {client.clientNomeComercial}
                                </p>
                            )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <span>
                            {client.totalOS} {client.totalOS === 1 ? 'O.S' : 'O.S\'s'}
                        </span>
                    </div>
                    <Badge variant="secondary" className="gap-1">
                        <Package className="h-3 w-3" />
                        {client.totalLabelsEstimated.toLocaleString('pt-BR')}
                    </Badge>
                </div>

                <div className="text-xs text-muted-foreground">
                    Clique para ver detalhes das O.S's
                </div>
            </CardContent>
        </Card>
    );
}
