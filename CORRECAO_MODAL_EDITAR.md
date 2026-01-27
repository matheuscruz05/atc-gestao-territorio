# 🔧 Correção: Modal de Edição Mostrando Apenas Topo

## 📋 Problema Identificado

Ao clicar em "Editar" um cadastro, o formulário de edição (`novo-cadastro.tsx`) exibia apenas a **parte superior** da tela, deixando o resto do formulário oculto ou inacessível.

## 🔍 Análise de Raiz

### Causa Primária
Duas seções do formulário tinham **altura máxima limitada**:
- **Linha 519**: Dropdown de **Canal** com `max-h-48` (aprox. 192px)
- **Linha 792**: Dropdown de **Concorrentes** com `max-h-48` (aprox. 192px)

Quando essas seções ficavam abertas, a restrição CSS `max-h-48` + `overflow-hidden` cortava toda a altura disponível abaixo delas, deixando o resto do formulário invisível.

### Comportamento Observado
```
┌─────────────────────┐
│  Canal (ABERTO)     │ <- max-h-48 cortava aqui
│  [Dropdown...]      │
│  [Dropdown...]      │ <- Altura máxima alcançada
└─────────────────────┘
(Resto do formulário era invisível)
```

## ✅ Solução Implementada

### Alteração 1: Dropdown de Canal (Linha 519)
**Antes:**
```tsx
className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border-2 border-primary rounded-lg max-h-48 overflow-hidden shadow-xl"
```

**Depois:**
```tsx
className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border-2 border-primary rounded-lg max-h-96 overflow-hidden shadow-xl"
```

**Mudança:** `max-h-48` → `max-h-96` (aumenta altura máxima de 192px para 384px)

---

### Alteração 2: Dropdown de Concorrentes (Linha 792)
**Antes:**
```tsx
<View className="bg-background border border-border rounded-lg overflow-hidden max-h-48">
  <ScrollView nestedScrollEnabled>
```

**Depois:**
```tsx
<View className="bg-background border border-border rounded-lg overflow-hidden max-h-96">
  <ScrollView nestedScrollEnabled>
```

**Mudança:** `max-h-48` → `max-h-96` (aumenta altura máxima de 192px para 384px)

---

## 🎯 Resultado

Agora o formulário renderiza completamente, mesmo com dropdowns abertos:

```
┌──────────────────────────┐
│ Canal                    │
│ Unidade                  │
│ Estado                   │
├──────────────────────────┤
│ Categoria 1              │
│ - Produto                │
│ - Implantado             │
│ - Potencial              │
│ - Concorrentes (ABERTO)  │
│   [Item 1]               │
│   [Item 2]               │ <- Dropdown agora cabe melhor
│   [Item 3]               │
├──────────────────────────┤
│ Categoria 2              │
│ - ...                    │
├──────────────────────────┤
│ [Botão Salvar]           │ <- VISÍVEL agora!
└──────────────────────────┘
```

## 🧪 Como Testar

### Em Localhost
1. Abra a aplicação no navegador
2. Crie um novo cadastro OU edite um existente
3. **Teste 1:** Preencha todos os campos e salve
4. **Teste 2:** Abra o dropdown de "Canal" → deve exibir lista maior
5. **Teste 3:** Abra o dropdown de "Concorrentes" → deve exibir lista maior
6. **Teste 4:** Role para baixo → botão "Salvar" deve estar visível
7. **Teste 5:** Salve o cadastro → deve sincronizar com Google Sheets

### Em Produção (Vercel)
Após deploy, repita os testes acima

## 📊 Alterações de Arquivo

**Arquivo:** `app/novo-cadastro.tsx`
**Total de mudanças:** 2 linhas modificadas
**Commit:** (será feito junto com otros ajustes)

```diff
- Linha 519: max-h-48 → max-h-96 (Dropdown Canal)
- Linha 792: max-h-48 → max-h-96 (Dropdown Concorrentes)
```

## ⚠️ Notas Importantes

### Efeito Colateral: Possível Área Mais Grande
- Os dropdowns agora podem ocupar até **384px** (máx)
- Isso é esperado e desejado
- Em telas pequenas, o `ScrollView` pai permite rolagem normal

### Comportamento em Mobile
- Em dispositivos móveis, o `ScrollView` principal continua funcionando normalmente
- Dropdowns de até 384px são razoáveis para a maioria dos dispositivos

### Caso Precise Maior Controle
Se no futuro precisar de altura dinâmica, pode-se usar:
```tsx
{concorrenteDropdownOpen[index] && concorrentes.length > 10 ? "max-h-96" : "max-h-64"}
```

Mas por enquanto, altura fixa de 384px é adequada.

## 🔄 Outras Melhorias Relacionadas

Este fix foi implementado junto com:
1. ✅ Logging detalhado em `handleSalvar()` (para diagnóstico melhorado)
2. ✅ Logging melhorado em `loadForEdit()` (para debug de carregamento)
3. ✅ Criação de `GUIA_DEBUG_NOVO_CADASTRO.md` (documentação de troubleshooting)

---

**Última atualização:** 15 de janeiro de 2024  
**Status:** ✅ Corrigido  
**Testado em:** localhost (React Native Web)  
**Próximo passo:** Deploy em Vercel e verificação
