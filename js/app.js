// app.js

// Seleções DOM
const entradasEl = document.getElementById('entradas');
const saidasEl = document.getElementById('saidas');
const saldoEl = document.getElementById('saldo');
const listaTransacoesEl = document.getElementById('lista-transacoes');
const filtroCategoriaEl = document.getElementById('filtro-categoria');
const controleBotoesEl = document.getElementById('controle-botoes');
const graficoCtx = document.getElementById('graficoTransacoes').getContext('2d');

let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
let categorias = JSON.parse(localStorage.getItem('categorias')) || [];

// Inicializa categorias padrão se estiver vazio
if (categorias.length === 0) {
  categorias = ['Salário', 'Alimentação', 'Transporte', 'Lazer', 'Outros'];
  localStorage.setItem('categorias', JSON.stringify(categorias));
}

// Cria e insere os botões no header
function criarBotoes() {
  // Botão Modo Escuro
  const btnDark = document.createElement('button');
  btnDark.id = 'toggle-dark-mode';
  btnDark.className = 'botao';
  btnDark.textContent = 'Modo Escuro';

  btnDark.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    btnDark.textContent = document.body.classList.contains('dark-mode') ? 'Modo Claro' : 'Modo Escuro';
  });

  // Botão Exportar CSV
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
  // Limpa opções (menos "Todas")
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

    // Data formatada
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

// Editar transação (redirecionar para nova-transacao com dados preenchidos)
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

// Gráfico Chart.js
let chart;

function atualizarGrafico() {
  const totalEntradas = transacoes.filter(t => t.valor > 0).reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = Math.abs(transacoes.filter(t => t.valor < 0).reduce((acc, t) => acc + t.valor, 0));

  if (chart) chart.destroy();

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

// Inicializar
function init() {
  criarBotoes();
  popularFiltroCategorias();
  atualizarResumo();
  renderizarTransacoes();
  configurarEventos();
  atualizarGrafico();
}

init();
