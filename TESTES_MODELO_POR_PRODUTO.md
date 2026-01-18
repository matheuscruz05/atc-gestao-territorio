# ✅ GUIA DE TESTES - IMPLEMENTAÇÃO MODELO POR PRODUTO

**Duração estimada:** 5-10 minutos  
**O que testar:** Novo formulário, subcadastros por produto, dropdown concorrentes, salvamento JSON

---

## 🧪 TESTE 1: Novo Cadastro Carrega Subcadastros

### Pré-requisito
- App está rodando
- Usuário logado
- PRODUTOS sheet tem dados

### Executar
1. **Ir para "Novo Cadastro"**
   - Menu → Novo Cadastro (ou aba correspondente)
   
2. **Verificar formulário**
   - [ ] Título: "Novo Cadastro"
   - [ ] Campos comuns aparecem: Canal, Unidade, Estado
   - [ ] Seção "Categorias de Produtos" visível
   
3. **Contar subcadastros**
   - Scroll down para ver quantos cartões aparecem
   - [ ] Deve haver ~13 cartões (se PRODUTOS sheet tem ~13 produtos ativos)
   - [ ] Cada cartão começa com número + nome da categoria (ex: "1. FERTILIZANTE - BASE")

4. **Verificar conteúdo de 1 cartão**
   - [ ] Título: "1. FERTILIZANTE - BASE"
   - [ ] Campo "Produto *" → mostra nome fixo (ex: "MICROESSENTIALS")
   - [ ] Campo "Produtor já utiliza? *" → [Sim] [Não] buttons
   - [ ] Campo "Potencial *" → input [número] + unidade (tons/litros)
   - [ ] Campo "Concorrentes *" → TextInput com placeholder "Buscar concorrente..."
   - [ ] Campo "Observação *" → textarea

5. **Verificar produto é READ-ONLY**
   - [ ] Clicar no campo Produto → não abre picker/dropdown
   - [ ] Apenas leitura do nome do produto

✅ **Esperado:** ~13 subcadastros aparecem, um por produto, em ordem por categoria.

---

## 🧪 TESTE 2: Dropdown de Concorrentes com Busca

### Executar
1. **Clicar na caixa "Buscar concorrente..." do primeiro subcadastro**
   - TextInput ativa
   - [ ] Cursor aparece
   
2. **Pressionar para abrir dropdown**
   - Clique no input (onFocus trigger)
   - [ ] Dropdown abre imediatamente abaixo do input
   - [ ] Lista mostra todos os concorrentes (KCL, TOPMIX, MAP, etc.)
   
3. **Testar filtro digitando**
   - [ ] Digite "KCL" 
   - [ ] Lista filtra → mostra apenas "00 00 60 KCL"
   - [ ] Digite "TOP"
   - [ ] Lista filtra → mostra "02 28 20 TOPMIX", "14 14 10 YARA TOPMIX"
   - [ ] Backspace para limpar
   - [ ] Lista volta ao completo

4. **Selecionar múltiplos concorrentes**
   - [ ] Clique em "00 00 60 KCL"
   - [ ] Checkbox marca ✓
   - [ ] Dropdown pode fechar (ou permanecer aberto)
   - [ ] Tag "00 00 60 KCL" aparece abaixo do input
   - [ ] Clique em "02 28 20 TOPMIX"
   - [ ] Segunda tag aparece: "00 00 60 KCL, 02 28 20 TOPMIX"
   
5. **Remover seleção (click em tag ×)**
   - [ ] Tag exibe: "00 00 60 KCL ×"
   - [ ] Clique em "×"
   - [ ] Tag desaparece
   - [ ] Apenas "02 28 20 TOPMIX" permanece

✅ **Esperado:** Dropdown abre, filtra digitando, múltiplas seleções funcionam, tags aparecem e são removíveis.

---

## 🧪 TESTE 3: Preencher e Salvar Cadastro

