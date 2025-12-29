# Controle de Zoom via Scroll do Mouse

## 📝 Descrição

Implementado controle de zoom no editor de etiquetas através do scroll do mouse (roda do mouse). Esta funcionalidade permite que o usuário ajuste o nível de zoom do canvas de forma intuitiva, sem interferir com o zoom do navegador.

## ✨ Funcionalidades

### Controle de Zoom
- **Scroll para cima** (roda do mouse para frente): Aumenta o zoom (Zoom In)
- **Scroll para baixo** (roda do mouse para trás): Diminui o zoom (Zoom Out)
- **Incremento**: 10% por movimento do scroll
- **Limites**: 
  - Mínimo: 10%
  - Máximo: 500%

### Comportamento
- ✅ **Previne zoom do navegador**: O evento `preventDefault()` garante que o scroll não afete o zoom da página
- ✅ **Ativo apenas no canvas**: O zoom via scroll funciona apenas quando o mouse está sobre a área do canvas
- ✅ **Suave e responsivo**: Incrementos de 10% proporcionam controle preciso
- ✅ **Sincronizado**: O valor do zoom é sincronizado com os controles visuais (slider e botões +/-)

## 🔧 Implementação Técnica

### Arquivo Modificado
- `src/components/editor/LabelCanvas.tsx`

### Mudanças Realizadas

1. **Adicionado `setZoom` ao hook `useLabelStore`**
   ```typescript
   const { zoom, setZoom, ... } = useLabelStore();
   ```

2. **Criado useEffect separado para o event listener**
   ```typescript
   useEffect(() => {
     const container = containerRef.current;
     if (!container) return;

     const handleWheel = (e: WheelEvent) => {
       e.preventDefault();
       
       const delta = e.deltaY;
       const zoomIncrement = 10;
       
       let newZoom = zoom;
       if (delta < 0) {
         newZoom = Math.min(500, zoom + zoomIncrement);
       } else {
         newZoom = Math.max(10, zoom - zoomIncrement);
       }
       
       setZoom(newZoom);
     };

     container.addEventListener('wheel', handleWheel, { passive: false });

     return () => {
       container.removeEventListener('wheel', handleWheel);
     };
   }, [zoom, setZoom]);
   ```

3. **Configuração do event listener**
   - `{ passive: false }`: Permite o uso de `preventDefault()`
   - Anexado ao `containerRef` (div que envolve o canvas)
   - Cleanup automático ao desmontar o componente

## 🎯 Casos de Uso

### Usuário Trabalhando no Editor
1. Usuário posiciona o mouse sobre o canvas
2. Usa a roda do mouse para ajustar o zoom
3. Zoom aumenta/diminui sem afetar o zoom do navegador
4. Controles visuais (slider, porcentagem) são atualizados automaticamente

### Integração com Controles Existentes
- O zoom via scroll funciona em conjunto com:
  - Botões de Zoom In/Out
  - Slider de zoom
  - Indicador de porcentagem

## ⚠️ Observações Importantes

1. **Não interfere com o navegador**: O `preventDefault()` garante que o scroll não cause zoom da página
2. **Performance**: useEffect separado evita reinicialização do canvas
3. **Acessibilidade**: Mantém os controles visuais para usuários que preferem não usar o scroll
4. **Limites respeitados**: Zoom sempre entre 10% e 500%

## 🧪 Testes Sugeridos

- [ ] Scroll para cima aumenta o zoom
- [ ] Scroll para baixo diminui o zoom
- [ ] Zoom não ultrapassa 500%
- [ ] Zoom não fica abaixo de 10%
- [ ] Navegador não dá zoom na página
- [ ] Controles visuais sincronizados
- [ ] Funciona apenas quando mouse está sobre o canvas

## 📚 Referências

- **Componente**: `LabelCanvas.tsx`
- **Store**: `labelStore.ts` (função `setZoom`)
- **Página**: `Editor.tsx` (controles visuais de zoom)
