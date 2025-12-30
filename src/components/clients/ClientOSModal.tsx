import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientOSGroup } from '@/utils/dataAnalysis';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { OSDataSummary } from './OSDataSummary';
import {
    Building2,
    FileText,
    ExternalLink,
    Calendar,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ClientOSModalProps {
    client: ClientOSGroup | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ClientOSModal({ client, open, onOpenChange }: ClientOSModalProps) {
    const navigate = useNavigate();
    const [expandedOS, setExpandedOS] = useState<Set<string>>(new Set());

    if (!client) return null;

    const toggleOS = (osId: string) => {
        const newExpanded = new Set(expandedOS);
        if (newExpanded.has(osId)) {
            newExpanded.delete(osId);
        } else {
            newExpanded.add(osId);
        }
        setExpandedOS(newExpanded);
    };

    const handleOpenEditor = (osId: string) => {
        navigate(`/editor/${osId}`);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <span>{client.clientRazaoSocial}</span>
                    </DialogTitle>
                    <DialogDescription className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-primary">
                                Código: {client.clientCode}
                            </span>
                        </div>
                        {client.clientNomeComercial &&
                            client.clientNomeComercial !== client.clientRazaoSocial && (
                                <div className="text-sm">
                                    Nome Comercial: {client.clientNomeComercial}
                                </div>
                            )}
                    </DialogDescription>
                </DialogHeader>

                <Separator />

                {/* Resumo */}
                <div className="flex items-center gap-4 py-2">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                            {client.totalOS} {client.totalOS === 1 ? 'Ordem de Serviço' : 'Ordens de Serviço'}
                        </span>
                    </div>
                    <Badge variant="secondary">
                        {client.totalLabelsEstimated.toLocaleString('pt-BR')} etiquetas estimadas
                    </Badge>
                </div>

                <Separator />

                {/* Lista de O.S's */}
                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-3">
                        {client.osList.map((os) => {
                            const isExpanded = expandedOS.has(os.id);

                            return (
                                <Collapsible
                                    key={os.id}
                                    open={isExpanded}
                                    onOpenChange={() => toggleOS(os.id)}
                                >
                                    <div className="border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
                                        {/* Header da O.S */}
                                        <CollapsibleTrigger asChild>
                                            <div className="p-4 bg-card hover:bg-accent/50 cursor-pointer transition-colors">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h4 className="font-semibold text-base">
                                                                {os.name}
                                                            </h4>
                                                            <Badge variant="outline" className="text-xs">
                                                                O.S
                                                            </Badge>
                                                        </div>
                                                        {os.description && (
                                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                                {os.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>
                                                                Criada em {format(new Date(os.createdAt), "dd/MM/yyyy")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenEditor(os.id);
                                                            }}
                                                            className="gap-2"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                            Abrir
                                                        </Button>
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </CollapsibleTrigger>

                                        {/* Conteúdo Expandido */}
                                        <CollapsibleContent>
                                            <div className="p-4 pt-0 bg-muted/30">
                                                <Separator className="mb-4" />
                                                <OSDataSummary os={os} />
                                            </div>
                                        </CollapsibleContent>
                                    </div>
                                </Collapsible>
                            );
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
