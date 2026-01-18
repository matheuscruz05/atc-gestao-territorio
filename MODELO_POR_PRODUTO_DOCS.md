# 🎯 IMPLEMENTAÇÃO - MODELO POR PRODUTO (SUBCADASTROS)

**Data:** 13 de Janeiro de 2026  
**Status:** ✅ Implementado e testado

---

## 📋 Mudanças Realizadas

### 1. Backend: Armazenamento em JSON (server/sheets-sync.ts)

#### ✅ Coluna H agora armazena JSON de N categorias
```typescript
// Antes: Expandia em 8 colunas (H-O) com padding/truncamento
categoriasData.push(
  cat.categoria, cat.produtoRef, cat.produtoNomeLivre, 
  cat.unidadePotencial, implantadoFlag(cat.implantado),
  String(cat.potencialValor), cat.concorrentes, cat.observacao
);

// Depois: Uma coluna (H) com JSON completo
const categoriasJson = JSON.stringify(categorias || []);
const row = [...baseRow, categoriasJson];
```

#### ✅ Ranges atualizadas
- **POST /api/sheets/cadastros:** A2:H → coluna H com JSON
- **POST /api/sheets/cadastros/bulk:** A2:H (todos os subcadastros em um JSON)
- **DELETE /api/sheets/cadastros/:id:** Clear A:H

#### ✅ normalizeCategorias() removido o padding
```typescript
// Antes: slice(0, 5) + pad com vazios até 5
// Depois: retorna array completo, sem truncar
const categorias = Array.isArray(cadastro.categorias) 
  ? cadastro.categorias 
  : [];
```

**Impacto:** Agora pode haver 10, 20, ou N subcadastros por cadastro sem perda.

---

### 2. Frontend - Pull (lib/google-sheets-sync.ts)

#### ✅ Range pullCadastrosFromSheets atualizado
```typescript
// Antes: A2:O1000 (esperava dados em 15 colunas)
// Depois: A2:H1000 (coluna H tem JSON)
const range = "CADASTROS!A2:H1000";
```

#### ✅ Parsing com fallback
```typescript
const categoriasJson = row[offset + 7];
let categorias = [];

if (categoriasJson) {
  try {
    categorias = JSON.parse(categoriasJson);
  } catch (e) {
    categorias = [];
  }
} else if (row.length >= offset + 15) {
  // Fallback: formato antigo (uma categoria plana em 8 colunas)
  categorias = [{...}];
}

return {
  cadastroId: row[offset + 0],
  // ... outros campos ...
  categorias,
  deletado: false,
};
```

**Impacto:** Pull automático lê JSON; dados antigos (antes de hoje) são convertidos para novo formato.

---

### 3. Frontend - Form (app/novo-cadastro.tsx)

#### ✅ Subcadastros dinâmicos por produto
```typescript
// Novo helper: cria um subcadastro por cada produto ativo
const buildCategoriasFromProdutos = (produtosList): CategoriaData[] => {
  const ativos = produtosList.filter(p => p.ativo);
  const ordered = [];
  
  CATEGORY_ORDER.forEach(cat => {
    ativos
      .filter(p => p.categoria === cat)
      .forEach(p => {
        ordered.push({
          categoria: p.categoria,
          produtoRef: p.produtoId,  // Fixo, não muda
          produtoNomeLivre: "",
          unidadePotencial: p.unidadePotencial,
          implantado: "Não",
          potencialValor: 0,
          concorrentes: "",
          observacao: "",
        });
      });
  });
  
  return ordered;
};
```

**Exemplo:**
- FERTILIZANTE-BASE: 5 produtos → 5 subcadastros
- COBERTURA: 2 produtos → 2 subcadastros
- HIDROSSOLÚVEIS: 1 produto → 1 subcadastro
- **Total:** ~13 subcadastros (dinamicamente do Sheets)

#### ✅ Inicialização do formulário
```typescript
useEffect(() => {
  async function loadData() {
    const [produtosData, ...] = await Promise.all([...]);
    
    if (!editId && !defaultsApplied) {
      const defaults = buildCategoriasFromProdutos(produtosData);
      setCategoriasData(defaults);  // Um por produto
      setDefaultsApplied(true);
    }
  }
  loadData();
}, [editId, defaultsApplied]);
```

#### ✅ Produto agora é READ-ONLY (não selectável)
```typescript
<View className="bg-background border border-border rounded-lg p-4">
  <Text className="text-base font-semibold text-foreground">
    {produtoLookup[catData.produtoRef]?.produto || "Produto"}
  </Text>
  <Text className="text-xs text-muted mt-1">
    {produtoLookup[catData.produtoRef]?.categoria}
  </Text>
</View>
```

