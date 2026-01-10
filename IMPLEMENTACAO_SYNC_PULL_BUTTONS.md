# Implementação: Botões de Sincronização e Pull para Google Sheets

## Resumo Executivo

Implementamos funcionalidade completa de sincronização manual entre a aplicação local e Google Sheets para dois tipos de usuários:
- **ATC**: Botão "Sincronizar com Sheets" para enviar seus cadastros locais
- **ADMIN**: Botão "Enviar" (push) e "Atualizar" (pull) para gerenciar sincronização bidirecional

## 📋 Funcionalidades Implementadas

### 1. Novas Funções na `lib/google-sheets-sync.ts`

#### `syncAllCadastrosToSheets(cadastros: Cadastro[])`
- Envia múltiplos cadastros para Google Sheets em uma operação batch
- Detecta a próxima linha disponível automaticamente
- Usa PUT explícito (não append) para maior confiabilidade
- Retorna sucesso/erro com mensagem descritiva

```typescript
const result = await syncAllCadastrosToSheets(cadastros);
// result.success: boolean
// result.message: "7 cadastro(s) sincronizado(s) com sucesso"
```

#### `pullCadastrosFromSheets()`
- Baixa todos os cadastros do Google Sheets
- Parse com detecção de offset (compatível com headers desalinhados)
- Retorna array de Cadastro sem modificar storage local
- Permite que Admin mescle com dados locais

```typescript
const result = await pullCadastrosFromSheets();
// result.success: boolean
// result.cadastros: Cadastro[]
// result.message: "10 cadastro(s) baixado(s) do Sheets"
```

### 2. Interface ATC - Dashboard com Sync Button

**Localização**: `app/(tabs)/dashboards.tsx`

```tsx
// Novo botão acima dos cards de dashboard
<TouchableOpacity
  onPress={handleSync}
  disabled={isSyncing}
  className={`mb-4 py-3 px-4 rounded-lg ${isSyncing ? "bg-gray-300" : "bg-blue-500"}`}
>
  {isSyncing ? (
    <>
      <ActivityIndicator color="white" size="small" />
      <Text className="text-white font-bold ml-2">Sincronizando...</Text>
    </>
  ) : (
    <Text className="text-white font-bold">🔄 Sincronizar com Sheets</Text>
  )}
</TouchableOpacity>
```

**Comportamento**:
1. ATC clica "Sincronizar com Sheets"
2. App chama `processQueueOnce()` (processa fila de retentativas)
3. Mostra spinner durante sincronização
4. Recarrega dashboard
5. Exibe toast: "✅ Sincronizado - Seus dados foram sincronizados com sucesso"

### 3. Interface ADMIN - Dashboard com Sync + Pull Buttons

**Localização**: `app/admin/index.tsx` (aba Dashboard)

```tsx
// Botões lado a lado
<View className="flex-row gap-2">
  {/* Botão Enviar */}
  <TouchableOpacity
    onPress={handleSync}
    disabled={isSyncing}
    className={`flex-1 py-3 px-4 rounded-lg ${isSyncing ? "bg-gray-300" : "bg-blue-500"}`}
  >
    {isSyncing ? (
      <>
        <ActivityIndicator color="white" size="small" />
        <Text className="text-white font-bold ml-2">Sincronizando...</Text>
      </>
    ) : (
      <Text className="text-white font-bold">📤 Enviar</Text>
    )}
  </TouchableOpacity>

  {/* Botão Atualizar */}
  <TouchableOpacity
    onPress={handlePull}
    disabled={isPulling}
    className={`flex-1 py-3 px-4 rounded-lg ${isPulling ? "bg-gray-300" : "bg-green-500"}`}
  >
    {isPulling ? (
      <>
        <ActivityIndicator color="white" size="small" />
        <Text className="text-white font-bold ml-2">Baixando...</Text>
      </>
    ) : (
      <Text className="text-white font-bold">📥 Atualizar</Text>
    )}
  </TouchableOpacity>
</View>
```

