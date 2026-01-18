# 🎯 QUICK START - REFERÊNCIA RÁPIDA

## O que mudou?

### Antes ❌
```
Novo Cadastro → Produto: [Picker dropdown]
Novo Cadastro → Concorrentes: [TextInput multiline]
```

### Depois ✅
```
Novo Cadastro → Produto: [Radio buttons por categoria]
Novo Cadastro → Concorrentes: [Checkboxes com lista do Sheets]
```

---

## Como usar?

### 1. Novo Cadastro

```
Ir para "Novo Cadastro"
↓
Aparecem 5 categorias:
├─ FERTILIZANTE-BASE
├─ COBERTURA  
├─ ESPECIAL
├─ PROTETOR
└─ HIDROSSOLÚVEIS

Cada categoria:
├─ Produto: [seleciona 1 de N opções]
├─ Produtor já utiliza? [Sim] [Não]
├─ Potencial: [número] [tons/litros]
├─ Concorrentes: [seleciona múltiplos]
└─ Observação: [texto livre]

Clicar "Salvar Cadastro"
↓
Salvo no Sheets automaticamente ✅
```

### 2. Admin

```
Ir para Admin
↓
Ver cards com:
├─ 5 categorias (sempre visíveis)
├─ Potenciais (tons + litros em box azul)
├─ [Editar] button
└─ [Excluir] button

Editar: Clica [Editar] → Formulário carrega dados
Excluir: Clica [Excluir] → Confirma → Apaga do Sheets
Buscar: Digite GR → Filtra cadastros
```

---

## Principais mudanças de código

### app/novo-cadastro.tsx

**Adicionado:**
```typescript
// Linha 19 - Importar função
import { syncConcorrentesFromSheets } from "@/lib/google-sheets-sync";

// Linha 43 - State para concorrentes
const [concorrentes, setConcorrentes] = useState<string[]>([]);

// Linha 69-73 - Carregar do Sheets
useEffect(() => {
  async function loadData() {
    const concorrentesData = await syncConcorrentesFromSheets();
    setConcorrentes(concorrentesData);
  }
  loadData();
}, []);
```

**Modificado: Produto (linhas 315-346)**
```typescript
// Antes: Picker
// Depois: TouchableOpacity buttons
{getProdutosFiltrados(catData.categoria).map((p) => (
  <TouchableOpacity
    className={catData.produtoRef === p.produtoId ? "bg-primary" : "bg-background"}
    onPress={() => updateCategoriaData(index, "produtoRef", p.produtoId)}
  >
    <Text>{p.produto}</Text>
  </TouchableOpacity>
))}
```

**Modificado: Concorrentes (linhas 442-515)**
```typescript
// Antes: TextInput multiline
// Depois: Checkboxes com split/join
{concorrentes.map((conc) => {
  const selecionados = catData.concorrentes?.split(",").map(c => c.trim()) || [];
  const isSelected = selecionados.includes(conc);
  
  return (
    <TouchableOpacity
      className={isSelected ? "bg-primary" : "bg-background"}
      onPress={() => {
        const updated = isSelected 
          ? selecionados.filter(c => c !== conc).join(", ")
          : [...selecionados, conc].join(", ");
        updateCategoriaData(index, "concorrentes", updated);
      }}
    >
      <Text>{isSelected ? "✓" : ""} {conc}</Text>
    </TouchableOpacity>
  );
})}
```

### lib/google-sheets-sync.ts

