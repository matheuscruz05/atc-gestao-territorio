# Instruções para Atualização da Planilha Google Sheets

## 📋 Visão Geral

O aplicativo agora suporta **5 categorias por cadastro**. A planilha Google Sheets precisa ser atualizada para comportar esse novo formato.

---

## 1️⃣ ABA "CADASTROS" - Nova Estrutura

### ❌ Formato Antigo (REMOVER)
```
CADASTRO_ID | CRIADO_EM | ATC_EMAIL | ATC_NOME | CANAL | UNIDADE | ESTADO | CATEGORIA | PRODUTO_REF | PRODUTO_NOME_LIVRE | UNIDADE_POTENCIAL | IMPLANTADO | POTENCIAL_VALOR | CONCORRENTES | OBSERVACAO
```

### ✅ Formato Novo (IMPLEMENTAR)

A planilha agora precisa ter **uma linha por cadastro** com **colunas repetidas para cada categoria (5x)**:

```
CADASTRO_ID | CRIADO_EM | ATC_EMAIL | ATC_NOME | CANAL | UNIDADE | ESTADO | 
CAT1_CATEGORIA | CAT1_PRODUTO_REF | CAT1_PRODUTO_LIVRE | CAT1_UNIDADE_POT | CAT1_IMPLANTADO | CAT1_POTENCIAL | CAT1_CONCORRENTES | CAT1_OBSERVACAO |
CAT2_CATEGORIA | CAT2_PRODUTO_REF | CAT2_PRODUTO_LIVRE | CAT2_UNIDADE_POT | CAT2_IMPLANTADO | CAT2_POTENCIAL | CAT2_CONCORRENTES | CAT2_OBSERVACAO |
CAT3_CATEGORIA | CAT3_PRODUTO_REF | CAT3_PRODUTO_LIVRE | CAT3_UNIDADE_POT | CAT3_IMPLANTADO | CAT3_POTENCIAL | CAT3_CONCORRENTES | CAT3_OBSERVACAO |
CAT4_CATEGORIA | CAT4_PRODUTO_REF | CAT4_PRODUTO_LIVRE | CAT4_UNIDADE_POT | CAT4_IMPLANTADO | CAT4_POTENCIAL | CAT4_CONCORRENTES | CAT4_OBSERVACAO |
CAT5_CATEGORIA | CAT5_PRODUTO_REF | CAT5_PRODUTO_LIVRE | CAT5_UNIDADE_POT | CAT5_IMPLANTADO | CAT5_POTENCIAL | CAT5_CONCORRENTES | CAT5_OBSERVACAO
```

### 📐 Estrutura Detalhada

**Colunas Fixas (A-G):**
- `A` - **CADASTRO_ID**: ID único do cadastro
- `B` - **CRIADO_EM**: Data/hora de criação
- `C` - **ATC_EMAIL**: Email do usuário ATC
- `D` - **ATC_NOME**: Nome do usuário ATC
- `E` - **CANAL**: Canal de distribuição
- `F` - **UNIDADE**: Unidade/Cliente
- `G` - **ESTADO**: Estado (PR ou SC)

**Categoria 1 (H-O):**
- `H` - **CAT1_CATEGORIA**: FERTILIZANTE - BASE
- `I` - **CAT1_PRODUTO_REF**: Referência do produto
- `J` - **CAT1_PRODUTO_LIVRE**: Nome livre do produto
- `K` - **CAT1_UNIDADE_POT**: tons ou litros
- `L` - **CAT1_IMPLANTADO**: Sim ou Não
- `M` - **CAT1_POTENCIAL**: Valor numérico
- `N` - **CAT1_CONCORRENTES**: Lista de concorrentes
- `O` - **CAT1_OBSERVACAO**: Observações

**Categoria 2 (P-W):**
- `P` - **CAT2_CATEGORIA**: FERTILIZANTES - COBERTURA
- `Q` - **CAT2_PRODUTO_REF**
- `R` - **CAT2_PRODUTO_LIVRE**
- `S` - **CAT2_UNIDADE_POT**
- `T` - **CAT2_IMPLANTADO**
- `U` - **CAT2_POTENCIAL**
- `V` - **CAT2_CONCORRENTES**
- `W` - **CAT2_OBSERVACAO**

**Categoria 3 (X-AE):**
- `X` - **CAT3_CATEGORIA**: BIOLÓGICOS - INOCULANTES
- `Y` - **CAT3_PRODUTO_REF**
- `Z` - **CAT3_PRODUTO_LIVRE**
- `AA` - **CAT3_UNIDADE_POT**
- `AB` - **CAT3_IMPLANTADO**
- `AC` - **CAT3_POTENCIAL**
- `AD` - **CAT3_CONCORRENTES**
- `AE` - **CAT3_OBSERVACAO**

**Categoria 4 (AF-AM):**
- `AF` - **CAT4_CATEGORIA**: BIOLÓGICOS - FOLIARES
- `AG` - **CAT4_PRODUTO_REF**
- `AH` - **CAT4_PRODUTO_LIVRE**
- `AI` - **CAT4_UNIDADE_POT**
- `AJ` - **CAT4_IMPLANTADO**
- `AK` - **CAT4_POTENCIAL**
- `AL` - **CAT4_CONCORRENTES**
- `AM` - **CAT4_OBSERVACAO**

