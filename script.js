// Configuración y Utilidades
const CARD_VALUES = {
    '2': 1, '4': 2, '5': 3, '6': 4, '7': 5,
    'Sota': 6, 'Caballo': 7, 'Rey': 8,
    '3': 9, 'As': 10
};

const SUITS = ['oros', 'copas', 'espadas', 'bastos'];
const CARD_NAMES = ['As', '2', '3', '4', '5', '6', '7', 'Sota', 'Caballo', 'Rey'];

function createDeck() {
    const deck = [];
    for (const suit of SUITS) {
        for (let i = 0; i < 10; i++) {
            // Saltamos el 8 y 9 (que no existen en la baraja española)
            if (i === 7 || i === 8) continue;
            
            const card = {
                name: CARD_NAMES[i],
                suit: suit,
                value: CARD_VALUES[CARD_NAMES[i]],
                display: `${CARD_NAMES[i]}-${suit}`
            };
            deck.push(card);
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// Estado del Juego
let gameState = {
    phase: 'initial', // initial, choosing, playing, war, gameOver
    playerPile: [],
    pcPile: [],
    currentPlayerCard: null,
    currentPcCard: null,
    warCards: []
};

// Elementos del DOM
const elements = {
    statusMessage: document.getElementById('statusMessage'),
    pilesContainer: document.getElementById('pilesContainer'),
    playerCard: document.getElementById('playerCard'),
    pcCard: document.getElementById('pcCard'),
    playerCounter: document.getElementById('playerCounter'),
    pcCounter: document.getElementById('pcCounter'),
    newGameBtn: document.getElementById('newGameBtn')
};

// Inicialización del Juego
function initGame() {
    // Crear y barajar la baraja
    const deck = shuffleDeck(createDeck());
    
    // Dividir en 5 montones (1 para jugador, 1 para PC, 3 descartados)
    const pileSize = Math.ceil(deck.length / 5);
    const piles = [];
    
    for (let i = 0; i < 5; i++) {
        const start = i * pileSize;
        const end = start + pileSize;
        piles.push(deck.slice(start, end));
    }
    
    // Actualizar estado del juego
    gameState = {
        phase: 'choosing',
        playerPile: [],
        pcPile: [],
        currentPlayerCard: null,
        currentPcCard: null,
        warCards: [],
        availablePiles: piles
    };
    
    // Renderizar montones
    renderPiles();
    updateCounters();
    elements.statusMessage.textContent = 'Elige un montón para comenzar';
}

function renderPiles() {
    elements.pilesContainer.innerHTML = '';
    
    if (gameState.phase === 'choosing') {
        // Mostrar los 5 montones para que el jugador elija
        gameState.availablePiles.forEach((pile, index) => {
            const pileElement = document.createElement('div');
            pileElement.className = 'pile';
            pileElement.dataset.index = index;
            
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardBack.textContent = pile.length;
            
            pileElement.appendChild(cardBack);
            pileElement.addEventListener('click', () => choosePile(index));
            
            elements.pilesContainer.appendChild(pileElement);
        });
    } else if (gameState.phase === 'playing' || gameState.phase === 'war') {
        // Mostrar solo el montón del jugador
        const playerPileElement = document.createElement('div');
        playerPileElement.className = 'pile';
        
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        cardBack.textContent = gameState.playerPile.length;
        
        playerPileElement.appendChild(cardBack);
        playerPileElement.addEventListener('click', playRound);
        elements.pilesContainer.appendChild(playerPileElement);
        
        // Mostrar el montón de la PC (solo contador)
        const pcPileElement = document.createElement('div');
        pcPileElement.className = 'pile';
        pcPileElement.style.marginLeft = '20px';
        
        const pcCardBack = document.createElement('div');
        pcCardBack.className = 'card-back';
        pcCardBack.textContent = gameState.pcPile.length;
        
        pcPileElement.appendChild(pcCardBack);
        elements.pilesContainer.appendChild(pcPileElement);
    }
}

// Lógica del Montón
function choosePile(pileIndex) {
    if (gameState.phase !== 'choosing') return;
    
    // El jugador elige un montón
    const playerPile = gameState.availablePiles[pileIndex];
    const remainingPiles = [...gameState.availablePiles];
    remainingPiles.splice(pileIndex, 1);
    
    // La PC elige un montón aleatorio de los restantes
    const pcPileIndex = Math.floor(Math.random() * remainingPiles.length);
    const pcPile = remainingPiles[pcPileIndex];
    
    // Actualizar estado del juego
    gameState.playerPile = playerPile;
    gameState.pcPile = pcPile;
    gameState.phase = 'playing';
    
    // Renderizar cambios
    renderPiles();
    updateCounters();
    elements.statusMessage.textContent = '¡Comienza el juego! Haz clic en tu montón para jugar una ronda.';
}

// Lógica de la Ronda
function playRound() {
    if (gameState.phase !== 'playing' && gameState.phase !== 'war') return;
    
    // Verificar si hay cartas suficientes
    if (gameState.playerPile.length === 0 || gameState.pcPile.length === 0) {
        endGame();
        return;
    }
    
    // Sacar cartas
    const playerCard = gameState.playerPile.shift();
    const pcCard = gameState.pcPile.shift();
    
    // Actualizar estado
    gameState.currentPlayerCard = playerCard;
    gameState.currentPcCard = pcCard;
    
    // Mostrar cartas
    showCards(playerCard, pcCard);
    
    // Comparar cartas
    compareCards(playerCard, pcCard);
}

function showCards(playerCard, pcCard) {
    // Limpiar contenedores
    elements.playerCard.innerHTML = '';
    elements.pcCard.innerHTML = '';
    
    // Mostrar carta del jugador
    const playerCardElement = createCardElement(playerCard);
    elements.playerCard.appendChild(playerCardElement);
    
    // Mostrar carta de la PC
    const pcCardElement = createCardElement(pcCard);
    elements.pcCard.appendChild(pcCardElement);
    
    // Animación de voltear
    setTimeout(() => {
        playerCardElement.classList.add('flipped');
        pcCardElement.classList.add('flipped');
    }, 100);
}

function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    
    const cardBack = document.createElement('div');
    cardBack.className = 'card-back';
    
    const cardFront = document.createElement('div');
    cardFront.className = 'card-front';
    
    const cardValue = document.createElement('div');
    cardValue.className = 'card-value';
    cardValue.textContent = card.name;
    
    const cardSuit = document.createElement('div');
    cardSuit.className = `card-suit ${card.suit}`;
    
    // Usar símbolos Unicode para los palos
    let suitSymbol = '';
    switch(card.suit) {
        case 'oros': suitSymbol = '♦'; break;
        case 'copas': suitSymbol = '♥'; break;
        case 'espadas': suitSymbol = '♠'; break;
        case 'bastos': suitSymbol = '♣'; break;
    }
    cardSuit.textContent = suitSymbol;
    
    cardFront.appendChild(cardValue);
    cardFront.appendChild(cardSuit);
    
    cardElement.appendChild(cardBack);
    cardElement.appendChild(cardFront);
    
    return cardElement;
}

function compareCards(playerCard, pcCard) {
    // Agregar cartas a las cartas en juego (para manejar guerras)
    gameState.warCards.push(playerCard, pcCard);
    
    if (playerCard.value > pcCard.value) {
        // Jugador gana
        playerWinsRound();
    } else if (pcCard.value > playerCard.value) {
        // PC gana
        pcWinsRound();
    } else {
        // Empate - Guerra
        startWar();
    }
}

function playerWinsRound() {
    elements.statusMessage.textContent = '¡Ganaste esta ronda!';
    
    // El jugador se lleva todas las cartas en juego
    gameState.playerPile.push(...gameState.warCards);
    gameState.warCards = [];
    
    updateCounters();
    checkGameEnd();
    
    // Preparar para la siguiente ronda
    gameState.phase = 'playing';
}

function pcWinsRound() {
    elements.statusMessage.textContent = '¡La PC ganó esta ronda!';
    
    // La PC se lleva todas las cartas en juego
    gameState.pcPile.push(...gameState.warCards);
    gameState.warCards = [];
    
    updateCounters();
    checkGameEnd();
    
    // Preparar para la siguiente ronda
    gameState.phase = 'playing';
}

function startWar() {
    const warMessage = document.createElement('div');
    warMessage.className = 'war-message';
    warMessage.textContent = '¡GUERRA! Las cartas tienen el mismo valor.';
    
    // Insertar mensaje de guerra
    elements.statusMessage.innerHTML = '';
    elements.statusMessage.appendChild(warMessage);
    
    gameState.phase = 'war';
    
    // Verificar si hay suficientes cartas para la guerra
    if (gameState.playerPile.length < 2 || gameState.pcPile.length < 2) {
        // No hay cartas suficientes para la guerra
        if (gameState.playerPile.length < 2 && gameState.pcPile.length < 2) {
            elements.statusMessage.textContent = '¡Doble guerra imposible! Ambos se quedaron sin cartas.';
            endGame('Empate');
        } else if (gameState.playerPile.length < 2) {
            elements.statusMessage.textContent = '¡No tienes cartas para la guerra!';
            endGame('PC');
        } else {
            elements.statusMessage.textContent = '¡La PC no tiene cartas para la guerra!';
            endGame('Jugador');
        }
        return;
    }
    
    // Sacar cartas boca abajo para la guerra
    const playerHiddenCard = gameState.playerPile.shift();
    const pcHiddenCard = gameState.pcPile.shift();
    gameState.warCards.push(playerHiddenCard, pcHiddenCard);
    
    // Mostrar mensaje de cartas ocultas
    setTimeout(() => {
        elements.statusMessage.textContent = 'Cartas ocultas jugadas para la guerra...';
        
        // Después de un breve retraso, jugar la siguiente ronda
        setTimeout(playRound, 1500);
    }, 2000);
}

// Actualización del Estado del Juego
function updateCounters() {
    elements.playerCounter.textContent = `Cartas: ${gameState.playerPile.length}`;
    elements.pcCounter.textContent = `Cartas: ${gameState.pcPile.length}`;
}

function checkGameEnd() {
    if (gameState.playerPile.length === 0 || gameState.pcPile.length === 0) {
        endGame();
    }
}

// Fin del Juego
function endGame() {
    let winner;
    let message;
    
    if (gameState.playerPile.length === 0 && gameState.pcPile.length === 0) {
        winner = 'Empate';
        message = '¡Juego terminado en empate! Ambos jugadores se quedaron sin cartas al mismo tiempo.';
    } else if (gameState.playerPile.length === 0) {
        winner = 'PC';
        message = '¡Has perdido! La PC se ha quedado con todas las cartas.';
    } else {
        winner = 'Jugador';
        message = '¡Felicidades! Has ganado al quedarte con todas las cartas.';
    }
    
    gameState.phase = 'gameOver';
    elements.statusMessage.textContent = message;
    
    // Mostrar mensaje de resultado final
    const resultMessage = document.createElement('div');
    resultMessage.className = 'final-result';
    
    if (winner === 'Empate') {
        resultMessage.textContent = 'El juego ha terminado en empate.';
        resultMessage.style.color = '#FFA500'; // Naranja para empate
    } else if (winner === 'Jugador') {
        resultMessage.textContent = '¡VICTORIA! ¡Has ganado la partida!';
        resultMessage.style.color = '#2ECC71'; // Verde para victoria
    } else {
        resultMessage.textContent = '¡DERROTA! La PC ha ganado la partida.';
        resultMessage.style.color = '#E74C3C'; // Rojo para derrota
    }
    
    // Insertar el mensaje después del status message
    elements.statusMessage.insertAdjacentElement('afterend', resultMessage);
    
    // Deshabilitar el clic en el montón
    const playerPileElement = document.querySelector('.pile');
    if (playerPileElement) {
        playerPileElement.removeEventListener('click', playRound);
    }
}

// Event Listeners
elements.newGameBtn.addEventListener('click', initGame);

// Iniciar el juego al cargar la página
document.addEventListener('DOMContentLoaded', initGame);