**Fluxo Enviar (Sync)**:
1. Admin clica "📤 Enviar"
2. App chama `syncAllCadastrosToSheets(cadastros)` com todos os cadastros locais
3. Mostra spinner e desabilita botão durante operação
4. Exibe toast de sucesso com número de cadastros enviados

**Fluxo Atualizar (Pull)**:
1. Admin clica "📥 Atualizar"
2. App chama `pullCadastrosFromSheets()`
3. Mescla com dados locais (deduplica por `cadastroId`):
   - Se cadastroId não existe localmente: adiciona
   - Se existe: atualiza com versão do Sheets (versão mais recente)
4. Salva dados mesclados em storage local
5. Recalcula métricas do dashboard
6. Exibe toast de sucesso com número de cadastros baixados

### 4. Integração com Toast/Notificações

Usamos hook `useToast()` para exibir mensagens:

```typescript
const toast = useToast();

// Sucesso
toast.show("success", "✅ Sincronizado", "Seus dados foram sincronizados com sucesso");

// Erro
toast.show("error", "❌ Erro na sincronização", error_message);

// Info
toast.show("info", "ℹ️ Informação", "Mensagem informativa");
```

## 🧪 Suite de Testes

**Arquivo**: `tests/sync-buttons.integration.test.ts`

Total: **17 testes** - Todos passando ✅

### Categorias de Testes:

1. **ATC Sync Button - Queue Processing** (2 testes)
   - ✅ Processamento local de fila
   - ✅ Estrutura de dados para envio

2. **Admin Sync Button - Batch Preparation** (3 testes)
   - ✅ Preparação de múltiplos cadastros
   - ✅ Validação de lista vazia
   - ✅ Estrutura de dados em lote

3. **Admin Pull Button - Download from Sheets** (3 testes)
   - ✅ Download de cadastros
   - ✅ Integridade de dados
   - ✅ Estrutura de Cadastro correta

4. **Round-trip: Local → Sheets → Local** (2 testes)
   - ✅ Ciclo completo de sincronização
   - ✅ Merge sem conflitos

5. **Conflict Resolution** (1 teste)
   - ✅ Resolução de conflitos com dados mais recentes

6. **Partial Failure Handling** (1 teste)
   - ✅ Validação em lote com dados mistos

7. **Dashboard Metrics** (2 testes)
   - ✅ Estruturação de métricas
   - ✅ Cálculo com dados de exemplo

8. **User Experience Flows** (3 testes)
   - ✅ Fluxo ATC completo
   - ✅ Fluxo ADMIN completo
   - ✅ Transições de estado e mensagens de toast

### Rodar os Testes

```bash
npm run test -- tests/sync-buttons.integration.test.ts
```

Resultado esperado:
```
 Test Files  1 passed (1)
      Tests  17 passed (17)
```

## 📊 Fluxos Visuais

### Fluxo ATC: Sincronizar Localmente
```
┌─────────────────────────────────────────┐
│  Dashboard ATC                          │
│  ┌────────────────────────────────────┐ │
│  │  🔄 Sincronizar com Sheets       │ │
│  └────────────────────────────────────┘ │
│  [Seu perfil]                           │
│  Total: 5 cadastros                     │
│  Implantados: 2                         │
│  Potencial: R$ 15.000                   │
└─────────────────────────────────────────┘
         ↓ (clica botão)
┌─────────────────────────────────────────┐
│  Sincronizando...  ⏳                   │
└─────────────────────────────────────────┘
         ↓ (sucesso)
┌─────────────────────────────────────────┐
│  ✅ Sincronizado                        │
│  Seus dados foram sincronizados         │
│  com sucesso                            │
└─────────────────────────────────────────┘
```

