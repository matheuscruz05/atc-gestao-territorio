import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import {
  getUsuarios,
  getProdutos,
  getCanais,
  getUnidades,
  getCadastros,
  setUsuarios as setUsuariosLocal,
  setProdutos as setProdutosLocal,
  setCanais as setCanaisLocal,
  setUnidades as setUnidadesLocal,
  setCadastros as setCadastrosLocal,
} from "@/lib/storage";
import {
  getDashboardMetricas,
  syncCadastrosFromSheets,
  syncAllCadastrosToSheets,
  pullCadastrosFromSheets,
  syncAllFromSheets,
  deleteCadastroFromSheets,
} from "@/lib/google-sheets-sync";
import { confirmAction } from "@/lib/confirm";
import type { Usuario, Produto, Canal, Unidade, Cadastro, Categoria, CategoriaData, Implantado } from "@/types/models";
import { CATEGORIAS } from "@/types/models";
import { DashboardCard } from "@/components/dashboard-card";
import { DashboardChartBar } from "@/components/dashboard-chart-bar";
import { DashboardCompetitorsChart } from "@/components/dashboard-competitors-chart";
import { TopPerformerCard } from "@/components/top-performer-card";
import { DashboardList } from "@/components/dashboard-list";
import { useToast } from "@/lib/toast";
import { Picker } from "@react-native-picker/picker";

type Tab = "dashboard" | "usuarios" | "produtos" | "canais" | "unidades" | "cadastros";

