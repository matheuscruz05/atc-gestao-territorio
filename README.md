# ATC Gestão de Território

Aplicativo móvel para gestão de território de vendas, permitindo que Agentes Técnicos Comerciais (ATCs) cadastrem produtos em locais/canais e coordenadores administrem toda a operação.

## 📱 Sobre o Projeto

Este aplicativo foi desenvolvido seguindo as especificações do `blueprint.md`, implementando um sistema completo de gestão de território com:

- **Autenticação** com controle de acesso por perfil (ATC e Coordenador)
- **Cadastro de produtos** com validações inteligentes
- **Dashboard administrativo** para coordenadores
- **Integração com Google Sheets** para sincronização de dados
- **Interface nativa** seguindo Apple Human Interface Guidelines

## 🎯 Funcionalidades Principais

### Para ATCs (Agentes Técnicos Comerciais)

- ✅ Login seguro com email e senha
- ✅ Visualização dos próprios cadastros
- ✅ Cadastro de produtos com validações:
  - Produto filtrado por categoria
  - Campo "Produto Livre" obrigatório para HIDROSSOLÚVEIS
  - Potencial obrigatório quando Implantado = Sim
  - Unidade potencial auto-preenchida
- ✅ Busca e filtros de cadastros
- ✅ Pull-to-refresh para atualização

### Para Coordenadores

- ✅ Visualização de todos os cadastros (de todos os ATCs)
- ✅ Dashboard com métricas agregadas
- ✅ Filtros avançados (por ATC, Categoria, Estado, Status)
- ✅ Administração de:
  - Usuários (ATCs e Coordenadores)
  - Produtos (catálogo completo)
  - Canais de venda
  - Unidades comerciais
- ✅ Controle de ativação/desativação de registros

### Integração Google Sheets

- ✅ Sincronização bidirecional com planilha Google Sheets
- ✅ Suporte para API Key (leitura) ou Service Account (leitura/escrita)
- ✅ Webhook para notificações em tempo real (opcional)
- ✅ Documentação completa de configuração

## 🚀 Como Começar

### 1. Instalar Dependências

```bash
pnpm install
```

### 2. Iniciar o Servidor de Desenvolvimento

```bash
pnpm dev
```

### 3. Abrir no Dispositivo

#### Opção A: Expo Go (Recomendado para testes rápidos)

1. Instale o app Expo Go no seu celular:
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. Escaneie o QR code que aparece no terminal

#### Opção B: Emulador/Simulador

```bash
# iOS (requer macOS)
pnpm ios

# Android
pnpm android
```

#### Opção C: Web (para testes básicos)

O servidor já inicia automaticamente na web. Acesse a URL mostrada no terminal.

## 🔑 Credenciais de Demo

### Coordenador
- **Email**: coord@atc.com
- **Senha**: 123456

### ATCs
- **ATC 1**: atc1@atc.com / 123456
- **ATC 2**: atc2@atc.com / 123456
- **ATC 3**: atc3@atc.com / 123456

## 📊 Estrutura de Dados

O aplicativo gerencia 5 entidades principais:

1. **USUARIOS**: Controle de acesso (ATCs e Coordenadores)
2. **PRODUTOS**: Catálogo de produtos por categoria
3. **CANAIS**: Canais de venda (Varejo, Cooperativa, etc.)
4. **UNIDADES**: Unidades comerciais por região
5. **CADASTROS**: Registros de produtos por local/canal

### Categorias de Produtos

1. FERTILIZANTE - BASE
2. FERTILIZANTES - COBERTURA
3. BIOLÓGICOS - INOCULANTES
4. BIOLÓGICOS - FOLIARES
5. HIDROSSOLÚVEIS

## 🔗 Integração com Google Sheets

Para configurar a integração com Google Sheets:

1. Leia o guia completo: **[GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)**
2. Crie a planilha conforme especificado
3. Configure as credenciais (API Key ou Service Account)
4. Adicione as variáveis de ambiente no arquivo `.env`

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# ID da planilha Google Sheets
EXPO_PUBLIC_GOOGLE_SHEETS_ID=seu_spreadsheet_id_aqui

# API Key (apenas leitura)
EXPO_PUBLIC_GOOGLE_SHEETS_API_KEY=sua_api_key_aqui

