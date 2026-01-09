// Tabela de estágios do TAF
const ESTAGIOS = [
    { estagio: 1,  velocidade: 8.5,  tempoBip: 9.00, trajetos: 7  },
    { estagio: 2,  velocidade: 9.0,  tempoBip: 8.00, trajetos: 8  },
    { estagio: 3,  velocidade: 9.5,  tempoBip: 7.57, trajetos: 8  },
    { estagio: 4,  velocidade: 10.0, tempoBip: 7.20, trajetos: 8  },
    { estagio: 5,  velocidade: 10.5, tempoBip: 6.85, trajetos: 9  },
    { estagio: 6,  velocidade: 11.0, tempoBip: 6.54, trajetos: 9  },
    { estagio: 7,  velocidade: 11.5, tempoBip: 6.26, trajetos: 10 },
    { estagio: 8,  velocidade: 12.0, tempoBip: 6.00, trajetos: 10 },
    { estagio: 9,  velocidade: 12.5, tempoBip: 5.70, trajetos: 10 },
    { estagio: 10, velocidade: 13.0, tempoBip: 5.33, trajetos: 11 },
    { estagio: 11, velocidade: 13.5, tempoBip: 5.14, trajetos: 11 },
    { estagio: 12, velocidade: 14.0, tempoBip: 4.96, trajetos: 12 }
];

// Configuração por sexo
const CONFIG = {
    masculino: { estagioMax: 8 },
    feminino: { estagioMax: 7 }
};

// Estado do app
let estado = {
    sexo: null,
    estagioAtual: 0,
    bipAtual: 0,
    tempoInicio: null,
    tempoDecorrido: 0,
    pausado: false,
    executando: false,
    intervaloBip: null,
    intervaloTempo: null,
    wakeLock: null
};

// Elementos do DOM
const elementos = {
    telaSelecao: document.getElementById('tela-selecao'),
    telaTeste: document.getElementById('tela-teste'),
    telaContagem: document.getElementById('tela-contagem'),
    telaFinalizado: document.getElementById('tela-finalizado'),
    estagioAtual: document.getElementById('estagio-atual'),
    bipAtual: document.getElementById('bip-atual'),
    bipTotal: document.getElementById('bip-total'),
    tempo: document.getElementById('tempo'),
    velocidade: document.getElementById('velocidade'),
    numeroContagem: document.getElementById('numero-contagem'),
    controlesAguardando: document.getElementById('controles-aguardando'),
    controlesExecutando: document.getElementById('controles-executando'),
    btnPausar: document.getElementById('btn-pausar'),
    resultadoEstagio: document.getElementById('resultado-estagio'),
    resultadoBip: document.getElementById('resultado-bip'),
    resultadoTempo: document.getElementById('resultado-tempo'),
    telaTabela: document.getElementById('tela-tabela'),
    tabelaCorpo: document.getElementById('tabela-corpo'),
    tabelaSubtitulo: document.getElementById('tabela-subtitulo')
};

// Contexto de áudio
let audioContext = null;
let audioDesbloqueado = false;

// Inicializar áudio
function inicializarAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Desbloquear áudio no iOS (precisa ser chamado em resposta a toque do usuário)
function desbloquearAudio() {
    if (audioDesbloqueado) return;

    inicializarAudio();

    // Toca um som silencioso para desbloquear
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Volume zero (silencioso)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);

    audioDesbloqueado = true;
    console.log('Áudio desbloqueado!');
}

// Desbloquear áudio no primeiro toque em qualquer lugar
document.addEventListener('touchstart', desbloquearAudio, { once: true });
document.addEventListener('click', desbloquearAudio, { once: true });

// Tocar bip da contagem regressiva (som original)
function tocarBipContagem() {
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

// Tocar bip normal (som de buzina)
function tocarBip() {
    if (!audioContext) return;

    const currentTime = audioContext.currentTime;

    // Oscilador principal - onda quadrada para som de buzina
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(380, currentTime);

    // Segundo oscilador para dar corpo ao som
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(382, currentTime);

    // Envelope de volume para buzina
    gain1.gain.setValueAtTime(0.3, currentTime);
    gain1.gain.setValueAtTime(0.3, currentTime + 0.4);
    gain1.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);

    gain2.gain.setValueAtTime(0.15, currentTime);
    gain2.gain.setValueAtTime(0.15, currentTime + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);

    osc1.start(currentTime);
    osc1.stop(currentTime + 0.5);
    osc2.start(currentTime);
    osc2.stop(currentTime + 0.5);
}

