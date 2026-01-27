# 🔍 Guia de Debug - Sistema de Logs Melhorado

## 📋 Sumário

Este documento explica como usar o novo sistema de logging detalhado adicionado à função `handleSalvar()` e ao carregamento de cadastros para edição.

## 🎯 O que foi melhorado

### 1. **Logs na Função de Edição (`loadForEdit`)**
Adicionado logging em 7 pontos críticos:

```
✅ Estado: "Carregando cadastro para edição"
✅ Tentativa: "Tentando buscar do Google Sheets"
✅ Resultado: "Cadastro carregado do Sheets" ou "Cadastro NÃO encontrado no Sheets"
✅ Fallback: "Tentando buscar do localStorage"
✅ Resultado: "Cadastro carregado do localStorage"
✅ Erro: "Cadastro NÃO encontrado em nenhuma fonte"
✅ Sucesso: "Preenchendo formulário com dados do cadastro"
```

### 2. **Logs na Função de Salvamento (`handleSalvar`)**
Adicionado logging em 15 pontos críticos:

```
INÍCIO
├─ ⏰ Hora exata do clique
├─ 🔒 Bloqueio de cliques duplos
├─ ✅ isLoading definido como true
├─ 👤 Informações do usuário (nome, email, role)
├─ 📋 Validação de campos (canal, unidade, estado)
├─ 💾 Salvar em AsyncStorage
├─ 🌐 Sincronizar com Google Sheets
├─ 📊 Resposta da API (success, message, error, details)
├─ 🎉 Sucesso: Tipo de cadastro (novo ou edição)
├─ 🔄 Se edição: Recarregar dados do Sheets
├─ 📦 Total de cadastros sincronizados
├─ 🔙 Volta para tela anterior após 600ms
├─ ⚠️ Se falha: Enfileira para retry automático
└─ ✅ FIM: isLoading redefinido como false
```

## 🖥️ Como Visualizar os Logs

### **Em Localhost (React Native Web)**
1. Abra o navegador (Chrome, Firefox, Safari)
2. Pressione **F12** para abrir DevTools
3. Vá para a aba **Console**
4. Crie um novo cadastro ou edite um existente
5. Os logs aparecerão no Console em tempo real

### **Em Produção (Vercel)**
1. Abra o navegador e acesse o app
2. Pressione **F12** para abrir DevTools
3. Vá para a aba **Console**
4. Os logs também aparecem em produção (não são filtrados)
5. **IMPORTANTE:** Logs também são enviados ao servidor em caso de erro

## 📊 Interpretando os Logs

### **Cenário 1: Novo Cadastro Salvo com Sucesso**

```
========== 🚀 INICIANDO SALVAMENTO ==========
[Novo Cadastro] ⏰ Hora: 14:30:45
[Novo Cadastro] 🔒 Bloqueando cliques duplos...
[Novo Cadastro] ✅ isLoading definido como true
[Novo Cadastro] 👤 Usuário: João Silva (joao@example.com) - Role: ATC
[Novo Cadastro] 📋 Validando campos essenciais...
[Novo Cadastro]   - canal: DISTRIBUIDOR
[Novo Cadastro]   - unidade: ✅ preenchido
[Novo Cadastro]   - estado: SP
[Novo Cadastro] ✅ Todas as validações passaram!
[Novo Cadastro] ⏰ Timestamp atual: 2024-01-15T14:30:45.123Z
[Novo Cadastro] 📸 Snapshots criados: 2
[Novo Cadastro] ➕ MODO NOVO CADASTRO
[Novo Cadastro] 📖 Histórico criado: 1 registro
[Novo Cadastro] 📦 Objeto cadastro criado:
  - cadastroId: ABC123XYZ
  - canal: DISTRIBUIDOR
  - unidade: Unidade 001
  - atcEmail: joao@example.com
  - atcNome: João Silva
  - categorias: 2
  - historico: 1
  - editadoEm: (vazio para novo cadastro)
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

[Novo Cadastro] 🔓 Desbloqueando cliques duplos...
[Novo Cadastro] ✅ isLoading definido como false
```

### **Cenário 2: Editar Cadastro Existente com Sucesso**