# Webhook URL (opcional)
EXPO_PUBLIC_WEBHOOK_URL=https://script.google.com/macros/s/xxx/exec
```

## 🧪 Testes

### Testes Automatizados

```bash
pnpm test
```

**Nota**: Os testes unitários requerem ambiente React Native. Para validação completa, use os testes manuais.

### Testes Manuais

Siga o guia completo de testes: **[TESTES_MANUAIS.md](./TESTES_MANUAIS.md)**

Este guia contém 30+ cenários de teste cobrindo:
- Autenticação e controle de acesso
- Cadastro de produtos com validações
- Funcionalidades de ATC e Coordenador
- Integração com Google Sheets
- Interface e usabilidade

## 📁 Estrutura do Projeto

```
atc-gestao-territorio/
├── app/                      # Telas e navegação (Expo Router)
│   ├── (tabs)/              # Tabs principais
│   │   ├── index.tsx        # Home (Meus Cadastros / Dashboard)
│   │   ├── cadastros.tsx    # Todos os Cadastros (COORD)
│   │   ├── admin.tsx        # Administração (COORD)
│   │   └── perfil.tsx       # Perfil e Logout
│   ├── login.tsx            # Tela de Login
│   └── novo-cadastro.tsx    # Formulário de Cadastro
├── components/              # Componentes reutilizáveis
├── lib/                     # Lógica de negócio
│   ├── auth-context.tsx     # Contexto de autenticação
│   ├── storage.ts           # AsyncStorage (armazenamento local)
│   ├── google-sheets-sync.ts # Integração Google Sheets
│   └── seed-data.ts         # Dados iniciais
├── types/                   # Tipos TypeScript
│   └── models.ts            # Modelos de dados
├── tests/                   # Testes
│   └── app.test.ts          # Testes automatizados
├── design.md                # Planejamento de interface
├── todo.md                  # Lista de funcionalidades
├── GOOGLE_SHEETS_SETUP.md   # Guia de configuração Sheets
├── TESTES_MANUAIS.md        # Guia de testes manuais
└── blueprint.md             # Especificação original
```

## 🎨 Design

O design segue as diretrizes do Apple Human Interface Guidelines:

- **Orientação**: Portrait (9:16) exclusivamente
- **Uso**: Otimizado para uma mão
- **Estilo**: Clean, profissional, focado em produtividade
- **Cores**: Paleta azul (#0a7ea4) com suporte a dark mode

Veja o planejamento completo em: **[design.md](./design.md)**

## 📝 Validações Implementadas

### Cadastro de Produtos

1. ✅ Todos os campos obrigatórios validados
2. ✅ Produto filtrado automaticamente por categoria selecionada
3. ✅ Campo "Produto Livre" obrigatório apenas para HIDROSSOLÚVEIS
4. ✅ Potencial obrigatório quando Implantado = Sim
5. ✅ Unidade potencial auto-preenchida baseada no produto
6. ✅ ATC_EMAIL preenchido automaticamente (invisível)

### Controle de Acesso

1. ✅ ATCs veem apenas próprios cadastros
2. ✅ Coordenadores veem todos os cadastros
3. ✅ Telas administrativas restritas a coordenadores
4. ✅ Sessão persistente entre reinicializações

## 🔧 Tecnologias Utilizadas

- **React Native 0.81** com **Expo SDK 54**
- **TypeScript 5.9** para type safety
- **Expo Router 6** para navegação
- **NativeWind 4** (Tailwind CSS para React Native)
- **AsyncStorage** para armazenamento local
- **Google Sheets API** para sincronização
- **React Native Reanimated 4** para animações

## 📦 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento
pnpm dev:server       # Apenas backend
pnpm dev:metro        # Apenas Metro bundler

# Build
pnpm build            # Build de produção

# Testes
pnpm test             # Executa testes
pnpm check            # Verifica tipos TypeScript
pnpm lint             # Linter

# Plataformas específicas
pnpm android          # Abre no Android
pnpm ios              # Abre no iOS
pnpm qr               # Gera QR code para Expo Go
```

## 🚀 Deploy

Para publicar o aplicativo:

1. Crie um checkpoint:
   ```bash
   # O checkpoint é criado automaticamente ao finalizar desenvolvimento
   ```

2. Clique no botão **Publish** na interface do Manus

3. O app será publicado e você receberá:
   - Link para compartilhar
   - QR code para instalação
   - Opções de distribuição

## 📄 Documentação Adicional

- **[blueprint.md](./blueprint.md)** - Especificação original completa
- **[design.md](./design.md)** - Planejamento de interface
- **[GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)** - Configuração Google Sheets
- **[TESTES_MANUAIS.md](./TESTES_MANUAIS.md)** - Guia de testes
- **[todo.md](./todo.md)** - Lista de funcionalidades implementadas

## 🐛 Troubleshooting

### Erro: "Failed to load module"
```bash
pnpm install
pnpm dev
```

### App não conecta no Expo Go
- Verifique se está na mesma rede Wi-Fi
- Tente usar o QR code em vez de digitar URL manualmente

### Google Sheets não sincroniza
- Verifique se as variáveis de ambiente estão corretas
- Confirme que a planilha está compartilhada com a service account
- Veja troubleshooting completo em GOOGLE_SHEETS_SETUP.md

## 📞 Suporte

Para dúvidas ou problemas:

1. Consulte a documentação acima
2. Verifique o guia de testes manuais
3. Revise o blueprint.md para especificações

## 📜 Licença

Este projeto foi desenvolvido para uso interno da equipe ATC.

---

**Desenvolvido com ❤️ usando Manus AI**
