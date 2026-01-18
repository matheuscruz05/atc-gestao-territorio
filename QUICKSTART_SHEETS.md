# 🚀 QUICK START - Google Sheets Sync Atualizado

## ⚡ 5 Passos para Começar

### 1️⃣ Verificar Estrutura da Planilha ✅

Abra sua planilha Google Sheets (`1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs`):

**Aba CADASTROS**:
- Deve ter **67 colunas** (A até AU)
- Cabeçalho na linha 1 com nomes de colunas
- Categorias fixas preenchidas nas linhas 2-6 (coluna H, P, X, AF, AN)

**Aba USUARIOS**:
- Deve ter **7 colunas** (A até G)
- Colunas: EMAIL, NOME, ROLE, SENHA, ATIVO, **GC**, **GR** (novas)

✅ **Status**: Ambas as abas devem estar atualizadas pelo script `update-sheets-structure.ts`

---

### 2️⃣ Limpar Cadastros Antigos (Opcional)

Se já tem cadastros no app com formato antigo, recomenda-se limpar:

**Option A: Via Browser Console**
```javascript
// Abrir DevTools (F12)
// Ir para Console
// Executar:
localStorage.removeItem('cadastros');
localStorage.removeItem('usuarios');
localStorage.removeItem('produtos');
localStorage.removeItem('canais');
localStorage.removeItem('unidades');
// Recarregar página
```

**Option B: Via App**
- Uninstall e reinstall do app (se Expo)

---

### 3️⃣ Criar Novo Cadastro com 5 Categorias

**Steps**:
1. Fazer login no app
2. Ir para "Novo Cadastro"
3. Preencher **dados base** (obrigatórios):
   - Canal: `Seu Canal`
   - Unidade: `Kg` ou `Litro` ou `Ton`
   - Estado: `SP` ou seu estado

4. Preencher **pelo menos UMA categoria**:
   - Ir para a aba "FERTILIZANTE - BASE" (ou outra)
   - Preencher:
     - Produto Ref: `REF-001`
     - Produto Livre: `Nome do Produto`
     - Unidade Potencial: `Kg`
     - Implantado: `SIM` ou `NÃO`
     - Potencial: `1000` (número)
     - Concorrentes: `Empresa X, Empresa Y`
     - Observação: `Alguma nota`

5. **Repetir para outras categorias** (opcional, não precisa preencher as 5)

6. Clicar "**Salvar Cadastro**"

✅ **Resultado**: Cadastro criado localmente com suporte a 5 categorias

---

### 4️⃣ Sincronizar para Google Sheets

**Steps**:
1. Voltar para "**Meus Cadastros**"
2. Encontrar o cadastro que criou
3. Clicar "**Sincronizar**" (botão verde)
4. Esperar mensagem: "Cadastro sincronizado com sucesso"

✅ **Resultado**: Dados enviados para planilha Google Sheets

---

### 5️⃣ Validar na Planilha Google Sheets

**Steps**:
1. Abrir planilha: `1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs`
2. Ir para aba "**CADASTROS**"
3. **Verificar última linha preenchida**:
   - Colunas A-G devem ter seus dados base (Canal, Unidade, Estado)
   - Colunas H-O devem ter dados da Categoria 1 (FERTILIZANTE - BASE)
   - Colunas P-W devem ter dados da Categoria 2 (ou vazio)
   - ...

4. **Validar formato**:
   ```
   | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | ... | AU |
   |id |dt |email|nome|canal|unit|est|cat|ref|livre|un|imp|pot|conc|obs|cat|ref|...|obs|
   ```

✅ **Resultado**: Dados aparecem corretamente na planilha com 67 colunas

---

## 🧪 Testes Rápidos

### Teste 1: Cadastro Completo (5 categorias)
```
App: Criar cadastro com 5 categorias preenchidas
✓ Sincronizar
✓ Verificar planilha (67 colunas, todas com dados)
```

### Teste 2: Cadastro Parcial (3 categorias)
```
App: Criar cadastro com 3 categorias (2 e 4 vazias)
✓ Sincronizar
✓ Verificar planilha (categorias 2 e 4 em branco, outras com dados)
```

