# Mudanças no Sistema de Potencial

## Resumo da Implementação

Foi implementada uma mudança crítica na estrutura de dados de potencial do sistema, conforme solicitado. Agora o sistema trabalha com dois campos de potencial e calcula o **Potencial Real** automaticamente.

## Novos Campos

### 1. **Potencial Atingido**
- Representa o potencial que o produtor **já utiliza** na área
- **Obrigatório** apenas quando "Produtor já utiliza?" = **Sim**
- Valor padrão: 0 (quando produtor não utiliza)

### 2. **Potencial Total**
- Representa o potencial **total da área** do produtor
- **Sempre obrigatório** (independente se já utiliza ou não)

### 3. **Potencial Real** (Calculado)
- Fórmula: `Potencial Real = Potencial Total - Potencial Atingido`
- Exemplo: Se potencial total = 1000 tons e atingido = 400 tons, então potencial real = 600 tons
- Este é o valor usado em **todos os KPIs do admin**

## Lógica de Validação

### Quando "Produtor já utiliza?" = **Sim**
- Deve preencher: **Potencial Atingido** + **Potencial Total**
- Ambos os campos são obrigatórios

### Quando "Produtor já utiliza?" = **Não**
- Deve preencher: **Potencial Total**
- Potencial Atingido = 0 (automático, pois o produtor não utiliza ainda)

## Mudanças Implementadas

### 1. **Tipos TypeScript** (`types/models.ts`)
- ✅ Interface `CategoriaData` atualizada com:
  - `potencialAtingido: number`
  - `potencialTotal: number`
  - `potencialValor?: number` (mantido para compatibilidade)

### 2. **Tela de Novo Cadastro** (`app/novo-cadastro.tsx`)
- ✅ Dois campos de potencial lado a lado (layout otimizado)
- ✅ Campo "Potencial Atingido" aparece apenas se "Sim" estiver selecionado
- ✅ Campo "Potencial Total" sempre visível
- ✅ Card informativo mostrando **Potencial Real** calculado em tempo real
- ✅ Validação condicional: zera potencial atingido se mudar para "Não"
- ✅ Migração automática de dados antigos para novo formato

### 3. **Dashboard Admin** (`app/admin/index.tsx`)
- ✅ Função helper `calcPotencialReal()` criada
- ✅ Todos os KPIs agora usam **Potencial Real**:
  - Card "Potencial Real (tons)"
  - Card "Potencial Real (litros)"
  - "ATC com Maior Potencial Real"
  - "Canal com Maior Potencial Real"
  - "Unidade com Maior Potencial Real"
  - Rankings por tons e litros
- ✅ Normalização automática de dados antigos

### 4. **Google Sheets Sync** (`lib/google-sheets-sync.ts`)
- ✅ Pull de dados do Sheets com migração automática
- ✅ Parse de JSON com suporte aos novos campos
- ✅ Fallback para formato antigo com conversão automática
- ✅ Envio de cadastros com estrutura JSON completa

### 5. **Listagem de Cadastros** (`app/cadastros/index.tsx`)
- ✅ Exibição de:
  - "Potencial Atingido" (quando aplicável)
  - "Potencial Total"
  - **"Potencial Real"** em destaque (card azul com ícone 💡)
- ✅ Validação atualizada para usar `potencialTotal`
- ✅ Migração automática de dados antigos

### 6. **Tela Principal ATC** (`app/(tabs)/index.tsx`)
- ✅ Migração automática de dados antigos
- ✅ Normalização consistente com novos campos

## Compatibilidade com Dados Antigos

O sistema foi desenvolvido com **migração automática** de dados antigos:

1. **Se cadastro tem apenas `potencialValor` antigo:**
   - Se `implantado === "Sim"`: 
     - `potencialAtingido = potencialValor`
     - `potencialTotal = potencialValor`
   - Se `implantado === "Não"`:
     - `potencialAtingido = 0`
     - `potencialTotal = potencialValor`

2. **Todas as telas fazem migração automática** ao carregar dados
3. **Google Sheets sync** também faz migração durante pull/sync

## Interface do Usuário

### Novo Cadastro - Seção de Potencial

```
Potencial *

[Potencial Atingido]     [Potencial Total]
  0 tons                   1000 tons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Potencial Real (disponível para captação)
   1000.0 tons
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Listagem de Cadastros

```
📊 Pot. Atingido: 400 tons
📊 Pot. Total: 1000 tons
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Pot. Real: 600.0 tons
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Próximos Passos Recomendados

1. **Testar no ambiente de desenvolvimento**
   - Criar novos cadastros com as duas opções (Sim/Não)
   - Verificar cálculos do Potencial Real
   - Testar edição de cadastros antigos

2. **Verificar Google Sheets**
   - Confirmar que a estrutura da planilha suporta JSON na coluna H
   - Testar sync bidirecional (push/pull)
   - Validar migração de dados antigos

3. **Documentar para usuários**
   - Criar guia explicando os novos campos
   - Treinar equipe sobre a diferença entre Potencial Atingido e Total

## Observações Técnicas

- ✅ Sem erros de compilação TypeScript
- ✅ Retrocompatibilidade garantida
- ✅ Migração transparente para usuários
- ✅ Todos os KPIs atualizados consistentemente
- ✅ Validações condicionais implementadas
- ✅ Layout responsivo e otimizado

---

**Data de Implementação:** 15 de janeiro de 2026
**Status:** ✅ Completo e testável
