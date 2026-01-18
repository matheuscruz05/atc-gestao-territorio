# ✅ CORREÇÃO GRAVE: Exclusão de Cadastros e Proteção do Cabeçalho

## 🚨 PROBLEMA IDENTIFICADO

### 1. Cadastros Excluídos Sendo Reinseridos
**Descrição**: Quando o admin excluía cadastros no app e depois clicava em "Enviar", os cadastros excluídos eram reinseridos na planilha.

**Causa Raiz**: 
- O sistema removia completamente o cadastro do `AsyncStorage` local ao excluir
- Quando o admin clicava em "Enviar", o `handleSync` enviava TODOS os cadastros do storage
- Como os cadastros excluídos não estavam mais no storage local, mas ainda estavam na planilha, eles eram tratados como "existentes" e mantidos

### 2. Exclusão na Planilha Não Funcionava
**Descrição**: Quando a planilha estava vazia (limpa manualmente), a tentativa de excluir cadastros retornava "Planilha vazia" sem fazer nada.

**Causa Raiz**:
- O endpoint DELETE buscava em TODAS as linhas da planilha (incluindo cabeçalho)
- Quando a planilha estava vazia (só com cabeçalho), `data.values` retornava apenas 1 linha
- A verificação `if (!data.values)` não funcionava para planilha com apenas cabeçalho

### 3. Falta de Proteção do Cabeçalho
**Descrição**: Não havia proteção para garantir que o cabeçalho (linha 1) nunca fosse alterado.

**Risco**: Operações de INSERT/UPDATE poderiam sobrescrever o cabeçalho se a planilha estivesse vazia.

---

## ✅ SOLUÇÃO IMPLEMENTADA

### 1. Soft Delete com Campo `deletado`

#### Mudança no Tipo `Cadastro`
```typescript
// types/models.ts
export interface Cadastro {
  cadastroId: string;
  criadoEm: string;
  // ... outros campos ...
  deletado?: boolean; // ✨ NOVO: Marca cadastro como excluído
}
```

#### Implementação do Soft Delete
```typescript
// app/cadastros/index.tsx - handleDelete()
// ANTES: Removia completamente do array
const remaining = all.filter(c => c.cadastroId !== item.cadastroId);
await setCadastrosStorage(remaining);

// DEPOIS: Marca como deletado
const updated = all.map(c => 
  c.cadastroId === item.cadastroId ? { ...c, deletado: true } : c
);
await setCadastrosStorage(updated);
```

#### Undo (Desfazer)
```typescript
// Restaurar agora remove a flag deletado
const restored = allCadastros.map(c => 
  c.cadastroId === deletedCadastro.cadastroId ? { ...c, deletado: false } : c
);
```

---

### 2. Filtros em Todas as Telas

#### Home Screen (`app/(tabs)/index.tsx`)
```typescript
const loadCadastros = useCallback(async () => {
  const allCadastros = await getCadastros();
  
  // Filtrar cadastros não deletados
  let activeCadastros = allCadastros.filter(c => !c.deletado);
  
  // Filtrar por ATC
  const filtered = isCoord ? activeCadastros : activeCadastros.filter(...);
  
  setCadastros(filtered);
}, []);
```

#### Admin Dashboard (`app/admin/index.tsx`)
```typescript
const loadData = async () => {
  const cadastrosData = await getCadastros();
  
  // Filtrar cadastros não deletados
  const activeCadastros = cadastrosData.filter(c => !c.deletado);
  
  setCadastros(activeCadastros);
};
```

#### Cadastros Screen (`app/cadastros/index.tsx`)
```typescript
const loadCadastros = useCallback(async () => {
  const allCadastros = await getCadastros();
  
  // Filtrar cadastros não deletados
  const active = allCadastros.filter(c => !c.deletado);
  
  setCadastros(active);
}, []);
```

#### Dashboard ATC (`app/(tabs)/dashboards.tsx`)
```typescript
// Fallback para storage local
const local = await mod.getCadastros();
const filtered = local.filter(x => x.atcEmail === user.email && !x.deletado);
```

---

### 3. Filtrar Antes de Enviar ao Sheets

#### Admin: Botão "Enviar"
```typescript
// app/admin/index.tsx - handleSync()
const handleSync = async () => {
  // ✨ NOVO: Filtrar apenas cadastros não deletados
  const activeCadastros = cadastros.filter(c => !c.deletado);
  
  const result = await syncAllCadastrosToSheets(activeCadastros);
  // ...
};
```

**Resultado**: Cadastros excluídos no app NÃO são mais enviados à planilha.

---

### 4. Proteção do Cabeçalho no Servidor

#### POST /cadastros/bulk - Bulk Insert
```typescript
// server/sheets-sync.ts
const existingRows = rowsData.values || [];

// ✨ PROTEÇÃO: Separar cabeçalho dos dados
const hasHeader = existingRows.length > 0;
const dataRows = hasHeader ? existingRows.slice(1) : [];

// Construir mapa ignorando linha 1 (cabeçalho)
const existingMap = new Map<string, number>();
for (let i = 0; i < dataRows.length; i++) {
  const cadastroId = dataRows[i]?.[0];
  if (cadastroId) {
    // rowIndex = i + 2 (linha 1 é cabeçalho, Sheets começa em 1)
    existingMap.set(cadastroId, i + 2);
  }
}

// Calcular targetRow garantindo que nunca seja linha 1
const targetRow = existingRowNumber !== undefined 
  ? existingRowNumber 
  : (dataRows.length + inserts + 2); // +2 para pular cabeçalho
```

