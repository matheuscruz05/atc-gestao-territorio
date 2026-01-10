# 🧪 Guia de Testes dos Dashboards

## Resumo das Correções

✅ **Dashboard agora funciona com dados locais!**

### O Problema
Os dashboards mostravam "0" porque a função `getDashboardMetricas()` tentava buscar dados do Google Sheets, que não estava configurado. Retornava array vazio.

### A Solução
- Modificado `getDashboardMetricas()` para aceitar dados locais como parâmetro
- Modificado `admin.tsx` para buscar dados locais **antes** de chamar a função de métricas
- Implementado fallback automático: se Sheets não estiver configurado, usa dados locais

## ✅ Testes Automatizados

Todos os testes de Google Sheets **PASSAM**:

```bash
✓ tests/google-sheets-sync.test.ts (4 tests) 4ms
  ✓ Google Sheets Sync › authenticateWithSheets › deve retornar erro quando Sheets não está configurado
  ✓ Google Sheets Sync › getDashboardMetricas › deve retornar métricas padrão quando Sheets não está configurado
  ✓ Google Sheets Sync › getDashboardMetricas › deve processar cadastros locais e gerar métricas corretas
  ✓ Google Sheets Sync › syncCadastrosFromSheets › deve retornar array vazio quando Sheets não está configurado
```

### Execute os testes:
```bash
pnpm test tests/google-sheets-sync.test.ts
```

## 🧪 Testes Manuais

### 1️⃣ Teste: Dashboard mostra 16 cadastros
**Pré-requisitos:**
- App com 16 cadastros salvos localmente
- Google Sheets **NÃO** configurado

**Passos:**
1. Abra o app: `pnpm dev`
2. Faça login como coordenador: `coord@atc.com` / `123456`
3. Vá para a aba **"Admin"**
4. Clique na aba **"📊 Dashboard"**

**Resultado Esperado:**
- Card "Total de Cadastros" mostra: **16** ✅
- Card "ATCs Ativos" mostra: **2 ou mais** ✅
- Card "Implantados" mostra: **número correto** ✅
- Card "Potencial Total" mostra: **valor correto em R$** ✅

### 2️⃣ Teste: Gráfico "Cadastros por Categoria"
**Pré-requisitos:** Mesmos do teste 1

**Passos:**
1. Na aba "Dashboard", scroll down
2. Procure por "📊 Cadastros por Categoria"

**Resultado Esperado:**
- Mostra categorias: HIDROSSOLÚVEL, DRY, etc
- Cada barra mostra número de cadastros por categoria
- Exemplo: HIDROSSOLÚVEL: 5, DRY: 8, etc

### 3️⃣ Teste: Gráfico "Cadastros por ATC"
**Pré-requisitos:** Mesmos do teste 1

**Passos:**
1. Na aba "Dashboard", scroll down
2. Procure por "Cadastros por ATC"

**Resultado Esperado:**
- Mostra nomes dos ATCs: ATC 1, ATC 2, etc
- Cada barra mostra quantos cadastros cada ATC tem
- Exemplo: ATC 1: 8, ATC 2: 8

### 4️⃣ Teste: Lista "Top 5 Produtos"
**Pré-requisitos:** Mesmos do teste 1

**Passos:**
1. Na aba "Dashboard", scroll down
2. Procure por "🏆 Top 5 Produtos"

**Resultado Esperado:**
- Mostra produtos em ordem decrescente
- Barra de progresso para cada produto
- Exemplo:
  - Produto A: ████████ 5 cadastros
  - Produto B: ████░░░░ 3 cadastros

### 5️⃣ Teste: Lista "Cadastros por Unidade"
**Pré-requisitos:** Mesmos do teste 1

**Passos:**
1. Na aba "Dashboard", scroll down
2. Procure por "🏢 Cadastros por Unidade"

**Resultado Esperado:**
- Mostra unidades: BELO HORIZONTE, MINAS GERAIS, etc
- Número de cadastros por unidade
- Barras de progresso

### 6️⃣ Teste: Pull-to-Refresh (Atualizar Dados)
**Pré-requisitos:** Mesmos do teste 1

**Passos:**
1. Na aba "Dashboard"
2. Puxe a tela para baixo (pull-to-refresh)
3. Veja o indicador de carregamento

