// Estado da aplicação
let appState = {
  anuncios: [],
  usuarios: [],
  pagamentos: [],
  currentPage: 'dashboard'
};

// Carrega dados do localStorage
function loadData() {
  const stored = localStorage.getItem('automobi_data');
  if (stored) {
    appState = JSON.parse(stored);
  }
}

// Salva dados no localStorage
function saveData() {
  localStorage.setItem('automobi_data', JSON.stringify(appState));
}

// Navegar entre páginas
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const page = link.dataset.page;
    
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(page).classList.add('active');
    
    appState.currentPage = page;
    
    if (page === 'anuncios') renderAnunciosAdmin();
    if (page === 'usuarios') renderUsuarios();
    if (page === 'pagamentos') renderPagamentos();
  });
});

// Atualizar Dashboard
function updateDashboard() {
  const totalAnuncios = appState.anuncios.filter(a => a.status === 'publicado').length;
  const anunciosPendentes = appState.anuncios.filter(a => a.status === 'pendente').length;
  const receitaTotal = appState.pagamentos
    .filter(p => p.status === 'confirmado')
    .reduce((sum, p) => sum + 9.99, 0);
  const usuariosAtivos = new Set(appState.anuncios.map(a => a.userId)).size;
  
  document.getElementById('total-anuncios').textContent = totalAnuncios;
  document.getElementById('anuncios-pendentes').textContent = anunciosPendentes;
  document.getElementById('receita-total').textContent = 'R$ ' + receitaTotal.toFixed(2);
  document.getElementById('usuarios-ativos').textContent = usuariosAtivos;
  
  renderAnunciosPendentes();
}

// Renderizar anúncios pendentes no dashboard
function renderAnunciosPendentes() {
  const container = document.getElementById('anuncios-pendentes-list');
  const pendentes = appState.anuncios.filter(a => a.status === 'pendente');
  
  if (pendentes.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhum anúncio pendente</p>';
    return;
  }
  
  container.innerHTML = pendentes.map(anuncio => `
    <div class="anuncio-item">
      <img src="${anuncio.imagens[0] || 'placeholder.jpg'}" alt="${anuncio.veiculo}" class="anuncio-image">
      <div class="anuncio-info">
        <h4>${anuncio.veiculo} - ${anuncio.ano}</h4>
        <p><strong>Vendedor:</strong> ${anuncio.nomeCompleto}</p>
        <p><strong>WhatsApp:</strong> ${anuncio.whatsapp}</p>
        <p><strong>Valor:</strong> R$ ${anuncio.valor.toFixed(2)}</p>
        <span class="anuncio-status status-pendente">Aguardando Pagamento</span>
      </div>
      <div class="anuncio-actions">
        <button class="btn-small btn-view" onclick="abrirModalPagamento('${anuncio.id}')">Verificar PIX</button>
      </div>
    </div>
  `).join('');
}

// Renderizar anúncios na página de admin
function renderAnunciosAdmin() {
  const container = document.getElementById('anuncios-admin-list');
  
  if (appState.anuncios.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhum anúncio cadastrado</p>';
    return;
  }
  
  container.innerHTML = appState.anuncios.map(anuncio => `
    <div class="anuncio-item">
      <img src="${anuncio.imagens[0] || 'placeholder.jpg'}" alt="${anuncio.veiculo}" class="anuncio-image">
      <div class="anuncio-info">
        <h4>${anuncio.veiculo} - ${anuncio.ano}</h4>
        <p><strong>Vendedor:</strong> ${anuncio.nomeCompleto}</p>
        <p><strong>Localização:</strong> ${anuncio.cidade}, ${anuncio.estado}</p>
        <p><strong>Valor:</strong> R$ ${anuncio.valor.toFixed(2)}</p>
        <span class="anuncio-status status-${anuncio.status}">${anuncio.status.toUpperCase()}</span>
      </div>
      <div class="anuncio-actions">
        ${anuncio.status === 'pendente' ? `
          <button class="btn-small btn-approve" onclick="aprovarAnuncio('${anuncio.id}')">Aprovar</button>
          <button class="btn-small btn-reject" onclick="rejeitarAnuncio('${anuncio.id}')">Rejeitar</button>
        ` : ''}
        <button class="btn-small btn-view" onclick="verDetalhesAnuncio('${anuncio.id}')">Ver Detalhes</button>
      </div>
    </div>
  `).join('');
}

