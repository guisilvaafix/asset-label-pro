# Correção: Seleção Múltipla com Shift+Click

## 🐛 Problema Identificado

A seleção múltipla de elementos usando **Shift+Click** não estava funcionando corretamente no editor de etiquetas.

### Causas Raiz

1. **Ordem de execução do `preventDefault()`**: O código estava chamando `e.e.preventDefault()` e `e.e.stopPropagation()` **DEPOIS** de manipular a seleção, permitindo que o Fabric.js sobrescrevesse a seleção com seu comportamento padrão.

2. **Falta de configuração nativa**: O Fabric.js não estava configurado para reconhecer a tecla `Shift` como tecla de seleção múltipla através da propriedade `selectionKey`.

3. **Caso sem seleção prévia**: Quando não havia nenhum elemento selecionado e o usuário clicava com Shift em um elemento, o código não fazia nada, esperando que o Fabric.js lidasse com isso - mas o comportamento padrão não estava configurado corretamente.

---

## ✅ Soluções Implementadas

### 1. **Prevenção Imediata do Comportamento Padrão**

**Antes:**
```typescript
canvas.on('mouse:down', (e) => {
  const pointer = e.e as MouseEvent;
  
  if (pointer.shiftKey && e.target) {
    const clickedObject = e.target as ExtendedFabricObject;
    // ... manipulação da seleção ...
    
    // preventDefault DEPOIS (muito tarde!)
    e.e.preventDefault();
    e.e.stopPropagation();
  }
});
```

**Depois:**
```typescript
canvas.on('mouse:down', (e) => {
  const pointer = e.e as MouseEvent;
  
  if (pointer.shiftKey && e.target) {
    // Prevenir comportamento padrão IMEDIATAMENTE
    e.e.preventDefault();
    e.e.stopPropagation();
    
    const clickedObject = e.target as ExtendedFabricObject;
    // ... manipulação da seleção ...
  }
});
```

**Impacto:** Garante que o Fabric.js não sobrescreva a seleção customizada.

---

### 2. **Configuração da Tecla de Seleção Múltipla**

Adicionado após a criação do canvas:

```typescript
const canvas = new FabricCanvas(canvasRef.current, {
  width: labelWidthPx,
  height: labelHeightPx,
  backgroundColor: '#f8f9fa',
  selection: true,
  preserveObjectStacking: true,
  fireRightClick: true,
  stopContextMenu: true,
});

// Configurar tecla de seleção múltipla
canvas.selectionKey = 'shiftKey';
```

**Impacto:** Habilita o suporte nativo do Fabric.js para seleção múltipla com Shift.

---

### 3. **Tratamento do Caso Sem Seleção Prévia**

**Antes:**
```typescript
if (activeSelection) {
  // ... manipulação da seleção ...
}
// Se não há seleção, não faz nada
```

**Depois:**
```typescript
if (activeSelection) {
  // ... manipulação da seleção ...
} else {
  // Se não há seleção, selecionar o objeto clicado
  canvas.setActiveObject(clickedObject);
  canvas.requestRenderAll();
}
```

**Impacto:** Garante que o primeiro elemento seja selecionado corretamente quando Shift+Click é usado sem seleção prévia.

---

### 4. **Extensão de Tipo TypeScript**

Adicionado em `src/types/fabric-extensions.d.ts`:

```typescript
// Extensão para Fabric.js Canvas
declare global {
  namespace fabric {
    interface Canvas {
      selectionKey?: string | string[];
    }
  }
}
```

**Impacto:** Permite usar `canvas.selectionKey` sem erros de TypeScript.

---

## 🎯 Como Funciona Agora

### Fluxo de Seleção Múltipla

1. **Usuário clica com Shift em um elemento**
   - Event handler detecta `pointer.shiftKey === true`
   - `preventDefault()` e `stopPropagation()` são chamados IMEDIATAMENTE

2. **Verificação de seleção existente**
   - **Se há seleção ativa:**
     - Se é `ActiveSelection` (múltipla): adiciona ou remove o elemento
     - Se é seleção única: cria `ActiveSelection` com ambos os elementos
   - **Se não há seleção:**
     - Seleciona o elemento clicado

3. **Renderização**
   - `canvas.requestRenderAll()` atualiza a visualização
   - Store é atualizado através dos event listeners `selection:created` e `selection:updated`

---

## 📋 Arquivos Modificados

1. **`src/components/editor/LabelCanvas.tsx`**
   - Movido `preventDefault()` para o início do handler
   - Adicionado `canvas.selectionKey = 'shiftKey'`
   - Adicionado tratamento para caso sem seleção prévia

2. **`src/types/fabric-extensions.d.ts`**
   - Adicionada extensão de tipo para `Canvas.selectionKey`

---

## 🧪 Testes Realizados

### Cenários Testados

- [x] Shift+Click em elemento sem seleção prévia → Seleciona o elemento
- [x] Shift+Click em segundo elemento → Cria seleção múltipla
- [x] Shift+Click em terceiro elemento → Adiciona à seleção múltipla
- [x] Shift+Click em elemento já selecionado → Remove da seleção
- [x] Shift+Click em último elemento → Volta para seleção única
- [x] Seleção por área (arrastar) continua funcionando
- [x] Seleção única (click sem Shift) continua funcionando

---

## 🔍 Detalhes Técnicos

### Por que `preventDefault()` no início?

O Fabric.js processa eventos de mouse em várias etapas:
1. Evento nativo do navegador
2. Event handlers customizados (`mouse:down`)
3. Lógica interna de seleção do Fabric.js

Se chamarmos `preventDefault()` **depois** de manipular a seleção, a lógica interna do Fabric.js (etapa 3) já terá sido executada, sobrescrevendo nossa seleção customizada.

Chamando `preventDefault()` **imediatamente**, impedimos que a etapa 3 seja executada, mantendo nossa seleção customizada intacta.

### Por que `selectionKey`?

A propriedade `selectionKey` informa ao Fabric.js qual tecla deve ser usada para seleção múltipla. Sem essa configuração, o Fabric.js pode usar comportamentos padrão que conflitam com nosso handler customizado.

Definindo explicitamente `selectionKey = 'shiftKey'`, garantimos que:
- O Fabric.js reconhece Shift como tecla de seleção múltipla
- Comportamentos nativos do Fabric.js (como arrastar para selecionar múltiplos) funcionam corretamente com Shift
- Nosso handler customizado está alinhado com o comportamento esperado do Fabric.js

---

## ✨ Resultado

A seleção múltipla com **Shift+Click** agora funciona perfeitamente:

- ✅ Seleciona múltiplos elementos
- ✅ Adiciona/remove elementos da seleção
- ✅ Compatível com outros métodos de seleção
- ✅ Sincronizado com o store do Zustand
- ✅ Atualiza o painel de propriedades corretamente

---

## 📚 Referências

- **Fabric.js Documentation**: [Selection](http://fabricjs.com/docs/fabric.Canvas.html#selectionKey)
- **Event Handling**: [Mouse Events](http://fabricjs.com/events)
- **ActiveSelection**: [API Reference](http://fabricjs.com/docs/fabric.ActiveSelection.html)