**Categoria 5 (AN-AU):**
- `AN` - **CAT5_CATEGORIA**: HIDROSSOLÚVEIS
- `AO` - **CAT5_PRODUTO_REF**
- `AP` - **CAT5_PRODUTO_LIVRE**
- `AQ` - **CAT5_UNIDADE_POT**
- `AR` - **CAT5_IMPLANTADO**
- `AS` - **CAT5_POTENCIAL**
- `AT` - **CAT5_CONCORRENTES**
- `AU` - **CAT5_OBSERVACAO**

### 📝 Exemplo de Linha

```
1768062819024 | 2026-01-10T16:33:39.024Z | teste@atc.com | Teste ATC | Canal Teste | Unidade Tes | PR |
FERTILIZANTE - BASE | PROD_TEST | Produto Teste | tons | Não | 1.5 | Nenhum | Teste de sincronia |
FERTILIZANTES - COBERTURA | | | tons | Não | 0 | | |
BIOLÓGICOS - INOCULANTES | | | tons | Não | 0 | | |
BIOLÓGICOS - FOLIARES | | | tons | Não | 0 | | |
HIDROSSOLÚVEIS | | | litros | Não | 0 | | |
```

---

## 2️⃣ ABA "USUARIOS" - Adicionar Colunas GC e GR

### ❌ Formato Antigo
```
EMAIL | NOME | ROLE | SENHA | ATIVO
```

### ✅ Formato Novo
```
EMAIL | NOME | ROLE | SENHA | ATIVO | GC | GR
```

**Novas Colunas:**
- `F` - **GC**: Gerente Comercial (preenchido manualmente pelo Admin)
- `G` - **GR**: Gerente Regional (preenchido manualmente pelo Admin)

### 📝 Exemplo de Linha
```
admin@exemplo.com | Administrador | COORD | admin123 | TRUE | Caroline P | PILON
atc1@exemplo.com | ATC Teste 1 | ATC | atc123 | TRUE | Caroline P | PILON
joao@exemplo.com | Joao | ATC | joaom | TRUE | Caroline P | PILON
diuli@exemplo.com | Diuli C | ATC | diulic | TRUE | Moacir Almeida | Maria Rizzi
caio@exemplo.com | CAIO FRANCELINO | ATC | FRANCELINO050 | TRUE | Moacir Almeida | Maria Rizzi
```

---

## 🚀 Passos para Implementação

### Passo 1: Backup da Planilha Atual
1. Acesse a planilha no Google Sheets
2. Clique em **Arquivo > Fazer uma cópia**
3. Salve com nome "ATC_Gestao_Territorio_DB_BACKUP_[DATA]"

### Passo 2: Atualizar ABA "CADASTROS"
1. Abra a aba **CADASTROS**
2. **Insira novas colunas** após a coluna G (ESTADO)
3. Copie os cabeçalhos conforme listado acima (H até AU)
4. **IMPORTANTE**: As categorias têm ordem fixa:
   - CAT1 = FERTILIZANTE - BASE
   - CAT2 = FERTILIZANTES - COBERTURA
   - CAT3 = BIOLÓGICOS - INOCULANTES
   - CAT4 = BIOLÓGICOS - FOLIARES
   - CAT5 = HIDROSSOLÚVEIS

### Passo 3: Migrar Dados Existentes (Opcional)
Se você tem dados antigos na planilha:
1. Cada linha antiga vira uma linha nova
2. Os dados da categoria antiga vão para CAT1, CAT2, CAT3, CAT4 ou CAT5 conforme a categoria
3. As outras 4 categorias ficam vazias

### Passo 4: Atualizar ABA "USUARIOS"
1. Abra a aba **USUARIOS**
2. Insira duas novas colunas após a coluna E (ATIVO)
3. Cabeçalhos: **GC** (coluna F) e **GR** (coluna G)
4. Preencha manualmente os valores para cada usuário

### Passo 5: Testar Sincronização
1. Abra o app
2. Crie um novo cadastro no app
3. Clique em **Sync** (botão azul "📤 Enviar")
4. Verifique se os dados aparecem corretamente na planilha

---

## ⚠️ Observações Importantes

1. **Ordem das Categorias é Fixa**: O app sempre envia nessa ordem, não altere
2. **Campos Vazios**: Se uma categoria não foi preenchida no app, todas as 8 colunas dela ficarão vazias
3. **Retrocompatibilidade**: O app ainda consegue ler cadastros antigos (formato single-category)
4. **Validação Manual**: Após implementar, teste com alguns cadastros de teste antes de usar em produção
5. **GC e GR**: Esses campos serão usados futuramente para filtros e relatórios por gerente

---

## 📞 Suporte

Se tiver dúvidas na implementação:
1. Verifique se os cabeçalhos estão exatamente como documentado
2. Confirme que a ordem das colunas está correta
3. Teste com um cadastro simples primeiro
4. Revise os logs do app para identificar erros de sincronização

---

**Data de Atualização**: 12 de janeiro de 2026  
**Versão do App**: 3.0 (Multi-categoria)