### Teste 3: Atualizar e Resincronizar
```
App: Editar cadastro existente
✓ Mudar valor do Potencial (ex: 1000 → 2000)
✓ Sincronizar
✓ Verificar planilha (valor atualizado)
```

### Teste 4: Admin Sync em Massa
```
App (Admin): Ir para painel de Cadastros
✓ Clicar "Sincronizar Tudo"
✓ Esperar sucesso
✓ Verificar planilha (múltiplas linhas adicionadas)
```

---

## 📊 Estrutura de Dados Esperada

### Exemplo na Planilha

```
Coluna  | A          | B  | C           | D      | E     | F    | G  | H                   | I      | ...
Tipo    | CADASTRO_ID| DT | ATC_EMAIL   | NOME   | CANAL | UNID | EST| CAT1_CATEGORIA      | REF    | ...
Linha 1 | Header     | Header        |                                                          
Linha 2 | 12345      | 2024-01-15    | user@ex| João  | Var  | Kg   | SP | FERTILIZANTE -BASE | REF-001| ...
```

### Valores Especiais

| Campo | Valores | Exemplo |
|-------|---------|---------|
| IMPLANTADO | "SIM" / "NÃO" | SIM |
| POTENCIAL | Número | 1000 |
| CATEGORIA | Texto fixo | FERTILIZANTE - BASE |
| ESTADO | Sigla | SP, MG, SC |

---

## ❌ Problemas Comuns e Soluções

### "Cadastro não sincronizou"
1. Verificar conexão de internet
2. Verificar se app está acessível a Google Sheets API
3. Verificar credenciais em `.env.local`
4. Abrir console (F12) para ver erro específico

### "Colunas desalinhadas"
1. Verificar se planilha tem 67 colunas
2. Se não, executar: `npx tsx scripts/update-sheets-structure.ts`
3. Recarregar app e tentar novamente

### "Dados incompletos"
1. Verificar se categoria está preenchida no app
2. Verificar se todas as categorias têm 8 campos cada
3. Se categoria está vazia no app, as colunas ficarão em branco na planilha (normal)

### "Erro de autenticação"
1. Verificar se `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` está no `.env.local`
2. Verificar se arquivo `./secrets/sa-key.json` existe
3. Verificar se Service Account tem acesso à planilha compartilhada

---

## 📈 Fluxo Completo Visual

```
┌─────────────────────────────┐
│   Usuário final no App      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Novo Cadastro (5 cats)    │
│   ✓ Canal, Unidade, Estado  │
│   ✓ Cat 1, 2, 3, 4, 5       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   Clica "Sincronizar"       │
└──────────────┬──────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ sendCadastroToSheets │
    │ (67 colunas)         │
    └──────────────┬───────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Google Sheets API   │
        │ PUT v4/spreadsheets │
        └──────────────┬──────┘
                       │
                       ▼
            ┌────────────────────┐
            │  Nova Linha        │
            │  CADASTROS!A:AU    │
            │  (67 colunas)      │
            └────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────┐
    │ ✅ Sucesso                   │
    │ "Cadastro sincronizado"      │
    └──────────────────────────────┘
```

---

## 🔧 Arquivo de Configuração

### `.env.local` (Exemplo)

```env
EXPO_PUBLIC_GOOGLE_SHEETS_ID=1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=AIzaSyBNET7Szj8kedgcjDWj1Ix0Vf8V33W6CSQ
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./secrets/sa-key.json
```

### `./secrets/sa-key.json` (Estrutura)

```json
{
  "type": "service_account",
  "project_id": "atc-gestao-territorio-483803",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "atc-gestao-territorio-sa@...",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

---

## 📞 Suporte Rápido

| Problema | Ação |
|----------|------|
| Planilha não tem 67 colunas | Execute: `npx tsx scripts/update-sheets-structure.ts` |
| Autenticação falha | Verifique `.env.local` e `./secrets/sa-key.json` |
| Dados não sincronizados | Verifique console (F12) para erros |
| Performance lenta | Verifique conexão de internet |

---

**Versão**: 1.0
**Status**: 🟢 Pronto
**Suporte**: Consulte `DOCUMENTACAO_TECNICA_SHEETS.md` para mais detalhes