```
========== 🚀 INICIANDO SALVAMENTO ==========
[Novo Cadastro] ⏰ Hora: 14:35:20
[Novo Cadastro] 🔒 Bloqueando cliques duplos...
[Novo Cadastro] ✅ isLoading definido como true
[Novo Cadastro] 👤 Usuário: Maria Santos (maria@example.com) - Role: COORD
[Novo Cadastro] 📋 Validando campos essenciais...
[Novo Cadastro]   - canal: PRODUTOR
[Novo Cadastro]   - unidade: ✅ preenchido
[Novo Cadastro]   - estado: MG
[Novo Cadastro] ✅ Todas as validações passaram!
[Novo Cadastro] ⏰ Timestamp atual: 2024-01-15T14:35:20.456Z
[Novo Cadastro] 📸 Snapshots criados: 1
[Novo Cadastro] ✏️  MODO EDIÇÃO: editingId=ABC123XYZ
[Novo Cadastro] 📚 Total de cadastros em localStorage: 15
[Novo Cadastro] ✅ Cadastro existente encontrado!
[Novo Cadastro] 📖 Histórico anterior: 2 registros
[Novo Cadastro] 📖 Histórico atualizado: 3 registros
[Novo Cadastro] 📦 Objeto cadastro criado:
  - cadastroId: ABC123XYZ
  - canal: PRODUTOR
  - unidade: Unidade 002
  - atcEmail: maria@example.com (mantido de antes)
  - atcNome: Maria Santos (mantido de antes)
  - categorias: 2
  - historico: 3
  - editadoEm: 2024-01-15T14:35:20.456Z
[Novo Cadastro] 💾 Iniciando salvar em AsyncStorage...
[Novo Cadastro] ✅ Salvo em AsyncStorage com sucesso!
[Novo Cadastro] 🌐 Iniciando sincronização com Google Sheets...
[Novo Cadastro] 📊 Enviando cadastro para API...
[Novo Cadastro] ✅ Resposta da API recebida:
  - success: true
  - message: Cadastro atualizado com sucesso
[Novo Cadastro] 🎉 ✅ Cadastro Atualizado
[Novo Cadastro] ℹ️  Cadastro atualizado e sincronizado com Google Sheets!
[Novo Cadastro] 🔄 Recarregando dados do Google Sheets após edição...
[Novo Cadastro] ✅ Sincronização de cadastros após edição concluída
[Novo Cadastro] 📦 Total de cadastros sincronizados: 15
[Novo Cadastro] ⏱️  Aguardando 600ms antes de voltar...
[Novo Cadastro] 🔙 Voltando para tela anterior...
========== ✅ SALVAMENTO CONCLUÍDO ==========

[Novo Cadastro] 🔓 Desbloqueando cliques duplos...
[Novo Cadastro] ✅ isLoading definido como false
```

### **Cenário 3: Erro de Validação (Campo Obrigatório Vazio)**

```
========== 🚀 INICIANDO SALVAMENTO ==========
[Novo Cadastro] ⏰ Hora: 14:40:10
[Novo Cadastro] 🔒 Bloqueando cliques duplos...
[Novo Cadastro] ✅ isLoading definido como true
[Novo Cadastro] 👤 Usuário: Pedro Costa (pedro@example.com) - Role: ATC
[Novo Cadastro] 📋 Validando campos essenciais...
[Novo Cadastro]   - canal: ❌ VAZIO
[Novo Cadastro]   - unidade: ✅ preenchido
[Novo Cadastro]   - estado: RJ
[Novo Cadastro] ⚠️  Canal vazio
[Alert mostra: "Erro: Selecione um canal"]
[Novo Cadastro] 🔓 Desbloqueando cliques duplos...
[Novo Cadastro] ✅ isLoading definido como false
```

### **Cenário 4: Sincronização Falha (Vercel Offline)**

```
========== 🚀 INICIANDO SALVAMENTO ==========
[Novo Cadastro] ⏰ Hora: 14:45:30
... [logs de validação e criação] ...
[Novo Cadastro] 💾 Iniciando salvar em AsyncStorage...
[Novo Cadastro] ✅ Salvo em AsyncStorage com sucesso!
[Novo Cadastro] 🌐 Iniciando sincronização com Google Sheets...
[Novo Cadastro] 📊 Enviando cadastro para API...
[Novo Cadastro] ✅ Resposta da API recebida:
  - success: false
  - message: Erro ao sincronizar
  - error: Network error: Failed to fetch
[Novo Cadastro] ⚠️  Sincronização falhou! Enfileirando para retry...
[Novo Cadastro] 📦 Guardando em fila de sincronização...
[Novo Cadastro] ⚠️ Cadastro Salvo
[Novo Cadastro] ℹ️  Dados salvos localmente. Sincronização pendente — será tentada automaticamente.
[Toast mostra: "⚠️ Cadastro Salvo"]
[Novo Cadastro] ⏱️  Aguardando 600ms antes de voltar...
[Novo Cadastro] 🔙 Voltando para tela anterior...
========== ✅ SALVAMENTO CONCLUÍDO ==========

[Novo Cadastro] 🔓 Desbloqueando cliques duplos...
[Novo Cadastro] ✅ isLoading definido como false
```

