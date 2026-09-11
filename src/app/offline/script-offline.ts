// Script vanilla (não é bundle React) injetado inline via
// <script dangerouslySetInnerHTML> em page.tsx. Motivo: esta é a página que
// o service worker serve quando TUDO falhou (sem rede, sem cache pro que
// foi pedido) — se ela dependesse de um chunk JS próprio do Next
// (inevitável se fosse um componente cliente com hooks), esse chunk
// precisaria ter sido buscado em alguma visita anterior, o que não
// acontece pra uma rota que só existe pra esse cenário de fallback.
// Ficando só como HTML+script inline (parte do mesmo documento cacheado
// pelo service worker), não existe chunk extra pra faltar.
//
// Por ser string solta, duplica a leitura do IndexedDB de
// `src/lib/offline/banco-local.ts` e os rótulos/cores de status de
// `src/lib/rotulos.ts` — mantenha os dois em sincronia se o nome/versão do
// banco ou os status do poço mudarem.
export const SCRIPT_OFFLINE = `
(function () {
  function escaparHtml(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var CORES_STATUS = {
    planejado: 'background:#f3f4f6;color:#374151;',
    em_perfuracao: 'background:#fef3c7;color:#92400e;',
    concluido: 'background:#dcfce7;color:#166534;',
    cancelado: 'background:#fee2e2;color:#991b1b;'
  };
  var ROTULOS_STATUS = {
    planejado: 'Planejado',
    em_perfuracao: 'Em perfuração',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
  };

  function abrirBanco() {
    return new Promise(function (resolve, reject) {
      var pedido = indexedDB.open('pocos-offline', 1);
      pedido.onsuccess = function () { resolve(pedido.result); };
      pedido.onerror = function () { reject(pedido.error); };
    });
  }

  function buscarPoco(id) {
    return abrirBanco().then(function (banco) {
      return new Promise(function (resolve, reject) {
        if (!banco.objectStoreNames.contains('pocos')) { resolve(undefined); return; }
        var pedido = banco.transaction('pocos', 'readonly').objectStore('pocos').get(id);
        pedido.onsuccess = function () { resolve(pedido.result); };
        pedido.onerror = function () { reject(pedido.error); };
      });
    });
  }

  function listarPocos() {
    return abrirBanco().then(function (banco) {
      return new Promise(function (resolve, reject) {
        if (!banco.objectStoreNames.contains('pocos')) { resolve([]); return; }
        var pedido = banco.transaction('pocos', 'readonly').objectStore('pocos').getAll();
        pedido.onsuccess = function () { resolve(pedido.result || []); };
        pedido.onerror = function () { reject(pedido.error); };
      });
    });
  }

  function selo(status) {
    var cor = CORES_STATUS[status] || CORES_STATUS.planejado;
    var rotulo = ROTULOS_STATUS[status] || status;
    return '<span style="border-radius:9999px;padding:4px 12px;font-size:13px;font-weight:500;' + cor + '">' + escaparHtml(rotulo) + '</span>';
  }

  function avisoOffline() {
    return '<div style="margin-bottom:16px;background:#fef3c7;color:#78350f;padding:8px 12px;border-radius:6px;font-size:14px;">Visualização offline — dado salvo neste aparelho na última vez que a tela foi aberta com internet. Pode estar desatualizado, e não dá pra editar sem conexão.</div>';
  }

  function renderizarDetalhe(poco) {
    var html = avisoOffline();
    html += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">';
    html += '<h1 style="font-size:24px;font-weight:700;margin:0;">Poço ' + escaparHtml(poco.identificacao) + '</h1>';
    html += selo(poco.status);
    html += '</div>';
    html += '<p style="color:#6b7280;margin:4px 0;">' + escaparHtml(poco.obraNome) + ' — ' + escaparHtml(poco.clienteNome) + '</p>';
    html += '<p style="color:#6b7280;font-size:14px;margin-bottom:24px;">' +
      (poco.municipio ? escaparHtml(poco.municipio) + '/' + escaparHtml(poco.uf || '') : 'Locação não informada') +
      (poco.profundidadeFinalTexto ? ' · ' + escaparHtml(poco.profundidadeFinalTexto) + ' m' : '') +
      '</p>';

    if (poco.camadas && poco.camadas.length > 0) {
      html += '<h2 style="font-weight:600;margin-bottom:8px;">Perfil litológico</h2>';
      html += '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">';
      html += '<thead><tr>' +
        '<th style="border:1px solid #d1d5db;padding:4px 8px;text-align:left;">Prof. inicial (m)</th>' +
        '<th style="border:1px solid #d1d5db;padding:4px 8px;text-align:left;">Prof. final (m)</th>' +
        '<th style="border:1px solid #d1d5db;padding:4px 8px;text-align:left;">Descrição</th>' +
        '</tr></thead><tbody>';
      poco.camadas.forEach(function (camada) {
        html += '<tr>' +
          '<td style="border:1px solid #d1d5db;padding:4px 8px;">' + Number(camada.profundidadeInicial).toFixed(2) + '</td>' +
          '<td style="border:1px solid #d1d5db;padding:4px 8px;">' + Number(camada.profundidadeFinal).toFixed(2) + '</td>' +
          '<td style="border:1px solid #d1d5db;padding:4px 8px;">' + escaparHtml(camada.descricao) + '</td>' +
          '</tr>';
      });
      html += '</tbody></table>';
    }

    html += '<a href="/pocos" style="color:#2563eb;text-decoration:underline;">Voltar para a lista de poços</a>';
    document.getElementById('conteudo-offline').innerHTML = html;
  }

  function renderizarLista(pocos) {
    var html = avisoOffline();
    html += '<h1 style="font-size:24px;font-weight:700;margin-bottom:16px;">Poços</h1>';

    if (pocos.length === 0) {
      html += '<p style="text-align:center;color:#6b7280;margin-top:32px;">Nenhum poço foi aberto com internet neste aparelho ainda.</p>';
    } else {
      pocos.sort(function (a, b) { return a.identificacao.localeCompare(b.identificacao); });
      pocos.forEach(function (poco) {
        html += '<a href="/pocos/' + encodeURIComponent(poco.id) + '" style="display:block;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-decoration:none;color:inherit;margin-bottom:12px;">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">' +
          '<span style="font-size:18px;font-weight:600;">' + escaparHtml(poco.identificacao) + '</span>' +
          selo(poco.status) +
          '</div>' +
          '<p style="margin:4px 0 0;color:#4b5563;">' + escaparHtml(poco.obraNome) + ' — ' + escaparHtml(poco.clienteNome) + '</p>' +
          '</a>';
      });
    }

    document.getElementById('conteudo-offline').innerHTML = html;
  }

  function principal() {
    var partes = window.location.pathname.split('/').filter(Boolean);

    if (partes.length === 2 && partes[0] === 'pocos' && partes[1] !== 'novo') {
      buscarPoco(partes[1]).then(function (poco) {
        if (poco) renderizarDetalhe(poco);
      }).catch(function () {});
      return;
    }

    if (window.location.pathname === '/pocos') {
      listarPocos().then(renderizarLista).catch(function () {});
    }
  }

  if ('indexedDB' in window) principal();
})();
`;