**Adicionado (linhas 783-809):**
```typescript
export async function syncConcorrentesFromSheets(): Promise<string[]> {
  const config = getConfig();
  if (!config.spreadsheetId || !config.apiKey) {
    console.warn("Google Sheets não configurado");
    return [];
  }

  try {
    const range = "CONCORRENTES!A2:A";
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/${range}?key=${config.apiKey}`;
    
    logDebug("syncConcorrentesFromSheets", "Fetching concorrentes");
    const response = await fetch(url);
    const data = await response.json();

    if (!data.values) return [];

    const concorrentes: string[] = data.values
      .map((row: string[]) => row[0]?.trim())
      .filter((conc: string) => conc);

    logDebug("syncConcorrentesFromSheets", "Loaded concorrentes", { total: concorrentes.length });
    return concorrentes;
  } catch (error) {
    console.error("Erro ao sincronizar concorrentes:", error);
    return [];
  }
}
```

---

## Sheets - Estrutura

### CONCORRENTES (novo)
```
Linha 1: CONCORRENTE | ATIVO
Linha 2: 00 00 60 KCL | true
Linha 3: 02 20 18 | true
Linha 4: 02 28 20 TOPMIX | true
...
Linha 13: ULEXITA | true
```

### CADASTROS (modificado)
```
Coluna F: categorias (JSON com 5 entries)
[
  { categoria, produtoRef, produtoNomeLivre, unidadePotencial, implantado, potencialValor, concorrentes, observacao },
  ...
]

Exemplo concorrentes:
"00 00 60 KCL, 02 28 20 TOPMIX" (múltiplos separados por vírgula+espaço)
```

---

## Testes Rápidos

### ✅ Teste 1: Concorrentes carregam?
1. Abrir "Novo Cadastro"
2. Procurar por "Concorrentes"
3. Deve aparecer lista com: KCL, TOPMIX, MAP, etc.
4. Não deve dizer "Carregando concorrentes..."

### ✅ Teste 2: Salvar funciona?
1. Preencher formulário
2. Selecionar alguns produtos e concorrentes
3. Clicar "Salvar Cadastro"
4. Esperar toast de sucesso
5. Abrir Sheets → CADASTROS → verificar linha nova

### ✅ Teste 3: Admin exibe bem?
1. Ir para Admin
2. Ver cards com 5 categorias
3. Ver potenciais em caixa azul (tons + litros)
4. Clicar "Editar" → dados devem carregar no form

### ✅ Teste 4: Edit e Delete funcionam?
1. Admin → Editar → mudar dados → Atualizar → verificar Sheets
2. Admin → Excluir → confirmar → card desaparece → verificar Sheets

---

## Debug - Console Logs

```javascript
// Quando concorrentes carregam:
[SheetsClient][syncConcorrentesFromSheets] YYYY-MM-DD HH:MM:SS - Fetching concorrentes
[SheetsClient][syncConcorrentesFromSheets] YYYY-MM-DD HH:MM:SS - Loaded concorrentes {"total": 12}

// Quando salva cadastro:
[SheetsClient][sendCadastroToSheets] YYYY-MM-DD HH:MM:SS - Enviando cadastro
[SheetsClient][sendCadastroToSheets] YYYY-MM-DD HH:MM:SS - Enviado com sucesso

// Admin:
[Admin] Editar/Excluir cadastro {"id": "..."}
```

---

## Campos Obrigatórios

Para cada uma das 5 categorias:
- ✅ Produto (selecionar 1)
- ✅ Implantado (Sim/Não)
- ✅ Potencial (número)
- ✅ Concorrentes (selecionar pelo menos 1)
- ✅ Observação (texto)

---

## Perguntas Comuns

**P: Posso selecionar mais de um produto por categoria?**  
R: Não, apenas 1 produto por categoria. Use radio buttons (círculo).

**P: Posso editar concorrentes depois?**  
R: Sim, clicar "Editar" no admin carrega o formulário com dados.

**P: Concorrentes não carregam, o que fazer?**  
R: Verificar console → procurar `syncConcorrentesFromSheets` → verificar se Sheets está online.

**P: Dados somem depois de fechar app?**  
R: Não, estão salvos no Sheets. Próxima vez que abre, pull sincroniza.

**P: Como adicionar novo concorrente?**  
R: Editar Google Sheets → CONCORRENTES → adicionar linha → próxima vez que abre app, já aparece.

---

## Versão
**v3.5.0 - 15 de Janeiro de 2024**

**Status:** ✅ PRONTO PARA USO
