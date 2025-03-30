// src/utils/categorize-expense.util.ts

/**
 * Função que normaliza o texto, removendo acentos, convertendo para minúsculas e removendo espaços extras.
 */
export function normalizeText(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
  
  /**
   * Função que categoriza o gasto com base na descrição e nas palavras-chave definidas.
   */
  export function categorizeExpense(description: string): string {
    const normalizedDescription = normalizeText(description);
    const categoryMappings = [
      {
        name: 'Alimentação',
        keywords: [
          'almoco', 'jantar', 'lanche', 'cafe', 'restaurante', 'comida', 'refeicao', 'desjejum', 'ceia', 'brunch',
          'ifood', 'ubereats', 'rappi', 'delivery', 'salgado', 'pizza', 'hamburguer', 'churrasco', 'pizzaria', 'lanchonete',
          'sorvete', 'pastel', 'comidacaseira', 'fastfood', 'espetinho', 'coxinha', 'paodequeijo', 'brigadeiro', 'empada', 'prato feito',
          'menu', 'refrigerante', 'suco', 'bebida', 'cafedamanha', 'pao', 'sanduiche', 'sushi', 'poke', 'boteco', 'petiscaria',
          'foodtruck', 'comidinha', 'lancherapido', 'batatafrita', 'açai', 'empadinha', 'quibe', 'chopp', 'parmegiana', 'padaria'
        ]
      },
      {
        name: 'Transporte',
        keywords: [
          'uber', '99taxi', '99pop', 'taxi', 'onibus', 'metro', 'passagem', 'locacao', 'motoboy', 'bicicleta',
          'bike', 'cabify', 'aplicativo', 'ride', 'corrida', 'rodoviaria', 'trem', 'carona', 'aplicativodetransporte', 'transporteurbano',
          'fretado', 'van', 'alugueldecarro', 'locadora', 'mobilidade', 'trajeto', 'percurso', 'chamadadetaxi', 'corridacompartilhada', 'uberblack',
          'uberx', 'onibusexecutivo', 'taxiamarelo', 'microonibus', 'caronasolidaria', 'translado', 'scooter', 'alugueldebike', 'patinete', 'appdemobilidade',
          'transbordo', 'linhadeonibus', 'transporteescolar', 'embarque', 'desembarque', 'rota', 'viagem', 'deslocamento', 'apptaxi', 'circuito'
        ]
      },
      {
        name: 'Saúde',
        keywords: [
          'farmacia', 'remedio', 'medico', 'consulta', 'hospital', 'vacina', 'clinica', 'exame', 'dentista', 'psicologo',
          'fisioterapia', 'atendimento', 'enfermaria', 'urgencia', 'emergencia', 'ambulancia', 'planodesaude', 'saude', 'laboratorio', 'examedesangue',
          'cirurgia', 'internacao', 'receituario', 'nutricao', 'nutricionista', 'terapeutico', 'anestesia', 'obstetra', 'ginecologia', 'pediatria',
          'cardiologista', 'oftalmologia', 'otorrino', 'dermatologia', 'urologia', 'endocrinologia', 'psiquiatria', 'atendimentomedico', 'consultaonline', 'telemedicina',
          'clinicapopular', 'examedimagem', 'radiologia', 'ultrassom', 'tomografia', 'ressonancia', 'imunologia', 'tratamento', 'saudemental', 'medicinaalternativa'
        ]
      },
      {
        name: 'Lazer',
        keywords: [
          'cinema', 'show', 'teatro', 'bar', 'festa', 'lazer', 'parque', 'viagem', 'turismo', 'evento',
          'concerto', 'festival', 'balada', 'boate', 'musica', 'exposicao', 'museu', 'passeio', 'piquenique', 'standup',
          'comedia', 'espetaculo', 'rodadasamba', 'forro', 'pagode', 'samba', 'futebol', 'esportes', 'jogo', 'parquedediversoes',
          'feira', 'eventocultural', 'opera', 'showaovivo', 'noite', 'entretenimento', 'hobby', 'churrasco', 'encontro', 'acampamento',
          'festivalderua', 'cultural', 'clube', 'baladasertaneja', 'rap', 'rock', 'festajunina', 'sambaderoda', 'karaoke', 'picnic'
        ]
      },
      {
        name: 'Moradia',
        keywords: [
          'aluguel', 'imovel', 'casa', 'apartamento', 'condominio', 'luz', 'agua', 'internet', 'telefone', 'energia',
          'manutencao', 'reparo', 'imobiliaria', 'financiamentoimobiliario', 'hipoteca', 'moradia', 'aluguelresidencial', 'aluguelcomercial', 'condominiofechado', 'portaria',
          'vizinhança', 'condominioresidencial', 'taxadecondominio', 'alugueltemporario', 'aluguelportemporada', 'alugueldecasa', 'alugueldeapartamento', 'aluguelonline', 'decoracao', 'reforma',
          'mobiliario', 'mobilia', 'aluguevenda', 'corretor', 'aluguelcurtoprazo', 'aluguellongoprazo', 'casapropria', 'financiamento', 'apartamentonovo', 'imovelnovo',
          'reformaresidencial', 'reparosdomesticos', 'servicodelimpeza', 'portariaremota', 'alugueldequarto', 'aluguelcompartilhado', 'alugueldesobrado', 'alugueldekitnet', 'inquilino'
        ]
      },
      {
        name: 'Educação',
        keywords: [
          'curso', 'faculdade', 'escola', 'livro', 'materialescolar', 'mensalidade', 'tutoria', 'treinamento', 'educacao', 'educacaoonline',
          'cursinho', 'ensino', 'professor', 'aulaparticular', 'preparatorio', 'vestibular', 'inscricao', 'certificacao', 'posgraduacao', 'graduacao',
          'universidade', 'ensinoadistancia', 'ead', 'cursoonline', 'cursotecnico', 'informatica', 'idiomas', 'ingles', 'espanhol', 'portugues',
          'olimpiada', 'workshop', 'seminario', 'palestra', 'curtaduracao', 'educacaocontinuada', 'aulaparticular', 'materialdidatico', 'cursopreparatorio', 'escolaparticular',
          'escolapublica', 'cursodeculinaria', 'cursodemusica', 'cursodedanca', 'cursodefotografia', 'cursodeinformatica', 'cursodeadministracao', 'cursodeengenharia', 'cursodedireito', 'cursotecnico'
        ]
      },
      {
        name: 'Vestuário',
        keywords: [
          'roupa', 'calcado', 'acessorio', 'vestido', 'camisa', 'calca', 'sapato', 'moda', 'boutique', 'fashion',
          'terno', 'gravata', 'blazer', 'shorts', 'saia', 'regata', 'bermuda', 'casaco', 'jaqueta', 'lingerie',
          'pijama', 'meias', 'sapatenis', 'tenis', 'bota', 'sandalia', 'chinelo', 'roupacasual', 'roupasocial', 'roupaesportiva',
          'academia', 'roupadeginastica', 'roupadebanho', 'maio', 'biquini', 'roupadefrio', 'roupadeverao', 'roupadeinverno', 'vestuari feminino', 'vestuari masculino',
          'modainfantil', 'lojaroupas', 'costura', 'estilista', 'desfile', 'tshirt', 'blusa', 'sueter', 'cardiga', 'moletom'
        ]
      },
      {
        name: 'Serviços',
        keywords: [
          'manutencao', 'conserto', 'servico', 'conta', 'prestacao', 'assistencia', 'reparo', 'instalacao', 'consertos', 'limpeza',
          'zeladoria', 'jardinagem', 'pintura', 'reparos', 'servicotecnico', 'suporte', 'consultoria', 'terceirizacao', 'servicosgerais', 'pedreiro',
          'eletricista', 'encanador', 'marcenaria', 'design', 'informatica', 'programacao', 'desenvolvimento', 'freelancer', 'freelancetecnico', 'entrega'
        ]
      },
      {
        name: 'Compras',
        keywords: [
          'loja', 'produto', 'venda', 'outlet', 'bazar', 'brecho', 'atacado', 'varejo', 'online',
          'marketplace', 'consignado', 'outletonline', 'lojavirtual', 'promocao', 'desconto', 'oferta', 'cupom', 'liquidacao', 'saldao',
          'barganha', 'importado', 'entrega', 'retirada', 'compracoletiva', 'assinatura', 'produtosimportados', 'acessorios', 'eletronicos', 'vestuario'
        ]
      },
      {
        name: 'Mercado',
        keywords: [
          'compra', 'mercado', 'supermercado', 'hipermercado', 'mercearia', 'açougue', 'hortifruti', 'frutaria', 'carnes', 'carne',
          'frango', 'peixe', 'laticinios', 'leite', 'queijo', 'iogurte', 'ovos', 'arroz', 'feijao', 'macarrao',
          'farinha', 'acucar', 'sal', 'azeite', 'vinagre', 'tempero', 'biscoito', 'cereal', 'suco', 'refrigerante',
          'agua', 'produto de limpeza', 'limpeza', 'sabao', 'detergente', 'desinfetante', 'papel higiênico', 'higiene', 'condimentos', 'conservas',
          'embutidos', 'snacks', 'salgadinhos', 'congelados', 'sorvete', 'massas', 'pães', 'bolos', 'cookies', 'cereais'
        ]
      },
      {
        name: 'Tecnologia',
        keywords: [
          'computador', 'celular', 'notebook', 'eletronico', 'software', 'hardware', 'gadgets', 'acessoriostech', 'smartphone', 'tablet',
          'tv', 'smarttv', 'console', 'videogame', 'game', 'tecnologia', 'internet', 'wifi', 'rede', 'impressora',
          'scanner', 'monitor', 'teclado', 'mouse', 'headset', 'fonedeouvido', 'carregador', 'cabo', 'dispositivo', 'aplicativo',
          'app', 'sistema', 'computacao', 'programacao', 'desenvolvimento', 'robotica', 'drone', 'camera', 'foto', 'actioncam'
        ]
      },
      {
        name: 'Finanças',
        keywords: [
          'banco', 'dinheiro', 'pagamento', 'transferencia', 'saque', 'investimento', 'credito', 'divida', 'financiamento', 'fatura',
          'boleto', 'cartao', 'cheque', 'remuneracao', 'extrato', 'saldo', 'aplicacao', 'rendimento', 'juros', 'financiado',
          'cash', 'depositar', 'pagar', 'pagconta', 'conta', 'operacao', 'investimentoonline', 'corretora', 'tesourodireto', 'rendafixa'
        ]
      },
      {
        name: 'Entretenimento',
        keywords: [
          'streaming', 'netflix', 'spotify', 'jogo', 'game', 'videogame', 'cinema', 'serie', 'tv', 'musica',
          'show', 'concerto', 'podcast', 'youtube', 'entretenimento', 'playstation', 'xbox', 'nintendo', 'canal', 'humor',
          'comedia', 'standup', 'maratona', 'documentario', 'reality', 'live', 'videoonline', 'filme', 'animacao', 'desenho'
        ]
      },
      {
        name: 'Pets',
        keywords: [
          'pet', 'cachorro', 'gato', 'racao', 'veterinario', 'petshop', 'banho', 'tosa', 'brinquedopet', 'coleira',
          'alimentopet', 'vacinatopet', 'consultapet', 'petcare', 'criacao', 'adestramento', 'petsitter', 'petseguro', 'petfood', 'petiscos'
        ]
      },
      {
        name: 'Beleza',
        keywords: [
          'salao', 'cabeleireiro', 'maquiagem', 'cosmeticos', 'estetica', 'spa', 'tratamento', 'depilacao', 'manicure', 'pedicure', 'unha', 'esmalte', 'cabelo', 'skincare',
          'barbearia', 'cortedecabelo', 'tintura', 'hidratacao', 'escova', 'alisamento', 'botox', 'micropigmentacao', 'designdesobrancelha', 'depilador',
          'beleza', 'esteticafacial', 'massagem', 'limpezadepele', 'pele', 'rejuvenescimento', 'cirurgiaplastica', 'cirurgiaestetica', 'procedimentosesteticos', 'cuidadoscomapele',
          'dermocosmetico', 'tratamentosfaciais', 'clinicaestetica', 'spaday', 'cosmetologista', 'maquiagemprofissional', 'aulasmaquiagem', 'beauty', 'belezanatural', 'maquiagemartistica'
        ]
      },
      {
        name: 'Utilidades',
        keywords: [
          'feira', 'utilidades', 'mercadoria', 'sacolas', 'utensilios', 'materialdelimpeza', 'ferramentas', 'eletroportateis', 'panelas', 'talheres',
          'copos', 'pratos', 'talheresdescartaveis', 'utensiliosdecozinha', 'organizadores', 'caixas', 'embalagens', 'itensdelimpeza', 'detergente', 'sabao',
          'produtosdelimpeza', 'esponja', 'panodeprato', 'utensiliosdomesticos', 'cortina', 'tapete', 'luminaria', 'lampada', 'eletronicos', 'cabo',
          'extensao', 'adaptador', 'ferramentasmanuais', 'ferramentaseletricas', 'parafusos', 'pregos', 'martelo', 'serrote', 'lixa',
          'fixadores', 'materialdeconstrucao', 'cimento', 'areia', 'brita', 'utilitarios', 'organizador', 'produtomultiuso', 'eletrodomesticopequeno', 'aparelhosutilitarios'
        ]
      },
      {
        name: 'Viagem',
        keywords: [
          'passagem', 'hotel', 'aeroporto', 'viagem', 'alojamento', 'turismo', 'excursao', 'hospedagem', 'reserva', 'pacote',
          'pacotedeviagem', 'passagensaereas', 'lowcost', 'checkin', 'checkout', 'bagagem', 'mala', 'viagemdecarro', 'rodoviaria', 'viagemdeonibus',
          'viagemdetrem', 'reservaonline', 'hospedagembarata', 'airbnb', 'hostal', 'pousada', 'resort', 'acampamento', 'roteiro',
          'itinerario', 'destino', 'cidade', 'viageminternacional', 'viagemnacional', 'citytour', 'excursaoguida', 'cruzeiro', 'promocoesviagem', 'descontoviagem',
          'turismorural', 'turismodeaventura', 'viagemdeleza', 'viagemdenegocios', 'travel', 'viagemorganizada', 'viagememgrupo', 'passaporte', 'seguroviagem', 'aeroportointernacional'
        ]
      },
      {
        name: 'Assinaturas',
        keywords: [
          'disneyplus', 'disney', 'disney+', 'amazonprime', 'discovery+', 'discoveryplus', 'discovery', 'prime', 'globoplay', 'primevideo', 'youtube', 'hbo', 'max', 'assinatura', 'mensalidade', 'subscricao', 'servicoonline', 'streaming', 'plataforma', 'assinaturadigital', 'assinaturadarevista', 'assinaturadejornal', 'assinaturadetv',
          'tvporscricao', 'netflix', 'spotify', 'amazonprime', 'appletv', 'clarovideo', 'sky', 'assinaturadeclube', 'assinaturadesoftware', 'licenca', 'premier', 'hbomax',
          'assinaturanual', 'assinaturamensal', 'assinaturarecorrente', 'pagamentorecorrente', 'assinaturadegym', 'assinaturadebox', 'assinaturadecaixa', 'assinaturadeprodutos', 'clubedeassinatura', 'assinaturadecerveja',
          'assinaturadevinho', 'assinaturadelivros', 'assinaturadenoticias', 'assinaturadeconteudo', 'assinaturapremium', 'assinaturagratis', 'testegratis', 'assinaturadepodcast', 'assinaturadeesporte', 'assinaturadejogos',
          'assinaturadecurso', 'assinaturadetools', 'assinaturadeferramentasonline', 'assinaturadeutilidades', 'assinaturaderefeicao', 'assinaturadecafe', 'assinaturademercado', 'assinaturadesoftware', 'assinaturaonline'
        ]
      },
      {
        name: 'Fitness',
        keywords: [
          'academia', 'ginastica', 'treino', 'personal', 'fitness', 'exercicio', 'atividadefisica', 'musculacao', 'corrida', 'caminhada',
          'pilates', 'yoga', 'crossfit', 'aerobica', 'zumba', 'alongamento', 'spartan', 'treinofuncional', 'academia24h', 'academiaonline',
          'academiafeminina', 'academiamasculina', 'natacao', 'hidroginastica', 'escalada', 'ciclismo', 'bicicleta', 'spinning', 'academiaperto', 'instrutor',
          'personaltrainer', 'treinoemcasa', 'homeworkout', 'cardio', 'musculacaoparamulheres', 'musculacaoparahomens', 'academiacompleta', 'academiaequipada', 'pilatesreformer', 'treinodeforca',
          'treinode resistencia', 'circuito', 'treinointervalado', 'treinofuncional', 'balanco', 'reabilitacao', 'crosstraining', 'treinointensivo', 'fitnesstracker'
        ]
      },
      {
        name: 'Investimentos',
        keywords: [
          'acao', 'fii', 'investimento', 'rendafixa', 'tesouro', 'carteira', 'investimentoonline', 'corretora', 'mercadofinanceiro', 'bolsa',
          'divida', 'rendimento', 'juros', 'fundos', 'securitizacao', 'cdb', 'lci', 'lca', 'debenture', 'investimentoimobiliario',
          'investimentoemouro', 'investimentoemprata', 'fundodeinvestimento', 'diversificacao', 'resgate', 'poupanca', 'tesourodireto', 'previdencia', 'rendavariavel',
          'acaobluechip', 'acaosmallcap', 'etf', 'bdr', 'startup', 'venturecapital', 'investimentoemcriptomoedas', 'bitcoin', 'ethereum', 'altcoin', 'blockchain',
          'trading', 'daytrade', 'swingtrade', 'investimentosustentavel', 'investimentosocial', 'microinvestimento', 'investimentoanjo', 'analisefundamentalista', 'analisetecnica', 'performance'
        ]
      },
      {
        name: 'Impostos',
        keywords: [
          'imposto', 'taxa', 'tributo', 'contribuicao', 'declaracao', 'irpf', 'irpj', 'iss', 'icms', 'ipva',
          'inss', 'sim', 'simei', 'aliquota', 'retencao', 'pagamentoimposto', 'fatura', 'contribuinte', 'receitafederal', 'estado',
          'prefeitura', 'taxadeservico', 'impostoderenda', 'impostosefederais', 'impostosestaduais', 'impostosmunicipais', 'boleto', 'contabilidade', 'notafiscal',
          'declaracaomanual', 'deducao', 'restituicao', 'fiscal', 'tributacao', 'compensacao', 'planejamentotributario', 'sistematributario', 'taxaextra', 'impostoservicos',
          'cnpj', 'consultafiscal', 'receita', 'recolhimento', 'escrituracao', 'demonstrativo', 'contribuicaoprevidenciaria', 'valoragregado', 'basedecalculo', 'regulamentofiscal'
        ]
      },
      {
        name: 'Doações',
        keywords: [
          'doacao', 'caridade', 'solidariedade', 'contribuicao', 'doacoes', 'campanha', 'beneficente', 'filantropia', 'doador', 'ajudar',
          'ajuda', 'projetosocial', 'ong', 'apoio', 'cooperativa', 'voluntariado', 'incentivo', 'doacaoonline', 'doacaodesangue',
          'doacaodealimentos', 'doacaoderoupas', 'doacaodedinheiro', 'doacaoanonima', 'doacaoregulada', 'fundododoacao', 'arrecadacao', 'caridoso', 'doacaobeneficente',
          'campanhasolidaria', 'doacaodigital', 'doacaovirtual', 'ajudaroProximo', 'doacaaparacaridade', 'doacaoaong', 'doacaodetempo', 'doacaoderesursos', 'apoiosocial', 'ajudasocial',
          'doacaobeneficente', 'doacaodealimentos', 'doacaodeutilidades', 'doacaocorporativa', 'incentivosocial', 'doacaoconsciente', 'doacaofacilitada', 'doacaocomunitaria', 'doacaovoluntaria', 'doacaoparacrisis'
        ]
      },
      {
        name: 'Entretenimento Digital',
        keywords: [
          'jogoonline', 'microtransacao', 'skin', 'itemvirtual', 'lootbox', 'esports', 'jogomobile', 'appdejogo', 'gameonline', 'jogodigital',
          'plataformadejogo', 'assinaturadejogo', 'jogogratis', 'jogoparacelular', 'jogomultiplayer', 'competitivo', 'streamingdejogo', 'gamer', 'livestream',
          'campeonatoonline', 'torneioonline', 'fps', 'rpg', 'mmorpg', 'estrategia', 'simulador', 'aventura', 'jogoindie', 'jogocasual',
          'jogoarcade', 'jogodeestrategia', 'jogodecorrida', 'jogodeluta', 'jogodeesportes', 'jogodecartas', 'jogodetabuleirodigital', 'xadrezonline', 'mobilegame', 'freetoplay',
          'jogopago', 'atualizacaodejogo', 'expansao', 'dlc', 'patch', 'beta', 'earlyaccess', 'jogocooperativo', 'jogocompetitivo', 'jogoemnuvem', 'jogovr'
        ]
      },
      {
        name: 'Comunicação',
        keywords: [
          'telefone', 'internet', 'mensalidade', 'conta', 'assinatura', 'recarga', 'chip', 'operadora', 'celular', 'plano',
          'pacote', 'dados', 'sms', 'ligacao', 'recargadecelular', 'roaming', 'telecom', 'wifi', 'rede', 'fibra',
          'conexao', 'bandalarga', 'modem', 'roteador', 'tecnologia', 'tvpaga', 'satelite', 'telefonefixo', 'centraltelefonica', 'chamada',
          'conferencia', 'videochamada', 'whatsapp', 'telegram', 'messenger', 'skype', 'zoom', 'meetup', 'comunicacao', 'mensagem',
          'email', 'correio', 'smsilimitado', 'planofamilia', 'planoempresarial', 'internetilimitada', 'fibraoptica', 'satelital', 'ligacaointernacional', 'chamadainternacional'
        ]
      }
    ];
  
    for (const mapping of categoryMappings) {
      for (const keyword of mapping.keywords) {
        const normalizedKeyword = normalizeText(keyword);
        if (normalizedDescription.includes(normalizedKeyword)) {
          return mapping.name;
        }
      }
    }
    return 'Outros';
  }
  