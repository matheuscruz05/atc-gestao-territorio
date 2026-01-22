import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import { getCadastros } from "@/lib/storage";
import type { Cadastro, Safra, HistoricoEdicao, PotencialSnapshot } from "@/types/models";

export default function TimelineCoordScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(true);
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedSafra, setSelectedSafra] = useState<Safra | "Todas">("Todas");
  const [searchProduto, setSearchProduto] = useState("");
  const [searchAtc, setSearchAtc] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const allCadastros = await getCadastros();
      // Filtrar apenas cadastros não deletados
      const cadastrosAtivos = allCadastros.filter((c) => !c.deletado);
      setCadastros(cadastrosAtivos);
    } catch (error) {
      console.error("Erro ao carregar cadastros:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Estrutura de dados para timeline: agrupar por unidade e categoria
  interface TimelineItem {
    cadastroId: string;
    atcEmail: string;
    atcNome: string;
    unidade: string;
    canal: string;
    estado: string;
    categoria: string;
    produtoRef: string;
    produtoNome?: string;
    safra: Safra;
    evolucao: {
      data: string;
      potencialAtingido: number;
      potencialTotal: number;
    }[];
  }

  const timelineData = useMemo(() => {
    const items: TimelineItem[] = [];

    cadastros.forEach((cadastro) => {
      if (!cadastro.historico || cadastro.historico.length === 0) return;

      // Agrupar snapshots por categoria e produto
      const gruposPorProduto = new Map<string, PotencialSnapshot[]>();

      cadastro.historico.forEach((hist) => {
        hist.snapshots.forEach((snapshot) => {
          const key = `${snapshot.categoria}-${snapshot.produtoRef}-${snapshot.safra}`;
          if (!gruposPorProduto.has(key)) {
            gruposPorProduto.set(key, []);
          }
          gruposPorProduto.get(key)!.push(snapshot);
        });
      });

      // Criar um TimelineItem para cada produto
      gruposPorProduto.forEach((snapshots, key) => {
        const firstSnapshot = snapshots[0];
        
        // Ordenar por data
        const evolucao = snapshots
          .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
          .map((s) => ({
            data: s.data,
            potencialAtingido: s.potencialAtingido,
            potencialTotal: s.potencialTotal,
          }));

        items.push({
          cadastroId: cadastro.cadastroId,
          atcEmail: cadastro.atcEmail,
          atcNome: cadastro.atcNome,
          unidade: cadastro.unidade,
          canal: cadastro.canal,
          estado: cadastro.estado,
          categoria: firstSnapshot.categoria,
          produtoRef: firstSnapshot.produtoRef,
          produtoNome: firstSnapshot.produtoNomeLivre,
          safra: firstSnapshot.safra,
          evolucao,
        });
      });
    });

    return items;
  }, [cadastros]);

  // Filtrar por busca e safra
  const filteredData = useMemo(() => {
    let filtered = timelineData;

    // Filtro por unidade/canal
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.unidade.toLowerCase().includes(search) ||
          item.canal.toLowerCase().includes(search) ||
          item.estado.toLowerCase().includes(search)
      );
    }

    // Filtro por ATC
    if (searchAtc.trim()) {
      const search = searchAtc.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.atcNome.toLowerCase().includes(search) ||
          item.atcEmail.toLowerCase().includes(search)
      );
    }

    // Filtro por safra
    if (selectedSafra !== "Todas") {
      filtered = filtered.filter((item) => item.safra === selectedSafra);
    }

    // Filtro por produto
    if (searchProduto.trim()) {
      const search = searchProduto.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.categoria.toLowerCase().includes(search) ||
          item.produtoRef.toLowerCase().includes(search) ||
          item.produtoNome?.toLowerCase().includes(search)
      );
    }

    // Ordenar por maior potencial atingido na última medição
    filtered.sort((a, b) => {
      const aUltimo = a.evolucao[a.evolucao.length - 1]?.potencialAtingido || 0;
      const bUltimo = b.evolucao[b.evolucao.length - 1]?.potencialAtingido || 0;
      return bUltimo - aUltimo;
    });

    return filtered;
  }, [timelineData, searchText, searchAtc, selectedSafra, searchProduto]);

  // Renderizar card de evolução
  const renderTimelineCard = (item: TimelineItem, index: number) => {
    const ultimoPotencialAtingido =
      item.evolucao[item.evolucao.length - 1]?.potencialAtingido || 0;
    const ultimoPotencialTotal =
      item.evolucao[item.evolucao.length - 1]?.potencialTotal || 0;
    const potencialReal = Math.max(ultimoPotencialTotal - ultimoPotencialAtingido, 0);
    
    const percentualAtingido = ultimoPotencialTotal > 0
      ? (ultimoPotencialAtingido / ultimoPotencialTotal) * 100
      : 0;

    // Cores por safra
    const safraColor = item.safra === "Inverno" ? "blue" : "orange";
    const safraIcon = item.safra === "Inverno" ? "❄️" : "☀️";

    // Calcular crescimento entre primeira e última medição
    const primeiroAtingido = item.evolucao[0]?.potencialAtingido || 0;
    const crescimento = ultimoPotencialAtingido - primeiroAtingido;
    const crescimentoPercentual = primeiroAtingido > 0
      ? ((crescimento / primeiroAtingido) * 100).toFixed(1)
      : "0";

    return (
      <View
        className={`bg-surface rounded-lg border border-${safraColor}-500 border-opacity-30 p-3`}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground" numberOfLines={1}>
              {item.unidade} • {item.canal}
            </Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <Text className="text-xs text-gray-400">
                {item.categoria.split(" - ")[1] || item.categoria}
              </Text>
              <Text className="text-xs text-cyan-300">
                {item.produtoNome || item.produtoRef}
              </Text>
            </View>
            <Text className="text-xs text-purple-300 mt-0.5">
              ATC: {item.atcNome}
            </Text>
          </View>
          <View className="flex-col items-end gap-1">
            <View className={`bg-${safraColor}-500 bg-opacity-20 px-2 py-1 rounded`}>
              <Text className="text-xs font-bold">{safraIcon}</Text>
            </View>
            <View className="bg-primary rounded px-2 py-0.5">
              <Text className="text-xs font-bold text-white">
                #{item.cadastroId?.substring(0, 8)}
              </Text>
            </View>
          </View>
        </View>

        {/* Resumo de potenciais */}
        <View className="flex-row gap-2 mb-2">
          <View className="bg-green-500 bg-opacity-20 px-2 py-1 rounded border border-green-500 border-opacity-30 flex-1">
            <Text className="text-xs text-gray-400">Atingido</Text>
            <Text className="text-sm font-bold text-green-400">
              {ultimoPotencialAtingido.toFixed(0)}
            </Text>
          </View>
          <View className={`bg-${safraColor}-500 bg-opacity-20 px-2 py-1 rounded border border-${safraColor}-500 border-opacity-30 flex-1`}>
            <Text className="text-xs text-gray-400">Real</Text>
            <Text className={`text-sm font-bold text-${safraColor}-400`}>
              {potencialReal.toFixed(0)}
            </Text>
          </View>
          <View className="bg-purple-500 bg-opacity-20 px-2 py-1 rounded border border-purple-500 border-opacity-30 flex-1">
            <Text className="text-xs text-gray-400">Progresso</Text>
            <Text className="text-sm font-bold text-purple-400">
              {percentualAtingido.toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Crescimento */}
        {item.evolucao.length > 1 && (
          <View className="mb-2">
            <Text
              className={`text-xs ${
                crescimento >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {crescimento >= 0 ? "↗" : "↘"} {crescimento >= 0 ? "+" : ""}
              {crescimento.toFixed(0)} ({crescimentoPercentual}%) desde a primeira medição
            </Text>
          </View>
        )}

        {/* Gráfico de barras */}
        <View className="gap-1">
          <Text className="text-xs font-bold text-gray-400 mb-1">
            Evolução do Potencial Atingido
          </Text>
          {item.evolucao.map((ponto, idx) => {
            const percentual = ultimoPotencialTotal > 0
              ? (ponto.potencialAtingido / ultimoPotencialTotal) * 100
              : 0;
            const dataFormatada = new Date(ponto.data).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            });

            return (
              <View key={idx} className="flex-row items-center gap-2">
                <Text className="text-xs text-gray-400 w-16">
                  {dataFormatada}
                </Text>
                <View className="flex-1 bg-gray-700 rounded h-6 overflow-hidden">
                  <View
                    className={`bg-${safraColor}-500 h-full justify-center px-2`}
                    style={{ width: `${Math.min(percentual, 100)}%` }}
                  >
                    <Text className="text-xs font-bold text-white">
                      {ponto.potencialAtingido.toFixed(0)}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-400 w-12 text-right">
                  {percentual.toFixed(0)}%
                </Text>
              </View>
            );
          })}
          {/* Linha do potencial total (referência) */}
          <View className="border-t border-dashed border-gray-600 pt-1 mt-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-xs text-gray-500 w-16">Meta</Text>
              <View className="flex-1 bg-gray-800 rounded h-6 justify-center px-2">
                <Text className="text-xs font-bold text-gray-300">
                  {ultimoPotencialTotal.toFixed(0)}
                </Text>
              </View>
              <Text className="text-xs text-gray-500 w-12 text-right">100%</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center py-12">
        <ActivityIndicator size="large" color={colors.tint} />
        <Text className="text-sm text-gray-400 mt-4">
          Carregando timeline...
        </Text>
      </View>
    );
  }

  return (
      <View className="flex-1">
        <ScrollView className="flex-1 px-4 py-6">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground">
            📈 Timeline de Evolução
          </Text>
          <Text className="text-sm text-gray-200 mt-1">
            Acompanhe a evolução do potencial atingido de todos os ATCs
          </Text>
        </View>

        {/* Busca por ATC */}
        <View className="mb-3">
          <Text className="text-xs font-bold text-gray-400 mb-1">
            Buscar por ATC
          </Text>
          <TextInput
            className="bg-input border border-border rounded-lg px-3 py-2 text-foreground"
            placeholder="Digite o nome do ATC..."
            placeholderTextColor="#9ca3af"
            value={searchAtc}
            onChangeText={setSearchAtc}
          />
        </View>

        {/* Busca por unidade/canal */}
        <View className="mb-3">
          <Text className="text-xs font-bold text-gray-400 mb-1">
            Buscar por Unidade/Canal
          </Text>
          <TextInput
            className="bg-input border border-border rounded-lg px-3 py-2 text-foreground"
            placeholder="Digite o nome da unidade ou canal..."
            placeholderTextColor="#9ca3af"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Filtro de Safra */}
        <View className="mb-3">
          <Text className="text-xs font-bold text-gray-400 mb-1">Safra</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`flex-1 py-2 px-3 rounded ${
                selectedSafra === "Todas"
                  ? "bg-primary"
                  : "bg-gray-700"
              }`}
              onPress={() => setSelectedSafra("Todas")}
              activeOpacity={0.8}
            >
              <Text
                className={`text-xs font-bold text-center ${
                  selectedSafra === "Todas" ? "text-white" : "text-gray-400"
                }`}
              >
                Todas
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 px-3 rounded ${
                selectedSafra === "Verão"
                  ? "bg-orange-500"
                  : "bg-gray-700"
              }`}
              onPress={() => setSelectedSafra("Verão")}
              activeOpacity={0.8}
            >
              <Text
                className={`text-xs font-bold text-center ${
                  selectedSafra === "Verão" ? "text-white" : "text-gray-400"
                }`}
              >
                ☀️ Verão
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 px-3 rounded ${
                selectedSafra === "Inverno"
                  ? "bg-blue-500"
                  : "bg-gray-700"
              }`}
              onPress={() => setSelectedSafra("Inverno")}
              activeOpacity={0.8}
            >
              <Text
                className={`text-xs font-bold text-center ${
                  selectedSafra === "Inverno" ? "text-white" : "text-gray-400"
                }`}
              >
                ❄️ Inverno
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Busca por produto */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-gray-400 mb-1">
            Buscar por Categoria/Produto
          </Text>
          <TextInput
            className="bg-input border border-border rounded-lg px-3 py-2 text-foreground"
            placeholder="Digite a categoria ou produto..."
            placeholderTextColor="#9ca3af"
            value={searchProduto}
            onChangeText={setSearchProduto}
          />
        </View>

        {/* Lista de cards */}
        {filteredData.length === 0 ? (
          <View className="flex-1 justify-center items-center py-12">
            <Text className="text-4xl mb-3">📊</Text>
            <Text className="text-sm text-gray-400 text-center">
              {timelineData.length === 0
                ? "Nenhum histórico de edições encontrado."
                : "Nenhum resultado encontrado com os filtros aplicados."}
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-xs text-gray-400 mb-2">
              {filteredData.length} {filteredData.length === 1 ? "resultado" : "resultados"}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {filteredData.map((item, index) => (
                <View key={index} style={{ width: '48%' }}>
                  {renderTimelineCard(item, index)}
                </View>
              ))}
            </View>
          </>
        )}
        </ScrollView>
      </View>
    );
  }
