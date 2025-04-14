document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email-login').value;
  const senha = document.getElementById('password-login').value;

  try {
    // Corrige a URL para garantir que o caminho está certo
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    // Verifica se a resposta foi bem-sucedida antes de tentar acessar o JSON
    if (!response.ok) {
      const errorData = await response.json();
      alert(`Erro: ${errorData.erro || 'Erro desconhecido'}`);
      return;  // Para a execução se ocorrer um erro
    }

    const data = await response.json();  // Obtém a resposta JSON

    console.log('Resposta do login:', data); // Verifica a resposta da API

    // Armazenar o nome do usuário na sessão
    sessionStorage.setItem('userEmail', data.user.email);
    sessionStorage.setItem('userName', data.user.nome);

    alert('Login realizado com sucesso!');

    // Atualiza a interface de usuário para mostrar o nome do usuário logado
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = `Bem-vindo, ${data.user.nome}!`;  // Exibe o nome do usuário
      userNameElement.style.display = 'inline';
    }

    // Redireciona para a página inicial após o login
    window.location.href = "/index.html";
  } catch (error) {
    console.error('Erro ao tentar fazer login:', error);
    alert('Erro ao se conectar com o servidor.');
  }
});

