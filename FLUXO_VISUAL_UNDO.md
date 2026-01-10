# 📊 FLUXO VISUAL: Sincronização + Undo

## 🎯 Diagrama Completo do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                     TELA DE CADASTROS (Admin)                       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Cadastro: Fertilizante XYZ                                   │  │
│  │ ─────────────────────────────────────────────────────────    │  │
│  │ Categoria: FERTILIZANTE - BASE                              │  │
│  │ Estado: RS • Implantado: Sim                                 │  │
│  │                                                              │  │
│  │ [Editar] [Excluir] ← Admin buttons (isCoord only)          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Clica "Excluir"
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Alert: "Confirmar exclusão?"                                        │
│ ─────────────────────────────────────────────────────────────────── │
│ Deseja excluir o cadastro "Fertilizante XYZ"?                      │
│                                                                      │
│  [Cancelar]           [Excluir] ← Clica aqui                       │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Confirmado
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PROCESSAMENTO (Backend)                                             │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│ 1. Guardar em memória                                              │
│    deletedCadastroRef.current = {id, nome, ...props}              │
│    ✅                                                               │
│                                                                      │
│ 2. Remover localmente                                              │
│    await setCadastrosStorage(remaining)                            │
│    ✅                                                               │
│                                                                      │
│ 3. Remover do Sheets (BACKGROUND)                                 │
│    deleteCadastroFromSheets(cadastroId)                            │
│    ✅ (não bloqueia se falhar)                                     │
│                                                                      │
│ 4. Recarregar lista                                                │
│    await loadCadastros()                                           │
│    ✅                                                               │
│                                                                      │
│ 5. Iniciar timeout de 5 segundos                                  │
│    undoTimeoutRef.current = setTimeout(...)                        │
│    ✅                                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Exibir Alert de Undo
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Alert: "✅ Cadastro Excluído"                                      │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│ "Fertilizante XYZ" foi excluído.                                  │
│ Desfazer nos próximos 5 segundos?                                 │
│                                                                      │
│  [Desfazer]            [Manter exclusão]                           │
│       │                        │                                    │
│       ▼                        ▼                                    │
│   CENÁRIO A              CENÁRIO B                                 │
│   (se < 5s)              (ou timeout)                              │
└─────────────────────────────────────────────────────────────────────┘
              │                                         │
              ├─────────────────────────────────────────┤
              │                                         │
              ▼                                         ▼
┌──────────────────────────────┐      ┌──────────────────────────────┐
│ UNDO ACIONADO ✅              │      │ FINALIZAR EXCLUSÃO ✅         │
│ ──────────────────────────── │      │ ──────────────────────────── │
│                              │      │                              │
│ 1. Verificar disponibilidade │      │ 1. Limpar referência         │
│    undoAvailable === true    │      │    deletedCadastroRef = null │
│    ✅                         │      │    ✅                         │
│                              │      │                              │
│ 2. Restaurar cadastro        │      │ 2. Limpar timeout            │
│    allCadastros.push(        │      │    clearTimeout()             │
│      deletedCadastroRef...)  │      │    ✅                         │
│    ✅                         │      │                              │
│                              │      │ 3. Dados permanentemente     │
│ 3. Recarregar lista          │      │    descartados               │
│    await loadCadastros()     │      │    ❌ Sem recuperação        │
│    ✅                         │      │                              │
│                              │      │                              │
│ 4. Mostrar sucesso           │      │ CADASTRO DELETADO            │
│    Alert: "✅ Restaurado"    │      │ (sem undo)                   │
│    ✅                         │      │                              │
│                              │      │                              │
└──────────────────────────────┘      └──────────────────────────────┘
```

---

## ⏱️ TIMELINE: 5 SEGUNDOS DE UNDO

```
┌────────────────────────────────────────────────────────────────┐
│ DELETAR CADASTRO                                               │
│ ├─ 0ms:   Cadastro removido do storage                         │
│ ├─ 50ms:  Solicitação enviada ao Sheets API                   │
│ ├─ 100ms: Alert de undo exibido                               │
│ │                                                              │
│ │ ┌─ JANELA DE UNDO: 5 SEGUNDOS ───────────────────────────┐ │
│ │ │                                                         │ │
│ │ ├─ 500ms:  Usuário pode clicar "Desfazer" ✅           │ │
│ │ ├─ 2000ms: Usuário pode clicar "Desfazer" ✅           │ │
│ │ ├─ 4999ms: ÚLTIMA OPORTUNIDADE "Desfazer" ✅           │ │
│ │ │                                                        │ │
│ │ └─ 5000ms: TIMEOUT EXPIRADO ❌ (sem mais undo)        │
│ │                                                         │ │
│ │     ├─ undoAvailable = false                            │ │
│ │     ├─ deletedCadastroRef.current = null               │ │
│ │     ├─ clearTimeout(undoTimeoutRef)                    │ │
│ │     └─ Dados descartados permanentemente               │ │
│ │                                                         │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                              │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔄 SINCRONIZAÇÃO COM GOOGLE SHEETS

