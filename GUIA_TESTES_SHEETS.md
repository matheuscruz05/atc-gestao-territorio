# 🧪 GUIA DE TESTES - GOOGLE SHEETS SYNC 5 CATEGORIAS

## ✅ Checklist de Validação

### Fase 1: Verificação de Estrutura

- [ ] **Aba CADASTROS**
  - [ ] Abrir a planilha
  - [ ] Verificar se possui 67 colunas (A-AU)
  - [ ] Verificar cabeçalhos:
    - A-G: Campos base (CADASTRO_ID, CRIADO_EM, ATC_EMAIL, ATC_NOME, CANAL, UNIDADE, ESTADO)
    - H-O: CAT1_* (FERTILIZANTE - BASE)
    - P-W: CAT2_* (FERTILIZANTES - COBERTURA)
    - X-AE: CAT3_* (BIOLÓGICOS - INOCULANTES)
    - AF-AM: CAT4_* (BIOLÓGICOS - FOLIARES)
    - AN-AU: CAT5_* (HIDROSSOLÚVEIS)
  - [ ] Verificar se categorias estão preenchidas nas linhas 2-6

- [ ] **Aba USUARIOS**
  - [ ] Verificar se possui 7 colunas (A-G)
  - [ ] Verificar nova coluna F: "GC"
  - [ ] Verificar nova coluna G: "GR"

---

### Fase 2: Teste Básico de Sincronização

#### Teste 2.1: Cadastro com 5 Categorias Completas

**Setup**:
1. Abrir app em browser ou emulador
2. Ir para "Novo Cadastro"
3. Preencher dados base:
   - Canal: `Varejo`
   - Unidade: `Kg`
   - Estado: `SP`

4. Preencher Categoria 1 (FERTILIZANTE - BASE):
   - Produto Ref: `FERTIL-001`
   - Produto Livre: `Fertilizante Orgânico`
   - Unidade Potencial: `Kg`
   - Implantado: `SIM`
   - Potencial: `1000`
   - Concorrentes: `Empresa X, Empresa Y`
   - Observação: `Teste categoria 1`

5. Repetir para Categorias 2-5 (com dados diferentes)

**Ação**:
1. Clicar "Sincronizar"
2. Esperar mensagem de sucesso

**Validação**:
1. Verificar se mensagem de sucesso aparece ✓
2. Ir para a planilha
3. Verificar nova linha foi criada
4. Validar colunas preenchidas corretamente:
   ```
   A: [ID único]
   B: [Data/hora]
   C: [Email do ATC]
   D: [Nome do ATC]
   E: Varejo
   F: Kg
   G: SP
   H: FERTILIZANTE - BASE
   I: FERTIL-001
   J: Fertilizante Orgânico
   K: Kg
   L: SIM
   M: 1000
   N: Empresa X, Empresa Y
   O: Teste categoria 1
   P: FERTILIZANTES - COBERTURA
   Q: FERTIL-002
   ...
   ```

**Esperado**: ✅ Nova linha com 67 colunas preenchidas

---

#### Teste 2.2: Cadastro com 3 Categorias (parcial)

**Setup**:
1. Novo Cadastro
2. Preencher dados base:
   - Canal: `Distribuidor`
   - Unidade: `Litro`
   - Estado: `MG`

3. Preencher APENAS Categorias 1, 3 e 5 (deixar 2 e 4 vazias)

**Ação**:
1. Clicar "Sincronizar"

**Validação**:
1. Verificar se nova linha foi criada
2. Verificar se Categorias 1, 3, 5 têm dados
3. Verificar se Categorias 2, 4 ficaram vazias (colunas em branco)

**Esperado**: ✅ Categorias parciais tratadas corretamente

---

#### Teste 2.3: Cadastro Vazio (Só Base)

**Setup**:
1. Novo Cadastro
2. Preencher APENAS:
   - Canal: `Online`
   - Unidade: `Ton`
   - Estado: `SC`
3. Deixar todas as 5 categorias vazias

**Ação**:
1. Clicar "Sincronizar"

**Validação**:
1. Verificar se nova linha foi criada
2. Verificar se colunas A-G têm dados
3. Verificar se colunas H-AU estão vazias

**Esperado**: ✅ Dados base sincronizados, categorias em branco

---

### Fase 3: Operações de CRUD

#### Teste 3.1: Atualizar Cadastro

**Setup**:
1. Criar novo cadastro (conforme Teste 2.1)
2. Sincronizar com sucesso

**Ação**:
1. Voltar para "Meus Cadastros"
2. Encontrar o cadastro criado
3. Clicar em editar
4. Modificar um campo (ex: Potencial de 1000 para 2000)
5. Clicar em salvar

**Validação**:
1. Verificar se alteração foi salva localmente
2. Verificar se botão "Sincronizar" está disponível novamente
3. Clicar "Sincronizar"
4. Verificar se a planilha foi atualizada (nova linha ou mesmo cadastro atualizado)