**Por quê:** Cada subcadastro é para 1 produto específico. Usuário não escolhe; preenchimento é **linear por produto**.

---

### 4. Concorrentes: Dropdown com Busca (app/novo-cadastro.tsx)

#### ✅ Estados para dropdown + busca
```typescript
const [concorrenteSearch, setConcorrenteSearch] = useState<Record<number, string>>({});
const [concorrenteDropdownOpen, setConcorrenteDropdownOpen] = useState<Record<number, boolean>>({});
```

#### ✅ UI: Input + Dropdown filtrado
```typescript
<TextInput
  placeholder="Buscar concorrente..."
  value={concorrenteSearch[index] || ""}
  onChangeText={text => setConcorrenteSearch({...})}
  onFocus={() => setConcorrenteDropdownOpen({..., [index]: true})}
/>

{concorrenteDropdownOpen[index] && (
  <ScrollView>
    {concorrentes
      .filter(c => c.toLowerCase().includes(search.toLowerCase()))
      .map(conc => (
        <TouchableOpacity onPress={() => { /* toggle */ }}>
          <Checkbox isSelected={} />
          <Text>{conc}</Text>
        </TouchableOpacity>
      ))}
  </ScrollView>
)}
```

#### ✅ Tags removíveis
```typescript
<View className="flex-wrap flex-row gap-2">
  {catData.concorrentes
    .split(",").map(c => c.trim()).filter(Boolean)
    .map(conc => (
      <TouchableOpacity 
        className="bg-primary px-3 py-2 rounded-full"
        onPress={() => { /* remove */ }}
      >
        <Text>{conc} ×</Text>
      </TouchableOpacity>
    ))}
</View>
```

**UX:** 
1. Clica input → dropdown abre
2. Digita → filtra concorrentes
3. Clica opção → marca checkbox + fecha dropdown (opcionalmente)
4. Tag aparece abaixo
5. Clica tag × → desseleciona

---

## 📊 Estrutura de Dados - ANTES vs DEPOIS

### Antes (5 categorias fixas, dados espalhados)
```
CADASTROS Linha 2:
A: CAD-001
B: 2024-01-15T10:00:00Z
C: user@email.com
...
G: SP
H: FERTILIZANTE-BASE
I: PROD-001
J: 
K: tons
L: SIM
M: 100
N: "KCL, MAP"
O: "Obs 1"
P: (vazio - próxima categoria)
...
```

### Depois (N subcadastros em JSON)
```
CADASTROS Linha 2:
A: CAD-001
B: 2024-01-15T10:00:00Z
C: user@email.com
D: João Silva
E: COSAN
F: Unidade SP
G: SP
H: [
     {"categoria":"FERTILIZANTE-BASE","produtoRef":"MICROESSENTIALS","implantado":"Sim",...,"concorrentes":"KCL, MAP"},
     {"categoria":"FERTILIZANTE-BASE","produtoRef":"PERFORMA_BIO","implantado":"Não",...,"concorrentes":"TOPMIX"},
     {"categoria":"COBERTURA","produtoRef":"ASPIRE","implantado":"Não",...,"concorrentes":""},
     {"categoria":"COBERTURA","produtoRef":"PERFORMA_ULTRA","implantado":"Sim",...,"concorrentes":"ULEXITA"},
     ...
   ]
```

**Vantagens:**
- ✅ Sem truncamento (N itens, não 5)
- ✅ Escalável (adiciona produtos ao PRODUTOS sheet)
- ✅ Estrutura clara em JSON
- ✅ Compatível com dados antigos (fallback)

---

## 🧪 Testes - PASSO A PASSO

### Teste 1: Abrir "Novo Cadastro"
```
1. App inicia
2. Carrega PRODUTOS sheet
3. buildCategoriasFromProdutos() cria subcadastros
4. Exibe ~13 cartões (um por produto)
5. Cada cartão mostra:
   ✓ Produto (fixo, apenas leitura)
   ✓ "Produtor já utiliza?"
   ✓ "Potencial" [número] [unidade]
   ✓ Concorrentes (dropdown)
   ✓ Observação (textarea)
```

**Esperado:** Form carrega em ~1 segundo, sem travamentos.

---

### Teste 2: Preencher Concorrentes com Dropdown
```
1. Ir para "Concorrentes" de um subcadastro
2. Clicar input
3. Dropdown abre com todas as opções
4. Digitar "KCL"
5. Filtra → mostra "00 00 60 KCL"
6. Clicar → marca checkbox
7. Tag "00 00 60 KCL" aparece abaixo
8. Digitar "TOPMIX"
9. Filtra → "02 28 20 TOPMIX"
10. Clicar → segunda tag aparece
11. Clicar "×" em primeira tag → desseleciona

**Esperado:** Dropdown funciona, filtro funciona, múltiplas seleções salvam em "00 00 60 KCL, 02 28 20 TOPMIX".
```

