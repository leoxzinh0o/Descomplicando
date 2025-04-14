document.addEventListener('DOMContentLoaded', () => {
  // Cadastro
  const formCadastro = document.getElementById('formCadastro');
  if (formCadastro) {
    formCadastro.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nome = document.getElementById('nome').value;
      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;

      const response = await fetch('/api/cadastrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha })
      });

      const data = await response.json();

      if (response.status === 201) {
        alert('Usuário cadastrado com sucesso!');
        window.location.href = "/login.html";
      } else {
        alert(`Erro: ${data.erro}`);
      }
    });
  }

  // Login
  const formLogin = document.getElementById('formLogin');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email-login').value;
      const senha = document.getElementById('password-login').value;

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (response.status === 200) {
        alert('Login realizado com sucesso!');
        window.location.href = "/index.html";
      } else {
        alert(`Erro: ${data.erro}`);
      }
    });
  }

  // Somente carrega os anúncios se a página tiver o container correto
  const container = document.getElementById('product-list');
  if (container) {
    carregarAnuncios();
  }

  // Função para carregar os anúncios com layout padronizado
  async function carregarAnuncios() {
    try {
      const response = await fetch('/api/anuncios');
      if (!response.ok) throw new Error('Erro ao carregar os anúncios.');

      const anuncios = await response.json();
      
      // Verifica se a estrutura de dados está correta
      if (!anuncios || !anuncios.anunciosNaoExpirados) {
        console.error("A resposta não tem o formato esperado.");
        return;
      }

      // Limpa o conteúdo atual do container
      container.innerHTML = '';

      if (anuncios.anunciosNaoExpirados.length === 0) {
        container.innerHTML = '<p>Nenhum anúncio disponível no momento.</p>';
        return;
      }

      anuncios.anunciosNaoExpirados.forEach(anuncio => {
        const imagemUrl = anuncio.imagem ? `/uploads/${anuncio.imagem}` : '/img/no-image.jpg';
        const div = document.createElement('div');
        div.classList.add('col-md-4', 'mb-4');
        div.innerHTML = `
          <div class="card product-card card-anuncio">
            <img src="${imagemUrl}" class="card-img-top" alt="${anuncio.nome}">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${anuncio.nome}</h5>
              <p class="card-text text-truncate">${anuncio.descricao}</p>
              <p class="card-text"><strong>Categoria:</strong> ${anuncio.categoria}</p>
              <p class="card-text"><strong>Quantidade:</strong> ${anuncio.quantidade}</p>
              <p class="card-text"><strong>Localização:</strong> ${anuncio.localizacao}</p>
              <p class="card-text text-danger"><strong>Expira em:</strong> 
                <span class="contador-tempo" data-criado="${anuncio.criadoEm}" data-duracao="${anuncio.duracao}">Calculando...</span>
              </p>
            </div>
          </div>
        `;
        container.appendChild(div);
      });

      iniciarContadores(); // Inicia o contador de tempo para cada anúncio
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar os anúncios.');
    }
  }

  // Função para iniciar os contadores de tempo para os anúncios
  function iniciarContadores() {
    const elementos = document.querySelectorAll('.contador-tempo');

    elementos.forEach(el => {
      const criadoEm = new Date(el.dataset.criado);
      const duracao = el.dataset.duracao;

      let prazoMs = 0;
      switch (duracao) {
        case '24h': prazoMs = 24 * 60 * 60 * 1000; break;
        case '7d': prazoMs = 7 * 24 * 60 * 60 * 1000; break;
        case '15d': prazoMs = 15 * 24 * 60 * 60 * 1000; break;
        case '30d': prazoMs = 30 * 24 * 60 * 60 * 1000; break;
        default: prazoMs = 7 * 24 * 60 * 60 * 1000;
      }

      const expiraEm = new Date(criadoEm.getTime() + prazoMs);

      function atualizar() {
        const agora = new Date();
        const restante = expiraEm - agora;

        if (restante <= 0) {
          el.textContent = 'Expirado';
          el.classList.add('text-muted');
          const card = el.closest('.card');
          if (card) card.classList.add('expirado');
          return;
        }

        const dias = Math.floor(restante / (1000 * 60 * 60 * 24));
        const horas = Math.floor((restante % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((restante % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((restante % (1000 * 60)) / 1000);

        el.textContent = `${dias}d ${horas}h ${minutos}m ${segundos}s`;
      }

      atualizar();
      setInterval(atualizar, 1000);
    });
  }

  // Verificar se a página contém os containers necessários
  const containerDescomplicados = document.getElementById('descomplicados-product-list');
  if (containerDescomplicados) {
    // Carregar anúncios descomplicados (caso você tenha a lógica para "descomplicar" o anúncio)
    carregarAnunciosDescomplicados();
  }

  // Função para carregar anúncios descomplicados (caso haja anúncios descomplicados)
  async function carregarAnunciosDescomplicados() {
    try {
      const response = await fetch('/api/anuncios/descomplicados');
      if (!response.ok) throw new Error('Erro ao carregar os anúncios descomplicados.');

      const anunciosDescomplicados = await response.json();
      containerDescomplicados.innerHTML = '';

      anunciosDescomplicados.forEach(anuncio => {
        const imagemUrl = anuncio.imagem ? `/uploads/${anuncio.imagem}` : '/img/no-image.jpg';
        const div = document.createElement('div');
        div.classList.add('col-md-4', 'mb-4');
        div.innerHTML = `
          <div class="card product-card card-anuncio descomplicado">
            <img src="${imagemUrl}" class="card-img-top" alt="${anuncio.nome}">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${anuncio.nome}</h5>
              <p class="card-text text-truncate">${anuncio.descricao}</p>
              <p class="card-text"><strong>Categoria:</strong> ${anuncio.categoria}</p>
              <p class="card-text"><strong>Quantidade:</strong> ${anuncio.quantidade}</p>
              <p class="card-text"><strong>Localização:</strong> ${anuncio.localizacao}</p>
              <p class="card-text text-success">Este anúncio foi descomplicado.</p>
            </div>
          </div>
        `;
        containerDescomplicados.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar os anúncios descomplicados.');
    }
  }

});