### Executar
1. **Ir para 2-3 subcadastros e preencher dados**

   **Subcadastro 1 (FERTILIZANTE-BASE / MICROESSENTIALS):**
   - [ ] "Produtor já utiliza?" → clique "Sim" (muda para verde)
   - [ ] "Potencial" → digite "500"
   - [ ] "Concorrentes" → busque "KCL", selecione
   - [ ] "Observação" → digite "Cliente grande"
   
   **Subcadastro 2 (FERTILIZANTE-BASE / PERFORMA BIO):**
   - [ ] "Produtor já utiliza?" → clique "Não"
   - [ ] "Potencial" → digite "250"
   - [ ] "Concorrentes" → busque "MAP", selecione + "TOPMIX"
   - [ ] "Observação" → digite "Novo interesse"
   
   **Deixar outros vazios (não preenchidos)**

2. **Preencher campos obrigatórios (comuns)**
   - [ ] Canal → selecione um (ex: COSAN)
   - [ ] Unidade → digite (ex: "Ribeirão Preto")
   - [ ] Estado → selecione "SP" ou "PR"

3. **Clique botão "Salvar Cadastro"**
   - [ ] Botão fica cinzento + loading spinner
   - [ ] Aguarde 2-3 segundos
   - [ ] Toast verde: "✅ Sucesso - Cadastro salvo e sincronizado!"
   - [ ] Volta para tela anterior (admin ou home)

✅ **Esperado:** Salva sem erro, toast aparece, volta para anterior.

---

## 🧪 TESTE 4: Verificar JSON no Google Sheets

### Executar
1. **Abrir Google Sheets (planilha do projeto)**
   
2. **Ir para aba CADASTROS**
   - [ ] Última linha tem cadastro novo (cadastroId mais recente)

3. **Clique na coluna H (categorias)**
   - [ ] Vê JSON expandido:
     ```json
     [
       {
         "categoria": "FERTILIZANTE - BASE",
         "produtoRef": "MICROESSENTIALS",
         "produtoNomeLivre": "",
         "unidadePotencial": "tons",
         "implantado": "Sim",
         "potencialValor": 500,
         "concorrentes": "00 00 60 KCL",
         "observacao": "Cliente grande"
       },
       {
         "categoria": "FERTILIZANTE - BASE",
         "produtoRef": "PERFORMA_BIO",
         ...
         "implantado": "Não",
         "potencialValor": 250,
         "concorrentes": "11 52 00 MAP, 02 28 20 TOPMIX",
         ...
       },
       ...
     ]
     ```
   
4. **Verificar estrutura**
   - [ ] Array com 2 elementos (os que preenchemos) ou mais (se preencheu mais)
   - [ ] Sem truncamento (não limitado a 5)
   - [ ] JSON válido (não erros de syntax)
   - [ ] Valores corretos (500, 250, "KCL", "MAP, TOPMIX")
   - [ ] Não há "undefined", todos campos preenchidos

✅ **Esperado:** JSON salvo corretamente, contém apenas os subcadastros preenchidos (não vazios), estrutura válida.

---

## 🧪 TESTE 5: Admin Editar Cadastro

### Pré-requisito
- Executou TESTE 1-4 (tem cadastro salvo)

### Executar
1. **Ir para Admin**
   - Menu → Admin ou aba Admin

2. **Localizar cadastro novo**
   - [ ] Vê card com dados (email, canal, unidade, estado)
   - [ ] Card mostra subcadastros (agora N items, não 5)
   - [ ] Exibe: "FERTILIZANTE - BASE: Produto, Potencial: 500 tons, ..."

