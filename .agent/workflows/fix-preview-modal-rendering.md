# Plano de Correção: Problemas de Posição e Formatação no Preview Modal

## Contexto

O `SheetPreviewModal.tsx` apresenta diferenças visuais em relação ao editor principal (`LabelCanvas.tsx`) no que diz respeito a:
1. **Posicionamento de texto** - Textos aparecem em posições diferentes
2. **Formatação de texto** - Negrito não é aplicado corretamente

Apesar desses problemas visuais, a funcionalidade principal (dados corretos e exportação PDF) está funcionando perfeitamente.

## Análise do Problema

### 1. Diferenças de Implementação

**LabelCanvas.tsx (Editor - Fabric.js)**
- Usa biblioteca Fabric.js para renderização
- Posicionamento e formatação gerenciados pela biblioteca
- Renderização mais robusta e consistente

**SheetPreviewModal.tsx (Preview - Canvas nativo)**
- Usa Canvas API nativa do navegador
- Cálculos manuais de posição e formatação
- Mais suscetível a inconsistências

### 2. Problemas Identificados

#### Posicionamento
```typescript
// SheetPreviewModal.tsx linha 210-213
const elemX = labelX + element.x * MM_TO_PX;
const elemY = labelY + element.y * MM_TO_PX;
const elemWidth = element.width * MM_TO_PX;
const elemHeight = element.height * MM_TO_PX;
```

**Possíveis causas:**
- Fator de conversão `MM_TO_PX` pode estar incorreto
- Cálculo de baseline do texto (`textBaseline: 'top'`) pode não corresponder ao Fabric.js
- Rotação de elementos pode afetar posicionamento

#### Formatação (Negrito)
```typescript
// SheetPreviewModal.tsx linha 254
ctx.font = `${element.fontStyle === 'italic' ? 'italic ' : ''}${element.fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px ${element.fontFamily || 'Arial'}`;
```

**Possíveis causas:**
- Fonte não carregada no momento da renderização
- String de font mal formatada
- Navegador não reconhecendo o peso da fonte

## Plano de Ação

### Fase 1: Investigação e Diagnóstico

#### 1.1 Adicionar Logs de Debug
```typescript
// No case 'text' do SheetPreviewModal.tsx
console.log('Preview Text Debug:', {
  element: {
    x: element.x,
    y: element.y,
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    fontFamily: element.fontFamily
  },
  calculated: {
    elemX,
    elemY,
    fontSize,
    fontString: ctx.font
  }
});
```

#### 1.2 Comparar com LabelCanvas
- Extrair lógica de renderização de texto do LabelCanvas
- Comparar cálculos de posição e formatação
- Identificar diferenças específicas

### Fase 2: Correção de Posicionamento

#### 2.1 Revisar Fator de Conversão
```typescript
// Verificar se MM_TO_PX está correto
const MM_TO_PX = 4; // Atual
// Comparar com LabelCanvas que pode usar valor diferente
```

#### 2.2 Ajustar Baseline do Texto
```typescript
// Testar diferentes baselines
ctx.textBaseline = 'top';      // Atual
ctx.textBaseline = 'middle';   // Alternativa 1
ctx.textBaseline = 'alphabetic'; // Alternativa 2
```

#### 2.3 Considerar Alinhamento
```typescript
// Verificar se textAlign está sendo aplicado corretamente
ctx.textAlign = (element.textAlign as CanvasTextAlign) || 'left';
```

### Fase 3: Correção de Formatação

#### 3.1 Garantir Carregamento de Fontes
```typescript
// Adicionar verificação de fonte carregada
await document.fonts.ready;
```

#### 3.2 Melhorar String de Font
```typescript
// Formato mais robusto
const fontStyle = element.fontStyle === 'italic' ? 'italic' : 'normal';
const fontWeight = element.fontWeight === 'bold' ? 'bold' : 'normal';
const fontFamily = element.fontFamily || 'Arial';
ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
```

#### 3.3 Fallback para Fontes
```typescript
// Adicionar fontes de fallback
const fontFamily = element.fontFamily || 'Arial, sans-serif';
```

### Fase 4: Solução Alternativa (Se necessário)

#### 4.1 Usar Fabric.js no Preview
- Considerar usar Fabric.js também no preview
- Garantir renderização consistente
- Código:
```typescript
import { fabric } from 'fabric';

// Criar canvas Fabric temporário para renderização
const fabricCanvas = new fabric.Canvas(canvasRef.current);
// Renderizar elementos usando mesma lógica do LabelCanvas
```

#### 4.2 Compartilhar Lógica de Renderização
- Extrair função comum de renderização
- Usar em ambos LabelCanvas e SheetPreviewModal
- Garantir DRY (Don't Repeat Yourself)

## Implementação Passo a Passo

### Passo 1: Debug e Coleta de Dados
1. Adicionar logs no SheetPreviewModal
2. Adicionar logs no LabelCanvas
3. Comparar valores lado a lado
4. Identificar diferenças numéricas

### Passo 2: Correções Incrementais
1. Corrigir baseline do texto
2. Ajustar cálculo de posição Y
3. Melhorar string de font
4. Testar após cada mudança

### Passo 3: Validação
1. Criar etiqueta de teste com vários textos
2. Comparar editor vs preview vs PDF
3. Verificar diferentes fontes e tamanhos
4. Testar com/sem negrito, itálico

### Passo 4: Documentação
1. Documentar diferenças encontradas
2. Explicar correções aplicadas
3. Adicionar comentários no código

## Arquivos a Modificar

1. **SheetPreviewModal.tsx** (principal)
   - Linha 210-263: Renderização de texto
   - Adicionar logs de debug
   - Ajustar cálculos

2. **LabelCanvas.tsx** (referência)
   - Extrair lógica de renderização se necessário
   - Comparar com preview

3. **Novo arquivo (opcional): `textRenderer.ts`**
   - Função compartilhada de renderização
   - Usada por ambos componentes

## Critérios de Sucesso

- [ ] Texto no preview aparece na mesma posição do editor
- [ ] Negrito é aplicado corretamente no preview
- [ ] Itálico é aplicado corretamente no preview
- [ ] Diferentes tamanhos de fonte renderizam corretamente
- [ ] Diferentes famílias de fonte funcionam
- [ ] Alinhamento (left/center/right) funciona
- [ ] Rotação de texto mantém posição correta

## Riscos e Mitigações

**Risco 1:** Mudanças podem quebrar preview existente
- **Mitigação:** Testar extensivamente antes de commit
- **Mitigação:** Manter branch separada para testes

**Risco 2:** Fabric.js pode ser pesado para preview
- **Mitigação:** Avaliar impacto de performance
- **Mitigação:** Considerar lazy loading

**Risco 3:** Fontes podem não carregar a tempo
- **Mitigação:** Usar `document.fonts.ready`
- **Mitigação:** Adicionar loading state

## Próximos Passos

1. ✅ Commit e push das correções de Live Link
2. ✅ Criar este plano de correção
3. ⏳ Implementar Fase 1 (Debug)
4. ⏳ Implementar Fase 2 (Posicionamento)
5. ⏳ Implementar Fase 3 (Formatação)
6. ⏳ Validar e testar
7. ⏳ Commit e push das correções

## Notas Adicionais

- Este problema não é crítico pois a exportação PDF funciona corretamente
- O editor principal (onde o usuário trabalha) está correto
- O preview é apenas uma visualização aproximada
- Prioridade: Média (pode ser feito após outras features)

---

**Criado em:** 2026-01-07  
**Autor:** Sistema de IA  
**Status:** Planejamento  
**Prioridade:** Média