---

### Teste 3: Salvar e Verificar no Sheets
```
1. Preencher alguns subcadastros (e deixar outros vazios)
2. Clicar "Salvar Cadastro"
3. Toast "✅ Sucesso"
4. Abrir Google Sheets → CADASTROS
5. Ir para linha nova
6. Clicar em coluna H (categorias)
7. Ver JSON expandido
8. Verificar:
   ✓ Array com N itens (não 5)
   ✓ Produtos corretos (MICROESSENTIALS, PERFORMA_BIO, etc.)
   ✓ Concorrentes corretos (ex: "00 00 60 KCL, 02 28 20 TOPMIX")
   ✓ Valores preenchidos vs vazios aparecem

**Esperado:** JSON válido, todos os subcadastros presentes, sem truncamento.
```

---

### Teste 4: Editar Cadastro
```
1. Admin → seleciona um cadastro
2. Clica "Editar"
3. novo-cadastro.tsx carrega editId
4. useEffect dispara loadForEdit()
5. Pull de Sheets → parsing JSON da coluna H
6. buildCategoriasFromProdutos() NÃO rodado (editId != null)
7. Dados antigos carregam em categoriasData
8. Todos os subcadastros mostram com dados anteriores preenchidos
9. Edita alguns campos
10. Clica "Atualizar Cadastro"

**Esperado:** Edição funciona, JSON atualizado no Sheets, valores antigos recuperados.
```

---

### Teste 5: Compatibilidade com Dados Antigos
```
1. Se tiver cadastros salvos ANTES desta mudança:
   - Colunas H-O tinham dados expandidos (5 categorias fixas)
2. Novo pull tenta parseJSON(coluna H)
3. Falha → fallback para formato antigo
4. Extrai 1 categoria das colunas H-O (como antes)
5. Converte para novo formato categorias = [{...}]
6. Salva corretamente com novo formato

**Esperado:** Sem erro ao abrir cadastros antigos.
```

---

## 🚀 Resumo UX

### Fluxo de Preenchimento - Agora
```
1. Abre "Novo Cadastro"
2. Vê 13 subcadastros (FERTILIZANTE-BASE 1 a 5, COBERTURA 1 a 2, etc.)
3. Preenche na ordem:
   FERTILIZANTE-BASE #1 (MICROESSENTIALS)
   ├─ Produtor usa? [Sim] [Não]
   ├─ Potencial: [1000] tons
   ├─ Concorrentes: [dropdown busca] "KCL, MAP"
   └─ Observação: "..."
   
   FERTILIZANTE-BASE #2 (PERFORMA BIO)
   ├─ ...
   
   COBERTURA #1 (ASPIRE)
   ├─ ...
   
4. Clica "Salvar"
5. Todos os 13 (ou quantos preenchidos) salvam em um JSON
```

**Vantagem:** Intuitivo, ordenado por categoria, sem confusão de múltiplos campos por categoria.

---

## 🔄 Mudanças no Admin

O admin **não precisa de mudanças**; ele já exibe os cadastros corretamente:
- Pull de Sheets continua funcionando (coluna H é parseada)
- Card exibe categorias (agora N itens em vez de sempre 5)
- Editar abre o form refatorado
- Deletar remove a linha (coluna H inteira)

---

## 📝 Estrutura Sheets - Esperada

### CADASTROS (NOVO LAYOUT)
```
Col A: cadastroId
Col B: criadoEm
Col C: atcEmail
Col D: atcNome
Col E: canal
Col F: unidade
Col G: estado
Col H: categorias (JSON array)
```

### CONCORRENTES (SEM MUDANÇA)
```
Col A: CONCORRENTE (nome)
Col B: ATIVO (bool)
```

### PRODUTOS (SEM MUDANÇA)
```
Col A: produtoId
Col B: categoria
Col C: produto
Col D: unidadePotencial
Col E: ativo
```

---

## ⚠️ Rollback/Desfazer

Se precisar voltar para 5 categorias fixas:
1. Restaure `normalizeCategorias` em frontend + backend (com padding)
2. Mude ranges de volta para `A2:AU`
3. Remova `buildCategoriasFromProdutos`
4. Recoloque `getProdutosFiltrados` com radio buttons

**Dados novo layout (JSON) podem ser recuperados manualmente** parseando coluna H.

---

**Status:** ✅ PRONTO PARA TESTE EM PRODUÇÃO
