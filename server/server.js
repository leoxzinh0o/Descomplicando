const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const multer = require('multer');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// Configura o armazenamento das imagens com o Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'public', 'uploads');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware para sessões
app.use(session({
  secret: 'seuSegredoAqui',
  resave: false,
  saveUninitialized: true,
}));

// Middlewares para body e arquivos estáticos
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'html')));

// Função para ler o banco de dados
function readDB() {
  if (fs.existsSync(DB_PATH)) {
    const dbData = fs.readFileSync(DB_PATH, 'utf8');
    if (!dbData.trim()) return { clientes: [], anuncios: [] };
    try {
      return JSON.parse(dbData);
    } catch (error) {
      return { clientes: [], anuncios: [] };
    }
  }
  return { clientes: [], anuncios: [] };
}

// Função para salvar no banco de dados
function saveDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Erro ao salvar os dados no arquivo:", error);
  }
}

// Middleware de proteção de rota
function checkLogin(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

// Rotas de páginas
app.get('/index.html', checkLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'html', 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'html', 'login.html'));
});

app.get('/cadastro.html', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'html', 'cadastro.html'));
});

app.get('/anunciar.html', checkLogin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'html', 'anunciar.html'));
});

// Rotas da API

// Retorna todos os anúncios
app.get('/api/anuncios', (req, res) => {
  const db = readDB();

  // Função para separar anúncios expirados e não expirados
  const anunciosNaoExpirados = [];
  const anunciosExpirados = [];
  const anunciosDescomplicados = db.anunciosDescomplicados || [];

  db.anuncios.forEach(anuncio => {
    const criadoEm = new Date(anuncio.criadoEm);
    const duracao = anuncio.duracao;

    let prazoMs = 0;
    switch (duracao) {
      case '24h': prazoMs = 24 * 60 * 60 * 1000; break;
      case '7d': prazoMs = 7 * 24 * 60 * 60 * 1000; break;
      case '15d': prazoMs = 15 * 24 * 60 * 60 * 1000; break;
      case '30d': prazoMs = 30 * 24 * 60 * 60 * 1000; break;
      default: prazoMs = 7 * 24 * 60 * 60 * 1000;
    }

    const expirado = Date.now() > (criadoEm.getTime() + prazoMs);

    if (expirado) {
      anunciosExpirados.push(anuncio);
    } else {
      anunciosNaoExpirados.push(anuncio);
    }
  });

  res.status(200).json({
    anunciosNaoExpirados,
    anunciosExpirados,
    anunciosDescomplicados
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  const db = readDB();
  const cliente = db.clientes.find(c => c.email === email && c.senha === senha);

  if (!cliente) {
    return res.status(401).json({ erro: "E-mail ou senha inválidos." });
  }

  // Armazenar o cliente na sessão
  req.session.user = cliente;

  res.status(200).json({ mensagem: `Bem-vindo, ${cliente.nome}!`, user: cliente });
});

// Verifica se está logado
app.get('/api/checkLogin', (req, res) => {
  res.status(200).json({ user: req.session.user || null });
});

// Cadastro
app.post('/api/cadastrar', (req, res) => {
  const { nome, email, senha } = req.body;
  const db = readDB();

  if (db.clientes.some(cliente => cliente.email === email)) {
    return res.status(400).json({ erro: "Já existe um usuário cadastrado com esse e-mail." });
  }

  db.clientes.push({ nome, email, senha });
  saveDB(db);
  res.status(201).json({ mensagem: 'Cliente cadastrado com sucesso!' });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ erro: 'Erro ao tentar fazer logout.' });
    res.status(200).json({ mensagem: 'Logout realizado com sucesso.' });
  });
});

// Publica um novo anúncio
app.post('/api/anuncios', upload.single('imagem'), (req, res) => {
  const usuarioLogado = req.session.user;
  const { nome, descricao, categoria, quantidade, localizacao, duracao } = req.body;
  const imagem = req.file ? `/uploads/${req.file.filename}` : null;

  if (!nome || !descricao || !categoria || !quantidade || !localizacao || !duracao) {
    return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
  }

  const db = readDB();

  // Calcular o prazo de expiração com base na duração fornecida
  let prazoMs = 0;
  switch (duracao) {
    case '24h': prazoMs = 24 * 60 * 60 * 1000; break;
    case '7d': prazoMs = 7 * 24 * 60 * 60 * 1000; break;
    case '15d': prazoMs = 15 * 24 * 60 * 60 * 1000; break;
    case '30d': prazoMs = 30 * 24 * 60 * 60 * 1000; break;
    default: prazoMs = 7 * 24 * 60 * 60 * 1000;
  }

  const criadoEm = new Date();
  const expiraEm = new Date(criadoEm.getTime() + prazoMs);

  const novoAnuncio = {
    id: Date.now().toString(),
    nome,
    descricao,
    categoria,
    quantidade,
    localizacao,
    imagem,
    duracao, // Armazenando a duração no anúncio
    criadoEm: criadoEm.toISOString(),
    expiraEm: expiraEm.toISOString(), // Salvando o tempo de expiração
    usuarioId: usuarioLogado.email,
    mensagens: []
  };

  if (!db.anuncios) db.anuncios = [];
  db.anuncios.push(novoAnuncio);
  saveDB(db);

  res.status(201).json({ mensagem: 'Anúncio publicado com sucesso!', anuncio: novoAnuncio });
});