// Renderizar usuários
function renderUsuarios() {
  const container = document.getElementById('usuarios-list');
  
  if (appState.usuarios.length === 0) {
    container.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhum usuário</td></tr>';
    return;
  }
  
  container.innerHTML = appState.usuarios.map(usuario => {
    const anunciosUsuario = appState.anuncios.filter(a => a.userId === usuario.id);
    return `
      <tr>
        <td>${usuario.nomeCompleto}</td>
        <td>${usuario.whatsapp}</td>
        <td>${anunciosUsuario.length}</td>
        <td><span class="anuncio-status status-publicado">Ativo</span></td>
        <td>
          <button class="btn-small btn-view" onclick="alert('Detalhes do usuário: ${usuario.nomeCompleto}')">Ver Perfil</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Renderizar pagamentos
function renderPagamentos() {
  const container = document.getElementById('pagamentos-list');
  
  if (appState.pagamentos.length === 0) {
    container.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhum pagamento</td></tr>';
    return;
  }
  
  container.innerHTML = appState.pagamentos.map(pagamento => `
    <tr>
      <td>${pagamento.pixId}</td>
      <td>${pagamento.nomeVendedor}</td>
      <td>R$ ${pagamento.valor.toFixed(2)}</td>
      <td><span class="anuncio-status status-${pagamento.status}">${pagamento.status.toUpperCase()}</span></td>
      <td>${new Date(pagamento.data).toLocaleDateString('pt-BR')}</td>
      <td>
        ${pagamento.status === 'pendente' ? `
          <button class="btn-small btn-approve" onclick="confirmarPagamentoAdmin('${pagamento.id}')">Confirmar</button>
        ` : ''}
      </td>
    </tr>
  `).join('');
}

// Abrir modal de pagamento
function abrirModalPagamento(anuncioId) {
  const anuncio = appState.anuncios.find(a => a.id === anuncioId);
  if (!anuncio) return;
  
  const pagamento = appState.pagamentos.find(p => p.anuncioId === anuncioId);
  if (!pagamento) return;
  
  document.getElementById('modal-vendedor').textContent = anuncio.nomeCompleto;
  document.getElementById('modal-valor').textContent = '9.99';
  document.getElementById('modal-pix-id').textContent = pagamento.pixId;
  
  // Gerar QR Code
  const qrcodeContainer = document.getElementById('modal-qrcode');
  qrcodeContainer.innerHTML = '';
  
  // Aqui você geraria um QR Code real da transação PIX
  // Por enquanto, vamos criar um QR Code simulado
  const qr = new QRCode(qrcodeContainer, {
    text: `PIX:${pagamento.pixId}|VAL:9.99|VEND:${anuncio.nomeCompleto}`,
    width: 200,
    height: 200,
  });
  
  // Armazenar ID do pagamento atual para confirmar depois
  window.currentPagamentoId = pagamento.id;
  
  document.getElementById('modal-confirmar-pagamento').classList.add('active');
}

// Confirmar pagamento
function confirmarPagamento() {
  const pagamentoId = window.currentPagamentoId;
  const pagamento = appState.pagamentos.find(p => p.id === pagamentoId);
  
  if (pagamento) {
    pagamento.status = 'confirmado';
    
    // Publicar anúncio automaticamente
    const anuncio = appState.anuncios.find(a => a.id === pagamento.anuncioId);
    if (anuncio) {
      anuncio.status = 'publicado';
    }
    
    saveData();
    closeModal();
    updateDashboard();
    alert('Pagamento confirmado! Anúncio publicado com sucesso!');
  }
}

// Confirmar pagamento via admin
function confirmarPagamentoAdmin(pagamentoId) {
  const pagamento = appState.pagamentos.find(p => p.id === pagamentoId);
  
  if (pagamento) {
    pagamento.status = 'confirmado';
    
    const anuncio = appState.anuncios.find(a => a.id === pagamento.anuncioId);
    if (anuncio) {
      anuncio.status = 'publicado';
    }
    
    saveData();
    renderPagamentos();
    updateDashboard();
    alert('Pagamento confirmado! Anúncio publicado.');
  }
}

// Aprovar anúncio
function aprovarAnuncio(anuncioId) {
  const anuncio = appState.anuncios.find(a => a.id === anuncioId);
  if (anuncio) {
    anuncio.status = 'aprovado';
    saveData();
    renderAnunciosAdmin();
    updateDashboard();
  }
}

// Rejeitar anúncio
function rejeitarAnuncio(anuncioId) {
  const anuncio = appState.anuncios.find(a => a.id === anuncioId);
  if (anuncio) {
    anuncio.status = 'rejeitado';
    saveData();
    renderAnunciosAdmin();
    updateDashboard();
  }
}

// Ver detalhes do anúncio
function verDetalhesAnuncio(anuncioId) {
  const anuncio = appState.anuncios.find(a => a.id === anuncioId);
  if (anuncio) {
    const detalhes = `
Anúncio: ${anuncio.veiculo}
Ano: ${anuncio.ano}
Vendedor: ${anuncio.nomeCompleto}
WhatsApp: ${anuncio.whatsapp}
Cidade: ${anuncio.cidade}, ${anuncio.estado}
Valor: R$ ${anuncio.valor}
Status: ${anuncio.status}
Imagens: ${anuncio.imagens.length}
Vídeo: ${anuncio.video || 'Não enviado'}
    `;
    alert(detalhes);
  }
}

// Fechar modal
function closeModal() {
  document.getElementById('modal-confirmar-pagamento').classList.remove('active');
}

// Logout
document.querySelector('.logout-btn').addEventListener('click', () => {
  if (confirm('Tem certeza que deseja sair?')) {
    window.location.href = '../';
  }
});

// Fechar modal ao clicar no X
document.querySelector('.modal-close').addEventListener('click', closeModal);

// Inicializar
loadData();
updateDashboard();