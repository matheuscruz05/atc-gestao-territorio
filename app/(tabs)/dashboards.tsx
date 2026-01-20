import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, FlatList } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { DashboardCard } from "@/components/dashboard-card";
import { DashboardChartBar } from "@/components/dashboard-chart-bar";
import { useAuth } from "@/lib/auth-context";
import { getCadastrosByAtc, deleteCadastroFromSheets, syncCadastrosFromSheets } from "@/lib/google-sheets-sync";
import { useColors } from "@/hooks/use-colors";
import { useToast } from "@/lib/toast";
import { processQueueOnce } from "@/lib/sync-queue";
import { Picker } from "@react-native-picker/picker";
import { CATEGORIAS } from "@/types/models";
import type { Categoria, Cadastro, CategoriaData, Implantado } from "@/types/models";
import { useRouter } from "expo-router";
import { confirmAction } from "@/lib/confirm";
import { setCadastros as setCadastrosLocal } from "@/lib/storage";

export default function DashboardsScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const toast = useToast();
  const router = useRouter();
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Filtros
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | "TODAS">("TODAS");
  const [selectedProduto, setSelectedProduto] = useState<string>("TODOS");
  const [selectedImplantado, setSelectedImplantado] = useState<Implantado | "TODOS">("TODOS");
  const [selectedSafra, setSelectedSafra] = useState<"TODAS" | "Verão" | "Inverno">("TODAS");
  const [searchText, setSearchText] = useState<string>("");

  // Helper: Converter cadastro antigo para novo formato
  const normalizeToNewFormat = (cadastro: Cadastro): Cadastro => {
    // Se já tem categorias no novo formato, retornar como está
    if (cadastro.categorias && cadastro.categorias.length > 0) {
      return cadastro;
    }

    // Se tem apenas categoria antiga, converter
    if (cadastro.categoria) {
      const oldData: CategoriaData = {
        categoria: cadastro.categoria,
        produtoRef: cadastro.produtoRef || "",
        produtoNomeLivre: cadastro.produtoNomeLivre || "",
        unidadePotencial: cadastro.unidadePotencial || "tons",
        implantado: cadastro.implantado || "Não",
        potencialValor: cadastro.potencialValor || 0,
        potencialAtingido: cadastro.implantado === "Sim" ? (cadastro.potencialValor || 0) : 0,
        potencialTotal: cadastro.potencialValor || 0,
        safra: "Verão",
        concorrentes: cadastro.concorrentes || "",
        observacao: cadastro.observacao || "",
      };

      const newCategorias: CategoriaData[] = CATEGORIAS.map((cat) =>
        cat === cadastro.categoria
          ? oldData
          : {
              categoria: cat,
              produtoRef: "",
              produtoNomeLivre: "",
              unidadePotencial: "tons" as const,
              implantado: "Não" as Implantado,
              potencialValor: 0,
              potencialAtingido: 0,
              potencialTotal: 0,
              safra: "Verão",
              concorrentes: "",
              observacao: "",
            }
      );

      return {
        ...cadastro,
        categorias: newCategorias,
      };
    }

    // Se não tem nem categoria antiga nem nova, retornar com 5 categorias vazias
    return {
      ...cadastro,
      categorias: CATEGORIAS.map((cat) => ({
        categoria: cat,
        produtoRef: "",
        produtoNomeLivre: "",
        unidadePotencial: "tons" as const,
        implantado: "Não" as Implantado,
        potencialValor: 0,
        potencialAtingido: 0,
        potencialTotal: 0,
        safra: "Verão",
        concorrentes: "",
        observacao: "",
      })),
    };
  };

  async function load() {
    try {
      if (!user) return;
      const c = await getCadastrosByAtc(user.email);

      // If Sheets is empty or unreachable, fallback to local storage so ATC sees their own data
      if (!c || c.length === 0) {
        try {
          const mod = await import("@/lib/storage");
          const local = await mod.getCadastros();
          // Filtrar cadastros não deletados, do ATC e converter para novo formato
          const filtered = local
            .filter((x: any) => x.atcEmail === user.email && !x.deletado)
            .map((x: any) => normalizeToNewFormat(x));
          if (filtered.length > 0) {
            console.warn(
              `getCadastrosByAtc returned 0 rows; falling back to ${filtered.length} local cadastros for ${user.email}`
            );
            setCadastros(filtered);
            return;
          }
        } catch (err) {
          console.warn("Fallback to local cadastros failed:", err);
        }
      }

      // Converter para novo formato e garantir que potencialValor está presente
      const normalized = c.map((cad: any) => {
        const n = normalizeToNewFormat(cad);
        // Debug: verificar se potencialValor está presente
        console.log("[Dashboard] Cadastro normalizado:", {
          id: n.cadastroId,
          categoria: n.categorias?.[0]?.categoria,
          potencialValor: n.categorias?.[0]?.potencialValor,
          categorias_count: n.categorias?.length
        });
        return n;
      });
      setCadastros(normalized);
    } catch (e) {
      console.error("Erro ao carregar cadastros do ATC:", e);
    }
  }

  async function handleSync() {
    setIsSyncing(true);
    try {
      const result = await processQueueOnce();
      await load(); // Recarregar após sincronizar
      toast.show(
        "success",
        "✅ Sincronizado",
        "Seus dados foram sincronizados com sucesso"
      );
    } catch (e) {
      console.error("Erro ao sincronizar:", e);
      toast.show("error", "❌ Erro na sincronização", String(e));
    } finally {
      setIsSyncing(false);
    }
  }

  useEffect(() => {
    load();
  }, [user]);

  // Extrair todas as categorias com seus produtos de todos os cadastros
  const allCategoriaData: CategoriaData[] = cadastros.flatMap((cad) => {
    if (cad.categorias && cad.categorias.length > 0) {
      return cad.categorias;
    }
    // Formato antigo
    if (cad.categoria) {
      return [{
        categoria: cad.categoria,
        produtoRef: cad.produtoRef || "",
        produtoNomeLivre: cad.produtoNomeLivre || "",
        unidadePotencial: cad.unidadePotencial || "tons",
        implantado: cad.implantado || "Não",
        potencialValor: cad.potencialValor || 0,
        potencialAtingido: cad.implantado === "Sim" ? (cad.potencialValor || 0) : 0,
        potencialTotal: cad.potencialValor || 0,
        safra: "Verão",
        concorrentes: cad.concorrentes || "",
        observacao: cad.observacao || "",
      }];
    }
    return [];
  });

  // Aplicar filtros
  const filteredData: CategoriaData[] = allCategoriaData.filter((catData) => {
    // Filtro por categoria
    if (selectedCategoria !== "TODAS" && catData.categoria !== selectedCategoria) {
      return false;
    }
    
    // Filtro por produto
    if (selectedProduto !== "TODOS") {
      const produtoNome = catData.produtoNomeLivre || catData.produtoRef;
      if (produtoNome !== selectedProduto) {
        return false;
      }
    }
    
    // Filtro por implantado
    if (selectedImplantado !== "TODOS" && catData.implantado !== selectedImplantado) {
      return false;
    }
    
    // Filtro por safra
    if (selectedSafra !== "TODAS" && catData.safra !== selectedSafra) {
      return false;
    }
    
    return true;
  });

  // KPIs com os novos potenciais
  const totalCadastros = cadastros.length;
  const totalImplantados = filteredData.filter((c: CategoriaData) => c.implantado === "Sim").length;
  
  // Calcular potenciais usando a nova estrutura (Atingido, Total, Real)
  const calcularPotenciais = (dados: CategoriaData[]) => {
    const tons = { atingido: 0, total: 0, real: 0 };
    const litros = { atingido: 0, total: 0, real: 0 };

    dados.forEach((c) => {
      const atingido = c.potencialAtingido || 0;
      const total = c.potencialTotal || 0;
      const real = total - atingido;

      if (c.unidadePotencial === "litros") {
        litros.atingido += atingido;
        litros.total += total;
        litros.real += real;
      } else {
        tons.atingido += atingido;
        tons.total += total;
        tons.real += real;
      }
    });

    return { tons, litros };
  };

  const potenciais = calcularPotenciais(filteredData);
  const potenciaisTodo = calcularPotenciais(allCategoriaData);

  // Lista de produtos únicos para o filtro
  const produtosUnicos = Array.from(
    new Set(
      allCategoriaData.map((c: CategoriaData) => c.produtoNomeLivre || c.produtoRef).filter(Boolean)
    )
  );

  // Top products - baseado em POTENCIAL REAL (não contagem)
  const topProductsMap: Record<string, { realTons: number; realLitros: number }> = {};
  filteredData.forEach((c: CategoriaData) => {
    const name = c.produtoNomeLivre || c.produtoRef || "(sem produto)";
    if (!topProductsMap[name]) {
      topProductsMap[name] = { realTons: 0, realLitros: 0 };
    }
    const real = (c.potencialTotal || 0) - (c.potencialAtingido || 0);
    if (c.unidadePotencial === "litros") {
      topProductsMap[name].realLitros += real;
    } else {
      topProductsMap[name].realTons += real;
    }
  });
  const topProducts = Object.entries(topProductsMap)
    .map(([label, { realTons, realLitros }]) => ({
      label,
      value: realTons + realLitros, // Valor combinado para ranking
    }))
    .sort((a, b) => b.value - a.value);

  // Canais - baseado em POTENCIAL REAL (não contagem)
  const channelsMap: Record<string, { realTons: number; realLitros: number }> = {};
  cadastros.forEach((c) => {
    const ch = c.canal || "(sem canal)";
    if (!channelsMap[ch]) {
      channelsMap[ch] = { realTons: 0, realLitros: 0 };
    }
    // Somar potencial real de todas as categorias deste cadastro
    if (c.categorias && c.categorias.length > 0) {
      c.categorias.forEach((cat: CategoriaData) => {
        const real = (cat.potencialTotal || 0) - (cat.potencialAtingido || 0);
        if (cat.unidadePotencial === "litros") {
          channelsMap[ch].realLitros += real;
        } else {
          channelsMap[ch].realTons += real;
        }
      });
    }
  });
  const channels = Object.entries(channelsMap)
    .map(([label, { realTons, realLitros }]) => ({
      label,
      value: realTons + realLitros,
    }))
    .sort((a, b) => b.value - a.value);

  // Unidades - baseado em POTENCIAL REAL (não contagem)
  const unitsMap: Record<string, { realTons: number; realLitros: number }> = {};
  cadastros.forEach((c) => {
    const u = c.unidade || "(sem unidade)";
    if (!unitsMap[u]) {
      unitsMap[u] = { realTons: 0, realLitros: 0 };
    }
    // Somar potencial real de todas as categorias deste cadastro
    if (c.categorias && c.categorias.length > 0) {
      c.categorias.forEach((cat: CategoriaData) => {
        const real = (cat.potencialTotal || 0) - (cat.potencialAtingido || 0);
        if (cat.unidadePotencial === "litros") {
          unitsMap[u].realLitros += real;
        } else {
          unitsMap[u].realTons += real;
        }
      });
    }
  });
  const units = Object.entries(unitsMap)
    .map(([label, { realTons, realLitros }]) => ({
      label,
      value: realTons + realLitros,
    }))
    .sort((a, b) => b.value - a.value);

  // Lista de cadastros filtrados pela busca (ID, canal, unidade ou ATC)
  const normalizedSearch = searchText.trim().toLowerCase();
  const cadastrosFiltrados = cadastros.filter((c) => {
    if (c.deletado) return false;
    if (!normalizedSearch) return true;
    const haystack = [
      c.cadastroId,
      c.canal,
      c.unidade,
      c.atcNome,
    ]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase());
    return haystack.some((value) => value.includes(normalizedSearch));
  });

  // KPI: Concorrentes - mostra os principais concorrentes do produto selecionado
  let concorrentesMap: Record<string, number> = {};
  if (selectedProduto !== "TODOS") {
    cadastros.forEach((c) => {
      if (c.categorias && c.categorias.length > 0) {
        c.categorias.forEach((cat: CategoriaData) => {
          const produtoNome = cat.produtoNomeLivre || cat.produtoRef;
          if (produtoNome === selectedProduto && cat.concorrentes) {
            // Separar concorrentes por vírgula e contar
            cat.concorrentes
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s)
              .forEach((concorrente) => {
                concorrentesMap[concorrente] = (concorrentesMap[concorrente] || 0) + 1;
              });
          }
        });
      }
    });
  }
  const concorrentesList = Object.entries(concorrentesMap)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <ScreenContainer>
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        <View className="mb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-foreground">Dashboards</Text>
            <Text className="text-sm text-muted mt-1">Visão rápida do seu desempenho</Text>
          </View>
          <TouchableOpacity
            onPress={handleSync}
            disabled={isSyncing}
            className={`py-1.5 px-3 rounded-md flex-row items-center ${
              isSyncing ? "bg-gray-300" : "bg-blue-500"
            }`}
          >
            {isSyncing ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold ml-2">Sincronizando...</Text>
              </>
            ) : (
              <Text className="text-white font-semibold">🔄 Sincronizar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <View className="mb-3 gap-2">
          {/* Filtro Safra */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Safra</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg border ${
                  selectedSafra === "TODAS"
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
                onPress={() => setSelectedSafra("TODAS")}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedSafra === "TODAS" ? "text-white" : "text-foreground"
                  }`}
                >
                  TODAS
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg border ${
                  selectedSafra === "Verão"
                    ? "bg-orange-500 border-orange-500"
                    : "bg-surface border-border"
                }`}
                onPress={() => setSelectedSafra("Verão")}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedSafra === "Verão" ? "text-white" : "text-foreground"
                  }`}
                >
                  ☀️ Verão
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg border ${
                  selectedSafra === "Inverno"
                    ? "bg-blue-500 border-blue-500"
                    : "bg-surface border-border"
                }`}
                onPress={() => setSelectedSafra("Inverno")}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedSafra === "Inverno" ? "text-white" : "text-foreground"
                  }`}
                >
                  ❄️ Inverno
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Filtro Categoria */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Categoria</Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={selectedCategoria}
                onValueChange={(value) => {
                  setSelectedCategoria(value as Categoria | "TODAS");
                  setSelectedProduto("TODOS"); // Reset produto ao mudar categoria
                }}
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              >
                <Picker.Item label="TODAS" value="TODAS" />
                {CATEGORIAS.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Filtro Produto */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Produto</Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={selectedProduto}
                onValueChange={setSelectedProduto}
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              >
                <Picker.Item label="TODOS" value="TODOS" />
                {produtosUnicos.map((prod) => (
                  <Picker.Item key={prod} label={prod} value={prod} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Filtro Produtor já utiliza */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Produtor já utiliza?</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg border ${
                  selectedImplantado === "TODOS"
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
                onPress={() => setSelectedImplantado("TODOS")}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedImplantado === "TODOS" ? "text-white" : "text-foreground"
                  }`}
                >
                  TODOS
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg border ${
                  selectedImplantado === "Sim"
                    ? "bg-success border-success"
                    : "bg-surface border-border"
                }`}
                onPress={() => setSelectedImplantado("Sim")}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedImplantado === "Sim" ? "text-white" : "text-foreground"
                  }`}
                >
                  Sim
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg border ${
                  selectedImplantado === "Não"
                    ? "bg-warning border-warning"
                    : "bg-surface border-border"
                }`}
                onPress={() => setSelectedImplantado("Não")}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedImplantado === "Não" ? "text-white" : "text-foreground"
                  }`}
                >
                  Não
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Buscar por ID, Canal, Unidade ou ATC */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">🔍 Buscar (ID, Canal, Unidade, ATC)</Text>
            <View className="flex-row items-center gap-2">
              <View className="bg-primary px-2 py-1 rounded-full">
                <Text className="text-[10px] font-semibold text-white">ATC</Text>
              </View>
              <TextInput
                placeholder="Buscar por ID, canal, unidade ou ATC..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor={colors.muted}
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-foreground"
                style={{ color: colors.foreground }}
              />
            </View>
          </View>
        </View>

        {/* KPIs Principais */}
        <View className="gap-3 mb-4">
          {/* KPIs de Potencial em TONS */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs font-semibold text-muted uppercase">Potencial (TONS)</Text>
              <View className="bg-blue-500 rounded-full px-3 py-1">
                <Text className="text-[10px] font-semibold text-white opacity-90">Total Cadastros</Text>
                <Text className="text-base font-bold text-white text-center">{totalCadastros}</Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 border border-blue-500">
                <Text className="text-xs text-blue-200 font-semibold">Atingido</Text>
                <Text className="text-2xl font-bold text-white mt-1">{potenciais.tons.atingido.toFixed(0)}</Text>
              </View>
              <View className="flex-1 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg p-4 border border-gray-500">
                <Text className="text-xs text-gray-200 font-semibold">Total</Text>
                <Text className="text-2xl font-bold text-white mt-1">{potenciais.tons.total.toFixed(0)}</Text>
              </View>
              <View className="flex-1 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-4 border border-cyan-400">
                <Text className="text-xs text-cyan-100 font-semibold">Real</Text>
                <Text className="text-2xl font-bold text-white mt-1">{potenciais.tons.real.toFixed(0)}</Text>
              </View>
            </View>
          </View>

          {/* KPIs de Potencial em LITROS */}
          {potenciais.litros.total > 0 && (
            <View className="gap-2">
              <Text className="text-xs font-semibold text-muted uppercase">Potencial (LITROS)</Text>
              <View className="flex-row gap-2">
                <View className="flex-1 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4 border border-purple-500">
                  <Text className="text-xs text-purple-200 font-semibold">Atingido</Text>
                  <Text className="text-2xl font-bold text-white mt-1">{potenciais.litros.atingido.toFixed(0)}</Text>
                </View>
                <View className="flex-1 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg p-4 border border-gray-500">
                  <Text className="text-xs text-gray-200 font-semibold">Total</Text>
                  <Text className="text-2xl font-bold text-white mt-1">{potenciais.litros.total.toFixed(0)}</Text>
                </View>
                <View className="flex-1 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-4 border border-pink-400">
                  <Text className="text-xs text-pink-100 font-semibold">Real</Text>
                  <Text className="text-2xl font-bold text-white mt-1">{potenciais.litros.real.toFixed(0)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* KPI Concorrentes - aparecer apenas quando um produto está selecionado */}
          {selectedProduto !== "TODOS" && concorrentesList.length > 0 && (
            <View className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-4 border border-orange-500 mt-2">
              <Text className="text-xs text-orange-200 font-semibold uppercase">Principais Concorrentes - {selectedProduto}</Text>
              <View className="mt-3 gap-2">
                {concorrentesList.map((item, idx) => (
                  <View key={idx} className="flex-row items-center justify-between">
                    <Text className="text-sm text-orange-100 flex-1">{item.label}</Text>
                    <View className="bg-orange-500 rounded-full px-3 py-1">
                      <Text className="text-xs font-bold text-white">{item.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {selectedProduto !== "TODOS" && concorrentesList.length === 0 && (
            <View className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <Text className="text-sm text-gray-300 text-center">
                Nenhum concorrente registrado para {selectedProduto}
              </Text>
            </View>
          )}
        </View>

        {/* Gráficos Principais */}
        <View className="mb-4">
          <DashboardChartBar 
            title="Top Produtos (Potencial Real)" 
            items={topProducts.slice(0, 8)} 
            subtitle="Ordenado por potencial real total"
          />
        </View>

        <View className="mb-4">
          <DashboardChartBar 
            title="Por Canal (Potencial Real)" 
            items={channels.slice(0, 8)}
            subtitle="Ordenado por potencial real total"
          />
        </View>

        <View className="mb-6">
          <DashboardChartBar 
            title="Por Unidade (Potencial Real)" 
            items={units.slice(0, 8)}
            subtitle="Ordenado por potencial real total"
          />
        </View>

        {/* Lista de cadastros (com busca incluindo ATC) */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-bold text-foreground">📋 Cadastros</Text>
            <Text className="text-xs text-muted">{cadastrosFiltrados.length} cadastro(s)</Text>
          </View>

          {cadastrosFiltrados.map((cadastro) => {
            const realPot = cadastro.categorias?.[0]?.potencialAtingido || 0;
            const totalPot = cadastro.categorias?.[0]?.potencialTotal || 0;
            const unidade = cadastro.categorias?.[0]?.unidadePotencial || "tons";
            const produto = cadastro.categorias?.[0]?.produtoNomeLivre || cadastro.categorias?.[0]?.produtoRef || "---";
            const safra = cadastro.categorias?.[0]?.safra || "Verão";
            const safraIcon = safra === "Verão" ? "☀️" : "❄️";

            return (
              <View
                key={cadastro.cadastroId}
                className="bg-surface border border-border rounded-lg mb-2 overflow-hidden"
              >
                <View className="p-3 gap-2">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-foreground">{cadastro.canal}</Text>
                      <Text className="text-xs text-muted">{produto}</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <View className="bg-blue-500 rounded px-2 py-1">
                        <Text className="text-xs text-white font-semibold">{safraIcon}</Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row gap-1 text-xs">
                    <Text className="text-muted">ID: {cadastro.cadastroId.substring(0, 8)}</Text>
                    <Text className="text-muted">•</Text>
                    <Text className="text-muted">{cadastro.unidade}</Text>
                    <Text className="text-muted">•</Text>
                    <Text className="text-muted">{cadastro.atcNome}</Text>
                  </View>

                  <View className="flex-row gap-1 ml-auto">
                    <Text className="text-xs text-blue-400 font-semibold">
                      Atingido: {realPot.toFixed(0)} {unidade}
                    </Text>
                    <Text className="text-xs text-orange-400 font-semibold">
                      Total: {totalPot.toFixed(0)} {unidade}
                    </Text>
                  </View>
                </View>

                {/* Botões Compactos */}
                <View className="flex-row gap-1.5 border-t border-border p-2">
                  <TouchableOpacity
                    className="flex-1 bg-primary rounded py-1.5 items-center active:opacity-80"
                    onPress={() => {
                      console.log("[Dashboard] Editar cadastro", cadastro.cadastroId);
                      router.push(`/novo-cadastro?editId=${encodeURIComponent(cadastro.cadastroId)}` as any);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text className="text-white text-xs font-semibold">✏️ Editar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 bg-error rounded py-1.5 items-center active:opacity-80"
                    onPress={async () => {
                      const confirmed = await confirmAction(`Excluir ${cadastro.canal}?`, "Excluir");
                      if (!confirmed) return;

                      try {
                        const updated = cadastros.map((c) =>
                          c.cadastroId === cadastro.cadastroId
                            ? { ...c, deletado: true }
                            : c
                        );
                        await setCadastrosLocal(updated);
                        setCadastros(updated);
                        console.log("[Dashboard] Excluir cadastro", cadastro.cadastroId);
                        await deleteCadastroFromSheets(cadastro.cadastroId);
                        toast.show("success", "✅ Excluído", "");
                      } catch (e) {
                        toast.show("error", "❌ Erro", String(e));
                      }
                    }}
                    activeOpacity={0.8}
                  >
                    <Text className="text-white text-xs font-semibold">🗑️ Excluir</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {cadastrosFiltrados.length === 0 && (
            <View className="bg-surface border border-border rounded-lg p-4">
              <Text className="text-sm text-muted text-center">
                Nenhum cadastro encontrado{normalizedSearch ? ` para "${searchText}"` : ""}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