**Esperado**: ✅ Alterações sincronizadas corretamente

---

#### Teste 3.2: Deletar Cadastro

**Setup**:
1. Criar novo cadastro (conforme Teste 2.1)
2. Sincronizar com sucesso
3. Anotar o ID/linha da planilha

**Ação**:
1. Voltar para "Meus Cadastros"
2. Encontrar o cadastro
3. Clicar em "Deletar"
4. Confirmar deleção

**Validação**:
1. Verificar se cadastro desaparece do app
2. Ir para a planilha
3. Verificar se a linha foi deletada ou esvaziada (A-AU)

**Esperado**: ✅ Cadastro removido da planilha

---

#### Teste 3.3: Sincronização em Massa (Admin)

**Setup**:
1. Estar logado como ADMIN
2. Criar 3 cadastros diferentes com 5 categorias cada
3. Ir para painel ADMIN

**Ação**:
1. Encontrar botão "Sincronizar Tudo" ou similar
2. Clicar para sincronizar em massa

**Validação**:
1. Verificar mensagem de sucesso
2. Verificar planilha para 3 novas linhas
3. Verificar se todas as 67 colunas foram preenchidas

**Esperado**: ✅ Múltiplos cadastros sincronizados simultaneamente

---

### Fase 4: Validação de Dados

#### Teste 4.1: Verificação de Tipos

**Validação na Planilha**:
- [ ] Coluna B (CRIADO_EM): Formato data/hora
- [ ] Coluna L (IMPLANTADO): Contém "SIM" ou "NÃO" (não booleano)
- [ ] Coluna M (POTENCIAL): Contém números
- [ ] Colunas de texto: Sem caracteres especiais problemáticos

**Esperado**: ✅ Todos os tipos estão corretos

---

#### Teste 4.2: Verificação de Completitude

**Validação**:
- [ ] Nenhuma coluna essencial (A-G) em branco
- [ ] Se categoria está preenchida, todos os 8 campos têm algo
- [ ] Sem quebras no padrão de colunas

**Esperado**: ✅ Integridade de dados mantida

---

### Fase 5: Testes de Erro

#### Teste 5.1: Sem Conexão de Internet

**Setup**:
1. Desabilitar internet (airplane mode)
2. Criar novo cadastro
3. Tentar sincronizar

**Validação**:
1. Verificar mensagem de erro apropriada
2. Reabilitar internet
3. Tentar sincronizar novamente

**Esperado**: ✅ Comportamento gracioso com retry

---

#### Teste 5.2: Credenciais Inválidas

**Setup**:
1. Modificar `.env.local` com SPREADSHEET_ID errado

**Ação**:
1. Criar novo cadastro
2. Tentar sincronizar

**Validação**:
1. Verificar se erro é capturado
2. Restaurar credenciais corretas

**Esperado**: ✅ Erro mensagem clara

---

### Fase 6: Performance

#### Teste 6.1: Sincronização de Muitos Cadastros

**Setup**:
1. Criar 10+ cadastros

**Ação**:
1. Sincronizar tudo em lote

**Validação**:
1. Medir tempo de execução (objetivo: < 5 segundos)
2. Verificar se todas as linhas foram criadas
3. Verificar se não houve timeouts

**Esperado**: ✅ Sincronização rápida e confiável

---

## 📋 Checklist Final

```
[  ] Estrutura da planilha validada (67 colunas CADASTROS, 7 USUARIOS)
[  ] Teste 2.1: Cadastro com 5 categorias completas ✓
[  ] Teste 2.2: Cadastro com categorias parciais ✓
[  ] Teste 2.3: Cadastro só com base ✓
[  ] Teste 3.1: Atualização de cadastro ✓
[  ] Teste 3.2: Deleção de cadastro ✓
[  ] Teste 3.3: Sincronização em massa ✓
[  ] Teste 4.1: Tipos de dados corretos ✓
[  ] Teste 4.2: Integridade de dados ✓
[  ] Teste 5.1: Comportamento sem internet ✓
[  ] Teste 5.2: Tratamento de erros ✓
[  ] Teste 6.1: Performance ✓
```

---

## 🐛 Se Encontrar Problemas

### Problema: Colunas desalinhadas
**Solução**:
1. Verificar se todas as 67 colunas foram criadas
2. Executar script novamente: `npx tsx scripts/update-sheets-structure.ts`

### Problema: Dados não aparecem na planilha
**Solução**:
1. Verificar credenciais em `.env.local`
2. Verificar se Service Account tem acesso à planilha
3. Verificar console para mensagens de erro
4. Testar com simples cadastro

### Problema: Sincronização lenta
**Solução**:
1. Verificar conexão de internet
2. Verificar logs de API
3. Testar com menos categorias

---

**Documentação Versionada**: 1.0
**Data**: Hoje
**Status**: 🟢 Pronto para Testes
