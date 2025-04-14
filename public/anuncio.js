document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const mensagem = document.getElementById('mensagem');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nome = document.getElementById('product-name').value.trim();
    const descricao = document.getElementById('product-description').value.trim();
    const categoria = document.getElementById('product-category').value;
    const quantidade = parseInt(document.getElementById('product-quantity').value);
    const localizacao = document.getElementById('product-location').value.trim();
    const imagem = document.getElementById('product-image').files[0];
    const duracao = document.getElementById('ad-duration').value;

    if (!nome || !descricao || !categoria || !quantidade || !localizacao || !duracao || !imagem) {
      mensagem.innerHTML = `<div class="alert alert-warning">Por favor, preencha todos os campos obrigatórios, incluindo a imagem.</div>`;
      return;
    }

    if (quantidade <= 0 || duracao <= 0) {
      mensagem.innerHTML = `<div class="alert alert-warning">Quantidade e duração devem ser maiores que zero.</div>`;
      return;
    }

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('descricao', descricao);
    formData.append('categoria', categoria);
    formData.append('quantidade', quantidade);
    formData.append('localizacao', localizacao);
    formData.append('duracao', duracao);
    formData.append('imagem', imagem);

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Enviando...';
    mensagem.innerHTML = '';

    try {
      const response = await fetch('/api/anuncios', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.anuncio && data.anuncio.id) {
        mensagem.innerHTML = `<div class="alert alert-success">Anúncio publicado com sucesso! Redirecionando...</div>`;
        form.reset();

        setTimeout(() => {
          // Redireciona para a página do anúncio criado
          window.location.href = `anuncio.html?id=${data.anuncio.id}`;
        }, 2000);
      } else {
        mensagem.innerHTML = `<div class="alert alert-danger">Erro: ${data.erro || 'Não foi possível publicar o anúncio.'}</div>`;
      }
    } catch (error) {
      console.error('Erro ao enviar o anúncio:', error);
      mensagem.innerHTML = `<div class="alert alert-danger">Erro ao enviar o anúncio. Necessário Login.</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Publicar Anúncio';
    }
  });
  // --- Descomplicar anúncio ---
const btnDescomplicar = document.getElementById('btn-descomplicar');
const modal = new bootstrap.Modal(document.getElementById('descomplicarModal'));
const btnConfirmar = document.getElementById('confirmar-descomplicar');
const inputEmail = document.getElementById('email-negociador');
const erroEmail = document.getElementById('erro-email');

// Abrir o modal ao clicar no botão Descomplicar
btnDescomplicar?.addEventListener('click', () => {
  inputEmail.value = '';
  erroEmail.classList.add('d-none');
  modal.show();
});

// Confirmar descomplicação após validação do e-mail
btnConfirmar?.addEventListener('click', async () => {
  const email = inputEmail.value.trim();
  const anuncioId = new URLSearchParams(window.location.search).get('id');

  if (!email) {
    erroEmail.textContent = 'Por favor, insira um e-mail.';
    erroEmail.classList.remove('d-none');
    return;
  }

  try {
    // Verifica se o e-mail está cadastrado
    const check = await fetch(`/api/verificarUsuario?email=${encodeURIComponent(email)}`);
    const checkResult = await check.json();

    if (!checkResult.existe) {
      erroEmail.textContent = 'E-mail não cadastrado no sistema.';
      erroEmail.classList.remove('d-none');
      return;
    }

    // Envia requisição para marcar como descomplicado
    const confirmacao = await fetch(`/api/descomplicar/${anuncioId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailComprador: email })
    });

    if (confirmacao.ok) {
      modal.hide();
      location.reload(); // Atualiza a página para refletir o estado "Descomplicado"
    } else {
      erroEmail.textContent = 'Erro ao descomplicar. Tente novamente.';
      erroEmail.classList.remove('d-none');
    }

  } catch (err) {
    console.error('Erro ao confirmar descomplicação:', err);
    erroEmail.textContent = 'Erro inesperado. Tente novamente.';
    erroEmail.classList.remove('d-none');
  }
});
});