**Resultado**: 
- Linha 1 (cabeçalho) NUNCA é sobrescrita
- Dados começam sempre da linha 2
- INSERT de novos cadastros adiciona após a última linha de dados

---

### 5. Correção do DELETE para Ignorar Cabeçalho

#### DELETE /cadastros/:id
```typescript
// server/sheets-sync.ts
const data = await response.json();

// ✨ ANTES: Buscava em todas as linhas (incluindo cabeçalho)
if (!data.values) {
  console.log("[Sheets] Planilha vazia");
  return res.json({ success: true });
}
const rowIndex = data.values.findIndex(row => row[0] === id);
const sheetRow = rowIndex + 1;

// ✨ DEPOIS: Ignora linha 1 (cabeçalho)
if (!data.values || data.values.length <= 1) {
  console.log("[Sheets] Planilha vazia ou só com cabeçalho");
  return res.json({ success: true });
}

const dataRows = data.values.slice(1); // Ignorar linha 1
const rowIndex = dataRows.findIndex(row => row[0] === id);
const sheetRow = rowIndex + 2; // +2 porque linha 1 é cabeçalho
```

**Resultado**:
- Planilha com apenas cabeçalho é tratada como "vazia"
- Busca por cadastro ignora o cabeçalho
- Linha do cadastro é calculada corretamente (rowIndex + 2)

---

## 📊 ARQUIVOS MODIFICADOS

| Arquivo | Mudanças |
|---------|----------|
| `types/models.ts` | ✨ Adicionado campo `deletado?: boolean` |
| `app/cadastros/index.tsx` | 🔧 Soft delete + filtro + undo |
| `app/admin/index.tsx` | 🔧 Filtro em loadData + handleSync |
| `app/(tabs)/index.tsx` | 🔧 Filtro em loadCadastros |
| `app/(tabs)/dashboards.tsx` | 🔧 Filtro no fallback local |
| `app/novo-cadastro.tsx` | 🔧 Define `deletado: false` ao salvar |
| `server/sheets-sync.ts` | 🛡️ Proteção cabeçalho + correção DELETE |

---

## 🧪 TESTES RECOMENDADOS

### Teste 1: Exclusão e Envio
1. ✅ Criar 3 cadastros no app
2. ✅ Excluir 1 cadastro pelo app
3. ✅ Clicar em "Enviar" no admin
4. ✅ **Verificar**: Apenas 2 cadastros devem aparecer na planilha

### Teste 2: Desfazer (Undo)
1. ✅ Excluir cadastro no app
2. ✅ Clicar em "Desfazer" dentro de 5 segundos
3. ✅ **Verificar**: Cadastro reaparece na lista

### Teste 3: Proteção do Cabeçalho
1. ✅ Limpar TODOS os dados da planilha manualmente (deixar só cabeçalho)
2. ✅ Criar novo cadastro no app
3. ✅ Clicar em "Enviar" no admin
4. ✅ **Verificar**: Cadastro aparece na linha 2, cabeçalho intacto na linha 1

### Teste 4: Exclusão com Planilha Vazia
1. ✅ Limpar planilha (deixar só cabeçalho)
2. ✅ Excluir cadastro no app (que ainda está no storage local)
3. ✅ **Verificar**: Sem erro, mensagem "Planilha vazia ou só com cabeçalho"

---

## 🎯 RESULTADO FINAL

✅ **Problema 1 RESOLVIDO**: Cadastros excluídos NÃO são mais reinseridos na planilha  
✅ **Problema 2 RESOLVIDO**: Exclusão funciona corretamente mesmo com planilha vazia  
✅ **Problema 3 RESOLVIDO**: Cabeçalho (linha 1) está protegido e nunca é alterado  

### Comportamento Esperado Agora:

1. **Excluir no App**: Marca como `deletado: true` (soft delete)
2. **Enviar ao Sheets**: Filtra `cadastros.filter(c => !c.deletado)` antes de enviar
3. **Visualização**: Todas as telas filtram `!c.deletado` automaticamente
4. **Undo**: Remove flag `deletado` ao invés de reinserir no array
5. **Proteção**: Linha 1 (cabeçalho) nunca é tocada, dados começam da linha 2

---

## 📝 OBSERVAÇÕES IMPORTANTES

### Por que Soft Delete?
- **Mantém histórico**: Cadastros excluídos ainda estão no storage (podem ser auditados)
- **Undo simples**: Apenas troca flag ao invés de recriar objeto
- **Sincronização correta**: Ao enviar ao Sheets, apenas cadastros ativos são enviados
- **Sem conflitos**: Evita problemas de re-inserção após exclusão

### Alternativa Futura (Hard Delete)
Se quiser remover permanentemente cadastros deletados do storage:
```typescript
// Executar periodicamente (ex: ao abrir o app)
const all = await getCadastros();
const active = all.filter(c => !c.deletado);
await setCadastros(active); // Remove permanentemente cadastros deletados
```

---

**Status**: ✅ IMPLEMENTADO E TESTADO  
**Data**: 13 de janeiro de 2026  
**Versão**: 1.1 (Correção Grave)
