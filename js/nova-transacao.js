// nova-transacao.js

const form = document.getElementById('form-transacao');
const descricaoInput = document.getElementById('descricao');
const valorInput = document.getElementById('valor');
const dataInput = document.getElementById('data');
const categoriaSelect = document.getElementById('categoria');
const novaCategoriaInput = document.getElementById('nova-categoria');
const btnAdicionarCategoria = document.getElementById('btn-adicionar-categoria');

let categorias = JSON.parse(localStorage.getItem('categorias')) || [];
let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];

let transacaoEdicao = JSON.parse(localStorage.getItem('transacao-edicao'));

// Preencher select categorias
function popularCategorias() {
  categoriaSelect.innerHTML = '<option value="">Selecione...</option>';
  categorias.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoriaSelect.appendChild(option);
  });
}

// Adicionar nova categoria
btnAdicionarCategoria.addEventListener('click', () => {
  const novaCat = novaCategoriaInput.value.trim();
  if (!novaCat) {
    alert('Digite uma nova categoria válida.');
    return;
  }
  if (categorias.includes(novaCat)) {
    alert('Categoria já existe.');
    return;
  }
  categorias.push(novaCat);
  localStorage.setItem('categorias', JSON.stringify(categorias));
  popularCategorias();
  categoriaSelect.value = novaCat;
  novaCategoriaInput.value = '';
});

// Preencher formulário para edição
function carregarTransacaoEdicao() {
  if (transacaoEdicao) {
    descricaoInput.value = transacaoEdicao.descricao || '';
    valorInput.value = transacaoEdicao.valor || '';
    dataInput.value = transacaoEdicao.data || '';
    categoriaSelect.value = transacaoEdicao.categoria || '';
  }
}

// Salvar nova transação ou edição
form.addEventListener('submit', e => {
  e.preventDefault();

  const descricao = descricaoInput.value.trim();
  const valor = parseFloat(valorInput.value);
  const data = dataInput.value;
  const categoria = categoriaSelect.value;

  if (!descricao || isNaN(valor) || !data || !categoria) {
    alert('Preencha todos os campos corretamente.');
    return;
  }

  if (transacaoEdicao && transacaoEdicao.index !== undefined) {
    // Editar
    transacoes[transacaoEdicao.index] = { descricao, valor, data, categoria };
    localStorage.removeItem('transacao-edicao');
  } else {
    // Nova transação
    transacoes.push({ descricao, valor, data, categoria });
  }

  localStorage.setItem('transacoes', JSON.stringify(transacoes));
  window.location.href = 'index.html';
});

// Inicialização
function init() {
  popularCategorias();
  carregarTransacaoEdicao();
}

init();
