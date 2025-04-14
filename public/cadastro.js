document.getElementById('formCadastro').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  // Envia os dados do formulário para o backend
  const response = await fetch('/api/cadastrar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha })
  });

  const data = await response.json();

  if (response.ok) {  // Verifica se a resposta foi bem-sucedida
    alert('Usuário cadastrado com sucesso!');
    // Após o cadastro, redireciona para a página de login
    window.location.href = "/login.html"; // Ou onde for necessário
  } else {
    // Se houver erro, exibe a mensagem de erro
    alert(`Erro: ${data.erro || 'Erro desconhecido. Tente novamente.'}`);
  }
});
