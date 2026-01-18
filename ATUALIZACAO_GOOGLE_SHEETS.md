# Atualização Google Sheets - 5 Categorias

## ✅ Etapas Concluídas

### 1. **Atualização da Planilha Google Sheets** ✓
- **Script executado**: `scripts/update-sheets-structure.ts`
- **Data de execução**: Hoje
- **Status**: ✅ Sucesso

#### Alterações realizadas:

##### **Aba CADASTROS**
- **Nova estrutura**: 67 colunas (A-AU)
- **Colunas base** (A-G):
  - A: CADASTRO_ID
  - B: CRIADO_EM
  - C: ATC_EMAIL
  - D: ATC_NOME
  - E: CANAL
  - F: UNIDADE
  - G: ESTADO

- **5 Blocos de Categorias** (H-AU):
  - **Categoria 1** (H-O): FERTILIZANTE - BASE
  - **Categoria 2** (P-W): FERTILIZANTES - COBERTURA
  - **Categoria 3** (X-AE): BIOLÓGICOS - INOCULANTES
  - **Categoria 4** (AF-AM): BIOLÓGICOS - FOLIARES
  - **Categoria 5** (AN-AU): HIDROSSOLÚVEIS

- **Cada categoria contém 8 campos**:
  1. CATEGORIA
  2. PRODUTO_REF
  3. PRODUTO_LIVRE
  4. UNIDADE_POT
  5. IMPLANTADO (SIM/NÃO)
  6. POTENCIAL (número)
  7. CONCORRENTES
  8. OBSERVACAO

##### **Aba USUARIOS**
- **Nova estrutura**: 7 colunas (A-G)
- **Colunas adicionadas**:
  - F: GC (novo)
  - G: GR (novo)
- **Colunas originais mantidas**:
  - A: EMAIL
  - B: NOME
  - C: ROLE
  - D: SENHA
  - E: ATIVO

---

### 2. **Atualização do Código de Sincronização** ✓
- **Arquivo modificado**: `lib/google-sheets-sync.ts`

#### Funções atualizadas:

##### **`sendCadastroToSheets(cadastro: Cadastro)`**
- **Antes**: Enviava 15 colunas (A-O) com formato single-category
- **Depois**: Envia 67 colunas (A-AU) com 5 categorias
- **Lógica**:
  1. Coloca dados base nas colunas A-G
  2. Itera sobre o array `cadastro.categorias` (máx 5 itens)
  3. Extrai 8 campos por categoria
  4. Preenche colunas H-AU com dados das categorias
  5. Completa com espaços vazios se necessário

##### **`syncAllCadastrosToSheets(cadastros: Cadastro[])`**
- **Antes**: Batch sync com 15 colunas por linha
- **Depois**: Batch sync com 67 colunas por linha
- **Mudança de range**: A-O → A-AU

##### **`deleteCadastroFromSheets(cadastroId: string)`**
- **Antes**: Deletava range A-O
- **Depois**: Deleta range A-AU
- **Motivo**: Consistência com nova estrutura

---

## 🔧 Como Funciona Agora

### Fluxo de Sincronização:

```
App (novo cadastro com 5 categorias)
    ↓
Usuário clica "Sincronizar"
    ↓
sendCadastroToSheets() é chamado
    ↓
Dados são transformados:
  - Base: 7 colunas (A-G)
  - Categorias: 40 colunas (H-AU)
    Total: 67 colunas
    ↓
Google Sheets API PUT request
    ↓
Nova linha criada na aba CADASTROS
    ↓
✅ "Cadastro sincronizado com sucesso"
```

### Exemplo de Dados Enviados:

```
| A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | ... |
|---|---|---|---|---|---|---|----|-------|--------|---|----|----|----|----|---|
| ID| DT| EMAIL| NOME| CANAL| UNIDADE| ESTADO|CAT1|REF1|LIVR1|UN1|IMP1|POT1|CONC1|OBS1|CAT2|REF2| ... |
```

---

## ✅ Validação

### Checklist de Testes Necessários:

- [ ] **Criar novo cadastro** com 5 categorias preenchidas
- [ ] **Clicar "Sincronizar"** no novo cadastro
- [ ] **Verificar na planilha**:
  - Verificar se a linha foi criada
  - Verificar se colunas A-G têm dados base corretos
  - Verificar se colunas H-AU têm dados das 5 categorias
  - Verificar se os valores estão alinhados corretamente
  
- [ ] **Criar cadastro com 3 categorias** (as 2 últimas vazias)
- [ ] **Verificar dados parciais** na planilha
  - Verificar se colunas das categorias 4-5 ficam vazias
  
- [ ] **Deletar cadastro** do app
- [ ] **Verificar se a linha foi limpa** na planilha (range A-AU)

- [ ] **Admin Dashboard** - verificar se sincronização em massa funciona

---

## 🔐 Segurança

- ✅ Service Account JWT utilizado para autenticação
- ✅ Credenciais salvas em `/secrets/sa-key.json` (gitignored)
- ✅ Acesso restrito apenas a leitura/escrita da planilha específica
- ✅ Tokens armazenados em cache e expiram após 1 hora

---

## 📝 Notas Importantes

1. **Compatibilidade com dados antigos**: O código mantém compatibilidade com cadastros que ainda usam o formato antigo (campos `categoria`, `produtoRef`, etc.)

2. **Migração de dados**: Cadastros antigos no storage local não serão sincronizados. Recomenda-se:
   - Limpar AsyncStorage antes de testar (ou importar dados antigos da planilha)
   - Testar com novos cadastros criados no app

3. **Campos vazios**: Se um cadastro tiver menos de 5 categorias, as colunas das categorias vazias serão preenchidas com espaços em branco na planilha

4. **Potencial**: O campo POTENCIAL é enviado como número (sem unidades), compatível com cálculos de KPIs no dashboard

---

## 🚀 Próximas Etapas

1. **Limpar cadastros antigos** (opcional):
   ```typescript
   await AsyncStorage.removeItem('cadastros');
   ```

2. **Testar sincronização** com novo cadastro de 5 categorias

3. **Verificar Pull** (download de dados da planilha) - função `pullCadastrosFromSheets()` precisa ser atualizada se for usar (não implementado ainda)

4. **Monitorar erros** no console durante testes

---

## 📊 Relatório de Modificações

| Arquivo | Linhas | Alterações |
|---------|--------|-----------|
| `lib/google-sheets-sync.ts` | 504-573 | Atualizado `sendCadastroToSheets()` |
| `lib/google-sheets-sync.ts` | 691-765 | Atualizado `syncAllCadastrosToSheets()` |
| `lib/google-sheets-sync.ts` | 625-681 | Atualizado `deleteCadastroFromSheets()` |
| `scripts/update-sheets-structure.ts` | NEW | Novo script de atualização |

---

**Status**: ✅ Concluído e Pronto para Testes
**Data**: 2024
**Versão**: 1.0