// Tocar bip de mudança de estágio (diferente)
function tocarBipEstagio() {
    if (!audioContext) return;

    // Primeiro bip (mais grave)
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    osc1.frequency.value = 600;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.5, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    osc1.start(audioContext.currentTime);
    osc1.stop(audioContext.currentTime + 0.15);

    // Segundo bip (mais agudo)
    const osc2 = audioContext.createOscillator();
    const gain2 = audioContext.createGain();
    osc2.connect(gain2);
    gain2.connect(audioContext.destination);
    osc2.frequency.value = 1000;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.5, audioContext.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
    osc2.start(audioContext.currentTime + 0.15);
    osc2.stop(audioContext.currentTime + 0.35);
}

// Falar volta atual usando síntese de voz
function falarVolta(volta) {
    if ('speechSynthesis' in window) {
        // Cancelar fala anterior se ainda estiver falando
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(`volta ${volta}`);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.2;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        speechSynthesis.speak(utterance);
    }
}

// Vibrar
function vibrar(duracao = 100) {
    if ('vibrate' in navigator) {
        navigator.vibrate(duracao);
    }
}

// Vibrar mudança de estágio
function vibrarEstagio() {
    if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
    }
}

// Manter tela ligada
async function manterTelaLigada() {
    if ('wakeLock' in navigator) {
        try {
            estado.wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.log('Wake Lock não disponível:', err);
        }
    }
}

// Liberar tela
function liberarTela() {
    if (estado.wakeLock) {
        estado.wakeLock.release();
        estado.wakeLock = null;
    }
}

// Trocar tela
function mostrarTela(tela) {
    elementos.telaSelecao.classList.remove('ativa');
    elementos.telaTeste.classList.remove('ativa');
    elementos.telaContagem.classList.remove('ativa');
    elementos.telaFinalizado.classList.remove('ativa');
    elementos.telaTabela.classList.remove('ativa');
    tela.classList.add('ativa');
}

// Formatar tempo
function formatarTempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
}

// Selecionar teste
function selecionarTeste(sexo) {
    inicializarAudio();
    estado.sexo = sexo;
    resetarEstado();
    atualizarDisplay();
    mostrarTela(elementos.telaTeste);
    elementos.controlesAguardando.classList.remove('escondido');
    elementos.controlesExecutando.classList.add('escondido');
}

// Resetar estado
function resetarEstado() {
    estado.estagioAtual = 0;
    estado.bipAtual = 0;
    estado.tempoInicio = null;
    estado.tempoDecorrido = 0;
    estado.pausado = false;
    estado.executando = false;

    if (estado.intervaloBip) {
        clearTimeout(estado.intervaloBip);
        estado.intervaloBip = null;
    }
    if (estado.intervaloTempo) {
        clearInterval(estado.intervaloTempo);
        estado.intervaloTempo = null;
    }
}

// Atualizar display
function atualizarDisplay() {
    const estagioInfo = ESTAGIOS[estado.estagioAtual];

    elementos.estagioAtual.textContent = estagioInfo.estagio;
    elementos.bipAtual.textContent = estado.bipAtual;
    elementos.bipTotal.textContent = estagioInfo.trajetos;
    elementos.tempo.textContent = formatarTempo(estado.tempoDecorrido);
    elementos.velocidade.textContent = estagioInfo.velocidade.toFixed(1).replace('.', ',') + ' km/h';
}

// Iniciar contagem regressiva
function iniciarContagem() {
    mostrarTela(elementos.telaContagem);
    manterTelaLigada();

    let contagem = 5;
    elementos.numeroContagem.textContent = contagem;

    const intervalo = setInterval(() => {
        contagem--;

        if (contagem > 0) {
            elementos.numeroContagem.textContent = contagem;
            tocarBipContagem();
            vibrar();
        } else {
            clearInterval(intervalo);
            iniciarTeste();
        }
    }, 1000);
}

// Iniciar teste
function iniciarTeste() {
    estado.executando = true;
    estado.tempoInicio = Date.now() - (estado.tempoDecorrido * 1000);

    mostrarTela(elementos.telaTeste);
    elementos.controlesAguardando.classList.add('escondido');
    elementos.controlesExecutando.classList.remove('escondido');
    elementos.btnPausar.textContent = 'PAUSAR';

    // Primeiro bip imediato
    executarBip();

    // Iniciar contador de tempo
    estado.intervaloTempo = setInterval(() => {
        if (!estado.pausado) {
            estado.tempoDecorrido = (Date.now() - estado.tempoInicio) / 1000;
            elementos.tempo.textContent = formatarTempo(estado.tempoDecorrido);
        }
    }, 100);

    // Agendar próximo bip
    agendarProximoBip();
}