**Resultado Esperado:**
- Dados são recarregados
- Métricas se atualizam com valores corretos

### 7️⃣ Teste: Outros Tabs do Admin
**Pré-requisitos:** Mesmos do teste 1

**Passos:**
1. Na tela Admin, clique em cada aba:
   - 👥 Usuários
   - 📦 Produtos
   - 📢 Canais
   - 🏢 Unidades
   - 📋 Cadastros

**Resultado Esperado:**
- Cada aba carrega dados corretamente
- Mostra listas com informações
- Sem erros ou crashes

## 📊 Estrutura Interna

### Fluxo de Dados do Dashboard

```
Admin.tsx (loadData)
├─ getCadastros() → Busca dados locais
├─ getUsuarios() → Busca dados locais
├─ getDashboardMetricas(cadastrosLocais, usuariosLocais)
│  ├─ Recebe dados locais
│  ├─ Processa contagens
│  └─ Retorna métricas prontas
├─ setMetricas(metricasData)
└─ Renderiza componentes com dados
   ├─ DashboardCard (KPIs)
   ├─ DashboardChartBar (Gráficos)
   └─ DashboardList (Listas)
```

### Teste de Integração: Cria Cadastro → Vê no Dashboard

**Passos:**
1. Faça login como ATC: `atc1@atc.com` / `123456`
2. Vá para "Novo Cadastro"
3. Preencha e salve um cadastro
4. Volte para "Admin" → "Dashboard"
5. Puxe para atualizar (pull-to-refresh)

**Esperado:**
- O card "Total de Cadastros" incrementa em 1
- O gráfico "Cadastros por ATC" mostra novo valor
- O "Top 5 Produtos" atualiza com o novo produto

## 🔧 Troubleshooting

### Problema: Dashboard mostra 0 para tudo
**Solução:**
- Verifique se há dados salvos localmente
- Execute: `curl http://localhost:3000/api/debug` (se implementado)
- Clique em "Pull to Refresh" na tela

### Problema: Não aparece o Pull to Refresh
**Solução:**
- Certifique-se de estar na aba "Dashboard"
- Tente em um dispositivo real/emulador (não web)
- Verifique console para erros: `pnpm dev`

### Problema: App não compila
**Solução:**
```bash
# Limpar cache
rm -rf node_modules/.vite
pnpm clean

# Reinstalar
pnpm install
pnpm check
```

## 📝 Resumo das Mudanças

### 1. `lib/google-sheets-sync.ts`
```typescript
// ANTES: Não aceitava dados locais
export async function getDashboardMetricas(): Promise<{...}>

// DEPOIS: Aceita dados locais como fallback
export async function getDashboardMetricas(
  cadastrosLocais?: Cadastro[], 
  usuariosLocais?: Usuario[]
): Promise<{...}>
```

### 2. `app/(tabs)/admin.tsx`
```typescript
// ANTES: Chamava getDashboardMetricas() sem dados
const metricasData = await getDashboardMetricas();

// DEPOIS: Passa dados locais como fallback
const [usuariosData, ..., cadastrosData] = await Promise.all([...]);
const metricasData = await getDashboardMetricas(cadastrosData, usuariosData);
```

## ✅ Checklista de Validação

- [ ] Dashboard mostra 16 cadastros (ou número correto)
- [ ] "Cadastros por Categoria" mostra dados
- [ ] "Cadastros por ATC" mostra dados
- [ ] "Top 5 Produtos" lista produtos corretamente
- [ ] "Cadastros por Unidade" mostra unidades
- [ ] Pull-to-Refresh funciona
- [ ] App não mostra erros no console
- [ ] TypeScript valida sem erros: `pnpm check` ✅
- [ ] Testes passam: `pnpm test tests/google-sheets-sync.test.ts` ✅

## 🎯 Próximos Passos

1. **Quando Google Sheets estiver configurado:**
   - Os dados virão do Sheets automaticamente
   - Fallback para dados locais se Sheets falhar
   - Sincronização em tempo real

2. **Para melhorar o app:**
   - Adicionar gráficos mais bonitos (react-native-svg)
   - Adicionar filtros de data
   - Exportar dados em PDF/Excel
   - Notificações em tempo real