// Retorna um anúncio específico por ID
app.get('/api/anuncios/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const anuncio = db.anuncios.find(a => a.id === id);

  if (!anuncio) {
    return res.status(404).json({ erro: 'Anúncio não encontrado' });
  }

  // Garante que a lista de mensagens existe
  if (!anuncio.mensagens) {
    anuncio.mensagens = [];  // Se não houver mensagens, inicializa como array vazio
  }

  res.status(200).json(anuncio);  // Retorna o anúncio com as mensagens
});

// Salva mensagens
app.post('/api/anuncios/:id/mensagens', (req, res) => {
  try {
    const { texto } = req.body;
    const anuncioId = req.params.id.toString();
    const db = readDB();

    if (!req.session.user) {
      return res.status(401).json({ erro: "Usuário não autenticado." });
    }

    if (!texto || texto.trim() === '') {
      return res.status(400).json({ erro: "Texto da mensagem é obrigatório." });
    }

    const index = db.anuncios.findIndex(a => a.id === anuncioId);
    if (index === -1) {
      return res.status(404).json({ erro: "Anúncio não encontrado." });
    }

    if (!db.anuncios[index].mensagens) {
      db.anuncios[index].mensagens = [];
    }

    const novaMensagem = {
      id: Date.now().toString(),  // Gerando ID único para cada mensagem
      autor: req.session.user.email,
      texto,
      data: new Date().toISOString(),
      respostas: []  // Array de respostas (inicializado vazio)
    };

    db.anuncios[index].mensagens.push(novaMensagem);
    saveDB(db);

    res.status(201).json({ mensagem: "Mensagem enviada com sucesso.", novaMensagem });

  } catch (error) {
    console.error("❌ Erro interno ao salvar mensagem:", error);
    res.status(500).json({ erro: "Erro interno ao salvar mensagem." });
  }
});

// Salvar resposta para uma mensagem
app.post('/api/anuncios/:anuncioId/mensagens/:msgId/respostas', (req, res) => {
  const { anuncioId, msgId } = req.params;
  const { texto } = req.body;
  const db = readDB();

  const anuncio = db.anuncios.find(a => a.id === anuncioId);
  if (!anuncio) return res.status(404).json({ erro: "Anúncio não encontrado." });

  const mensagem = anuncio.mensagens.find(m => m.id === msgId);
  if (!mensagem) return res.status(404).json({ erro: "Mensagem não encontrada." });

  const resposta = {
    id: Date.now().toString(),
    autor: req.session.user.email,
    texto,
    data: new Date().toISOString(),
  };

  mensagem.respostas.push(resposta);
  saveDB(db);

  res.status(201).json({ mensagem: "Resposta adicionada com sucesso.", resposta });
});

// Encerra anúncio
app.post('/api/anuncios/:id/encerrar', (req, res) => {
  const db = readDB();
  const anuncio = db.anuncios.find(a => a.id === req.params.id);

  if (!anuncio) return res.status(404).json({ erro: "Anúncio não encontrado." });

  if (!req.session.user || req.session.user.email !== anuncio.usuarioId) {
    return res.status(403).json({ erro: "Acesso negado. Você não é o dono deste anúncio." });
  }

  anuncio.encerrado = true;

  // Move o anúncio para a lista de descomplicados
  db.anunciosDescomplicados = db.anunciosDescomplicados || [];
  db.anunciosDescomplicados.push(anuncio);

  // Remove o anúncio da lista de ativos
  db.anuncios = db.anuncios.filter(a => a.id !== anuncio.id);

  saveDB(db);

  res.status(200).json({ mensagem: "Anúncio descomplicado com sucesso." });
});

// Rota para remover um anúncio
app.post('/api/anuncios/:id/remover', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  
  // Encontra o anúncio
  const anuncioIndex = db.anuncios.findIndex(a => a.id === id);

  if (anuncioIndex === -1) {
    return res.status(404).json({ erro: "Anúncio não encontrado." });
  }

  // Verifica se o usuário logado é o dono do anúncio
  const anuncio = db.anuncios[anuncioIndex];
  if (!req.session.user || req.session.user.email !== anuncio.usuarioId) {
    return res.status(403).json({ erro: "Acesso negado. Você não é o dono deste anúncio." });
  }

  // Remove o anúncio da lista de anúncios
  db.anuncios.splice(anuncioIndex, 1);

  // Salva o banco de dados atualizado
  saveDB(db);

  res.status(200).json({ mensagem: "Anúncio removido com sucesso." });
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
