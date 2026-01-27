# 🧪 Teste Manual - Correções do Novo Cadastro

## 📋 Pré-requisitos

- [ ] Aplicação rodando em localhost (`npm run dev` ou similar)
- [ ] Browser com DevTools disponível (F12)
- [ ] Cadastros existentes no localStorage (ou criar um novo)
- [ ] Google Sheets configurado (ou app funcionando localmente)

---

## 🚀 Teste 1: Criar Novo Cadastro

### Passos
1. Abra o app em localhost
2. Clique em "Novo Cadastro" ou botão "+"
3. **Abra DevTools:** F12 → Console
4. Preencha os campos:
   - Canal: Selecione um valor
   - Unidade: Digite um valor
   - Estado: Selecione um estado
   - (Categorias são opcionais)

### O Que Observar (Console)

```
========== 🚀 INICIANDO SALVAMENTO ==========
[Novo Cadastro] ⏰ Hora: 14:30:45
[Novo Cadastro] 🔒 Bloqueando cliques duplos...
[Novo Cadastro] ✅ isLoading definido como true
[Novo Cadastro] 👤 Usuário: [Seu nome] ([seu email]) - Role: [ATC/COORD]
[Novo Cadastro] 📋 Validando campos essenciais...
[Novo Cadastro]   - canal: [SEU_CANAL]
[Novo Cadastro]   - unidade: ✅ preenchido
[Novo Cadastro]   - estado: [SEU_ESTADO]
[Novo Cadastro] ✅ Todas as validações passaram!
```

5. Clique em "Salvar Cadastro"
6. **Continue observando o console:**

```
[Novo Cadastro] ⏰ Timestamp atual: 2024-01-15T14:30:45.123Z
[Novo Cadastro] 📸 Snapshots criados: [número]
[Novo Cadastro] ➕ MODO NOVO CADASTRO
[Novo Cadastro] 📖 Histórico criado: 1 registro
[Novo Cadastro] 💾 Iniciando salvar em AsyncStorage...
[Novo Cadastro] ✅ Salvo em AsyncStorage com sucesso!
[Novo Cadastro] 🌐 Iniciando sincronização com Google Sheets...
[Novo Cadastro] 📊 Enviando cadastro para API...
[Novo Cadastro] ✅ Resposta da API recebida:
  - success: true
  - message: Cadastro criado com sucesso
[Novo Cadastro] 🎉 ✅ Sucesso
[Novo Cadastro] ℹ️  Cadastro salvo e sincronizado com Google Sheets!
[Novo Cadastro] ⏱️  Aguardando 600ms antes de voltar...
[Novo Cadastro] 🔙 Voltando para tela anterior...
========== ✅ SALVAMENTO CONCLUÍDO ==========
```

### ✅ Critério de Sucesso
- [ ] Console mostra logs completos (sem erros)
- [ ] Toast mostra "✅ Sucesso"
- [ ] App volta para lista de cadastros
- [ ] Novo cadastro aparece na lista

---

## 🔄 Teste 2: Editar Cadastro Existente

### Passos
1. Vá para a lista de cadastros
2. Encontre um cadastro e clique em "Editar"
3. **Abra DevTools:** F12 → Console
4. **Observe os logs de carregamento:**

```
[Novo Cadastro] 🔄 Carregando cadastro para edição: ABC123XYZ
[Novo Cadastro] 📊 Tentando buscar do Google Sheets...
[Novo Cadastro] ✅ Cadastro carregado do Google Sheets: ABC123XYZ
(OU)
[Novo Cadastro] ⚠️ Cadastro NÃO encontrado no Sheets, tentando localStorage...
[Novo Cadastro] 💾 Tentando buscar do localStorage...
[Novo Cadastro] ✅ Cadastro carregado do localStorage: ABC123XYZ
[Novo Cadastro] ✅ Preenchendo formulário com dados do cadastro...
[Novo Cadastro] ✅ Modo de edição ativado!
```

5. **Teste a UI:**
   - [ ] Todos os campos estão preenchidos
   - [ ] Formulário é completamente visível (não cortado)
   - [ ] Botão "Salvar" está visível no final