### **Cenário 5: Erro Não Capturado (Exception)**

```
========== 🚀 INICIANDO SALVAMENTO ==========
[Novo Cadastro] ⏰ Hora: 14:50:45
... [logs] ...
[Novo Cadastro] 💾 Iniciando salvar em AsyncStorage...

❌ ❌ ❌ ERRO NO SALVAMENTO ❌ ❌ ❌
[Novo Cadastro] ❌ Erro capturado: TypeError: cadastro.categorias.map is not a function
[Novo Cadastro] Nome do erro: TypeError
[Novo Cadastro] Mensagem: cadastro.categorias.map is not a function
[Novo Cadastro] Stack: 
  at sendCadastroToSheets (google-sheets-sync.ts:560)
  at handleSalvar (novo-cadastro.tsx:390)
  at ...
[Novo Cadastro] Estado quando erro ocorreu: {
  isEditing: false,
  editingId: null,
  canal: "DISTRIBUIDOR",
  unidade: "Unidade 001",
  estado: "SP",
  isLoading: true
}
[Alert mostra: "Erro: Ocorreu um erro ao salvar o cadastro: TypeError: cadastro.categorias.map is not a function"]
[Novo Cadastro] 🔓 Desbloqueando cliques duplos...
[Novo Cadastro] ✅ isLoading definido como false
```

## 🔧 Resolvendo Problemas Comuns

### ❌ Problema: "Cadastro NÃO encontrado em nenhuma fonte"

**O que significa:** Tentou-se editar um cadastro que não existe no Sheets ou localStorage

**Causas:**
- Cadastro foi deletado entre o carregamento da lista e o clique em Editar
- ID do cadastro está corrompido
- Cache desatualizado

**Solução:**
1. Volte para a lista de cadastros
2. Força atualização (pull-to-refresh)
3. Tente editar novamente

---

### ❌ Problema: "Sincronização falhou! Enfileirando para retry"

**O que significa:** Cadastro foi salvo localmente mas não foi para Google Sheets

**Causas mais comuns:**
- Vercel offline ou sem acesso a Google Sheets API
- Tokens de autenticação expirados
- Quota do Google Sheets excedida

**Solução:**
1. Verifique conexão de internet
2. Aguarde alguns minutos (retry automático acontece a cada 30 segundos)
3. Se persistir: Acesse [Vercel Dashboard](https://vercel.com) e verifique logs do servidor

---

### ❌ Problema: Timeout (Salvar leva muito tempo)

**O que significa:** Operação levou mais de 30 segundos

**Causas:**
- Conexão de internet lenta
- Google Sheets API sobrecarregado
- Vercel em cold start

**Solução:**
1. Tente novamente
2. Se for produção, aguarde cache warm-up (5-10 minutos)
3. Divida cadastros grandes em múltiplos cadastros menores

---

### ❌ Problema: "Erro ao sincronizar cadastros após edição"

**O que significa:** Edição foi sincronizada, mas a sincronização de retorno falhou

**Causas:**
- Problema temporário de rede
- Google Sheets API não respondendo
- Cache desatualizado

**Solução:**
1. Volte para a lista de cadastros
2. Pull-to-refresh para recarregar dados
3. Se ainda não atualizar: Aguarde 1 minuto (sync automático)

---

## 📈 Métricas Importantes nos Logs

### Timestamps
```
[Novo Cadastro] ⏰ Timestamp atual: 2024-01-15T14:30:45.123Z
```
Use este timestamp para correlacionar com logs do servidor (em Vercel)

### Snapshots
```
[Novo Cadastro] 📸 Snapshots criados: 2
```
Número de produtos com potencial registrados nesta edição

### Histórico
```
[Novo Cadastro] 📖 Histórico atualizado: 3 registros
```
Número de edições prévias deste cadastro

## 🚀 Próximos Passos

1. **Teste em localhost** criando e editando cadastros
2. **Observe os logs** e confirme fluxo esperado
3. **Se houver erro**: Copie os logs completos e compartilhe com a equipe
4. **Em produção**: Se precisar debugar, use DevTools no navegador (F12)

## 📝 Exemplo de Coleta de Logs para Bug Report

Se encontrar um erro, coleta esta informação:

1. Abra DevTools (F12)
2. Vá para Console
3. Clique com botão direito em qualquer log
4. Selecione "Save as..." e salve como arquivo
5. Compartilhe o arquivo com a equipe
6. Inclua também:
   - Que ação estava tentando fazer (novo cadastro ou edição)
   - Em que etapa falhou
   - Qual é o erro mostrado no Alert (popup)

---

**Última atualização:** 15 de janeiro de 2024  
**Versão:** 1.0  
**Autor:** Sistema de Debug Melhorado