### Fase 1: DELETE via API
```
┌─────────────────────────────────────────────────────────────┐
│ Local Storage                  Google Sheets API             │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ deleteCadastroFromSheets()                                  │
│  ├─ Buscar cadastro em CADASTROS!A:A                       │
│  │  Request: GET /values/CADASTROS!A:A                     │
│  │  ✅                                                       │
│  │                                                          │
│  ├─ Encontrar rowIndex                                      │
│  │  loop através dos dados                                  │
│  │  cadastroId === encontrado na linha X                   │
│  │  ✅                                                       │
│  │                                                          │
│  └─ Deletar linha                                           │
│     Tentar: DELETE /values/CADASTROS!AX:OX                 │
│     Se falhar: PUT com valores vazios                       │
│     ✅ (em background)                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Fase 2: Background Sync
```
┌─────────────────────────────────────────────────────────────┐
│ Timeline de Sincronização                                   │
│ ──────────────────────────────────────────────────────────  │
│                                                              │
│ T=0ms:   Delete iniciado (background)                       │
│          ↓                                                   │
│ T=50ms:  Request chega ao Sheets API                        │
│          ↓                                                   │
│ T=150ms: Resposta retorna                                   │
│          ├─ Se sucesso: ✅ Cadastro removido do Sheets     │
│          └─ Se erro: ⚠️ Aviso no console (não bloqueia)   │
│                                                              │
│ ✅ LOCAL: Cadastro sempre removido (no storage)             │
│ ⚠️ SHEETS: Pode falhar, mas recuperável na próxima sync   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 ESTADO EM DIFERENTES PONTOS

### Estado 1: Antes de Deletar
```typescript
// Storage
cadastros = [
  { cadastroId: "123", nome: "Fert A", ... },
  { cadastroId: "456", nome: "Fert B", ... },
]

// Refs
deletedCadastroRef = null
undoAvailable = undefined
```

### Estado 2: Deletado (antes do alert)
```typescript
// Storage
cadastros = [
  { cadastroId: "456", nome: "Fert B", ... },
  // "123" removido
]

// Refs
deletedCadastroRef = { cadastroId: "123", nome: "Fert A", ... }
undoAvailable = true
undoTimeoutRef = setTimeout(..., 5000)

// Sheets
// Requisição de DELETE/PUT enviada (em background)
```

### Estado 3: Undo Clicado
```typescript
// Storage
cadastros = [
  { cadastroId: "456", nome: "Fert B", ... },
  { cadastroId: "123", nome: "Fert A", ... },  // Restaurado!
]

// Refs
deletedCadastroRef = null  // Limpado
undoAvailable = false      // Timeout cancelado

// UI
Alert: "✅ Restaurado"
```

### Estado 4: Timeout Expirado (sem undo)
```typescript
// Storage
cadastros = [
  { cadastroId: "456", nome: "Fert B", ... },
  // "123" permanentemente removido
]

// Refs
deletedCadastroRef = null  // Limpado
undoAvailable = false      // Timeout disparado

// Sheets
// DELETE/PUT completado com sucesso
```

---

## 🔀 ÁRVORE DE DECISÃO

