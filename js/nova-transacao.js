// nova-transacao.js

const form = document.getElementById('form-transacao');
const descricaoInput = document.getElementById('descricao');
const valorInput = document.getElementById('valor');
const dataInput = document.getElementById('data');
const categoriaSelect = document.getElementById('categoria');
const novaCategoriaInput = document.getElementById('nova-categoria');
const btnAdicionarCategoria = document.getElementById('btn-adicionar-categoria');
const controleBotoesEl = document.getElementById('controle-botoes');

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
if (btnAdicionarCategoria) {
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
}

// Preencher formulário para edição
function carregarTransacaoEdicao() {
  if (transacaoEdicao) {
    descricaoInput.value = transacaoEdicao.descricao || '';
    valorInput.value = transacaoEdicao.valor || '';
    dataInput.value = transacaoEdicao.data || '';
    categoriaSelect.value = transacaoEdicao.categoria || '';
  }
}

// Criar botão de modo escuro
function aplicarModoEscuro() {
  const modoSalvo = localStorage.getItem('modo-escuro');
  if (modoSalvo === 'true') {
    document.body.classList.add('dark-mode');
  }

  if (controleBotoesEl) {
    const btnDark = document.createElement('button');
    btnDark.id = 'toggle-dark-mode';
    btnDark.className = 'botao';
    btnDark.textContent = document.body.classList.contains('dark-mode') ? 'Modo Claro ☀️' : 'Modo Escuro 🌙';

    btnDark.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem('modo-escuro', isDark);
      btnDark.textContent = isDark ? 'Modo Claro ☀️' : 'Modo Escuro 🌙';
    });

    controleBotoesEl.appendChild(btnDark);
  }
}

// Salvar nova transação ou edição
if (form) {
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
      transacoes[transacaoEdicao.index] = { descricao, valor, data, categoria };
      localStorage.removeItem('transacao-edicao');
    } else {
      transacoes.push({ descricao, valor, data, categoria });
    }

    localStorage.setItem('transacoes', JSON.stringify(transacoes));
    window.location.href = 'index.html';
  });
}

// Inicialização
function init() {
  popularCategorias();
  carregarTransacaoEdicao();
  aplicarModoEscuro();
  configurarCalculadora();
}

init();

// ====================== CALCULADORA ======================

function configurarCalculadora() {
  const btnCalculadora = document.getElementById('btn-calculadora');
  const modalCalculadora = document.getElementById('modal-calculadora');
  const calcDisplay = document.getElementById('calc-display');
  const btnLimpar = document.getElementById('btn-limpar');
  const btnFechar = document.getElementById('btn-fechar');
  const btnIgual = document.getElementById('btn-igual');
  const botoesCalc = modalCalculadora?.querySelectorAll('.calc-botoes button[data-val]');

  if (!btnCalculadora || !modalCalculadora || !calcDisplay || !btnLimpar || !btnFechar || !btnIgual || !botoesCalc) return;

  let expressao = '';

  // Abrir modal
  btnCalculadora.addEventListener('click', () => {
    modalCalculadora.classList.remove('hidden');
    expressao = '';
    calcDisplay.value = '';
    calcDisplay.focus();
  });

  // Fechar modal
  btnFechar.addEventListener('click', () => {
    modalCalculadora.classList.add('hidden');
  });

  // Limpar
  btnLimpar.addEventListener('click', () => {
    expressao = '';
    calcDisplay.value = '';
  });

  // Digitar valores
  botoesCalc.forEach(btn => {
    btn.addEventListener('click', () => {
      expressao += btn.dataset.val;
      calcDisplay.value = expressao;
    });
  });

  // Calcular
  btnIgual.addEventListener('click', () => {
    try {
      if (/^[0-9+\-*/.() ]+$/.test(expressao)) {
        let resultado = eval(expressao);
        if (typeof resultado === 'number' && !isNaN(resultado)) {
          resultado = Math.round((resultado + Number.EPSILON) * 100) / 100;
          calcDisplay.value = resultado;
          expressao = resultado.toString();
        } else {
          calcDisplay.value = 'Erro';
          expressao = '';
        }
      } else {
        calcDisplay.value = 'Erro';
        expressao = '';
      }
    } catch {
      calcDisplay.value = 'Erro';
      expressao = '';
    }
  });

  // Inserir no input de valor ao pressionar Enter
  calcDisplay.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      inserirResultadoNoInput(calcDisplay.value);
      modalCalculadora.classList.add('hidden');
    }
  });

  // Inserir ao dar duplo clique no botão igual
  btnIgual.addEventListener('dblclick', () => {
    inserirResultadoNoInput(calcDisplay.value);
    modalCalculadora.classList.add('hidden');
  });

  function inserirResultadoNoInput(valor) {
    const val = parseFloat(valor);
    if (!isNaN(val)) {
      valorInput.value = val;
    }
  }
}
