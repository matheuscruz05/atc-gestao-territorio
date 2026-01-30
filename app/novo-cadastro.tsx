import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import {
  getProdutos,
  getCanais,
  addCadastro,
  generateUniqueId,
  getCadastros,
} from "@/lib/storage";
import { sendCadastroToSheets, syncConcorrentesFromSheets, syncCadastrosFromSheets } from "@/lib/google-sheets-sync";
import { useToast } from "@/lib/toast";
import { enqueueCadastro } from "@/lib/sync-queue";
import type {
  Produto,
  Canal,
  Categoria,
  Implantado,
  Cadastro,
  PotencialSnapshot,
  HistoricoEdicao,
  CategoriaData,
} from "@/types/models";
import { CATEGORIAS, PRODUTOS_CATALOGO } from "@/types/models";
import { Picker } from "@react-native-picker/picker";

export default function NovoCadastroScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const toast = useToast();

  // Dados de referência
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [canais, setCanais] = useState<Canal[]>([]);
  const [concorrentes, setConcorrentes] = useState<string[]>([]);
  const [concorrenteSearch, setConcorrenteSearch] = useState<Record<number, string>>({});
  const [concorrenteDropdownOpen, setConcorrenteDropdownOpen] = useState<Record<number, boolean>>({});

  // Campos comuns do cadastro
  const [canal, setCanal] = useState("");
  const [canalSearch, setCanalSearch] = useState("");
  const [showCanalSuggestions, setShowCanalSuggestions] = useState(false);
  const [unidade, setUnidade] = useState("");
  const [estado, setEstado] = useState("");

  // Subcadastros: um por produto ativo (serão preenchidos após carregar produtos)
  const [categoriasData, setCategoriasData] = useState<CategoriaData[]>([]);
  const [defaultsApplied, setDefaultsApplied] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalCreatedEm, setOriginalCreatedEm] = useState<string | null>(null);
  const [originalAtcEmail, setOriginalAtcEmail] = useState<string | null>(null);
  const [originalAtcNome, setOriginalAtcNome] = useState<string | null>(null);

  const params = useLocalSearchParams();
  const editId = (params as any)?.editId as string | undefined;

  const CATEGORY_ORDER = CATEGORIAS;

  const buildCategoriasFromProdutos = (produtosList: Produto[]): CategoriaData[] => {
    const ativos = produtosList.filter((p) => p.ativo);
    const ordered: CategoriaData[] = [];

    CATEGORY_ORDER.forEach((cat) => {
      ativos
        .filter((p) => p.categoria === cat)
        .forEach((p) => {
          ordered.push({
            categoria: p.categoria,
            produtoRef: p.produtoId,
            produtoNomeLivre: "",
            unidadePotencial: p.unidadePotencial,
            implantado: "Não",
            safra: "Verão",
            potencialAtingido: 0,
            potencialTotal: 0,
            concorrentes: "",
            observacao: "",
          });
        });
    });

    return ordered;
  };

  // Carregar dados de referência
  useEffect(() => {
    async function loadData() {
      const [produtosData, canaisData, concorrentesData] = await Promise.all([
        getProdutos(),
        getCanais(),
        syncConcorrentesFromSheets(),
      ]);
      setProdutos(produtosData.filter((p) => p.ativo));
      setCanais(canaisData.filter((c) => c.ativo));
      setConcorrentes(concorrentesData);

      if (!editId && !defaultsApplied) {
        const defaults = buildCategoriasFromProdutos(produtosData);
        setCategoriasData(defaults);
        setDefaultsApplied(true);
      }
    }
    loadData();
  }, [defaultsApplied]); // Removido editId das dependências para evitar conflito com loadForEdit

  // Se vier editId, carregar cadastro existente
  useEffect(() => {
    async function loadForEdit() {
      if (!editId) return;
      try {
        console.log(`[Novo Cadastro] 🔄 Carregando cadastro para edição: ${editId}`);
        // Tentar buscar do Google Sheets primeiro (Vercel/web)
        let found: Cadastro | undefined = undefined;
        try {
          console.log(`[Novo Cadastro] 📊 Tentando buscar do Google Sheets...`);
          const allFromSheets = await syncCadastrosFromSheets();
          found = allFromSheets.find((c) => c.cadastroId === editId);
          if (found) {
            console.log(`✅ [Novo Cadastro] Cadastro carregado do Google Sheets: ${editId}`);
          } else {
            console.warn(`⚠️ [Novo Cadastro] Cadastro NÃO encontrado no Sheets: ${editId}`);
          }
        } catch (error) {
          console.warn(`⚠️ [Novo Cadastro] Erro ao buscar do Sheets, tentando localStorage:`, error);
        }
        
        // Fallback para localStorage se Sheets falhou
        if (!found) {
          console.log(`[Novo Cadastro] 💾 Tentando buscar do localStorage...`);
          const all = await getCadastros();
          found = all.find((c) => c.cadastroId === editId);
          if (found) {
            console.log(`✅ [Novo Cadastro] Cadastro carregado do localStorage: ${editId}`);
          } else {
            console.error(`❌ [Novo Cadastro] Cadastro NÃO encontrado em nenhuma fonte: ${editId}`);
            console.error(`[Novo Cadastro] Cadastros disponíveis no localStorage: ${all.map(c => c.cadastroId).join(", ")}`);
          }
        }
        
        if (found) {
          console.log(`[Novo Cadastro] ✅ Preenchendo formulário com dados do cadastro...`);
          console.log(`[Novo Cadastro] 📍 found.cadastroId: ${found.cadastroId}`);
          console.log(`[Novo Cadastro] 📊 found.categorias length: ${found.categorias?.length || "undefined"}`);
          console.log(`[Novo Cadastro] 🔍 found.categoria (antigo): ${found.categoria || "undefined"}`);
          console.log(`[Novo Cadastro] 🔍 PRODUTOS_CATALOGO.length: ${PRODUTOS_CATALOGO.length}`);
          console.log(`[Novo Cadastro] 🔍 CATEGORY_ORDER:`, CATEGORY_ORDER);
          
          if (found.categorias && found.categorias.length > 0) {
            console.log(`[Novo Cadastro] 🔍 Primeiras 3 categorias:`, found.categorias.slice(0, 3).map(c => ({
              categoria: c.categoria,
              produtoRef: c.produtoRef,
              implantado: c.implantado,
              potencialAtingido: c.potencialAtingido,
              potencialTotal: c.potencialTotal,
            })));
          }
          
          console.log(`[Novo Cadastro] 📝 Definindo estados de canal, unidade, estado...`);
          setCanal(found.canal);
          setUnidade(found.unidade);
          setEstado(found.estado);
          setOriginalAtcEmail(found.atcEmail);
          setOriginalAtcNome(found.atcNome);
          console.log(`[Novo Cadastro] ✅ Estados definidos com sucesso`);
          
          // Se tem categorias (novo formato)
          console.log(`[Novo Cadastro] 🔍 Verificando se tem categorias (novo formato)...`);
          if (found.categorias && Array.isArray(found.categorias) && found.categorias.length > 0) {
            console.log(`[Novo Cadastro] ✅ TEM categorias (novo formato)! Total: ${found.categorias.length}`);
            console.log(`[Novo Cadastro] 📦 Cadastro tem ${found.categorias.length} categorias (novo formato)`);
            console.log(`[Novo Cadastro] 📋 Primeiras categorias:`, found.categorias.slice(0, 3).map(c => ({
              categoria: c.categoria,
              produtoRef: c.produtoRef,
              implantado: c.implantado,
              potencialAtingido: c.potencialAtingido,
              potencialTotal: c.potencialTotal,
              concorrentes: c.concorrentes,
              observacao: c.observacao,
            })));
            // IMPORTANTE: Preservar TODOS os dados dos produtos salvos anteriormente
            // Mapear os dados de found.categorias para categoriasData, mantendo valores reais
            const migrated = found.categorias.map(cat => ({
              ...cat,
              safra: cat.safra ?? "Verão",
              // CRÍTICO: Preservar potenciais reais - não substituir por 0 se já têm valor!
              potencialAtingido: cat.potencialAtingido ?? (cat.implantado === "Sim" ? (cat.potencialValor || 0) : 0),
              potencialTotal: cat.potencialTotal ?? (cat.potencialValor || 0),
              // CRÍTICO: Preservar concorrentes e observacao salvos
              concorrentes: cat.concorrentes ?? "",
              observacao: cat.observacao ?? "",
            }));
            
            // IMPORTANTE: Se o cadastro tem menos produtos do que os disponíveis,
            // adicionar os produtos faltantes para permitir edição completa
            const totalProdutosCatalogo = PRODUTOS_CATALOGO.length;
            console.log(`[Novo Cadastro] 📊 Produtos no cadastro: ${migrated.length}, Produtos no catálogo: ${totalProdutosCatalogo}`);
            
            if (migrated.length < totalProdutosCatalogo) {
              console.log(`[Novo Cadastro] 📝 Cadastro tem ${migrated.length} produtos, mas catálogo tem ${totalProdutosCatalogo}`);
              console.log(`[Novo Cadastro] 📝 Adicionando produtos faltantes para permitir edição...`);
              
              // Obter IDs dos produtos já existentes no cadastro
              const existingProductIds = new Set(migrated.map(c => c.produtoRef));
              
              // Adicionar produtos que não existem no cadastro usando PRODUTOS_CATALOGO diretamente
              CATEGORY_ORDER.forEach((cat) => {
                PRODUTOS_CATALOGO
                  .filter((p) => p.categoria === cat && !existingProductIds.has(p.produtoId))
                  .forEach((p) => {
                    console.log(`[Novo Cadastro] ➕ Adicionando produto faltante: ${p.produto} (${p.categoria})`);
                    migrated.push({
                      categoria: p.categoria,
                      produtoRef: p.produtoId,
                      produtoNomeLivre: "",
                      unidadePotencial: p.unidadePotencial,
                      implantado: "Não",
                      safra: "Verão",
                      potencialAtingido: 0,
                      potencialTotal: 0,
                      concorrentes: "",
                      observacao: "",
                    });
                  });
              });
              
              console.log(`[Novo Cadastro] ✅ Total após adicionar faltantes: ${migrated.length} produtos`);
            }
            
            console.log(`[Novo Cadastro] ✅ Migradas ${migrated.length} categorias com dados preservados`);
            console.log(`[Novo Cadastro] 📊 Verificando dados:`, migrated.slice(0, 3).map(c => ({
              produto: c.produtoRef,
              implantado: c.implantado,
              potencialAtingido: c.potencialAtingido,
              concorrentes: c.concorrentes?.substring(0, 20),
            })));
            console.log(`[Novo Cadastro] 🚀 CHAMANDO setCategoriasData com ${migrated.length} categorias...`);
            setCategoriasData(migrated);
            console.log(`[Novo Cadastro] ✅ setCategoriasData EXECUTADO!`);
          } else if (found.categoria) {
            console.log(`[Novo Cadastro] 📦 Cadastro em formato antigo, convertendo...`);
            // Formato antigo - converter
            const oldData: CategoriaData = {
              categoria: found.categoria,
              produtoRef: found.produtoRef || "",
              produtoNomeLivre: found.produtoNomeLivre || "",
              unidadePotencial: found.unidadePotencial || "tons",
              implantado: found.implantado || "Não",
              safra: "Verão",
              potencialAtingido: found.implantado === "Sim" ? (found.potencialValor || 0) : 0,
              potencialTotal: found.potencialValor || 0,
              concorrentes: found.concorrentes || "",
              observacao: found.observacao || "",
            };
            const newCategorias = CATEGORIAS.map((cat) =>
              cat === found.categoria
                ? oldData
                : {
                    categoria: cat,
                    produtoRef: "",
                    produtoNomeLivre: "",
                    unidadePotencial: "tons" as const,
                    implantado: "Não" as Implantado,
                    safra: "Verão" as const,
                    potencialAtingido: 0,
                    potencialTotal: 0,
                    concorrentes: "",
                    observacao: "",
                  }
            );
            setCategoriasData(newCategorias);
          } else {
            // Fallback: se não tem categorias válidas, inicializar com defaults vazios BASEADO EM PRODUTOS
            console.log(`[Novo Cadastro] 📦 Cadastro sem categorias válidas, reconstruindo com buildCategoriasFromProdutos...`);
            console.log(`[Novo Cadastro] 📦 Cadastro tem: categorias=${found.categorias}, categoria=${found.categoria}`);
            
            // Chamar loadData para ter os produtos disponíveis
            const produtosData = await getProdutos();
            const defaults = buildCategoriasFromProdutos(produtosData);
            
            console.log(`[Novo Cadastro] ✅ Reconstruído com ${defaults.length} categorias (buildCategoriasFromProdutos)`);
            setCategoriasData(defaults);
            console.error(`[Novo Cadastro] ⚠️ Fallback usado: Cadastro sem categorias válidas. Recomendação: Re-salvar o cadastro para atualizar no Google Sheets`);
          }
          
          setIsEditing(true);
          setEditingId(found.cadastroId);
          setOriginalCreatedEm(found.criadoEm || null);
          console.log(`[Novo Cadastro] ✅ Modo de edição ativado!`);
        } else {
          console.error(`[Novo Cadastro] ❌ CADASTRO NÃO ENCONTRADO! editId: ${editId}`);
          console.error(`[Novo Cadastro] ❌ Tentou buscar do Sheets e localStorage mas found === undefined`);
        }
      } catch (error) {
        console.error("❌ Erro geral ao carregar cadastro para edição:", error);
        console.error("Stack:", error instanceof Error ? error.stack : "N/A");
      }
    }

    loadForEdit();
  }, [editId]);

  // Atualizar dados de uma categoria específica
  const updateCategoriaData = (index: number, field: keyof CategoriaData, value: any) => {
    const updated = [...categoriasData];
    (updated[index] as any)[field] = value;
    
    // Se mudou o produto, atualizar unidadePotencial
    if (field === "produtoRef" && value) {
      const produto = produtos.find((p) => p.produtoId === value);
      if (produto) {
        updated[index].unidadePotencial = produto.unidadePotencial;
      }
    }
    
    setCategoriasData(updated);
  };

  // Validar e salvar
  const handleSalvar = async () => {
    console.log("\n========== 🚀 INICIANDO SALVAMENTO ==========");
    console.log(`[Novo Cadastro] ⏰ Hora: ${new Date().toLocaleTimeString('pt-BR')}`);
    console.log("[Novo Cadastro] 🔒 Bloqueando cliques duplos...");
    
    // Bloquear cliques duplos
    if (isLoading) {
      console.warn("[Novo Cadastro] ⚠️  JÁ ESTÁ SALVANDO, ignorando novo clique");
      return;
    }
    
    // Definir loading IMEDIATAMENTE
    setIsLoading(true);
    console.log("[Novo Cadastro] ✅ isLoading definido como true");
    
    try {
      // Verificar se user está definido
      if (!user) {
        console.error("[Novo Cadastro] ❌ ERRO CRÍTICO: user é undefined!");
        console.error("[Novo Cadastro] Estado atual:", {
          isLoading,
          isEditing,
          canal,
          unidade,
          estado,
          categoriasData: `${categoriasData.length} categorias`,
        });
        Alert.alert("Erro Crítico", "Usuário não identificado. Faça login novamente.");
        setIsLoading(false);
        return;
      }
      console.log(`[Novo Cadastro] 👤 Usuário: ${user.nome} (${user.email}) - Role: ${user.role}`);
      
      // Validações apenas dos campos essenciais: Canal, Unidade e Estado
      console.log(`[Novo Cadastro] 📋 Validando campos essenciais...`);
      console.log(`  - canal: ${canal || "❌ VAZIO"}`);
      console.log(`  - unidade: ${unidade ? "✅ preenchido" : "❌ VAZIO"}`);
      console.log(`  - estado: ${estado || "❌ VAZIO"}`);
      
      if (!canal) {
        console.warn("[Novo Cadastro] ⚠️  Canal vazio");
        Alert.alert("Erro", "Selecione um canal");
        setIsLoading(false);
        return;
      }
      if (!unidade.trim()) {
        console.warn("[Novo Cadastro] ⚠️  Unidade vazia");
        Alert.alert("Erro", "Digite a unidade");
        setIsLoading(false);
        return;
      }
      if (!estado) {
        console.warn("[Novo Cadastro] ⚠️  Estado não selecionado");
        Alert.alert("Erro", "Selecione um estado");
        setIsLoading(false);
        return;
      }

      console.log("[Novo Cadastro] ✅ Todas as validações passaram!");
      
      // Todas as categorias e seus campos são opcionais
      // Se não preenchidos, aparecerá "?" no cadastro

      const now = new Date().toISOString();
      console.log(`[Novo Cadastro] ⏰ Timestamp atual: ${now}`);
      
      // Criar snapshot dos potenciais atuais
      const snapshots: PotencialSnapshot[] = categoriasData
        .filter((cat) => cat.produtoRef || cat.produtoNomeLivre) // Só incluir categorias com produto definido
        .map((cat) => ({
          data: now,
          categoria: cat.categoria,
          produtoRef: cat.produtoRef,
          produtoNomeLivre: cat.produtoNomeLivre,
          potencialAtingido: cat.potencialAtingido,
          potencialTotal: cat.potencialTotal,
          safra: cat.safra,
        }));
      
      console.log(`[Novo Cadastro] 📸 Snapshots criados: ${snapshots.length}`);

      // Se está editando, adicionar ao histórico
      let historico: HistoricoEdicao[] = [];
      if (isEditing && editingId) {
        console.log(`[Novo Cadastro] ✏️  MODO EDIÇÃO: editingId=${editingId}`);
        // Buscar histórico existente do cadastro
        const cadastrosAtuais = await getCadastros();
        console.log(`[Novo Cadastro] 📚 Total de cadastros em localStorage: ${cadastrosAtuais.length}`);
        const cadastroExistente = cadastrosAtuais.find((c) => c.cadastroId === editingId);
        
        if (cadastroExistente) {
          console.log(`[Novo Cadastro] ✅ Cadastro existente encontrado!`);
          historico = cadastroExistente.historico || [];
          console.log(`[Novo Cadastro] 📖 Histórico anterior: ${historico.length} registros`);
          // Adicionar novo snapshot ao histórico
          historico.push({
            editadoEm: now,
            snapshots,
          });
          console.log(`[Novo Cadastro] 📖 Histórico atualizado: ${historico.length} registros`);
        } else {
          console.warn(`[Novo Cadastro] ⚠️  Cadastro NÃO encontrado em localStorage! Criar novo histórico`);
          historico = [{
            editadoEm: now,
            snapshots,
          }];
        }
      } else {
        console.log(`[Novo Cadastro] ➕ MODO NOVO CADASTRO`);
        // Novo cadastro - criar primeiro snapshot
        historico = [{
          editadoEm: now,
          snapshots,
        }];
        console.log(`[Novo Cadastro] 📖 Histórico criado: 1 registro`);
      }

      const novoCadastro: Cadastro = {
        cadastroId: isEditing && editingId ? editingId : generateUniqueId(),
        criadoEm: isEditing && originalCreatedEm ? originalCreatedEm : now,
        atcEmail: isEditing && user?.role === "COORD" && originalAtcEmail ? originalAtcEmail : user!.email,
        atcNome: isEditing && user?.role === "COORD" && originalAtcNome ? originalAtcNome : user!.nome,
        canal,
        unidade: unidade.trim(),
        estado,
        categorias: categoriasData,
        deletado: false,
        // SEMPRE preenchê editadoEm quando é edição, mesmo que cadastro antigo não tenha
        // Para novos cadastros, deixa vazio para que apareça "criado" mas não "editado"
        editadoEm: isEditing ? now : "",
        historico, // Salvar histórico completo
      };

      console.log(`[Novo Cadastro] 📦 Objeto cadastro criado:`);
      console.log(`  - cadastroId: ${novoCadastro.cadastroId}`);
      console.log(`  - canal: ${novoCadastro.canal}`);
      console.log(`  - unidade: ${novoCadastro.unidade}`);
      console.log(`  - atcEmail: ${novoCadastro.atcEmail}`);
      console.log(`  - atcNome: ${novoCadastro.atcNome}`);
      console.log(`  - categorias: ${novoCadastro.categorias.length}`);
      console.log(`  - historico: ${novoCadastro.historico.length}`);
      console.log(`  - editadoEm: ${novoCadastro.editadoEm}`);

      // Salvar localmente
      console.log(`[Novo Cadastro] 💾 Iniciando salvar em AsyncStorage...`);
      await addCadastro(novoCadastro);
      console.log(`[Novo Cadastro] ✅ Salvo em AsyncStorage com sucesso!`);

      // Tentar sincronizar com Google Sheets
      console.log(`[Novo Cadastro] 🌐 Iniciando sincronização com Google Sheets...`);
      console.log(`[Novo Cadastro] 📊 Enviando cadastro para API...`);
      const syncResult = await sendCadastroToSheets(novoCadastro);
      
      console.log(`[Novo Cadastro] ✅ Resposta da API recebida:`);
      console.log(`  - success: ${syncResult.success}`);
      console.log(`  - message: ${syncResult.message}`);
      if (syncResult.error) {
        console.error(`  - error: ${syncResult.error}`);
      }
      if (syncResult.details) {
        console.error(`  - details: ${JSON.stringify(syncResult.details)}`);
      }

      if (syncResult.success) {
        const title = isEditing ? "✅ Cadastro Atualizado" : "✅ Sucesso";
        const message = isEditing
          ? "Cadastro atualizado e sincronizado com Google Sheets!"
          : "Cadastro salvo e sincronizado com Google Sheets!";

        console.log(`[Novo Cadastro] 🎉 ${title}`);
        console.log(`[Novo Cadastro] ℹ️  ${message}`);
        toast.show("success", title, message);
        
        // Se foi edição, sincronizar dados do Sheets para garantir que tudo está atualizado
        if (isEditing) {
          console.log(`[Novo Cadastro] 🔄 Recarregando dados do Google Sheets após edição...`);
          try {
            const result = await syncCadastrosFromSheets();
            console.log(`[Novo Cadastro] ✅ Sincronização de cadastros após edição concluída`);
            console.log(`[Novo Cadastro] 📦 Total de cadastros sincronizados: ${result.length}`);
          } catch (e) {
            console.warn("[Novo Cadastro] ⚠️  Erro ao sincronizar cadastros após edição:", e);
            console.error("[Novo Cadastro] Stack trace:", e instanceof Error ? e.stack : "N/A");
          }
        }
        
        console.log("[Novo Cadastro] ⏱️  Aguardando 600ms antes de voltar...");
        setTimeout(() => {
          console.log("[Novo Cadastro] 🔙 Voltando para tela anterior...");
          router.back();
        }, 600);
      } else {
        // Enfileirar para retry em segundo plano
        console.warn(`[Novo Cadastro] ⚠️  Sincronização falhou! Enfileirando para retry...`);
        console.log(`[Novo Cadastro] 📦 Guardando em fila de sincronização...`);
        await enqueueCadastro(novoCadastro);
        const title = isEditing ? "⚠️ Cadastro Atualizado" : "⚠️ Cadastro Salvo";
        const message =
          (isEditing ? "Dados atualizados localmente." : "Dados salvos localmente.") +
          " Sincronização pendente — será tentada automaticamente.";

        console.log(`[Novo Cadastro] ${title}`);
        console.log(`[Novo Cadastro] ℹ️  ${message}`);
        toast.show("info", title, message);
        console.log("[Novo Cadastro] ⏱️  Aguardando 600ms antes de voltar...");
        setTimeout(() => {
          console.log("[Novo Cadastro] 🔙 Voltando para tela anterior...");
          router.back();
        }, 600);
      }
      console.log("========== ✅ SALVAMENTO CONCLUÍDO ==========\n");
    } catch (error) {
      console.error("\n❌ ❌ ❌ ERRO NO SALVAMENTO ❌ ❌ ❌");
      console.error("[Novo Cadastro] ❌ Erro capturado:", error);
      if (error instanceof Error) {
        console.error("[Novo Cadastro] Nome do erro:", error.name);
        console.error("[Novo Cadastro] Mensagem:", error.message);
        console.error("[Novo Cadastro] Stack:", error.stack);
      }
      console.error("[Novo Cadastro] Estado quando erro ocorreu:", {
        isEditing,
        editingId,
        canal,
        unidade,
        estado,
        isLoading,
      });
      Alert.alert("Erro", "Ocorreu um erro ao salvar o cadastro: " + String(error));
    } finally {
      console.log("[Novo Cadastro] 🔓 Desbloqueando cliques duplos...");
      setIsLoading(false);
      console.log("[Novo Cadastro] ✅ isLoading definido como false");
    }
  };

  const produtoLookup = useMemo(() => {
    const map: Record<string, Produto> = {};
    produtos.forEach((p) => {
      map[p.produtoId] = p;
    });
    return map;
  }, [produtos]);

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-6 gap-4 pb-8">
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-2">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary text-base">← Voltar</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground flex-1">
              {isEditing ? "Editar Cadastro" : "Novo Cadastro"}
            </Text>
          </View>

          {/* Canal */}
          <View style={{ zIndex: 1000 }}>
            <Text className="text-sm font-medium text-foreground mb-2">Canal *</Text>
            <View className="relative">
              <TextInput
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted"
                placeholder="Digite o nome do canal..."
                placeholderTextColor={colors.muted}
                value={canal}
                onChangeText={(text) => {
                  setCanal(text);
                  setCanalSearch(text);
                  setShowCanalSuggestions(text.length > 0);
                }}
                onFocus={() => setShowCanalSuggestions(canal.length > 0)}
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              />
              
              {/* Sugestões de Autocomplete */}
              {showCanalSuggestions && canalSearch.length > 0 && (
                <View 
                  className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border-2 border-primary rounded-lg max-h-96 overflow-hidden shadow-xl"
                  style={{ zIndex: 9999 }}
                >
                  <ScrollView>
                    {canais
                      .filter((c) => c.canal.toLowerCase().includes(canalSearch.toLowerCase()))
                      .sort((a, b) => a.canal.localeCompare(b.canal))
                      .map((c) => (
                        <TouchableOpacity
                          key={c.canalId}
                          className="px-4 py-3 border-b border-gray-700 active:bg-primary"
                          onPress={() => {
                            setCanal(c.canal);
                            setCanalSearch(c.canal);
                            setShowCanalSuggestions(false);
                          }}
                        >
                          <Text className="text-sm font-medium text-white">{c.canal}</Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Unidade */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Unidade *</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted"
              placeholder="Digite o nome da unidade"
              placeholderTextColor={colors.muted}
              value={unidade}
              onChangeText={setUnidade}
              style={{ color: colors.foreground, backgroundColor: colors.surface }}
            />
          </View>

          {/* Estado */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Estado (UF) *</Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={estado}
                onValueChange={setEstado}
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              >
                <Picker.Item label="Selecione..." value="" />
                {["PR", "SC", "SP"].map((uf) => (
                  <Picker.Item key={uf} label={uf} value={uf} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Separador */}
          <View className="border-t border-border mt-4 pt-4" />
          <Text className="text-lg font-bold text-foreground mb-4">
            Categorias de Produtos
          </Text>

          {/* Debug: mostrar número de categorias */}
          {categoriasData.length === 0 && (
            <View className="bg-yellow-900 border border-yellow-500 rounded-lg p-4 mb-4">
              <Text className="text-yellow-300 font-semibold">
                ⚠️ Nenhuma categoria carregada. Categorias: {categoriasData.length}
              </Text>
            </View>
          )}

          {/* Seções para cada categoria */}
          {categoriasData.length > 0 ? (
            categoriasData.map((catData, index) => (
            <View
              key={`${catData.categoria}-${index}`}
              className="bg-surface border border-border rounded-lg p-4 gap-4"
            >
              {/* Título da Categoria */}
              <Text className="text-base font-bold text-primary">
                {index + 1}. {catData.categoria}
              </Text>

              {/* Produto - FIXO POR CATEGORIA */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Produto *</Text>
                <View className="bg-background border border-border rounded-lg p-4">
                  <Text className="text-base font-semibold text-foreground">
                    {produtoLookup[catData.produtoRef]?.produto || catData.produtoRef || "Produto"}
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    {produtoLookup[catData.produtoRef]?.categoria || catData.categoria}
                  </Text>
                </View>
              </View>

              {/* Produtor já utiliza? */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Produtor já utiliza? *
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg border ${
                      catData.implantado === "Sim"
                        ? "bg-success border-success"
                        : "bg-background border-border"
                    }`}
                    onPress={() => {
                      updateCategoriaData(index, "implantado", "Sim");
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        catData.implantado === "Sim" ? "text-white" : "text-foreground"
                      }`}
                    >
                      Sim
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg border ${
                      catData.implantado === "Não"
                        ? "bg-primary border-primary"
                        : "bg-background border-border"
                    }`}
                    onPress={() => {
                      updateCategoriaData(index, "implantado", "Não");
                      // Se mudou para "Não", zerar o potencial atingido
                      updateCategoriaData(index, "potencialAtingido", 0);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        catData.implantado === "Não" ? "text-white" : "text-foreground"
                      }`}
                    >
                      Não
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Safra - Verão ou Inverno */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">
                  Safra *
                </Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg border ${
                      catData.safra === "Verão"
                        ? "bg-orange-500 border-orange-500"
                        : "bg-background border-border"
                    }`}
                    onPress={() => updateCategoriaData(index, "safra", "Verão")}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        catData.safra === "Verão" ? "text-white" : "text-foreground"
                      }`}
                    >
                      ☀️ Verão
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-lg border ${
                      catData.safra === "Inverno"
                        ? "bg-blue-500 border-blue-500"
                        : "bg-background border-border"
                    }`}
                    onPress={() => updateCategoriaData(index, "safra", "Inverno")}
                    activeOpacity={0.8}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        catData.safra === "Inverno" ? "text-white" : "text-foreground"
                      }`}
                    >
                      ❄️ Inverno
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Potenciais - Layout em Grid 2 colunas */}
              <View className="gap-4">
                <Text className="text-sm font-medium text-foreground">
                  Potencial *
                </Text>
                
                <View className="flex-row gap-3">
                  {/* Potencial Atingido - só obrigatório se implantado = Sim */}
                  {catData.implantado === "Sim" && (
                    <View className="flex-1">
                      <Text className="text-xs text-muted mb-2">Potencial Atingido</Text>
                      <View className="flex-row items-center gap-2">
                        <TextInput
                          className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted"
                          placeholder="0"
                          placeholderTextColor={colors.muted}
                          value={String(catData.potencialAtingido || "")}
                          onChangeText={(value) =>
                            updateCategoriaData(index, "potencialAtingido", parseFloat(value) || 0)
                          }
                          keyboardType="numeric"
                          style={{ color: colors.foreground, backgroundColor: colors.background }}
                        />
                        <View className="bg-surface px-2 py-2.5 rounded-lg border border-border">
                          <Text className="text-xs text-muted">{catData.unidadePotencial}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Potencial Total - sempre obrigatório */}
                  <View className="flex-1">
                    <Text className="text-xs text-muted mb-2">Potencial Total</Text>
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-foreground placeholder-muted"
                        placeholder="0"
                        placeholderTextColor={colors.muted}
                        value={String(catData.potencialTotal || "")}
                        onChangeText={(value) =>
                          updateCategoriaData(index, "potencialTotal", parseFloat(value) || 0)
                        }
                        keyboardType="numeric"
                        style={{ color: colors.foreground, backgroundColor: colors.background }}
                      />
                      <View className="bg-surface px-2 py-2.5 rounded-lg border border-border">
                        <Text className="text-xs text-muted">{catData.unidadePotencial}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Potencial Real Calculado */}
                {catData.potencialTotal > 0 && (
                  <View className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                    <Text className="text-xs text-primary font-medium mb-1">
                      💡 Potencial Real (disponível para captação)
                    </Text>
                    <Text className="text-lg font-bold text-primary">
                      {(catData.potencialTotal - (catData.potencialAtingido || 0)).toFixed(1)} {catData.unidadePotencial}
                    </Text>
                  </View>
                )}
              </View>

              {/* Concorrentes - DROPDOWN COM BUSCA E MULTI-SELECT */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Concorrentes *</Text>
                {concorrentes.length > 0 ? (
                  <View className="gap-2">
                    {/* Input com busca */}
                    <View className="border border-border rounded-lg overflow-hidden bg-background">
                      <TextInput
                        className="px-4 py-3 text-foreground placeholder-muted"
                        placeholder="Buscar concorrente..."
                        placeholderTextColor={colors.muted}
                        value={concorrenteSearch[index] || ""}
                        onChangeText={(text) =>
                          setConcorrenteSearch({ ...concorrenteSearch, [index]: text })
                        }
                        onFocus={() =>
                          setConcorrenteDropdownOpen({
                            ...concorrenteDropdownOpen,
                            [index]: true,
                          })
                        }
                        style={{
                          color: colors.foreground,
                          backgroundColor: colors.background,
                        }}
                      />
                    </View>

                    {/* Dropdown com opções filtradas */}
                    {concorrenteDropdownOpen[index] && (
                      <View className="bg-background border border-border rounded-lg overflow-hidden max-h-96">
                        <ScrollView nestedScrollEnabled>
                          {concorrentes
                            .filter((conc) =>
                              conc
                                .toLowerCase()
                                .includes(
                                  (concorrenteSearch[index] || "").toLowerCase()
                                )
                            )
                            .map((conc) => {
                              const selecionados = catData.concorrentes
                                ? catData.concorrentes
                                    .split(",")
                                    .map((c) => c.trim())
                                    .filter(Boolean)
                                : [];
                              const isSelected = selecionados.includes(conc);

                              return (
                                <TouchableOpacity
                                  key={conc}
                                  className={`flex-row items-center gap-3 px-4 py-3 border-b border-border ${
                                    isSelected
                                      ? "bg-primary/10"
                                      : "bg-background"
                                  }`}
                                  onPress={() => {
                                    if (isSelected) {
                                      const updated = selecionados
                                        .filter((c) => c !== conc)
                                        .join(", ");
                                      updateCategoriaData(
                                        index,
                                        "concorrentes",
                                        updated
                                      );
                                    } else {
                                      const updated =
                                        selecionados.length > 0
                                          ? `${selecionados.join(", ")}, ${conc}`
                                          : conc;
                                      updateCategoriaData(
                                        index,
                                        "concorrentes",
                                        updated
                                      );
                                    }
                                  }}
                                >
                                  <View
                                    className={`w-5 h-5 rounded border-2 items-center justify-center ${
                                      isSelected
                                        ? "bg-primary border-primary"
                                        : "border-foreground"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Text className="text-white text-xs font-bold">
                                        ✓
                                      </Text>
                                    )}
                                  </View>
                                  <Text
                                    className={`flex-1 font-medium ${
                                      isSelected
                                        ? "text-primary"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {conc}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                        </ScrollView>
                      </View>
                    )}

                    {/* Tags de selecionados */}
                    {catData.concorrentes && (
                      <View className="flex-wrap flex-row gap-2">
                        {catData.concorrentes
                          .split(",")
                          .map((c) => c.trim())
                          .filter(Boolean)
                          .map((conc) => (
                            <TouchableOpacity
                              key={conc}
                              className="flex-row items-center gap-2 bg-primary px-3 py-2 rounded-full"
                              onPress={() => {
                                const selecionados = catData.concorrentes
                                  .split(",")
                                  .map((c) => c.trim())
                                  .filter(Boolean);
                                const updated = selecionados
                                  .filter((c) => c !== conc)
                                  .join(", ");
                                updateCategoriaData(
                                  index,
                                  "concorrentes",
                                  updated
                                );
                              }}
                            >
                              <Text className="text-white text-sm font-medium">
                                {conc}
                              </Text>
                              <Text className="text-white font-bold">×</Text>
                            </TouchableOpacity>
                          ))}
                      </View>
                    )}
                  </View>
                ) : (
                  <View className="bg-background border border-border rounded-lg p-4">
                    <Text className="text-muted">
                      Carregando concorrentes...
                    </Text>
                  </View>
                )}
              </View>

              {/* Observação */}
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Observação *</Text>
                <TextInput
                  className="bg-background border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted"
                  placeholder="Observações adicionais..."
                  placeholderTextColor={colors.muted}
                  value={catData.observacao}
                  onChangeText={(value) => updateCategoriaData(index, "observacao", value)}
                  multiline
                  numberOfLines={4}
                  style={{ color: colors.foreground, backgroundColor: colors.background }}
                />
              </View>
            </View>
            ))
          ) : (
            <View className="bg-background border border-border rounded-lg p-4">
              <Text className="text-muted text-center">
                Nenhuma categoria disponível. Carregando...
              </Text>
            </View>
          )}

          {/* Botão Salvar */}
          <TouchableOpacity
            className={`py-4 rounded-lg items-center justify-center ${
              isLoading ? "bg-gray-400" : "bg-primary"
            }`}
            onPress={handleSalvar}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-base font-bold">
                {isEditing ? "Atualizar Cadastro" : "Salvar Cadastro"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Espaço extra no final */}
          <View className="h-8" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
