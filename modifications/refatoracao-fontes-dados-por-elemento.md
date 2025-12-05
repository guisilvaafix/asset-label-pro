# Refatoração: Sistema de Fontes de Dados por Elemento e Melhorias de UX

**Data:** 2024-12-19  
**Tipo:** Refatoração Major + Melhorias de UX

## Resumo

Refatoração completa do sistema de geração de dados para etiquetas, permitindo que cada elemento (QR Code e Código de Barras) defina sua própria fonte de dados de forma independente. Além disso, foram implementadas melhorias significativas na experiência do usuário, incluindo sistema de debounce para inputs e correção de overflow na sidebar de propriedades.

## Principais Mudanças

### 1. Sistema de Fontes de Dados por Elemento

#### Antes
- Uma única configuração global de sequência ou CSV aplicada a todos os elementos
- Guia "Dados" obrigatória para configurar sequências
- Todos os QR codes e códigos de barras usavam a mesma fonte de dados

#### Depois
- Cada QR Code e Código de Barras pode ter sua própria fonte de dados:
  - **Sequencial**: Configuração individual de início, fim, incremento, prefixo e sufixo
  - **CSV/Excel**: Seleção de coluna específica do CSV importado
  - **Valor Fixo**: Valor estático para todas as etiquetas
- Configuração feita diretamente no painel de propriedades de cada elemento
- Guia "Dados" simplificada para apenas importar CSV e visualizar dados

### 2. Arquivos Modificados

#### Novos Arquivos
- `src/pages/Home.tsx` - Página inicial com lista de O.S's
- `src/pages/Editor.tsx` - Editor de etiquetas (renomeado de Index.tsx)
- `src/components/os/CreateOSModal.tsx` - Modal para criar novas O.S's
- `src/store/osStore.ts` - Store Zustand para gerenciar O.S's
- `src/utils/sequenceGenerator.ts` - Utilitário para geração de sequências

#### Arquivos Modificados
- `src/types/label.ts`
  - Removido: `useCustomSequence` de `LabelElement`
  - Adicionado: `dataSourceType: 'sequential' | 'csv' | 'fixed'`
  - Adicionado: `csvColumn?: string` para elementos que usam CSV

- `src/components/editor/PropertiesPanel.tsx`
  - Implementado seletor de "Fonte de Dados" para QR codes e códigos de barras
  - Adicionado estado local com debounce para evitar re-renderizações
  - Campos de configuração sequencial aparecem condicionalmente
  - Seleção de coluna CSV quando `dataSourceType === 'csv'`

- `src/components/editor/DataPanel.tsx`
  - Removida guia "Sequencial" (agora configurada por elemento)
  - Mantida apenas importação de CSV e visualização
  - Cálculo de total de etiquetas baseado nos elementos

- `src/utils/sequenceGenerator.ts`
  - Nova função `getElementValue()` que suporta sequential, CSV e fixed
  - Função `generateElementSequenceData()` atualizada para usar `dataSourceType`

- `src/utils/pdfExporter.ts`
  - Atualizado para usar `getElementValue()` em vez de lógica antiga
  - Suporte para diferentes fontes de dados por elemento

- `src/components/editor/ExportDialog.tsx`
  - Cálculo de total de etiquetas baseado nas configurações dos elementos
  - Suporte para múltiplas sequências simultâneas

- `src/pages/Editor.tsx`
  - Implementado `ResizablePanelGroup` para ajustar largura do preview
  - Corrigido overflow na sidebar direita

### 3. Melhorias de UX

#### Sistema de Debounce
- Estado local para valores de inputs (evita re-renderizações)
- Debounce de 300ms para texto e 150ms para números
- Atualização imediata no `onBlur` para garantir persistência
- Usuário não perde foco ao digitar

#### Overflow na Sidebar
- Adicionado `h-full overflow-hidden` no container
- `ScrollArea` configurado corretamente
- Header fixo com `flex-shrink-0`
- Conteúdo scrollável sem quebrar layout

## Como Usar

### Configurar Fonte de Dados para um Elemento

1. Selecione um QR Code ou Código de Barras no canvas
2. No painel de propriedades, encontre "Fonte de Dados"
3. Escolha uma das opções:
   - **Sequencial**: Configure início, fim, incremento, prefixo e sufixo
   - **CSV/Excel**: Selecione a coluna do CSV importado
   - **Valor Fixo**: Digite o valor diretamente

### Importar CSV

1. Vá para a guia "Dados" na sidebar direita
2. Clique em "Importar CSV/Excel"
3. Selecione o arquivo
4. As colunas ficarão disponíveis para uso nos elementos

## Benefícios

1. **Flexibilidade**: Cada elemento pode ter sua própria sequência ou fonte de dados
2. **Intuitividade**: Configuração direta no painel de propriedades
3. **Performance**: Debounce reduz re-renderizações desnecessárias
4. **UX Melhorada**: Usuário não perde foco ao digitar
5. **Organização**: Guia "Dados" simplificada e focada

## Notas Técnicas

- O sistema mantém compatibilidade com elementos existentes (default: `dataSourceType: 'fixed'`)
- A exportação calcula automaticamente o total de etiquetas baseado nas sequências configuradas
- Múltiplos elementos podem usar diferentes sequências na mesma etiqueta
- O preview e a exportação respeitam as configurações individuais de cada elemento

## Breaking Changes

⚠️ **Atenção**: Elementos criados antes desta refatoração que usavam `useCustomSequence` precisarão ser reconfigurados usando o novo sistema de `dataSourceType`.