6. **Teste os Dropdowns:**
   - [ ] Clique no dropdown "Canal" → deve abrir com lista maior
   - [ ] Clique no dropdown "Concorrentes" → deve abrir normalmente
   - [ ] Role para baixo no dropdown → deve funcionar

7. Faça uma alteração (ex: adicione um concorrente)

8. Clique em "Atualizar Cadastro"

9. **Observe os logs:**

```
========== 🚀 INICIANDO SALVAMENTO ==========
[Novo Cadastro] ✏️  MODO EDIÇÃO: editingId=ABC123XYZ
[Novo Cadastro] 📚 Total de cadastros em localStorage: [número]
[Novo Cadastro] ✅ Cadastro existente encontrado!
[Novo Cadastro] 📖 Histórico anterior: [número] registros
[Novo Cadastro] 📖 Histórico atualizado: [número+1] registros
[Novo Cadastro] 🎉 ✅ Cadastro Atualizado
[Novo Cadastro] ℹ️  Cadastro atualizado e sincronizado com Google Sheets!
[Novo Cadastro] 🔄 Recarregando dados do Google Sheets após edição...
[Novo Cadastro] ✅ Sincronização de cadastros após edição concluída
[Novo Cadastro] 📦 Total de cadastros sincronizados: [número]
```

### ✅ Critério de Sucesso
- [ ] Console mostra logs de carregamento
- [ ] Formulário renderiza completamente (não cortado)
- [ ] Edições são salvas
- [ ] Campo "Editado em" é preenchido
- [ ] Toast mostra sucesso

---

## 📅 Teste 3: Verificar Campo "Editado em"

### Passos
1. Volta para a lista de cadastros
2. Encontre o cadastro que acabou de editar
3. **Procure pelo campo "Editado em"** no card:

```
Cadastro: Unidade 001
Criado em: 15/01/2024 14:30:00
Editado em: 15/01/2024 14:35:30 ← DEVE ESTAR AQUI
```

### ✅ Critério de Sucesso
- [ ] Campo "Editado em" está visível no card
- [ ] Mostra data/hora recente (quando foi editado)
- [ ] Atualiza a cada edição

---

## ⚠️ Teste 4: Simular Erro de Validação

### Passos
1. Clique em "Novo Cadastro"
2. **NÃO** preencha o campo "Canal"
3. Preencha "Unidade" e "Estado"
4. Clique em "Salvar Cadastro"
5. **Observe no console:**

```
[Novo Cadastro] 📋 Validando campos essenciais...
[Novo Cadastro]   - canal: ❌ VAZIO
[Novo Cadastro] ⚠️  Canal vazio
```

### ✅ Critério de Sucesso
- [ ] Alert mostra: "Erro: Selecione um canal"
- [ ] App NÃO permite salvar sem canal
- [ ] Console mostra erro de validação

---

## 🚨 Teste 5: Simular Erro de Sincronização

**Nota:** Este teste é mais realista em produção (Vercel)

### Passos (Em Localhost)
1. Simule erro desligando a rede:
   - DevTools → Network → Throttling → Offline (opcional)
2. Crie um novo cadastro
3. **Observe:**

```
[Novo Cadastro] ⚠️  Sincronização falhou! Enfileirando para retry...
[Novo Cadastro] 📦 Guardando em fila de sincronização...
[Novo Cadastro] ⚠️ Cadastro Salvo
[Novo Cadastro] ℹ️  Dados salvos localmente. Sincronização pendente...
```

### ✅ Critério de Sucesso
- [ ] App salva localmente mesmo com erro
- [ ] Toast mostra "⚠️ Cadastro Salvo"
- [ ] Cadastro fica em fila para retry automático

---

## 📊 Teste 6: Verificar Logs Completos

### Passos
1. Abra DevTools (F12)
2. Vá para Console
3. **Limpe console:** `console.clear()`
4. Crie um novo cadastro
5. **Copie todos os logs:**
   - Clique direito → "Save as..."
   - Salve como `logs_novo_cadastro.txt`