```
┌─ USUÁRIO CLICA "EXCLUIR"
│
├─ CANCELAR?
│  └─ Sim: Voltar para lista (sem mudanças)
│  └─ Não: Continuar...
│
├─ DELETAR CONFIRMADO
│  ├─ Remover localmente ✅
│  ├─ Enviar ao Sheets (bg) ✅
│  └─ Exibir Alert de undo ✅
│
└─ ALERT DE UNDO (5 segundos)
   │
   ├─ DESFAZER CLICADO?
   │  ├─ Sim (< 5s):
   │  │  ├─ Restaurar cadastro ✅
   │  │  ├─ Recarregar lista ✅
   │  │  └─ Alert: "✅ Restaurado" ✅
   │  │
   │  └─ Não (ou > 5s):
   │     ├─ Manter exclusão ✅
   │     ├─ Dados descartados ✅
   │     └─ Sheets já sincronizado ✅
   │
   └─ FIM (Cadastro permanentemente deletado ou restaurado)
```

---

## 💾 DADOS PERSISTIDOS

### O QUE É PRESERVADO DURANTE UNDO

```
deletedCadastroRef.current = {
  ✅ cadastroId:      "123",
  ✅ produtoRef:      "PROD-001",
  ✅ produtoNomeLivre: "Fertilizante XYZ",
  ✅ categoria:        "FERTILIZANTE - BASE",
  ✅ canal:            "Distribuidor",
  ✅ unidade:          "Kg",
  ✅ estado:           "RS",
  ✅ atcNome:          "ATC Test",
  ✅ implantado:       "Sim",
  ✅ potencialValor:   100,
  ✅ unidadePotencial: "Kg",
  ✅ criadoEm:         "2024-01-15T10:30:00Z",  ← IMPORTANTE!
  ✅ ... (todas as propriedades)
}
```

---

## 🛡️ ERROR HANDLING

```
┌─────────────────────────────────────────────────────────────┐
│ POSSÍVEIS ERROS E TRATAMENTO                                │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ 1. Sheets API Error                                         │
│    └─ Solução: Log em console, continue (local já deletado) │
│    └─ Resultado: Usuário vê undo, dados safe               │
│                                                              │
│ 2. Storage Error ao deletar local                           │
│    └─ Solução: Try/catch com Alert                          │
│    └─ Resultado: Aviso ao usuário, sem deletar             │
│                                                              │
│ 3. Timeout expirado antes de undo clicado                   │
│    └─ Solução: Limpar refs, desabilitar botão              │
│    └─ Resultado: Aviso "Tempo expirado"                    │
│                                                              │
│ 4. Múltiplas deleções rápidas                               │
│    └─ Solução: Sobrescrever ref (last-one-wins)            │
│    └─ Resultado: Apenas último deletion é reversível      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 PERFORMANCE

```
┌─────────────────────────────────────────────────────────────┐
│ TEMPOS DE EXECUÇÃO (ms)                                     │
│ ─────────────────────────────────────────────────────────── │
│                                                              │
│ Deletar localmente           : ~5ms                          │
│ Enviar ao Sheets (bg)        : ~50-200ms                    │
│ Exibir alert                 : ~0ms (imediato)              │
│ Recarregar lista             : ~10-30ms                     │
│ Restaurar (undo)             : ~10-40ms                     │
│                                                              │
│ Total (sync): ~70-270ms                                     │
│ Total (UI bloqueado): ~0ms (tudo é async!)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 RESUMO VISUAL

```
╔═══════════════════════════════════════════════════════════╗
║              FLUXO DE DELETAÇÃO + UNDO                    ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  👤 Usuário clica "Excluir"                             ║
║       ↓                                                   ║
║  🔔 Alert de confirmação                                ║
║       ↓                                                   ║
║  ❌ Cadastro deletado (local + Sheets em bg)            ║
║       ↓                                                   ║
║  🔄 Alert de undo (5 segundos)                          ║
║       ├─ 👆 Desfazer → ✅ Restaurado                    ║
║       └─ ⏱️ Timeout → ❌ Permanentemente deletado        ║
║                                                           ║
║  ✅ Tudo sincronizado com Sheets                         ║
║  ✅ Data integrity preservada                            ║
║  ✅ Recuperação segura (5s window)                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- [IMPLEMENTACAO_DELETION_UNDO.md](IMPLEMENTACAO_DELETION_UNDO.md) - Detalhes técnicos
- [CONCLUSAO_DELETION_UNDO.md](CONCLUSAO_DELETION_UNDO.md) - Status final
- [tests/test-sheets-deletion.test.ts](tests/test-sheets-deletion.test.ts) - Testes