3. **Clique [Editar]**
   - [ ] Vai para novo-cadastro.tsx com editId
   - [ ] useEffect carrega dados
   - [ ] Tela mostra "Editar Cadastro" (título)
   - [ ] Campos comuns mostram dados antigos (Canal, Unidade, Estado)
   - [ ] **Subcadastros carregam com dados salvos**
     - [ ] Primeiro cartão: Potencial = 500, Concorrentes = "00 00 60 KCL", Observação = "Cliente grande"
     - [ ] Segundo cartão: Potencial = 250, Concorrentes = "11 52 00 MAP, 02 28 20 TOPMIX"

4. **Editar um subcadastro**
   - [ ] Mude Potencial de 500 → 750
   - [ ] Mude Concorrentes: remova "KCL", adicione "ULEXITA"
   - [ ] Resultado: Concorrentes = "ULEXITA"
   - [ ] Mude Observação: "Cliente grande" → "Cliente muito grande"

5. **Clique [Atualizar Cadastro]**
   - [ ] Toast verde: "✅ Cadastro Atualizado!"
   - [ ] Volta para admin

6. **Verificar no Sheets**
   - [ ] Abrir CADASTROS
   - [ ] Linha do cadastro editado tem JSON atualizado
   - [ ] Primeira categoria: potencialValor = 750, concorrentes = "ULEXITA", observacao = "Cliente muito grande"

✅ **Esperado:** Edição carrega dados, permite alterar, salva JSON atualizado no Sheets.

---

## 🧪 TESTE 6: GR Search (Admin)

### Executar
1. **Admin → campo "Buscar por GR"**
   - [ ] Input aparece na tela

2. **Digitar um GR válido**
   - Ex: se cadastro tem usuario com GR "SA01", digite "SA01"
   - [ ] Filtra cards → mostra apenas cadastros desse GR
   - [ ] Se não tem, mostra "Nenhum resultado"

3. **Limpar busca**
   - [ ] Backspace para limpar
   - [ ] Cards voltam a aparecer todos

✅ **Esperado:** Filtro funciona com dados novos (pull JSON do Sheets).

---

## 🧪 TESTE 7: Deletar Cadastro (Admin)

### Executar
1. **Admin → card de um cadastro**
   - [ ] Clique [Excluir]
   - [ ] Alert: "Tem certeza que deseja excluir?"
   
2. **Confirmar deleção**
   - [ ] Clique "OK"
   - [ ] Card desaparece
   - [ ] Toast: "✅ Cadastro deletado"

3. **Verificar no Sheets**
   - [ ] Abrir CADASTROS
   - [ ] Linha está vazia (clear API removeu dados)

✅ **Esperado:** Deleção funciona, linha fica vazia no Sheets.

---

## ⚠️ Se Erros Ocorrerem

### Erro: "Produtos não carregam" ou "Cadastro vazio"
- [ ] Verificar PRODUTOS sheet tem dados com `ativo=true`
- [ ] Checar console do navegador (F12) para erros

### Erro: "JSON inválido ao salvar"
- [ ] Console mostra erro? Enviar screenshot
- [ ] Verificar que categoriasData está sendo serializado

### Erro: "Dropdown não abre"
- [ ] Verificar CONCORRENTES sheet tem dados
- [ ] Checar `concorrenteDropdownOpen[index]` está sendo setado

### Erro: "Editar não carrega dados"
- [ ] Pull do Sheets falhando? Verificar console
- [ ] JSON na coluna H está corrompido? Verificar no Sheets

---

## 📋 Checklist Final

- [ ] TESTE 1: Subcadastros aparecem (~13)
- [ ] TESTE 2: Dropdown abre, filtra, múltiplas seleções
- [ ] TESTE 3: Salva sem erro
- [ ] TESTE 4: JSON salvo corretamente no Sheets
- [ ] TESTE 5: Editar carrega dados, atualiza
- [ ] TESTE 6: GR search funciona
- [ ] TESTE 7: Deletar funciona

✅ **Se todos os testes passaram:** Implementação está pronta para produção!

---

**Tempo total esperado:** 5-10 minutos  
**Data:** 13 de Janeiro de 2026  
**Status:** Pronto para teste