### ✅ Critério de Sucesso
- [ ] Arquivo contém fluxo completo
- [ ] Todos os pontos de checkpoint estão presentes
- [ ] Sem erros ou exceções não esperadas

---

## 🔍 Teste 7: Testar Dropdowns Completos

### Canal Dropdown (Linha 519)
1. Clique em "Novo Cadastro"
2. Clique no campo "Canal"
3. **Dropdown deve mostrar:**
   - [ ] Lista completa de canais
   - [ ] Altura adequada (não cortado)
   - [ ] Scroll funcionando se lista for grande
4. Selecione um canal

### Concorrentes Dropdown (Linha 792)
1. Na seção de uma categoria, clique no campo "Concorrentes"
2. **Dropdown deve mostrar:**
   - [ ] Lista filtrada de concorrentes
   - [ ] Altura adequada (não cortado)
   - [ ] Checkbox ou indicador de seleção
   - [ ] Scroll funcionando
3. Selecione alguns concorrentes

---

## 📈 Teste 8: Performance e Fluxo Completo

### Passos (Sequência Full Flow)
1. **Criar:** Novo cadastro com 2+ categorias
   - Tempo esperado: 2-5 segundos (com sync)
   - Console: Deve mostrar fluxo completo

2. **Editar:** O cadastro criado
   - Tempo esperado: 1-3 segundos
   - Verificar: "Editado em" aparece

3. **Sincronizar:** Confirmar no Google Sheets
   - Acessar Google Sheets
   - Procurar nova linha com dados corretos

4. **Voltar:** Para a lista
   - [ ] Novo cadastro aparece
   - [ ] "Criado em" e "Editado em" estão presentes

### ✅ Critério de Sucesso
- [ ] Fluxo completo sem erros
- [ ] Dados sincronizados com Google Sheets
- [ ] Tempos de resposta aceitáveis

---

## 📋 Checklist Final

- [ ] Teste 1: Novo cadastro criado e sincronizado
- [ ] Teste 2: Editar cadastro abre completamente (não cortado)
- [ ] Teste 3: Campo "Editado em" aparece e atualiza
- [ ] Teste 4: Validação funciona (campos obrigatórios)
- [ ] Teste 5: Erro de sincronização enfileira corretamente
- [ ] Teste 6: Logs são completos e informativos
- [ ] Teste 7: Dropdowns abrem com altura adequada
- [ ] Teste 8: Fluxo completo sem problemas

---

## 🐛 Se Encontrar Problemas

### "Cadastro não abre para editar"
1. Verifique o console:
   ```
   [Novo Cadastro] ❌ Cadastro NÃO encontrado em nenhuma fonte
   ```
2. Solução: Recarregue a lista com pull-to-refresh
3. Cole os logs aqui: https://github.com/.../issues/new

### "Modal mostra apenas topo (ainda cortado)"
1. Verifique se está usando versão corrigida:
   ```
   Linha 519: max-h-96 (não max-h-48)
   Linha 792: max-h-96 (não max-h-48)
   ```
2. Se não: Faça pull da última versão
3. Se sim: Limpe cache → Ctrl+Shift+R (hard refresh)

### "Editado em continua vazio"
1. Verifique se é primeiro cadastro: Novo cadastro não mostra "Editado em"
2. Edite o cadastro: Depois de editar, deve aparecer
3. Se ainda não aparecer: Cole console logs em issue

### "Sincronização sempre falha"
1. Verifique se Google Sheets está configurado
2. Verifique logs de erro específicos no console
3. Teste em Vercel (melhor diagnóstico)

---

## 📞 Próximo Passo

Após validar TODOS os testes:
1. Faça push da versão corrigida
2. Vercel faz deploy automático
3. Teste em produção com mesmo procedimento
4. Se tudo OK: Libere para usuários

---

**Commit:** d69ea4b  
**Data:** 15 de janeiro de 2024  
**Versão:** 1.0  
**Próximo:** Deploy em Vercel