### Fluxo ADMIN: Enviar + Atualizar
```
┌─────────────────────────────────────────┐
│  Dashboard Admin                        │
│  ┌──────────────────┬──────────────────┐ │
│  │ 📤 Enviar        │ 📥 Atualizar     │ │
│  └──────────────────┴──────────────────┘ │
│                                         │
│  Total: 7 cadastros                     │
│  ATCs: 3                                │
│  Implantados: 4                         │
│  Potencial: 45.000                      │
└─────────────────────────────────────────┘

ENVIAR: 📤
  1. Clica "📤 Enviar"
  2. App envia 7 cadastros locais
  3. Toast: "✅ Sincronizado - 7 cadastros enviados"

ATUALIZAR: 📥
  1. Clica "📥 Atualizar"
  2. App baixa cadastros do Sheets
  3. Mescla com local (deduplica)
  4. Recalcula métricas
  5. Toast: "✅ Atualizado - 10 cadastros baixados"
```

## 🔧 Mudanças Técnicas

### 1. Biblioteca `lib/google-sheets-sync.ts`

**Adicionado**:
- `syncAllCadastrosToSheets(cadastros)` - Batch write
- `pullCadastrosFromSheets()` - Batch read
- Funções internas para parse com offset detection

**Aprimorado**:
- Parsing de cadastros mais robusto
- Tratamento de headers desalinhados
- Mensagens de erro mais descritivas

### 2. ATC Dashboard `app/(tabs)/dashboards.tsx`

**Adicionado**:
- Hook `useToast` para notificações
- Estado `isSyncing` para controlar UI
- Função `handleSync()` para disparar sincronização
- Botão visual com spinner

**Importações Novas**:
- `useToast` from `@/lib/toast`
- `processQueueOnce` from `@/lib/sync-queue`

### 3. Admin Dashboard `app/admin/index.tsx`

**Adicionado**:
- Hook `useToast` para notificações
- Estados `isSyncing` e `isPulling`
- Função `handleSync()` para enviar todos os cadastros
- Função `handlePull()` para baixar e mesclar
- Dois botões lado a lado com feedback visual

**Importações Novas**:
- `syncAllCadastrosToSheets`, `pullCadastrosFromSheets` from sync lib
- `useToast` from `@/lib/toast`

## 🛡️ Tratamento de Erros

### Cenários Cobertos

1. **Sem Configuração do Sheets**
   - Verifica SPREADSHEET_ID e API_KEY
   - Retorna erro: "Google Sheets não configurado"

2. **Erro de Rede**
   - Captura erros HTTP
   - Toast com mensagem amigável
   - Estado UI volta ao normal

3. **Cadastros Inválidos em Batch**
   - Filtra apenas cadastros com cadastroId válido
   - Sincroniza os válidos
   - Toast informa número sincronizado

4. **Merge com Conflitos**
   - Deduplica por `cadastroId`
   - Prefere dados do Sheets (mais recentes)
   - Preserva histórico localmente

## 📱 Compatibilidade

- ✅ React Native (Expo)
- ✅ Web (expo-web)
- ✅ iOS
- ✅ Android
- ✅ TypeScript (tipagem completa)

## 🚀 Próximos Passos

### Sugestões de Melhoria:
1. **Edição Automática em Linha**: Em vez de append, atualizar linhas específicas por cadastroId
2. **Sincronização em Background**: Usar sync-queue com retry automático
3. **Histórico de Sincronização**: Registrar timestamps e status de cada sync
4. **Conflito de Dados**: Mostrar diff se dados locais ≠ Sheets
5. **Compressão de Dados**: Batch writes maiores (atualmente até ~100 linhas)

## 📚 Documentação Relacionada

- [Google Sheets API v4](https://developers.google.com/sheets/api)
- [Sincronização Background](./IMPLEMENTACAO_DELETION_UNDO.md)
- [Estrutura de Dados](./types/models.ts)

## ✅ Checklist de Implementação

- ✅ Funções `syncAllCadastrosToSheets` e `pullCadastrosFromSheets` implementadas
- ✅ UI Sync button para ATC
- ✅ UI Sync + Pull buttons para Admin
- ✅ Integração com Toast (notificações)
- ✅ Tratamento de erros completo
- ✅ Estados de loading (spinner)
- ✅ Merge de dados com deduplicação
- ✅ Recálculo de métricas após pull
- ✅ Teste suite (17 testes, todos passando)
- ✅ TypeScript com tipos corretos
- ✅ Documentação completa
