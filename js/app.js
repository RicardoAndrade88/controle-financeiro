// app.js

// Seleções DOM
const entradasEl = document.getElementById('entradas');
const saidasEl = document.getElementById('saidas');
const saldoEl = document.getElementById('saldo');
const listaTransacoesEl = document.getElementById('lista-transacoes');
const filtroCategoriaEl = document.getElementById('filtro-categoria');
const controleBotoesEl = document.getElementById('controle-botoes');
const graficoCanvas = document.getElementById('graficoTransacoes');
const graficoCtx = graficoCanvas ? graficoCanvas.getContext('2d') : null;
const graficoCategoriasCtx = document.getElementById('graficoCategorias').getContext('2d');

let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
let categorias = JSON.parse(localStorage.getItem('categorias')) || [];

// Inicializa categorias padrão se estiver vazio
if (categorias.length === 0) {
  categorias = ['Salário', 'Alimentação', 'Transporte', 'Lazer', 'Outros'];
  localStorage.setItem('categorias', JSON.stringify(categorias));
}

// Cria e insere os botões no header
function criarBotoes() {
  const btnDark = document.createElement('button');
  btnDark.id = 'toggle-dark-mode';
  btnDark.className = 'botao';

  // Aplica modo escuro salvo
  const modoSalvo = localStorage.getItem('modo-escuro');
  if (modoSalvo === 'true') {
    document.body.classList.add('dark-mode');
    btnDark.textContent = 'Modo Claro ☀️';
  } else {
    btnDark.textContent = 'Modo Escuro 🌙';
  }

  btnDark.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('modo-escuro', isDark);
    btnDark.textContent = isDark ? 'Modo Claro ☀️' : 'Modo Escuro 🌙';
  });

  const btnExportar = document.createElement('button');
  btnExportar.id = 'btn-exportar-csv';
  btnExportar.className = 'botao';
  btnExportar.textContent = 'Exportar CSV';

  btnExportar.addEventListener('click', exportarCSV);

  controleBotoesEl.prepend(btnDark);
  controleBotoesEl.appendChild(btnExportar);
}

// Atualiza resumo financeiro
function atualizarResumo() {
  const entradas = transacoes
    .filter(t => t.valor > 0)
    .reduce((acc, t) => acc + t.valor, 0);

  const saidas = transacoes
    .filter(t => t.valor < 0)
    .reduce((acc, t) => acc + t.valor, 0);

  const saldo = entradas + saidas;

  entradasEl.textContent = entradas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  saidasEl.textContent = saidas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  saldoEl.textContent = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Preenche filtro categorias
function popularFiltroCategorias() {
  filtroCategoriaEl.innerHTML = '<option value="">Todas</option>';
  categorias.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    filtroCategoriaEl.appendChild(option);
  });
}

// Renderiza lista de transações com filtro
function renderizarTransacoes() {
  const filtro = filtroCategoriaEl.value;
  listaTransacoesEl.innerHTML = '';

  const transFiltradas = filtro ? transacoes.filter(t => t.categoria === filtro) : transacoes;

  if (transFiltradas.length === 0) {
    listaTransacoesEl.innerHTML = '<li style="text-align:center; color:#999;">Nenhuma transação encontrada.</li>';
    return;
  }

  transFiltradas.forEach((t, i) => {
    const li = document.createElement('li');
    li.classList.add(t.valor > 0 ? 'entrada' : 'saida');

    const dataFormatada = new Date(t.data).toLocaleDateString('pt-BR');

    li.innerHTML = `
      <div style="flex:2;">${t.descricao}</div>
      <div style="flex:1; text-align:center;">${dataFormatada}</div>
      <div style="flex:1; text-align:center;">${t.categoria}</div>
      <div style="flex:1; text-align:right; font-weight:bold;">${t.valor.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}</div>
      <div style="flex:0 0 auto; display:flex; gap:8px;">
        <button class="edit botao" data-index="${i}">Editar</button>
        <button class="delete botao" data-index="${i}">Excluir</button>
      </div>
    `;

    listaTransacoesEl.appendChild(li);
  });
}

// Excluir transação
function excluirTransacao(index) {
  if (confirm('Deseja realmente excluir esta transação?')) {
    transacoes.splice(index, 1);
    salvarEAtualizar();
  }
}

// Editar transação
function editarTransacao(index) {
  localStorage.setItem('transacao-edicao', JSON.stringify({ ...transacoes[index], index }));
  window.location.href = 'nova-transacao.html';
}

// Salvar no localStorage e atualizar tela
function salvarEAtualizar() {
  localStorage.setItem('transacoes', JSON.stringify(transacoes));
  atualizarResumo();
  renderizarTransacoes();
  atualizarGrafico();
}

// Exportar CSV
function exportarCSV() {
  if (transacoes.length === 0) {
    alert('Não há transações para exportar.');
    return;
  }

  let csv = 'Descrição,Valor,Data,Categoria\n';
  transacoes.forEach(t => {
    csv += `"${t.descricao}",${t.valor},"${t.data}","${t.categoria}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transacoes.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Configurar eventos
function configurarEventos() {
  filtroCategoriaEl.addEventListener('change', renderizarTransacoes);

  listaTransacoesEl.addEventListener('click', e => {
    if (e.target.classList.contains('delete')) {
      excluirTransacao(Number(e.target.dataset.index));
    } else if (e.target.classList.contains('edit')) {
      editarTransacao(Number(e.target.dataset.index));
    }
  });
}

// Gráfico Entradas/Saídas
let chart;

function atualizarGrafico() {
  if (!graficoCtx) return;

  const totalEntradas = transacoes.filter(t => t.valor > 0).reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = Math.abs(transacoes.filter(t => t.valor < 0).reduce((acc, t) => acc + t.valor, 0));

  if (totalEntradas === 0 && totalSaidas === 0) {
    if (chart) chart.destroy();
    return;
  }

  chart = new Chart(graficoCtx, {
    type: 'doughnut',
    data: {
      labels: ['Entradas', 'Saídas'],
      datasets: [{
        data: [totalEntradas, totalSaidas],
        backgroundColor: ['#27ae60', '#e74c3c'],
        hoverOffset: 30,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: ctx => ctx.label + ': ' + ctx.parsed.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          }
        }
      }
    }
  });
}

// Gráfico por categoria
let chartCategorias;

function atualizarGraficoCategorias() {
  const somaPorCategoria = {};
  transacoes.forEach(t => {
    if (!somaPorCategoria[t.categoria]) {
      somaPorCategoria[t.categoria] = 0;
    }
    somaPorCategoria[t.categoria] += t.valor;
  });

  const labels = Object.keys(somaPorCategoria);
  const data = labels.map(cat => Math.abs(somaPorCategoria[cat]));

  const cores = [
    '#3498db', '#9b59b6', '#e67e22', '#1abc9c', '#f39c12',
    '#e74c3c', '#2ecc71', '#34495e', '#d35400', '#7f8c8d'
  ];

  if (chartCategorias) chartCategorias.destroy();

  chartCategorias = new Chart(graficoCategoriasCtx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Total por Categoria (R$)',
        data,
        backgroundColor: cores.slice(0, labels.length),
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ctx.parsed.y.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          }
        }
      }
    }
  });
}

// Inicializar
function init() {
  criarBotoes();
  popularFiltroCategorias();
  atualizarResumo();
  renderizarTransacoes();
  configurarEventos();
  atualizarGrafico();
  atualizarGraficoCategorias();
}

init();
