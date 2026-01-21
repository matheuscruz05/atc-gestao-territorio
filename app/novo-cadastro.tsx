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
import { CATEGORIAS } from "@/types/models";
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
  }, [editId, defaultsApplied]);

  // Se vier editId, carregar cadastro existente
  useEffect(() => {
    async function loadForEdit() {
      if (!editId) return;
      try {
        // Tentar buscar do Google Sheets primeiro (Vercel/web)
        let found: Cadastro | undefined = undefined;
        try {
          const allFromSheets = await syncCadastrosFromSheets();
          found = allFromSheets.find((c) => c.cadastroId === editId);
          if (found) {
            console.log(`✅ [Novo Cadastro] Cadastro carregado do Google Sheets: ${editId}`);
          }
        } catch (error) {
          console.warn(`⚠️ [Novo Cadastro] Erro ao buscar do Sheets, tentando localStorage:`, error);
        }
        
        // Fallback para localStorage se Sheets falhou
        if (!found) {
          const all = await getCadastros();
          found = all.find((c) => c.cadastroId === editId);
          if (found) {
            console.log(`✅ [Novo Cadastro] Cadastro carregado do localStorage: ${editId}`);
          }
        }
        
        if (found) {
          setCanal(found.canal);
          setUnidade(found.unidade);
          setEstado(found.estado);
          setOriginalAtcEmail(found.atcEmail);
          setOriginalAtcNome(found.atcNome);
          
          // Se tem categorias (novo formato)
          if (found.categorias && found.categorias.length > 0) {
            // Garantir que categorias antigas sejam migradas
            const migrated = found.categorias.map(cat => ({
              ...cat,
              safra: cat.safra ?? "Verão",
              potencialAtingido: cat.potencialAtingido ?? (cat.implantado === "Sim" ? (cat.potencialValor || 0) : 0),
              potencialTotal: cat.potencialTotal ?? (cat.potencialValor || 0),
            }));
            setCategoriasData(migrated);
          } else {
            // Formato antigo - converter
            if (found.categoria) {
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
            }
          }
          
          setIsEditing(true);
          setEditingId(found.cadastroId);
          setOriginalCreatedEm(found.criadoEm || null);
        }
      } catch (error) {
        console.error("Erro ao carregar cadastro para edição:", error);
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
    
    // Verificar se user está definido
    if (!user) {
      console.error("[Novo Cadastro] ❌ ERRO CRÍTICO: user é undefined!");
      Alert.alert("Erro Crítico", "Usuário não identificado. Faça login novamente.");
      return;
    }
    console.log(`[Novo Cadastro] 👤 Usuário: ${user.nome} (${user.email}) - Role: ${user.role}`);
    
    // Validações apenas dos campos essenciais: Canal, Unidade e Estado
    if (!canal) {
      Alert.alert("Erro", "Selecione um canal");
      return;
    }
    if (!unidade.trim()) {
      Alert.alert("Erro", "Digite a unidade");
      return;
    }
    if (!estado) {
      Alert.alert("Erro", "Selecione um estado");
      return;
    }

    // Todas as categorias e seus campos são opcionais
    // Se não preenchidos, aparecerá "?" no cadastro

    setIsLoading(true);
    try {
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
        editadoEm: isEditing ? now : "", // Define editadoEm como string vazia para novos cadastros
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
      const syncResult = await sendCadastroToSheets(novoCadastro);
      console.log(`[Novo Cadastro] Resultado da sincronização:`, syncResult);

      if (syncResult.success) {
        const title = isEditing ? "✅ Cadastro Atualizado" : "✅ Sucesso";
        const message = isEditing
          ? "Cadastro atualizado e sincronizado com Google Sheets!"
          : "Cadastro salvo e sincronizado com Google Sheets!";

        console.log(`[Novo Cadastro] 🎉 ${title}`);
        toast.show("success", title, message);
        
        // Se foi edição, sincronizar dados do Sheets para garantir que tudo está atualizado
        if (isEditing) {
          console.log(`[Novo Cadastro] 🔄 Recarregando dados do Google Sheets após edição...`);
          try {
            await syncCadastrosFromSheets();
            console.log("[Novo Cadastro] ✅ Sincronização de cadastros após edição concluída");
          } catch (e) {
            console.warn("[Novo Cadastro] ⚠️  Erro ao sincronizar cadastros após edição:", e);
          }
        }
        
        setTimeout(() => router.back(), 600);
      } else {
        // Enfileirar para retry em segundo plano
        console.warn(`[Novo Cadastro] ⚠️  Sincronização falhou! Enfileirando para retry...`);
        await enqueueCadastro(novoCadastro);
        const title = isEditing ? "⚠️ Cadastro Atualizado" : "⚠️ Cadastro Salvo";
        const message =
          (isEditing ? "Dados atualizados localmente." : "Dados salvos localmente.") +
          " Sincronização pendente — será tentada automaticamente.";

        console.log(`[Novo Cadastro] ${title}`);
        toast.show("info", title, message);
        setTimeout(() => router.back(), 600);
      }
      console.log("========== ✅ SALVAMENTO CONCLUÍDO ==========");
    } catch (error) {
      console.error("[Novo Cadastro] ❌ ERRO NO SALVAMENTO:", error);
      Alert.alert("Erro", "Ocorreu um erro ao salvar o cadastro");
    } finally {
      setIsLoading(false);
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
      <ScrollView className="flex-1">
        <View className="p-6 gap-4">
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
                  className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border-2 border-primary rounded-lg max-h-48 overflow-hidden shadow-xl"
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
          <View className="border-t border-border mt-4" />
          <Text className="text-lg font-bold text-foreground">
            Categorias de Produtos
          </Text>

          {/* Seções para cada categoria */}
          {categoriasData.map((catData, index) => (
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
                      <View className="bg-background border border-border rounded-lg overflow-hidden max-h-48">
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
          ))}

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