// Executar bip
function executarBip() {
    estado.bipAtual++;

    const estagioInfo = ESTAGIOS[estado.estagioAtual];
    const estagioMax = CONFIG[estado.sexo].estagioMax;

    // Verificar se completou os trajetos do estágio
    if (estado.bipAtual > estagioInfo.trajetos) {
        // Verificar se é o último estágio
        if (estado.estagioAtual >= estagioMax - 1) {
            finalizarTeste();
            return;
        }

        // Avançar para próximo estágio
        estado.estagioAtual++;
        estado.bipAtual = 1;

        // Bip e vibração de mudança de estágio
        tocarBipEstagio();
        vibrarEstagio();

        // Animação
        elementos.estagioAtual.classList.add('estagio-novo');
        setTimeout(() => {
            elementos.estagioAtual.classList.remove('estagio-novo');
        }, 500);
    } else {
        // Bip normal
        tocarBip();
        vibrar();
    }

    atualizarDisplay();

    // Falar volta atual após a buzina (delay de 600ms para não sobrepor)
    setTimeout(() => {
        falarVolta(estado.bipAtual);
    }, 600);

    // Flash visual
    document.body.classList.add('bip-flash');
    setTimeout(() => {
        document.body.classList.remove('bip-flash');
    }, 300);
}

// Agendar próximo bip
function agendarProximoBip() {
    if (!estado.executando || estado.pausado) return;

    const estagioInfo = ESTAGIOS[estado.estagioAtual];
    const tempoMs = estagioInfo.tempoBip * 1000;

    estado.intervaloBip = setTimeout(() => {
        if (estado.executando && !estado.pausado) {
            executarBip();
            agendarProximoBip();
        }
    }, tempoMs);
}

// Pausar teste
function pausarTeste() {
    if (estado.pausado) {
        // Continuar
        estado.pausado = false;
        estado.tempoInicio = Date.now() - (estado.tempoDecorrido * 1000);
        elementos.btnPausar.textContent = 'PAUSAR';
        agendarProximoBip();
    } else {
        // Pausar
        estado.pausado = true;
        elementos.btnPausar.textContent = 'CONTINUAR';

        if (estado.intervaloBip) {
            clearTimeout(estado.intervaloBip);
            estado.intervaloBip = null;
        }
    }
}

// Parar teste
function pararTeste() {
    estado.executando = false;
    estado.pausado = false;

    if (estado.intervaloBip) {
        clearTimeout(estado.intervaloBip);
        estado.intervaloBip = null;
    }
    if (estado.intervaloTempo) {
        clearInterval(estado.intervaloTempo);
        estado.intervaloTempo = null;
    }

    liberarTela();

    // Mostrar resultado
    elementos.resultadoEstagio.textContent = ESTAGIOS[estado.estagioAtual].estagio;
    elementos.resultadoBip.textContent = estado.bipAtual;
    elementos.resultadoTempo.textContent = formatarTempo(estado.tempoDecorrido);

    mostrarTela(elementos.telaFinalizado);
}

// Finalizar teste (completou todos os estágios)
function finalizarTeste() {
    estado.executando = false;

    if (estado.intervaloBip) {
        clearTimeout(estado.intervaloBip);
        estado.intervaloBip = null;
    }
    if (estado.intervaloTempo) {
        clearInterval(estado.intervaloTempo);
        estado.intervaloTempo = null;
    }

    liberarTela();

    // Bip de finalização
    tocarBipEstagio();
    vibrarEstagio();

    // Mostrar resultado
    const estagioMax = CONFIG[estado.sexo].estagioMax;
    elementos.resultadoEstagio.textContent = estagioMax;
    elementos.resultadoBip.textContent = ESTAGIOS[estagioMax - 1].trajetos;
    elementos.resultadoTempo.textContent = formatarTempo(estado.tempoDecorrido);

    mostrarTela(elementos.telaFinalizado);
}

// Voltar para seleção
function voltarSelecao() {
    resetarEstado();
    liberarTela();
    mostrarTela(elementos.telaSelecao);
}

// Mostrar tabela de estágios
function mostrarTabela() {
    const estagioMax = CONFIG[estado.sexo].estagioMax;
    const sexoTexto = estado.sexo === 'masculino' ? 'Masculino' : 'Feminino';

    elementos.tabelaSubtitulo.textContent = `${sexoTexto} - até estágio ${estagioMax}`;

    // Limpar tabela
    elementos.tabelaCorpo.innerHTML = '';

    // Preencher tabela com os estágios do sexo selecionado
    for (let i = 0; i < estagioMax; i++) {
        const estagio = ESTAGIOS[i];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${estagio.estagio}</td>
            <td>${estagio.velocidade.toFixed(1).replace('.', ',')} km/h</td>
            <td>${estagio.tempoBip.toFixed(2).replace('.', ',')}s</td>
            <td>${estagio.trajetos}</td>
        `;
        elementos.tabelaCorpo.appendChild(tr);
    }

    mostrarTela(elementos.telaTabela);
}

// Fechar tabela
function fecharTabela() {
    mostrarTela(elementos.telaTeste);
}

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(reg => console.log('Service Worker registrado'))
            .catch(err => console.log('Erro ao registrar SW:', err));
    });
}

// Prevenir zoom no iOS
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});