export default function AdminScreen() {
  const { isCoord } = useAuth();
  const colors = useColors();
  const toast = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Dados
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [canais, setCanais] = useState<Canal[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [metricas, setMetricas] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  // Filtros
  const [searchUsuarios, setSearchUsuarios] = useState("");
  const [searchProdutos, setSearchProdutos] = useState("");
  const [selectedCategoriaProd, setSelectedCategoriaProd] = useState<Categoria | "TODAS">("TODAS");
  const [searchCanais, setSearchCanais] = useState("");
  const [searchUnidades, setSearchUnidades] = useState("");
  const [searchCadastros, setSearchCadastros] = useState("");
  const [selectedGRFilter, setSelectedGRFilter] = useState<string>("TODOS");
  const [paginaCadastros, setPaginaCadastros] = useState(1);
  const [selectedCategoriaFilter, setSelectedCategoriaFilter] = useState<Categoria | "TODAS">("TODAS");
  const [selectedProdutoFilter, setSelectedProdutoFilter] = useState<string>("TODOS");
  const [selectedImplantadoFilter, setSelectedImplantadoFilter] = useState<"TODOS" | "Sim" | "Não">("TODOS");
  const [selectedSafraFilter, setSelectedSafraFilter] = useState<"TODOS" | "Verão" | "Inverno">("TODOS");

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  // Helper: Converter cadastro antigo para novo formato
  const normalizeToNewFormat = (cadastro: Cadastro): Cadastro => {
    // Se já tem categorias no novo formato, retornar como está
    if (cadastro.categorias && cadastro.categorias.length > 0) {
      // Garantir migração dos campos de potencial
      const migrated = cadastro.categorias.map(cat => ({
        ...cat,
        safra: cat.safra ?? "Verão",
        potencialAtingido: cat.potencialAtingido ?? (cat.implantado === "Sim" ? (cat.potencialValor || 0) : 0),
        potencialTotal: cat.potencialTotal ?? (cat.potencialValor || 0),
      }));
      return {
        ...cadastro,
        categorias: migrated,
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
        safra: "Verão",
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
              safra: "Verão" as const,
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
        safra: "Verão" as const,
        potencialAtingido: 0,
        potencialTotal: 0,
        concorrentes: "",
        observacao: "",
      })),
    };
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Puxa referência mais recente do Sheets para evitar exibir unidades removidas da planilha.
      let refs: any | null = null;
      try {
        refs = await syncAllFromSheets();
        if (refs.usuarios?.length) await setUsuariosLocal(refs.usuarios);
        if (refs.produtos?.length) await setProdutosLocal(refs.produtos);
        if (refs.canais?.length) await setCanaisLocal(refs.canais);
        if (refs.unidades?.length) await setUnidadesLocal(refs.unidades);
      } catch (err) {
        console.warn("[Admin] syncAllFromSheets falhou, usando cache local", err);
      }

      // Buscar cadastros do Google Sheets primeiro
      let cadastrosData: Cadastro[] = [];
      try {
        const sheetsCadastros = await syncCadastrosFromSheets();
        if (sheetsCadastros && sheetsCadastros.length > 0) {
          cadastrosData = sheetsCadastros;
          console.log(`✅ [Admin] Carregados ${cadastrosData.length} cadastros do Google Sheets`);
        } else {
          console.warn(`⚠️ [Admin] Google Sheets vazio, usando localStorage como fallback`);
          cadastrosData = await getCadastros();
        }
      } catch (error) {
        console.error(`❌ [Admin] Erro ao buscar do Google Sheets, usando localStorage:`, error);
        cadastrosData = await getCadastros();
      }

      const [usuariosData, produtosData, canaisData, unidadesDataLocal] =
        await Promise.all([
          getUsuarios(),
          getProdutos(),
          getCanais(),
          getUnidades(),
        ]);

      const unidadesData = refs?.unidades?.length ? refs.unidades : unidadesDataLocal;

      // Filtrar cadastros não deletados e converter para novo formato
      const activeCadastros = cadastrosData
        .filter(c => !c.deletado)
        .map(c => normalizeToNewFormat(c));

      const metricasData = await getDashboardMetricas(activeCadastros, usuariosData);

      setUsuarios(usuariosData);
      setProdutos(produtosData);
      setCanais(canaisData);
      setUnidades(unidadesData);
      setCadastros(activeCadastros);
      setMetricas(metricasData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleSync = async () => {
    console.log("[Admin] handleSync start - cadastros locais:", cadastros.length);
    setIsSyncing(true);
    try {
      // Filtrar apenas cadastros não deletados
      const activeCadastros = cadastros.filter(c => !c.deletado);
      console.log("[Admin] handleSync enviando ativos:", activeCadastros.length);
      const result = await syncAllCadastrosToSheets(activeCadastros);
      if (result.success) {
        toast.show("success", "✅ Sincronizado", result.message);
      } else {
        toast.show("error", "❌ Erro", result.message);
      }
    } catch (e) {
      console.error("Erro ao sincronizar:", e);
      toast.show("error", "❌ Erro na sincronização", String(e));
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePull = async () => {
    console.log("[Admin] handlePull start");
    setIsPulling(true);
    try {
      const refs = await syncAllFromSheets();
      if (refs.usuarios.length > 0) {
        await setUsuariosLocal(refs.usuarios);
        setUsuarios(refs.usuarios);
      }
      if (refs.produtos.length > 0) {
        await setProdutosLocal(refs.produtos);
        setProdutos(refs.produtos);
      }
      if (refs.canais.length > 0) {
        await setCanaisLocal(refs.canais);
        setCanais(refs.canais);
      }
      if (refs.unidades.length > 0) {
        await setUnidadesLocal(refs.unidades);
        setUnidades(refs.unidades);
      }

      const result = await pullCadastrosFromSheets();
      if (result.success) {
        // Manter somente cadastros não deletados localmente
        const merged = cadastros.filter((c) => !c.deletado);
        for (const pulled of result.cadastros) {
          const idx = merged.findIndex((c) => c.cadastroId === pulled.cadastroId);
          if (idx === -1) {
            merged.push(pulled);
          } else {
            merged[idx] = pulled;
          }
        }

        await setCadastrosLocal(merged);
        setCadastros(merged);

        const newMetricas = await getDashboardMetricas(merged);
        setMetricas(newMetricas);

        toast.show("success", "✅ Atualizado", result.message);
      } else {
        toast.show("error", "❌ Erro", result.message);
      }
    } catch (e) {
      console.error("Erro ao fazer pull:", e);
      toast.show("error", "❌ Erro no pull", String(e));
    } finally {
      setIsPulling(false);
    }
  };

  if (!isCoord) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <Text className="text-base text-muted text-center">
          Acesso restrito a coordenadores
        </Text>
      </ScreenContainer>
    );
  }

  // ====================== HELPERS ======================

  // Helper para calcular potencial real
  const calcPotencialReal = (cat: any): number => {
    const total = cat.potencialTotal ?? cat.potencialValor ?? 0;
    const atingido = cat.potencialAtingido ?? 0;
    return total - atingido;
  };

  // Extrair todos os dados de categorias
  const allCategoriaData = useMemo(() => {
    return cadastros.flatMap((cad) => {
      if (cad.categorias && cad.categorias.length > 0) {
        return cad.categorias.map((cat) => ({ 
          ...cat, 
          atcEmail: cad.atcEmail, 
          atcNome: cad.atcNome, 
          canal: cad.canal, 
          unidade: cad.unidade,
          // Garantir migração de dados antigos
          safra: cat.safra ?? "Verão",
          potencialAtingido: cat.potencialAtingido ?? (cat.implantado === "Sim" ? (cat.potencialValor || 0) : 0),
          potencialTotal: cat.potencialTotal ?? (cat.potencialValor || 0),
        }));
      }
      if (cad.categoria) {
        return [{
          categoria: cad.categoria,
          produtoRef: cad.produtoRef || "",
          produtoNomeLivre: cad.produtoNomeLivre || "",
          unidadePotencial: cad.unidadePotencial || "tons",
          implantado: cad.implantado || "Não",
          safra: "Verão",
          potencialAtingido: cad.implantado === "Sim" ? (cad.potencialValor || 0) : 0,
          potencialTotal: cad.potencialValor || 0,
          concorrentes: cad.concorrentes || "",
          observacao: cad.observacao || "",
          atcEmail: cad.atcEmail,
          atcNome: cad.atcNome,
          canal: cad.canal,
          unidade: cad.unidade,
        }];
      }
      return [];
    });
  }, [cadastros]);

  // Contar usuários ativos/inativos
  const usuariosAtivos = usuarios.filter((u) => u.ativo).length;
  const usuariosInativos = usuarios.length - usuariosAtivos;

  // ====================== DASHBOARD TAB ======================
  const dashboardContent = () => {
    // Filtros
    const filteredCategoriaData = allCategoriaData.filter((catData: any) => {
      if (selectedCategoriaFilter !== "TODAS" && catData.categoria !== selectedCategoriaFilter) return false;
      if (selectedProdutoFilter !== "TODOS") {
        const prodNome = catData.produtoNomeLivre || catData.produtoRef;
        if (prodNome !== selectedProdutoFilter) return false;
      }
      if (selectedImplantadoFilter !== "TODOS" && catData.implantado !== selectedImplantadoFilter) return false;
      if (selectedSafraFilter !== "TODOS" && catData.safra !== selectedSafraFilter) return false;
      return true;
    });

    const produtosUnicos = Array.from(
      new Set(allCategoriaData.map((c: any) => c.produtoNomeLivre || c.produtoRef).filter(Boolean))
    );

    // Usar POTENCIAL REAL para todos os cálculos
    const potencialRealTons = filteredCategoriaData
      .filter((c: any) => c.unidadePotencial === "tons")
      .reduce((s, c: any) => s + calcPotencialReal(c), 0);

    const potencialRealLitros = filteredCategoriaData
      .filter((c: any) => c.unidadePotencial === "litros")
      .reduce((s, c: any) => s + calcPotencialReal(c), 0);

    // Concorrentes - lógica baseada nos filtros selecionados
    let concorrentes: any[] = [];
    let concorrentesTitle = "";

    if (selectedProdutoFilter !== "TODOS") {
      // MODO 3: Produto selecionado - mostrar concorrentes mais usados para aquele produto
      const concorrentesFreq: Record<string, number> = {};
      filteredCategoriaData
        .filter((c: any) => (c.produtoNomeLivre || c.produtoRef) === selectedProdutoFilter)
        .forEach((c: any) => {
          if (c.concorrentes) {
            c.concorrentes.split(",").forEach((conc: string) => {
              const trimmed = conc.trim();
              if (trimmed) concorrentesFreq[trimmed] = (concorrentesFreq[trimmed] || 0) + 1;
            });
          }
        });

      concorrentes = Object.entries(concorrentesFreq)
        .map(([label, count]) => ({
          label,
          value: count,
        }))
        .sort((a, b) => b.value - a.value);
      
      concorrentesTitle = `Concorrentes: ${selectedProdutoFilter}`;
    } else if (selectedCategoriaFilter !== "TODAS") {
      // MODO 2: Apenas categoria selecionada - mostrar concorrentes mais usados naquela categoria
      const concorrentesFreq: Record<string, number> = {};
      filteredCategoriaData.forEach((c: any) => {
        if (c.concorrentes) {
          c.concorrentes.split(",").forEach((conc: string) => {
            const trimmed = conc.trim();
            if (trimmed) concorrentesFreq[trimmed] = (concorrentesFreq[trimmed] || 0) + 1;
          });
        }
      });

      concorrentes = Object.entries(concorrentesFreq)
        .map(([label, count]) => ({
          label,
          value: count,
        }))
        .sort((a, b) => b.value - a.value);
      
      concorrentesTitle = `Concorrentes: ${selectedCategoriaFilter}`;
    } else {
      // MODO 1: Nenhum filtro - mostrar produtos concorrentes mais utilizados em geral
      const concorrentesFreq: Record<string, number> = {};
      allCategoriaData.forEach((c: any) => {
        if (c.concorrentes) {
          c.concorrentes.split(",").forEach((conc: string) => {
            const trimmed = conc.trim();
            if (trimmed) concorrentesFreq[trimmed] = (concorrentesFreq[trimmed] || 0) + 1;
          });
        }
      });

      concorrentes = Object.entries(concorrentesFreq)
        .map(([label, count]) => ({
          label,
          value: count,
        }))
        .sort((a, b) => b.value - a.value);
      
      concorrentesTitle = "Concorrentes Mais Utilizados";
    }

    // KPIs por ATC, Canal e Unidade quando um produto está selecionado
    let topAtc: { nome: string; valor: number; unidade: string } | null = null;
    let topCanal: { nome: string; valor: number; unidade: string } | null = null;
    let topUnidade: { nome: string; valor: number; unidade: string } | null = null;

    if (selectedProdutoFilter !== "TODOS") {
      // Filtrar dados apenas do produto selecionado
      const produtoData = filteredCategoriaData.filter(
        (c: any) => (c.produtoNomeLivre || c.produtoRef) === selectedProdutoFilter
      );

      // Determinar unidade padrão do produto (tons ou litros)
      const unidadePadrao = produtoData[0]?.unidadePotencial || "tons";

      // Top ATC
      const atcPotencial: Record<string, number> = {};
      produtoData.forEach((c: any) => {
        const nome = c.atcNome;
        atcPotencial[nome] = (atcPotencial[nome] || 0) + calcPotencialReal(c);
      });
      const topAtcEntry = Object.entries(atcPotencial).sort((a, b) => b[1] - a[1])[0];
      if (topAtcEntry) {
        topAtc = {
          nome: topAtcEntry[0],
          valor: topAtcEntry[1],
          unidade: unidadePadrao,
        };
      }

      // Top Canal
      const canalPotencial: Record<string, number> = {};
      produtoData.forEach((c: any) => {
        const nome = c.canal;
        canalPotencial[nome] = (canalPotencial[nome] || 0) + calcPotencialReal(c);
      });
      const topCanalEntry = Object.entries(canalPotencial).sort((a, b) => b[1] - a[1])[0];
      if (topCanalEntry) {
        topCanal = {
          nome: topCanalEntry[0],
          valor: topCanalEntry[1],
          unidade: unidadePadrao,
        };
      }

      // Top Unidade
      const unidadePotencial: Record<string, number> = {};
      produtoData.forEach((c: any) => {
        const nome = c.unidade;
        unidadePotencial[nome] = (unidadePotencial[nome] || 0) + calcPotencialReal(c);
      });
      const topUnidadeEntry = Object.entries(unidadePotencial).sort((a, b) => b[1] - a[1])[0];
      if (topUnidadeEntry) {
        topUnidade = {
          nome: topUnidadeEntry[0],
          valor: topUnidadeEntry[1],
          unidade: unidadePadrao,
        };
      }
    }

    return (
      <View className="gap-2 pb-6">
        {/* Filtros */}
        <View className="gap-1.5">
          <View>
            <Text className="text-xs font-medium text-foreground mb-1">Categoria</Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={selectedCategoriaFilter}
                onValueChange={(value) => {
                  setSelectedCategoriaFilter(value as Categoria | "TODAS");
                  setSelectedProdutoFilter("TODOS");
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

          <View>
            <Text className="text-xs font-medium text-foreground mb-1">Produto</Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={selectedProdutoFilter}
                onValueChange={setSelectedProdutoFilter}
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              >
                <Picker.Item label="TODOS" value="TODOS" />
                {produtosUnicos.map((prod: any) => (
                  <Picker.Item key={prod} label={prod} value={prod} />
                ))}
              </Picker>
            </View>
          </View>

          <View>
            <Text className="text-xs font-medium text-foreground mb-1">Produtor já utiliza?</Text>
            <View className="flex-row gap-1.5">
              {["TODOS", "Sim", "Não"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  className={`flex-1 py-1.5 rounded-lg border ${
                    selectedImplantadoFilter === opt
                      ? "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setSelectedImplantadoFilter(opt as any)}
                >
                  <Text
                    className={`text-center font-semibold text-xs ${
                      selectedImplantadoFilter === opt ? "text-white" : "text-foreground"
                    }`}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text className="text-xs font-medium text-foreground mb-1">Safra</Text>
            <View className="flex-row gap-1.5">
              {["TODOS", "Verão", "Inverno"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  className={`flex-1 py-1.5 rounded-lg border ${
                    selectedSafraFilter === opt
                      ? opt === "Verão" 
                        ? "bg-orange-500 border-orange-500"
                        : opt === "Inverno"
                        ? "bg-blue-500 border-blue-500"
                        : "bg-primary border-primary"
                      : "bg-surface border-border"
                  }`}
                  onPress={() => setSelectedSafraFilter(opt as any)}
                >
                  <Text
                    className={`text-center font-semibold text-xs ${
                      selectedSafraFilter === opt ? "text-white" : "text-foreground"
                    }`}
                  >
                    {opt === "Verão" ? "☀️ Verão" : opt === "Inverno" ? "❄️ Inverno" : "TODOS"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* KPIs - Linha Única Horizontal */}
        <View className="flex-row gap-1.5">
          <DashboardCard title="Total Cadastros" value={cadastros.length} />
          <DashboardCard title="Potencial Real (tons)" value={potencialRealTons.toFixed(2)} color="success" />
          <DashboardCard title="Potencial Real (litros)" value={potencialRealLitros.toFixed(2)} color="success" />
        </View>

        {/* Top Performers - mostrado apenas quando um produto está selecionado */}
        {selectedProdutoFilter !== "TODOS" && (topAtc || topCanal || topUnidade) && (
          <View className="gap-2">
            <Text className="text-xs font-bold text-foreground uppercase tracking-wide">Destaques do Produto</Text>
            <View className="flex-row gap-1.5 flex-wrap">
              {topAtc && (
                <View className="flex-1 min-w-[45%]">
                  <TopPerformerCard
                    icon="👤"
                    title="ATC com Maior Potencial Real"
                    value={topAtc.nome}
                    subtitle={`${topAtc.valor.toFixed(2)} ${topAtc.unidade}`}
                    color="primary"
                  />
                </View>
              )}
              {topCanal && (
                <View className="flex-1 min-w-[45%]">
                  <TopPerformerCard
                    icon="📢"
                    title="Canal com Maior Potencial Real"
                    value={topCanal.nome}
                    subtitle={`${topCanal.valor.toFixed(2)} ${topCanal.unidade}`}
                    color="success"
                  />
                </View>
              )}
              {topUnidade && (
                <View className="flex-1 min-w-[45%]">
                  <TopPerformerCard
                    icon="🏢"
                    title="Unidade com Maior Potencial Real"
                    value={topUnidade.nome}
                    subtitle={`${topUnidade.valor.toFixed(2)} ${topUnidade.unidade}`}
                    color="warning"
                  />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Gráfico de Concorrentes */}
        <DashboardCompetitorsChart title={concorrentesTitle} items={concorrentes} />
      </View>
    );
  };

  // ====================== USUARIOS TAB ======================
  const usuariosContent = () => {
    const filtered = usuarios.filter((u) =>
      u.nome.toLowerCase().includes(searchUsuarios.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUsuarios.toLowerCase())
    );

    // KPIs por usuário - usar potencial REAL
    const usuariosPotencial: Record<string, { tons: number; litros: number }> = {};
    allCategoriaData.forEach((catData: any) => {
      const email = catData.atcEmail;
      if (!usuariosPotencial[email]) usuariosPotencial[email] = { tons: 0, litros: 0 };
      const potReal = calcPotencialReal(catData);
      if (catData.unidadePotencial === "tons") {
        usuariosPotencial[email].tons += potReal;
      } else {
        usuariosPotencial[email].litros += potReal;
      }
    });

    // Calcular totais
    const totalTons = filtered.reduce((s, u) => s + (usuariosPotencial[u.email]?.tons || 0), 0);
    const totalLitros = filtered.reduce((s, u) => s + (usuariosPotencial[u.email]?.litros || 0), 0);

    // Top 3 por tons e litros
    const top3Tons = filtered
      .sort((a, b) => (usuariosPotencial[b.email]?.tons || 0) - (usuariosPotencial[a.email]?.tons || 0))
      .slice(0, 3);
    const top3Litros = filtered
      .sort((a, b) => (usuariosPotencial[b.email]?.litros || 0) - (usuariosPotencial[a.email]?.litros || 0))
      .slice(0, 3);

    // Ordenar lista por potencial total
    const sortedFiltered = [...filtered].sort(
      (a, b) =>
        (usuariosPotencial[b.email]?.tons || 0) +
        (usuariosPotencial[b.email]?.litros || 0) -
        ((usuariosPotencial[a.email]?.tons || 0) + (usuariosPotencial[a.email]?.litros || 0))
    );

    // Max para barra de progresso
    const maxTons = Math.max(...sortedFiltered.map((u) => usuariosPotencial[u.email]?.tons || 0), 1);
    const maxLitros = Math.max(...sortedFiltered.map((u) => usuariosPotencial[u.email]?.litros || 0), 1);

    return (
      <View className="gap-4 pb-6">
        {/* KPIs Resumidos */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-blue-500 rounded-lg p-3">
            <Text className="text-xs text-white opacity-90">📊 Potencial Real (tons)</Text>
            <Text className="text-2xl font-bold text-white">{totalTons.toFixed(0)}</Text>
          </View>
          <View className="flex-1 bg-orange-500 rounded-lg p-3">
            <Text className="text-xs text-white opacity-90">📊 Potencial Real (litros)</Text>
            <Text className="text-2xl font-bold text-white">{totalLitros.toFixed(0)}</Text>
          </View>
        </View>

        {/* Busca */}
        <TextInput
          className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted"
          placeholder="Buscar por nome ou email..."
          placeholderTextColor={colors.muted}
          value={searchUsuarios}
          onChangeText={setSearchUsuarios}
          style={{ color: colors.foreground, backgroundColor: colors.surface }}
        />

        {/* Ranking - Top 3 por Tons */}
        {top3Tons.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">🏆 Top Toneladas</Text>
            {top3Tons.map((usuario, idx) => {
              const potData = usuariosPotencial[usuario.email] || { tons: 0, litros: 0 };
              const progress = potData.tons / maxTons;
              return (
                <View key={usuario.email} className="bg-surface border border-primary rounded-lg p-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text className="text-lg font-bold text-primary">#{idx + 1}</Text>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">{usuario.nome}</Text>
                        <Text className="text-xs text-muted">{usuario.email}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-primary">{potData.tons.toFixed(0)}t</Text>
                  </View>
                  <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${Math.max(progress * 100, 5)}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Ranking - Top 3 por Litros */}
        {top3Litros.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">🏆 Top Litros</Text>
            {top3Litros.map((usuario, idx) => {
              const potData = usuariosPotencial[usuario.email] || { tons: 0, litros: 0 };
              const progress = potData.litros / maxLitros;
              return (
                <View key={`${usuario.email}-litros`} className="bg-surface border border-orange-500 rounded-lg p-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text className="text-lg font-bold text-orange-500">#{idx + 1}</Text>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">{usuario.nome}</Text>
                        <Text className="text-xs text-muted">{usuario.email}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-orange-500">{potData.litros.toFixed(0)}L</Text>
                  </View>
                  <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                      style={{ width: `${Math.max(progress * 100, 5)}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Divider */}
        {(top3Tons.length > 0 || top3Litros.length > 0) && (
          <View className="h-px bg-border my-2" />
        )}

        {/* Lista Completa */}
        <View>
          <Text className="text-xs font-semibold text-muted mb-2">Todos os Usuários</Text>
          {sortedFiltered.map((usuario) => {
            const potData = usuariosPotencial[usuario.email] || { tons: 0, litros: 0 };
            return (
              <View key={usuario.email} className="bg-surface rounded-lg p-3 border border-border mb-2">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{usuario.nome}</Text>
                    <Text className="text-xs text-muted">{usuario.email}</Text>
                  </View>
                </View>
                <View className="flex-row gap-2 mb-2">
                  <View className="bg-primary px-2 py-1 rounded">
                    <Text className="text-xs font-semibold text-white">{usuario.role}</Text>
                  </View>
                  <View className={`px-2 py-1 rounded ${usuario.ativo ? "bg-success" : "bg-error"}`}>
                    <Text className="text-xs font-semibold text-white">
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-blue-900 rounded p-2">
                    <Text className="text-xs text-blue-200">Tons</Text>
                    <Text className="text-sm font-bold text-blue-100">{potData.tons.toFixed(0)}</Text>
                  </View>
                  <View className="flex-1 bg-orange-900 rounded p-2">
                    <Text className="text-xs text-orange-200">Litros</Text>
                    <Text className="text-sm font-bold text-orange-100">{potData.litros.toFixed(0)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ====================== PRODUTOS TAB ======================
  const produtosContent = () => {
    const filtered = produtos.filter((p) => {
      if (selectedCategoriaProd !== "TODAS" && p.categoria !== selectedCategoriaProd) return false;
      if (!p.produto.toLowerCase().includes(searchProdutos.toLowerCase())) return false;
      return true;
    });

    // KPIs por produto - usar Potencial REAL (total - atingido)
    const produtosPotencial: Record<string, { tons: number; litros: number }> = {};
    allCategoriaData.forEach((catData: any) => {
      const prodNome = catData.produtoNomeLivre || catData.produtoRef;
      if (!produtosPotencial[prodNome]) produtosPotencial[prodNome] = { tons: 0, litros: 0 };
      const potReal = calcPotencialReal(catData);
      if (catData.unidadePotencial === "tons") {
        produtosPotencial[prodNome].tons += potReal;
      } else {
        produtosPotencial[prodNome].litros += potReal;
      }
    });

    // Calcular totais
    const totalTons = filtered.reduce((s, p) => s + (produtosPotencial[p.produto]?.tons || 0), 0);
    const totalLitros = filtered.reduce((s, p) => s + (produtosPotencial[p.produto]?.litros || 0), 0);

    // Top 3 por tons e litros
    const top3Tons = filtered
      .sort((a, b) => (produtosPotencial[b.produto]?.tons || 0) - (produtosPotencial[a.produto]?.tons || 0))
      .slice(0, 3);
    const top3Litros = filtered
      .sort((a, b) => (produtosPotencial[b.produto]?.litros || 0) - (produtosPotencial[a.produto]?.litros || 0))
      .slice(0, 3);

    // Ordenar lista por potencial total
    const sortedFiltered = [...filtered].sort(
      (a, b) =>
        (produtosPotencial[b.produto]?.tons || 0) +
        (produtosPotencial[b.produto]?.litros || 0) -
        ((produtosPotencial[a.produto]?.tons || 0) + (produtosPotencial[a.produto]?.litros || 0))
    );

    // Max para barra de progresso
    const maxTons = Math.max(...sortedFiltered.map((p) => produtosPotencial[p.produto]?.tons || 0), 1);
    const maxLitros = Math.max(...sortedFiltered.map((p) => produtosPotencial[p.produto]?.litros || 0), 1);

    return (
      <View className="gap-4 pb-6">
        {/* KPIs Resumidos */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-blue-500 rounded-lg p-3">
            <Text className="text-xs text-white opacity-90">📊 Potencial Real (tons)</Text>
            <Text className="text-2xl font-bold text-white">{totalTons.toFixed(0)}</Text>
          </View>
          <View className="flex-1 bg-orange-500 rounded-lg p-3">
            <Text className="text-xs text-white opacity-90">📊 Potencial Real (litros)</Text>
            <Text className="text-2xl font-bold text-white">{totalLitros.toFixed(0)}</Text>
          </View>
        </View>

        {/* Filtros */}
        <View className="gap-2">
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Categoria</Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={selectedCategoriaProd}
                onValueChange={setSelectedCategoriaProd}
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              >
                <Picker.Item label="TODAS" value="TODAS" />
                {CATEGORIAS.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>

          <TextInput
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted"
            placeholder="Buscar por produto..."
            placeholderTextColor={colors.muted}
            value={searchProdutos}
            onChangeText={setSearchProdutos}
            style={{ color: colors.foreground, backgroundColor: colors.surface }}
          />
        </View>

        {/* Ranking - Top 3 por Tons */}
        {top3Tons.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">🏆 Top Toneladas</Text>
            {top3Tons.map((produto, idx) => {
              const potData = produtosPotencial[produto.produto] || { tons: 0, litros: 0 };
              const progress = potData.tons / maxTons;
              return (
                <View key={`${produto.produtoId}-tons`} className="bg-surface border border-primary rounded-lg p-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text className="text-lg font-bold text-primary">#{idx + 1}</Text>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">{produto.produto}</Text>
                        <Text className="text-xs text-muted">{produto.categoria}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-primary">{potData.tons.toFixed(0)}t</Text>
                  </View>
                  <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${Math.max(progress * 100, 5)}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Ranking - Top 3 por Litros */}
        {top3Litros.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">🏆 Top Litros</Text>
            {top3Litros.map((produto, idx) => {
              const potData = produtosPotencial[produto.produto] || { tons: 0, litros: 0 };
              const progress = potData.litros / maxLitros;
              return (
                <View key={`${produto.produtoId}-litros`} className="bg-surface border border-orange-500 rounded-lg p-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text className="text-lg font-bold text-orange-500">#{idx + 1}</Text>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">{produto.produto}</Text>
                        <Text className="text-xs text-muted">{produto.categoria}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-orange-500">{potData.litros.toFixed(0)}L</Text>
                  </View>
                  <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                      style={{ width: `${Math.max(progress * 100, 5)}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Divider */}
        {(top3Tons.length > 0 || top3Litros.length > 0) && (
          <View className="h-px bg-border my-2" />
        )}

        {/* Lista Completa */}
        <View>
          <Text className="text-xs font-semibold text-muted mb-2">Todos os Produtos</Text>
          {sortedFiltered.map((produto) => {
            const potData = produtosPotencial[produto.produto] || { tons: 0, litros: 0 };
            return (
              <View key={produto.produtoId} className="bg-surface rounded-lg p-3 border border-border mb-2">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{produto.produto}</Text>
                    <Text className="text-xs text-muted">{produto.categoria}</Text>
                  </View>
                </View>
                <View className="flex-row gap-2 mb-2">
                  <View className={`px-2 py-1 rounded ${produto.ativo ? "bg-success" : "bg-error"}`}>
                    <Text className="text-xs font-semibold text-white">
                      {produto.ativo ? "Ativo" : "Inativo"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-blue-900 rounded p-2">
                    <Text className="text-xs text-blue-200">Tons</Text>
                    <Text className="text-sm font-bold text-blue-100">{potData.tons.toFixed(0)}</Text>
                  </View>
                  <View className="flex-1 bg-orange-900 rounded p-2">
                    <Text className="text-xs text-orange-200">Litros</Text>
                    <Text className="text-sm font-bold text-orange-100">{potData.litros.toFixed(0)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ====================== CANAIS TAB ======================
  const canaisContent = () => {
    const filtered = canais.filter((c) =>
      c.canal.toLowerCase().includes(searchCanais.toLowerCase())
    );

    const canalsPotencial: Record<string, { tons: number; litros: number }> = {};
    cadastros.forEach((cad) => {
      if (!canalsPotencial[cad.canal]) canalsPotencial[cad.canal] = { tons: 0, litros: 0 };
      if (cad.categorias) {
        cad.categorias.forEach((cat: any) => {
          const potReal = calcPotencialReal(cat);
          if (cat.unidadePotencial === "tons") {
            canalsPotencial[cad.canal].tons += potReal;
          } else {
            canalsPotencial[cad.canal].litros += potReal;
          }
        });
      }
    });

    // Calcular totais
    const totalTons = filtered.reduce((s, c) => s + (canalsPotencial[c.canal]?.tons || 0), 0);
    const totalLitros = filtered.reduce((s, c) => s + (canalsPotencial[c.canal]?.litros || 0), 0);

    // Top 3 por tons e litros
    const top3Tons = filtered
      .sort((a, b) => (canalsPotencial[b.canal]?.tons || 0) - (canalsPotencial[a.canal]?.tons || 0))
      .slice(0, 3);
    const top3Litros = filtered
      .sort((a, b) => (canalsPotencial[b.canal]?.litros || 0) - (canalsPotencial[a.canal]?.litros || 0))
      .slice(0, 3);

    // Ordenar lista
    const sortedFiltered = [...filtered].sort(
      (a, b) =>
        (canalsPotencial[b.canal]?.tons || 0) +
        (canalsPotencial[b.canal]?.litros || 0) -
        ((canalsPotencial[a.canal]?.tons || 0) + (canalsPotencial[a.canal]?.litros || 0))
    );

    // Max para barra de progresso
    const maxTons = Math.max(...sortedFiltered.map((c) => canalsPotencial[c.canal]?.tons || 0), 1);
    const maxLitros = Math.max(...sortedFiltered.map((c) => canalsPotencial[c.canal]?.litros || 0), 1);

    return (
      <View className="gap-4 pb-6">
        {/* KPIs Resumidos */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-blue-500 rounded-lg p-3">
            <Text className="text-xs text-white opacity-90">📊 Potencial Real (tons)</Text>
            <Text className="text-2xl font-bold text-white">{totalTons.toFixed(0)}</Text>
          </View>
          <View className="flex-1 bg-orange-500 rounded-lg p-3">
            <Text className="text-xs text-white opacity-90">📊 Potencial Real (litros)</Text>
            <Text className="text-2xl font-bold text-white">{totalLitros.toFixed(0)}</Text>
          </View>
        </View>

        <TextInput
          className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted"
          placeholder="Buscar por canal..."
          placeholderTextColor={colors.muted}
          value={searchCanais}
          onChangeText={setSearchCanais}
          style={{ color: colors.foreground, backgroundColor: colors.surface }}
        />

        {/* Ranking - Top 3 por Tons */}
        {top3Tons.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">🏆 Top Toneladas</Text>
            {top3Tons.map((canal, idx) => {
              const potData = canalsPotencial[canal.canal] || { tons: 0, litros: 0 };
              const progress = potData.tons / maxTons;
              return (
                <View key={`${canal.canalId}-tons`} className="bg-surface border border-primary rounded-lg p-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text className="text-lg font-bold text-primary">#{idx + 1}</Text>
                      <Text className="text-sm font-semibold text-foreground flex-1">{canal.canal}</Text>
                    </View>
                    <Text className="text-base font-bold text-primary">{potData.tons.toFixed(0)}t</Text>
                  </View>
                  <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${Math.max(progress * 100, 5)}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Ranking - Top 3 por Litros */}
        {top3Litros.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">🏆 Top Litros</Text>
            {top3Litros.map((canal, idx) => {
              const potData = canalsPotencial[canal.canal] || { tons: 0, litros: 0 };
              const progress = potData.litros / maxLitros;
              return (
                <View key={`${canal.canalId}-litros`} className="bg-surface border border-orange-500 rounded-lg p-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text className="text-lg font-bold text-orange-500">#{idx + 1}</Text>
                      <Text className="text-sm font-semibold text-foreground flex-1">{canal.canal}</Text>
                    </View>
                    <Text className="text-base font-bold text-orange-500">{potData.litros.toFixed(0)}L</Text>
                  </View>
                  <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                      style={{ width: `${Math.max(progress * 100, 5)}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Divider */}
        {(top3Tons.length > 0 || top3Litros.length > 0) && (
          <View className="h-px bg-border my-2" />
        )}

        {/* Lista Completa */}
        <View>
          <Text className="text-xs font-semibold text-muted mb-2">Todos os Canais</Text>
          {sortedFiltered.map((canal) => {
            const potData = canalsPotencial[canal.canal] || { tons: 0, litros: 0 };
            return (
              <View key={canal.canalId} className="bg-surface rounded-lg p-3 border border-border mb-2">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-semibold text-foreground flex-1">{canal.canal}</Text>
                </View>
                <View className="flex-row gap-2 mb-2">
                  <View className={`px-2 py-1 rounded ${canal.ativo ? "bg-success" : "bg-error"}`}>
                    <Text className="text-xs font-semibold text-white">
                      {canal.ativo ? "Ativo" : "Inativo"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-blue-900 rounded p-2">
                    <Text className="text-xs text-blue-200">Tons</Text>
                    <Text className="text-sm font-bold text-blue-100">{potData.tons.toFixed(0)}</Text>
                  </View>
                  <View className="flex-1 bg-orange-900 rounded p-2">
                    <Text className="text-xs text-orange-200">Litros</Text>
                    <Text className="text-sm font-bold text-orange-100">{potData.litros.toFixed(0)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ====================== UNIDADES TAB ======================
  const unidadesContent = () => {
    // Unidades agora podem ser digitadas livremente no cadastro.
    // Merge das unidades salvas + unidades digitadas nos cadastros para ranking/filtros.
    const unidadesFromCadastrosMap = new Map<string, Unidade>();
    cadastros.forEach((cad) => {
      const nome = cad.unidade?.trim();
      if (!nome) return;
      if (!unidadesFromCadastrosMap.has(nome)) {
        unidadesFromCadastrosMap.set(nome, {
          unidadeId: nome,
          unidade: nome,
          estadoUf: cad.estado || undefined,
          ativo: true,
        });
      }
    });

    // Merge evitando duplicatas (case-insensitive em unidade)
    const mergedUnidades: Unidade[] = [...unidades];
    unidadesFromCadastrosMap.forEach((u) => {
      const exists = mergedUnidades.some((item) => item.unidade.toLowerCase() === u.unidade.toLowerCase());
      if (!exists) mergedUnidades.push(u);
    });

    const filtered = mergedUnidades.filter((u) =>
      u.unidade.toLowerCase().includes(searchUnidades.toLowerCase())
    );

    const unidadesPotencial: Record<string, { tons: number; litros: number }> = {};
    cadastros.forEach((cad) => {
      if (!unidadesPotencial[cad.unidade]) unidadesPotencial[cad.unidade] = { tons: 0, litros: 0 };
      if (cad.categorias) {
        cad.categorias.forEach((cat: any) => {
          const potReal = calcPotencialReal(cat);
          if (cat.unidadePotencial === "tons") {
            unidadesPotencial[cad.unidade].tons += potReal;
          } else {
            unidadesPotencial[cad.unidade].litros += potReal;
          }
        });
      }
    });

    // Calcular totais
    const totalTons = filtered.reduce((s, u) => s + (unidadesPotencial[u.unidade]?.tons || 0), 0);
    const totalLitros = filtered.reduce((s, u) => s + (unidadesPotencial[u.unidade]?.litros || 0), 0);

    // Top 3 por tons e litros
    const top3Tons = filtered
      .sort((a, b) => (unidadesPotencial[b.unidade]?.tons || 0) - (unidadesPotencial[a.unidade]?.tons || 0))
      .slice(0, 3);
    const top3Litros = filtered
      .sort((a, b) => (unidadesPotencial[b.unidade]?.litros || 0) - (unidadesPotencial[a.unidade]?.litros || 0))
      .slice(0, 3);

    // Ordenar lista
    const sortedFiltered = [...filtered].sort(
      (a, b) =>
        (unidadesPotencial[b.unidade]?.tons || 0) +
        (unidadesPotencial[b.unidade]?.litros || 0) -
        ((unidadesPotencial[a.unidade]?.tons || 0) + (unidadesPotencial[a.unidade]?.litros || 0))
    );

    // Max para barra de progresso
    const maxTons = Math.max(...sortedFiltered.map((u) => unidadesPotencial[u.unidade]?.tons || 0), 1);
    const maxLitros = Math.max(...sortedFiltered.map((u) => unidadesPotencial[u.unidade]?.litros || 0), 1);

    return (
      <View className="gap-4 pb-6">
        {/* KPIs Resumidos */}
        <View className="flex-row gap-2">
          <View className="flex-1 bg-blue-500 rounded-lg p-3">
            <Text className="text-xs text-white opacity-90">📊 Potencial Real (tons)</Text>
            <Text className="text-2xl font-bold text-white">{totalTons.toFixed(0)}</Text>
          </View>
          <View className="flex-1 bg-orange-500 rounded-lg p-3">
            <Text className="text-xs text-white opacity-90">📊 Potencial Real (litros)</Text>
            <Text className="text-2xl font-bold text-white">{totalLitros.toFixed(0)}</Text>
          </View>
        </View>

        <TextInput
          className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted"
          placeholder="Buscar por unidade..."
          placeholderTextColor={colors.muted}
          value={searchUnidades}
          onChangeText={setSearchUnidades}
          style={{ color: colors.foreground, backgroundColor: colors.surface }}
        />

        {/* Ranking - Top 3 por Tons */}
        {top3Tons.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">🏆 Top Toneladas</Text>
            {top3Tons.map((unidade, idx) => {
              const potData = unidadesPotencial[unidade.unidade] || { tons: 0, litros: 0 };
              const progress = potData.tons / maxTons;
              return (
                <View key={`${unidade.unidadeId}-tons`} className="bg-surface border border-primary rounded-lg p-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text className="text-lg font-bold text-primary">#{idx + 1}</Text>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">{unidade.unidade}</Text>
                        {unidade.estadoUf && <Text className="text-xs text-muted">{unidade.estadoUf}</Text>}
                      </View>
                    </View>
                    <Text className="text-base font-bold text-primary">{potData.tons.toFixed(0)}t</Text>
                  </View>
                  <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                      style={{ width: `${Math.max(progress * 100, 5)}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Ranking - Top 3 por Litros */}
        {top3Litros.length > 0 && (
          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">🏆 Top Litros</Text>
            {top3Litros.map((unidade, idx) => {
              const potData = unidadesPotencial[unidade.unidade] || { tons: 0, litros: 0 };
              const progress = potData.litros / maxLitros;
              return (
                <View key={`${unidade.unidadeId}-litros`} className="bg-surface border border-orange-500 rounded-lg p-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2 flex-1">
                      <Text className="text-lg font-bold text-orange-500">#{idx + 1}</Text>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">{unidade.unidade}</Text>
                        {unidade.estadoUf && <Text className="text-xs text-muted">{unidade.estadoUf}</Text>}
                      </View>
                    </View>
                    <Text className="text-base font-bold text-orange-500">{potData.litros.toFixed(0)}L</Text>
                  </View>
                  <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                      style={{ width: `${Math.max(progress * 100, 5)}%` }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Divider */}
        {(top3Tons.length > 0 || top3Litros.length > 0) && (
          <View className="h-px bg-border my-2" />
        )}

        {/* Lista Completa */}
        <View>
          <Text className="text-xs font-semibold text-muted mb-2">Todas as Unidades</Text>
          {sortedFiltered.map((unidade) => {
            const potData = unidadesPotencial[unidade.unidade] || { tons: 0, litros: 0 };
            return (
              <View key={unidade.unidadeId} className="bg-surface rounded-lg p-3 border border-border mb-2">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">{unidade.unidade}</Text>
                    {unidade.estadoUf && <Text className="text-xs text-muted">Estado: {unidade.estadoUf}</Text>}
                  </View>
                </View>
                <View className="flex-row gap-2 mb-2">
                  <View className={`px-2 py-1 rounded ${unidade.ativo ? "bg-success" : "bg-error"}`}>
                    <Text className="text-xs font-semibold text-white">
                      {unidade.ativo ? "Ativo" : "Inativo"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-blue-900 rounded p-2">
                    <Text className="text-xs text-blue-200">Tons</Text>
                    <Text className="text-sm font-bold text-blue-100">{potData.tons.toFixed(0)}</Text>
                  </View>
                  <View className="flex-1 bg-orange-900 rounded p-2">
                    <Text className="text-xs text-orange-200">Litros</Text>
                    <Text className="text-sm font-bold text-orange-100">{potData.litros.toFixed(0)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // ====================== CADASTROS TAB ======================
  const cadastrosContent = () => {
    const ITEMS_PER_PAGE = 9; // 3 colunas x 3 linhas

    // Extrair GRs únicos dos usuários
    const grsUnicos = Array.from(
      new Set(usuarios.filter((u) => u.gr).map((u) => u.gr))
    ) as string[];

    // Normaliza potenciais para número e garante categorias mesmo em registros antigos
    const normalizePotential = (value: any) => {
      const num = Number(value);
      return Number.isFinite(num) ? num : 0;
    };

    const getCategoriasFromCadastro = (cad: Cadastro) => {
      if (cad.categorias && cad.categorias.length > 0) return cad.categorias;
      return [
        {
          categoria: cad.categoria || CATEGORIAS[0],
          produtoRef: cad.produtoRef || "",
          produtoNomeLivre: cad.produtoNomeLivre || "",
          unidadePotencial: cad.unidadePotencial === "litros" ? "litros" : "tons",
          implantado: cad.implantado || "Não",
          potencialValor: normalizePotential(cad.potencialValor),
          concorrentes: cad.concorrentes || "",
          observacao: cad.observacao || "",
        },
      ];
    };

    // Helper: verificar se categoria está completa
    const isCategoriaCompleta = (catData: any) => {
      return (
        catData.categoria &&
        (catData.produtoRef || catData.produtoNomeLivre) &&
        catData.unidadePotencial &&
        catData.implantado &&
        catData.potencialValor > 0 &&
        catData.concorrentes && catData.concorrentes.trim() &&
        catData.observacao && catData.observacao.trim()
      );
    };

    // Filtrar cadastros baseado em busca, GR e Safra
    const filtered = cadastros.filter((c) => {
      if (c.deletado) return false;
      // Filtro por GR
      if (selectedGRFilter !== "TODOS") {
        const atcUser = usuarios.find((u) => u.email === c.atcEmail);
        if (!atcUser || atcUser.gr !== selectedGRFilter) return false;
      }

      // Filtro por Safra
      if (selectedSafraFilter !== "TODOS" && c.categorias && c.categorias.length > 0) {
        const hasSafra = c.categorias.some((cat: CategoriaData) => cat.safra === selectedSafraFilter);
        if (!hasSafra) return false;
      }

      // Filtro por busca (texto + GR)
        const search = searchCadastros.toLowerCase().trim();
        if (!search) return true; // Se vazio, retorna todos

        // Buscar por:
        // 1. Canal, Unidade, ATC (como antes)
        // 2. GR do usuário (novo)
        // 3. Cadastro ID (novo)
        const atcUser = usuarios.find((u) => u.email === c.atcEmail);
        const grDoAtc = atcUser?.gr?.toLowerCase() || "";

        return (
          c.canal.toLowerCase().includes(search) ||
          c.unidade.toLowerCase().includes(search) ||
          c.atcNome.toLowerCase().includes(search) ||
          grDoAtc.includes(search) || // Buscar por GR
          (c.cadastroId && c.cadastroId.toLowerCase().includes(search)) // Buscar por ID
        );
    });

    // Calcular paginação
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const startIdx = (paginaCadastros - 1) * ITEMS_PER_PAGE;
    const endIdx = startIdx + ITEMS_PER_PAGE;
    const paginatedData = filtered.slice(startIdx, endIdx);

    // Resetar página quando filtro muda
    if (paginaCadastros > totalPages && totalPages > 0) {
      setPaginaCadastros(1);
    }

    // Calcular potenciais REAIS (total - atingido)
    const { potencialTons, potencialLitros } = filtered.reduce(
      (acc, cad) => {
        const categorias = getCategoriasFromCadastro(cad);

        categorias.forEach((cat: any) => {
          const total = normalizePotential(cat.potencialTotal || cat.potencialValor);
          const atingido = normalizePotential(cat.potencialAtingido);
          const potencialReal = total - atingido;
          const unidade = cat.unidadePotencial === "litros" ? "litros" : "tons";

          if (unidade === "litros") {
            acc.potencialLitros += potencialReal;
          } else {
            acc.potencialTons += potencialReal;
          }
        });

        return acc;
      },
      { potencialTons: 0, potencialLitros: 0 }
    );

    // Componente para renderizar uma caixa de cadastro compacta
    const CadastroCard = ({ cadastro }: { cadastro: Cadastro }) => {
      const categoriasCadastro = getCategoriasFromCadastro(cadastro);

      // Calcular potencial REAL (total - atingido)
      const potentialTons = categoriasCadastro.reduce((sum, cat: any) => {
        if (cat.unidadePotencial === "tons") {
          const total = normalizePotential(cat.potencialTotal || cat.potencialValor);
          const atingido = normalizePotential(cat.potencialAtingido);
          return sum + (total - atingido);
        }
        return sum;
      }, 0);

      const potentialLitros = categoriasCadastro.reduce((sum, cat: any) => {
        if (cat.unidadePotencial === "litros") {
          const total = normalizePotential(cat.potencialTotal || cat.potencialValor);
          const atingido = normalizePotential(cat.potencialAtingido);
          return sum + (total - atingido);
        }
        return sum;
      }, 0);

      // Mapa de nomes abreviados das categorias
      const categoryNamesMap: Record<string, string> = {
        "FERTILIZANTE - BASE": "FERT. BASE",
        "FERTILIZANTES - COBERTURA": "FERT. COBERTURA",
        "BIOLÓGICOS - INOCULANTES": "INOCULANTES",
        "BIOLÓGICOS - FOLIARES": "FOLIARES",
        "HIDROSSOLÚVEIS": "HIDROSSOLÚVEIS",
      };

      // Mapa de nomes abreviados dos produtos
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
        "NITRATO_CALCIO": "NITRATO CÁL.",
        "MAP_PUTRIFICADO": "MAP PURIF.",
      };

      const getCategoryDisplayName = (fullCategory: string): string => {
        return categoryNamesMap[fullCategory] || fullCategory;
      };

      const getProdutoNome = (produtoRef: string): string => {
        return produtoNomeMap[produtoRef] || produtoRef || "Sem produto";
      };

      return (
        <View className="bg-surface rounded-lg border border-border overflow-hidden flex-1 mx-1 shadow-md">
          {/* Header: Canal - Unidade - UF + ID */}
          <View className="bg-gradient-to-r from-blue-900 to-gray-800 px-3 py-2 border-b border-border">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm font-bold text-white flex-1" numberOfLines={1}>
                {cadastro.canal} • {cadastro.unidade} • {cadastro.estado}
              </Text>
              <View className="bg-primary rounded px-2 py-0.5 ml-2">
                <Text className="text-xs font-bold text-white">
                  #{cadastro.cadastroId?.split("-")[0]}
                </Text>
              </View>
            </View>
            <Text className="text-xs text-gray-300" numberOfLines={1}>
              {cadastro.atcNome}
            </Text>
            <Text className="text-xs text-gray-400 mt-0.5">
              {cadastro.criadoEm ? new Date(cadastro.criadoEm).toLocaleDateString("pt-BR") : "Data desconhecida"}
            </Text>
          </View>

          {/* Resumo de Potenciais */}
          <View className="px-3 py-2 flex-row gap-2 border-b border-border bg-gray-900 bg-opacity-50">
            <View className="bg-blue-500 bg-opacity-20 px-2 py-1 rounded border border-blue-500 border-opacity-30">
              <Text className="text-xs font-bold text-blue-400">
                {potentialTons.toFixed(0)}t
              </Text>
            </View>
            <View className="bg-orange-500 bg-opacity-20 px-2 py-1 rounded border border-orange-500 border-opacity-30">
              <Text className="text-xs font-bold text-orange-400">
                {potentialLitros.toFixed(0)}L
              </Text>
            </View>
          </View>

          {/* Lista de Produtos */}
          <View className="p-2 gap-0.5">
            {categoriasCadastro && categoriasCadastro.length > 0 && (
              <View className="gap-0.5">
                {categoriasCadastro.map((catData: any, idx: number) => {
                  const completa = isCategoriaCompleta(catData);
                  const statusIcon = completa ? "✓" : "?";
                  const statusColor = completa ? "text-green-400" : "text-yellow-400";
                  const totalPot = normalizePotential(catData.potencialTotal || catData.potencialValor);
                  const atingidoPot = normalizePotential(catData.potencialAtingido);
                  const realPot = Math.max(totalPot - atingidoPot, 0);
                  const safraIcon = catData.safra === "Inverno" ? "❄️" : "☀️";
                  const produtoNome = getProdutoNome(catData.produtoRef);

                  return (
                    <View key={idx} className="flex-row items-center gap-1">
                      {/* Status */}
                      <Text className={`text-xs font-bold ${statusColor} w-4`}>
                        {statusIcon}
                      </Text>
                      
                      {/* Categoria + Produto + Safra */}
                      <View className="flex-row items-center gap-0.5 flex-shrink-0">
                        <Text className="text-xs font-bold text-foreground" numberOfLines={1}>
                          {getCategoryDisplayName(catData.categoria)}:
                        </Text>
                        <Text className="text-xs text-cyan-300" numberOfLines={1}>
                          {produtoNome}
                        </Text>
                        <Text className="text-xs">
                          {safraIcon}
                        </Text>
                      </View>
                      
                      {/* Potencial Atingido + Real */}
                      <View className="flex-row gap-1 ml-auto">
                        <Text className="text-xs text-blue-400 font-semibold">
                          {atingidoPot.toFixed(0)}
                        </Text>
                        <Text className="text-xs text-orange-400 font-semibold">
                          {realPot.toFixed(0)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Botões Compactos */}
          <View className="flex-row gap-1.5 border-t border-border p-2">
            <TouchableOpacity
              className="flex-1 bg-primary rounded py-1.5 items-center active:opacity-80"
              onPress={() => {
                console.log("[Admin] Editar cadastro", cadastro.cadastroId);
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
                  console.log("[Admin] Excluir cadastro", cadastro.cadastroId);
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
    };

    return (
      <View className="gap-2 pb-6">
        {/* Filtros - Layout Compacto */}
        <View className="gap-1.5">
          {/* Filtro Safra */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Safra</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg border ${
                  selectedSafraFilter === "TODAS"
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
                onPress={() => {
                  setSelectedSafraFilter("TODAS");
                  setPaginaCadastros(1);
                }}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedSafraFilter === "TODAS" ? "text-white" : "text-foreground"
                  }`}
                >
                  TODAS
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg border ${
                  selectedSafraFilter === "Verão"
                    ? "bg-orange-500 border-orange-500"
                    : "bg-surface border-border"
                }`}
                onPress={() => {
                  setSelectedSafraFilter("Verão");
                  setPaginaCadastros(1);
                }}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedSafraFilter === "Verão" ? "text-white" : "text-foreground"
                  }`}
                >
                  ☀️ Verão
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-2 rounded-lg border ${
                  selectedSafraFilter === "Inverno"
                    ? "bg-blue-500 border-blue-500"
                    : "bg-surface border-border"
                }`}
                onPress={() => {
                  setSelectedSafraFilter("Inverno");
                  setPaginaCadastros(1);
                }}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedSafraFilter === "Inverno" ? "text-white" : "text-foreground"
                  }`}
                >
                  ❄️ Inverno
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Linha 1: GR + Busca */}
          <View className="flex-row gap-2">
            {/* Filtro de GR - Dropdown Compacto */}
            {grsUnicos.length > 0 && (
              <View className="flex-1 bg-surface border border-border rounded-lg overflow-hidden">
                <Picker
                  selectedValue={selectedGRFilter}
                  onValueChange={(value) => {
                    setSelectedGRFilter(value);
                    setPaginaCadastros(1);
                  }}
                  style={{ color: colors.foreground, backgroundColor: colors.surface, height: 44 }}
                >
                  <Picker.Item label="🗺️ GR: TODOS" value="TODOS" />
                  {grsUnicos.map((gr) => (
                    <Picker.Item key={gr} label={`🗺️ GR: ${gr}`} value={gr} />
                  ))}
                </Picker>
              </View>
            )}

            {/* Campo de Busca Compacto */}
            <TouchableOpacity className="flex-1 bg-surface border border-border rounded-lg px-3 py-2.5 justify-center">
              <TextInput
                className="text-foreground text-sm"
                placeholder="🔍 GR, canal, unidade..."
                placeholderTextColor={colors.muted}
                value={searchCadastros}
                onChangeText={(text) => {
                  setSearchCadastros(text);
                  setPaginaCadastros(1);
                }}
                style={{ color: colors.foreground }}
              />
            </TouchableOpacity>
          </View>

          {/* KPIs + Info - Linha 2 */}
          <View className="flex-row gap-2">
            <View className="flex-1 bg-warning bg-opacity-10 rounded-lg px-2.5 py-2 border border-warning border-opacity-20">
              <Text className="text-xs text-muted">📊 Potencial Real (tons)</Text>
              <Text className="text-sm font-bold text-white">{potencialTons.toFixed(0)}</Text>
            </View>
            <View className="flex-1 bg-orange-500 bg-opacity-10 rounded-lg px-2.5 py-2 border border-orange-500 border-opacity-20">
              <Text className="text-xs text-muted">📊 Potencial Real (litros)</Text>
              <Text className="text-sm font-bold text-white">{potencialLitros.toFixed(0)}</Text>
            </View>
            <View className="flex-1 bg-primary bg-opacity-10 rounded-lg px-2.5 py-2 border border-primary border-opacity-20">
              <Text className="text-xs text-muted">📋 Registros</Text>
              <Text className="text-sm font-bold text-white">{filtered.length}</Text>
            </View>
          </View>
        </View>

        {/* Grid de Cadastros - 3 Colunas */}
        {paginatedData.length > 0 ? (
          <View className="gap-3">
            {/* Linhas de 3 */}
            {Array.from({ length: Math.ceil(paginatedData.length / 3) }).map((_, rowIdx) => (
              <View key={rowIdx} className="flex-row gap-1 justify-between">
                {paginatedData.slice(rowIdx * 3, rowIdx * 3 + 3).map((cadastro) => (
                  <CadastroCard key={cadastro.cadastroId} cadastro={cadastro} />
                ))}
                {/* Placeholder para manter layout uniforme */}
                {paginatedData.slice(rowIdx * 3, rowIdx * 3 + 3).length < 3 &&
                  Array.from({ length: 3 - paginatedData.slice(rowIdx * 3, rowIdx * 3 + 3).length }).map(
                    (_, idx) => (
                      <View key={`placeholder-${idx}`} className="flex-1 mx-1" />
                    )
                  )}
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-surface rounded-lg p-6 items-center">
            <Text className="text-base text-muted">📋 Nenhum cadastro encontrado</Text>
            <Text className="text-xs text-muted mt-1">Tente ajustar os filtros</Text>
          </View>
        )}

        {/* Paginação - Botões */}
        {totalPages > 1 && (
          <View className="gap-2 mt-4">
            <View className="flex-row gap-2 justify-center">
              <TouchableOpacity
                className={`px-4 py-2.5 rounded-lg ${
                  paginaCadastros === 1
                    ? "bg-gray-600 opacity-50"
                    : "bg-primary"
                }`}
                onPress={() => setPaginaCadastros(Math.max(1, paginaCadastros - 1))}
                disabled={paginaCadastros === 1}
              >
                <Text className="text-white font-semibold">← Anterior</Text>
              </TouchableOpacity>

              {/* Indicadores de página */}
              <View className="flex-row gap-1 items-center">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <TouchableOpacity
                    key={idx}
                    className={`w-8 h-8 rounded-lg items-center justify-center ${
                      paginaCadastros === idx + 1
                        ? "bg-primary"
                        : "bg-surface border border-border"
                    }`}
                    onPress={() => setPaginaCadastros(idx + 1)}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        paginaCadastros === idx + 1
                          ? "text-white"
                          : "text-foreground"
                      }`}
                    >
                      {idx + 1}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                className={`px-4 py-2.5 rounded-lg ${
                  paginaCadastros === totalPages
                    ? "bg-gray-600 opacity-50"
                    : "bg-primary"
                }`}
                onPress={() => setPaginaCadastros(Math.min(totalPages, paginaCadastros + 1))}
                disabled={paginaCadastros === totalPages}
              >
                <Text className="text-white font-semibold">Próximo →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ====================== RENDER ======================
  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header com Ícones de Navegação */}
        <View className="px-6 pt-6 pb-4 border-b border-border">
          <View className="flex-row justify-between items-start mb-3">
            {/* Título e Subtítulo */}
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">Administração</Text>
              <Text className="text-sm text-muted mt-0.5">Monitoramento em tempo real</Text>
            </View>

            {/* Ícones de Guias - Linha Compacta */}
            <View className="flex-row gap-1.5 ml-4">
              {(["dashboard", "usuarios", "produtos", "canais", "unidades", "cadastros"] as Tab[]).map((tab) => {
                const tabLabels: Record<Tab, string> = {
                  dashboard: "📊",
                  usuarios: "👥",
                  produtos: "📦",
                  canais: "🛣️",
                  unidades: "🏢",
                  cadastros: "📋",
                };
                return (
                  <TouchableOpacity
                    key={tab}
                    className={`p-2 rounded-lg transition-all ${
                      activeTab === tab
                        ? "bg-primary/20 border border-primary"
                        : "bg-surface border border-border hover:bg-surface/80"
                    }`}
                    onPress={() => setActiveTab(tab)}
                    activeOpacity={0.7}
                  >
                    <Text className={`text-xl ${activeTab === tab ? "text-primary" : "text-muted"}`}>
                      {tabLabels[tab] || ""}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Header da Tab Ativa - Intuitivo e Visual */}
        {!isLoading && (
          <View className="bg-surface border-b border-border px-6 py-3">
            <Text className="text-sm text-muted">Você está em:</Text>
            <Text className="text-xl font-bold text-foreground mt-1">
              {activeTab === "dashboard"
                ? "📊 Dashboard"
                : activeTab === "usuarios"
                ? "👥 Usuários"
                : activeTab === "produtos"
                ? "📦 Produtos"
                : activeTab === "canais"
                ? "🛣️ Canais"
                : activeTab === "unidades"
                ? "🏢 Unidades"
                : "📋 Cadastros"}
            </Text>
          </View>
        )}

        {/* Conteúdo */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-muted mt-4">Carregando dados...</Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-6" refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
            {/* Botões Sync/Pull - Elegantes e Compactos no Topo */}
            {activeTab === "dashboard" && (
              <View className="flex-row gap-1.5 my-3 justify-end">
                <TouchableOpacity
                  onPress={handleSync}
                  disabled={isSyncing}
                  className={`py-1.5 px-2.5 rounded-lg flex-row items-center justify-center ${isSyncing ? "bg-gray-400" : "bg-blue-500"}`}
                >
                  {isSyncing ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text className="text-white text-xs font-semibold ml-1">Enviar...</Text>
                    </>
                  ) : (
                    <Text className="text-white text-xs font-semibold">📤 Enviar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePull}
                  disabled={isPulling}
                  className={`py-1.5 px-2.5 rounded-lg flex-row items-center justify-center ${isPulling ? "bg-gray-400" : "bg-green-500"}`}
                >
                  {isPulling ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text className="text-white text-xs font-semibold ml-1">Atualizar...</Text>
                    </>
                  ) : (
                    <Text className="text-white text-xs font-semibold">📥 Atualizar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {activeTab === "dashboard" && dashboardContent()}
            {activeTab === "usuarios" && usuariosContent()}
            {activeTab === "produtos" && produtosContent()}
            {activeTab === "canais" && canaisContent()}
            {activeTab === "unidades" && unidadesContent()}
            {activeTab === "cadastros" && cadastrosContent()}
          </ScrollView>
        )}
      </View>
    </ScreenContainer>
  );
}
