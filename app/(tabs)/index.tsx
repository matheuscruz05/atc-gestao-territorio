import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import { getCadastros, setCadastros } from "@/lib/storage";
import { CATEGORIAS, PRODUTOS_CATALOGO } from "@/types/models";
import type { Cadastro, CategoriaData, Implantado } from "@/types/models";

export default function HomeScreen() {
  const { user, isCoord } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [filteredCadastros, setFilteredCadastros] = useState<Cadastro[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Helper: Converter cadastro antigo para novo formato
  const normalizeToNewFormat = (cadastro: Cadastro): Cadastro => {
    // Se já tem categorias no novo formato, retornar como está
    if (cadastro.categorias && cadastro.categorias.length > 0) {
      // Garantir migração de campos de potencial e safra
      // E migrar HIDRO_LIVRE para NITRATO_CALCIO (primeiro produto HIDROSSOLÚVEIS)
      const migratedBase = cadastro.categorias.map(cat => {
        // Migração de HIDRO_LIVRE para NITRATO_CALCIO
        let produtoRef = cat.produtoRef;
        if (produtoRef === "HIDRO_LIVRE") {
          produtoRef = "NITRATO_CALCIO";
        }
        
        return {
          ...cat,
          produtoRef,
          safra: cat.safra ?? "Verão",
          potencialAtingido: cat.potencialAtingido ?? (cat.implantado === "Sim" ? (cat.potencialValor || 0) : 0),
          potencialTotal: cat.potencialTotal ?? (cat.potencialValor || 0),
        };
      });

      // Normalização: garantir que HIDROSSOLÚVEIS tenha exatamente 2 itens fixos
      const others = migratedBase.filter(c => c.categoria !== "HIDROSSOLÚVEIS");
      const hydros = migratedBase.filter(c => c.categoria === "HIDROSSOLÚVEIS");

      // Tentar reaproveitar dados existentes
      const findByRef = (ref: string) => hydros.find(h => h.produtoRef === ref);
      const unknowns = hydros.filter(h => h.produtoRef !== "NITRATO_CALCIO" && h.produtoRef !== "MAP_PUTRIFICADO");

      const baseTemplate = (src?: CategoriaData): CategoriaData => ({
        categoria: "HIDROSSOLÚVEIS",
        produtoRef: src?.produtoRef || "",
        produtoNomeLivre: "",
        unidadePotencial: "litros",
        implantado: src?.implantado ?? "Não",
        safra: src?.safra ?? "Verão",
        potencialAtingido: src?.potencialAtingido ?? 0,
        potencialTotal: src?.potencialTotal ?? 0,
        concorrentes: src?.concorrentes ?? "",
        observacao: src?.observacao ?? "",
      });

      // Distribuir possíveis valores desconhecidos: primeiro vai para NITRATO, segundo para MAP
      const firstUnknown = unknowns[0];
      const secondUnknown = unknowns[1];

      const nitrato: CategoriaData = baseTemplate(
        findByRef("NITRATO_CALCIO") || firstUnknown
      );
      nitrato.produtoRef = "NITRATO_CALCIO";

      const mapPutrificado: CategoriaData = baseTemplate(
        findByRef("MAP_PUTRIFICADO") || secondUnknown
      );
      mapPutrificado.produtoRef = "MAP_PUTRIFICADO";

      const normalized = [...others, nitrato, mapPutrificado];
      return {
        ...cadastro,
        categorias: normalized,
      };
    }

    // Se tem apenas categoria antiga, converter
    if (cadastro.categoria) {
      const oldData: CategoriaData = {
        categoria: cadastro.categoria,
        produtoRef: cadastro.produtoRef || "",
        produtoNomeLivre: cadastro.produtoNomeLivre || "",
        unidadePotencial: cadastro.unidadePotencial || "tons",
        implantado: cadastro.implantado || "Não",
        potencialAtingido: cadastro.implantado === "Sim" ? (cadastro.potencialValor || 0) : 0,
        potencialTotal: cadastro.potencialValor || 0,
        concorrentes: cadastro.concorrentes || "",
        observacao: cadastro.observacao || "",
      };

      const newCategorias = CATEGORIAS.map((cat) =>
        cat === cadastro.categoria
          ? oldData
          : {
              categoria: cat,
              produtoRef: "",
              produtoNomeLivre: "",
              unidadePotencial: "tons" as const,
              implantado: "Não" as Implantado,
              potencialAtingido: 0,
              potencialTotal: 0,
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
        potencialAtingido: 0,
        potencialTotal: 0,
        concorrentes: "",
        observacao: "",
      })),
    };
  };

  // Migração única: converter HIDRO_LIVRE para NITRATO_CALCIO
  const migrateHidrosoluveis = useCallback(async () => {
    try {
      const allCadastros = await getCadastros();
      let hasChanges = false;
      
      const migratedCadastros = allCadastros.map(cadastro => {
        if (!cadastro.categorias || cadastro.categorias.length === 0) {
          return cadastro;
        }
        
        let changed = false;
        // 1) Migrar HIDRO_LIVRE → NITRATO_CALCIO
        const migratedBase = cadastro.categorias.map(cat => {
          if (cat.produtoRef === 'HIDRO_LIVRE') {
            changed = true;
            console.log(`🔄 Migrando cadastro ${cadastro.cadastroId}: HIDRO_LIVRE → NITRATO_CALCIO`);
            return { ...cat, produtoRef: 'NITRATO_CALCIO' };
          }
          return cat;
        });

        // 2) Normalizar HIDROSSOLÚVEIS para terem 2 itens fixos
        const others = migratedBase.filter(c => c.categoria !== 'HIDROSSOLÚVEIS');
        const hydros = migratedBase.filter(c => c.categoria === 'HIDROSSOLÚVEIS');

        const findByRef = (ref: string) => hydros.find(h => h.produtoRef === ref);
        const unknowns = hydros.filter(h => h.produtoRef !== 'NITRATO_CALCIO' && h.produtoRef !== 'MAP_PUTRIFICADO');

        if (hydros.length > 0) {
          changed = true;
          const baseTemplate = (src?: CategoriaData): CategoriaData => ({
            categoria: 'HIDROSSOLÚVEIS',
            produtoRef: src?.produtoRef || '',
            produtoNomeLivre: '',
            unidadePotencial: 'litros',
            implantado: src?.implantado ?? 'Não',
            safra: src?.safra ?? 'Verão',
            potencialAtingido: src?.potencialAtingido ?? 0,
            potencialTotal: src?.potencialTotal ?? 0,
            concorrentes: src?.concorrentes ?? '',
            observacao: src?.observacao ?? '',
          });

          const firstUnknown = unknowns[0];
          const secondUnknown = unknowns[1];

          const nitrato: CategoriaData = baseTemplate(findByRef('NITRATO_CALCIO') || firstUnknown);
          nitrato.produtoRef = 'NITRATO_CALCIO';

          const mapPut: CategoriaData = baseTemplate(findByRef('MAP_PUTRIFICADO') || secondUnknown);
          mapPut.produtoRef = 'MAP_PUTRIFICADO';

          const normalized = [...others, nitrato, mapPut];
          if (changed) hasChanges = true;
          return { ...cadastro, categorias: normalized };
        }

        if (changed) hasChanges = true;
        return { ...cadastro, categorias: migratedBase };
      });
      
      if (hasChanges) {
        await setCadastros(migratedCadastros);
        console.log('✅ Migração HIDROSSOLÚVEIS concluída!');
      }
    } catch (error) {
      console.error("❌ Erro na migração:", error);
    }
  }, []);

  const loadCadastros = useCallback(async () => {
    try {
      const allCadastros = await getCadastros();
      
      // Filtrar cadastros não deletados e converter para novo formato
      let activeCadastros = allCadastros
        .filter(c => !c.deletado)
        .map(c => normalizeToNewFormat(c));
      
      // Filtrar por ATC se não for coordenador
      const filtered = isCoord
        ? activeCadastros
        : activeCadastros.filter((c) => c.atcEmail === user?.email);
      
      setCadastros(filtered);
      setFilteredCadastros(filtered);
    } catch (error) {
      console.error("Error loading cadastros:", error);
    }
  }, [user, isCoord]);

  useEffect(() => {
    // Executar migração uma vez ao montar o componente
    migrateHidrosoluveis().then(() => {
      // Depois da migração, carregar cadastros
      loadCadastros();
    });

    // Subscribe to pending count changes
    let unsub: (() => void) | null = null;
    (async () => {
      const mod = await import("@/lib/sync-queue");
      const count = await mod.getPendingCount();
      setPendingCount(count);
      unsub = mod.subscribePendingCount((c: number) => setPendingCount(c));
    })();

    return () => unsub && unsub();
  }, [migrateHidrosoluveis, loadCadastros]);

  // Filtrar por busca - por Canal, Unidade, Estado ou ID
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCadastros(cadastros);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = cadastros.filter((c) => {
      // Buscar por ID
      if (c.cadastroId && c.cadastroId.toLowerCase().includes(query)) return true;
      
      // Buscar por Canal
      if (c.canal && c.canal.toLowerCase().includes(query)) return true;
      
      // Buscar por Unidade
      if (c.unidade && c.unidade.toLowerCase().includes(query)) return true;
      
      // Buscar por Estado (opcional)
      if (c.estado && c.estado.toLowerCase().includes(query)) return true;
      
      return false;
    });
    setFilteredCadastros(filtered);
  }, [searchQuery, cadastros]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCadastros();
    setIsRefreshing(false);
  };

  const renderCadastroCard = ({ item }: { item: Cadastro }) => {
    const hasNewFormat = item.categorias && item.categorias.length > 0;
    
    // Calcular totais de potencial por unidade
    const calcularTotaisPotencial = () => {
      if (!hasNewFormat) return { tons: { atingido: 0, total: 0, real: 0 }, litros: { atingido: 0, total: 0, real: 0 } };
      
      let totaisTons = { atingido: 0, total: 0 };
      let totaisLitros = { atingido: 0, total: 0 };
      
      item.categorias!.forEach((cat) => {
        const atingido = cat.potencialAtingido || 0;
        const total = cat.potencialTotal || 0;
        
        if (cat.unidadePotencial === "litros") {
          totaisLitros.atingido += atingido;
          totaisLitros.total += total;
        } else {
          totaisTons.atingido += atingido;
          totaisTons.total += total;
        }
      });
      
      return {
        tons: { atingido: totaisTons.atingido, total: totaisTons.total, real: totaisTons.total - totaisTons.atingido },
        litros: { atingido: totaisLitros.atingido, total: totaisLitros.total, real: totaisLitros.total - totaisLitros.atingido },
      };
    };

    // Barra de progresso visual inteligente - mostra atingido + real
    const ProgressBar = ({ atingido, total, height = 8 }: { atingido: number; total: number; height?: number }) => {
      const percentualAtingido = total > 0 ? Math.min((atingido / total) * 100, 100) : 0;
      const real = Math.max(total - atingido, 0);
      
      return (
        <View className="flex-1">
          <View className="w-full bg-gray-800 rounded-full overflow-hidden" style={{ height }}>
            <View className="flex-row h-full">
              {/* Parte Atingida - Azul */}
              <View
                className="bg-gradient-to-r from-blue-500 to-blue-600"
                style={{ width: `${percentualAtingido}%` }}
              />
              {/* Parte Real (restante) - Laranja */}
              <View
                className="bg-gradient-to-r from-orange-400 to-orange-500"
                style={{ width: `${100 - percentualAtingido}%` }}
              />
            </View>
          </View>
        </View>
      );
    };

    const potenciais = calcularTotaisPotencial();
    const createdDate = item.criadoEm ? new Date(item.criadoEm).toLocaleDateString("pt-BR") : "Data desconhecida";

    // Agrupar categorias por tipo
    const agruparCategoriasPorTipo = (categorias: CategoriaData[]) => {
      const agrupado: { [key: string]: CategoriaData[] } = {};
      categorias.forEach((cat) => {
        const tipo = cat.categoria.split(" - ")[0];
        if (!agrupado[tipo]) agrupado[tipo] = [];
        agrupado[tipo].push(cat);
      });
      return agrupado;
    };

    // Mapa para nomes amigáveis das categorias (conforme bboxcadastro.txt)
    const categoryNamesMap: Record<string, string> = {
      "FERTILIZANTE": "FERT. BASE",
      "FERTILIZANTES": "FERT. COBERTURA",
      "BIOLÓGICOS": "INOCULANTES",
      "HIDROSSOLÚVEIS": "HIDROSSOLÚVEIS",
    };

    const getCategoryDisplayName = (fullCategory: string): string => {
      // Se a categoria contém " - ", extrai a parte após o travessão
      if (fullCategory.includes(" - ")) {
        const parts = fullCategory.split(" - ");
        const afterDash = parts[1];
        // Se for FOLIARES, retorna como "FOLIARES"
        if (afterDash === "FOLIARES") {
          return "FOLIARES";
        }
        // Se for INOCULANTES, retorna como "INOCULANTES"
        if (afterDash === "INOCULANTES") {
          return "INOCULANTES";
        }
        // Se for BASE, retorna como "FERT. BASE"
        if (afterDash === "BASE") {
          return "FERT. BASE";
        }
        // Se for COBERTURA, retorna como "FERT. COBERTURA"
        if (afterDash === "COBERTURA") {
          return "FERT. COBERTURA";
        }
        // Fallback: retorna a parte após o travessão
        return afterDash;
      }
      // Se não tem " - ", verifica o mapa
      return categoryNamesMap[fullCategory] || fullCategory;
    };

    // Helper para obter o nome legível do produto pelo produtoRef
    const getProdutoNome = (produtoRef: string): string => {
      // Mapa de conversão conforme bboxcadastro.txt (versões resumidas)
      const produtoNomeMap: Record<string, string> = {
        "MICROESSENTIALS": "MICROESSENTIALS",
        "PBIO": "PBIO",
        "PPLUS": "PPLUS",
        "PNEO": "PNEO",
        "POWER_COAT": "POWER COAT",
        "ASPIRE": "ASPIRE",
        "PULTRA": "PULTRA",
        "MBIO_PHOS": "MBIO PHOS",
        "MBIO_HIDRO": "MBIO HIDRO",
        "MBIO_STIMULLUS": "MBIO STIMULLUS",
        "REFIRMA_CYBELION": "REFIRMA CYBELION",
        "MBIO_FLORESCE": "MBIO FLORESCE",
        "NITRATO_CALCIO": "NITRATO CÁLCIO",
        "MAP_PUTRIFICADO": "MAP PURIF.",
      };
      
      // Se estiver no mapa, usa o nome mapeado
      if (produtoRef in produtoNomeMap) {
        return produtoNomeMap[produtoRef];
      }
      
      // Migração: Se for HIDRO_LIVRE (ID antigo), retorna "Produto não especificado"
      if (produtoRef === "HIDRO_LIVRE") {
        return "Produto não especificado";
      }
      
      // Busca na lista de produtos
      const produto = PRODUTOS_CATALOGO.find(p => p.produtoId === produtoRef);
      
      if (!produto) {
        console.log("Produto não encontrado:", produtoRef);
      }
      
      return produto ? produto.produto : produtoRef || "Sem produto";
    };

    const categoriasAgrupadas = hasNewFormat ? agruparCategoriasPorTipo(item.categorias!) : {};

    return (
      <View className="bg-surface rounded-lg border border-border overflow-hidden shadow-md">
        {/* Header: Canal - Unidade - UF + ID */}
        <View className="bg-gradient-to-r from-blue-900 to-gray-800 px-3 py-2 border-b border-border">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-bold text-white flex-1" numberOfLines={1}>
              {item.canal} • {item.unidade} • {item.estado}
            </Text>
            <View className="bg-primary rounded px-2 py-0.5 ml-2">
              <Text className="text-xs font-bold text-white">
                #{item.cadastroId?.split("-")[0]}
              </Text>
            </View>
          </View>
          <Text className="text-xs text-gray-300 mt-0.5" numberOfLines={1}>
            {item.atcNome}
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            {createdDate}
          </Text>
        </View>

        {hasNewFormat ? (
          <View className="p-3 gap-2">
            {/* Resumo de Potenciais + Botão Editar */}
            <View className="flex-row items-center justify-between gap-2 mb-1">
              <View className="flex-row gap-3">
                <View className="bg-blue-500 bg-opacity-20 px-2 py-1 rounded border border-blue-500 border-opacity-30">
                  <Text className="text-xs font-bold text-blue-400">
                    {potenciais.tons.real.toFixed(0)}t
                  </Text>
                </View>
                {potenciais.litros.total > 0 && (
                  <View className="bg-orange-500 bg-opacity-20 px-2 py-1 rounded border border-orange-500 border-opacity-30">
                    <Text className="text-xs font-bold text-orange-400">
                      {potenciais.litros.real.toFixed(0)}L
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                className="bg-gradient-to-r from-cyan-500 to-blue-500 py-1.5 px-3 rounded active:opacity-80"
                onPress={() =>
                  router.push({
                    pathname: "/novo-cadastro",
                    params: { editId: item.cadastroId },
                  } as any)
                }
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-xs">✏️ Editar</Text>
              </TouchableOpacity>
            </View>

            {/* Linha divisória */}
            <View className="h-px bg-gray-700 my-1" />

            {/* Lista de Produtos por Categoria */}
            <View className="gap-1">
              {Object.entries(categoriasAgrupadas).map(([tipo, cats]) => (
                <View key={tipo}>
                  {cats.map((cat, idx) => {
                    const produtoNome = getProdutoNome(cat.produtoRef);
                    const statusIcon = cat.implantado === "Sim" ? "✓" : "?";
                    const statusColor = cat.implantado === "Sim" ? "text-green-400" : "text-yellow-400";
                    const totalPot = cat.potencialTotal || 0;
                    const atingidoPot = cat.potencialAtingido || 0;
                    const realPot = Math.max(totalPot - atingidoPot, 0);
                    const safraIcon = cat.safra === "Inverno" ? "❄️" : "☀️";
                    
                    return (
                      <View key={idx} className="flex-row items-center gap-1">
                        {/* Status */}
                        <Text className={`text-xs font-bold ${statusColor}`}>
                          {statusIcon}
                        </Text>
                        
                        {/* Categoria + Produto + Safra */}
                        <View className="flex-row items-center gap-1 flex-shrink-0">
                          <Text className="text-xs font-bold text-foreground" numberOfLines={1}>
                            {getCategoryDisplayName(cat.categoria)}:
                          </Text>
                          <Text className="text-xs text-cyan-300" numberOfLines={1}>
                            {produtoNome}
                          </Text>
                          <Text className="text-xs">
                            {safraIcon}
                          </Text>
                        </View>
                        
                        {/* Barra de progresso com valor atingido dentro */}
                        <View className="flex-1 flex-row items-center gap-1">
                          <View className="flex-1 relative">
                            <ProgressBar atingido={atingidoPot} total={totalPot} height={10} />
                            {/* Valor atingido dentro da barra */}
                            <View className="absolute left-1 top-0 bottom-0 justify-center">
                              <Text className="text-xs font-bold text-white" style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: {width: 0, height: 0}, textShadowRadius: 2 }}>
                                {atingidoPot.toFixed(0)}
                              </Text>
                            </View>
                          </View>
                          {/* Valor real após a barra */}
                          <Text className="text-xs font-bold text-orange-400 min-w-[30px] text-right">
                            {realPot.toFixed(0)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        ) : (
          // Fallback para formato antigo
          <View className="p-3 gap-2">
            <Text className="text-xs font-semibold text-foreground">
              {item.categoria || "N/A"}
            </Text>
            <View className="flex-row items-center gap-2">
              <View className={`px-3 py-1 rounded-full ${item.implantado === "Sim" ? "bg-emerald-500" : "bg-amber-500"}`}>
                <Text className="text-xs font-semibold text-white">
                  {item.implantado}
                </Text>
              </View>
              <Text className="text-xs font-medium text-foreground">
                {item.potencialValor} {item.unidadePotencial}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-gradient-to-r from-cyan-500 to-blue-500 py-1.5 px-3 rounded items-center mt-1"
              onPress={() =>
                router.push({
                  pathname: "/novo-cadastro",
                  params: { editId: item.cadastroId },
                } as any)
              }
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-xs">✏️ Editar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 gap-4">
          <View>
            <Text className="text-2xl font-bold text-foreground">
              {isCoord ? "Dashboard" : "Meus Cadastros"}
            </Text>
            <Text className="text-base text-muted mt-1">
              Olá, {user?.nome}
            </Text>
          </View>

          {/* Busca */}
          <TextInput
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Buscar por ID, canal, unidade..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Contador */}
          <Text className="text-sm text-muted">
            {filteredCadastros.length} cadastro(s){pendingCount ? ` • ${pendingCount} pendente(s)` : ""}
          </Text>
        </View>

        {/* Lista em Grid de 2 colunas */}
        <FlatList
          data={filteredCadastros}
          renderItem={({ item }) => (
            <View className="w-1/2 px-2 mb-4">
              {renderCadastroCard({ item })}
            </View>
          )}
          keyExtractor={(item) => item.cadastroId}
          numColumns={2}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12 w-full">
              <Text className="text-base text-muted text-center">
                {searchQuery
                  ? "Nenhum cadastro encontrado"
                  : "Nenhum cadastro ainda.\nToque no + para adicionar."}
              </Text>
            </View>
          }
        />

        {/* Botão Flutuante - apenas para ATC */}
        {!isCoord && (
          <TouchableOpacity
            className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
            onPress={() => router.push("/novo-cadastro" as any)}
            activeOpacity={0.8}
          >
            <Text className="text-white text-3xl font-light">+</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScreenContainer>
  );
}
