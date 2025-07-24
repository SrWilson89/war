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
    pcPiles: [],
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
    
    // Dividir en 5 montones (1 para jugador, 4 para PC)
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
        pcPiles: piles,
        currentPlayerCard: null,
        currentPcCard: null,
        warCards: []
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
        gameState.pcPiles.forEach((pile, index) => {
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
        elements.pilesContainer.appendChild(playerPileElement);
    }
}

// Lógica del Montón
function choosePile(pileIndex) {
    if (gameState.phase !== 'choosing') return;
    
    // El jugador elige un montón, los otros 4 son para la PC
    const chosenPile = gameState.pcPiles[pileIndex];
    const pcPiles = [...gameState.pcPiles];
    pcPiles.splice(pileIndex, 1);
    
    // Actualizar estado del juego
    gameState.playerPile = chosenPile;
    gameState.pcPiles = pcPiles;
    gameState.phase = 'playing';
    
    // Renderizar cambios
    renderPiles();
    updateCounters();
    elements.statusMessage.textContent = '¡Comienza el juego! Haz clic en tu montón para jugar una ronda.';
    
    // Hacer el montón del jugador clickable para jugar rondas
    const playerPileElement = document.querySelector('.pile');
    if (playerPileElement) {
        playerPileElement.addEventListener('click', playRound);
    }
}

// Lógica de la Ronda
function playRound() {
    if (gameState.phase !== 'playing' && gameState.phase !== 'war') return;
    
    // Verificar si hay cartas suficientes
    if (gameState.playerPile.length === 0 || gameState.pcPiles.flat().length === 0) {
        endGame();
        return;
    }
    
    // Sacar cartas
    const playerCard = gameState.playerPile.shift();
    let pcPileIndex = 0;
    
    // Encontrar un montón de la PC que tenga cartas
    while (pcPileIndex < gameState.pcPiles.length && gameState.pcPiles[pcPileIndex].length === 0) {
        pcPileIndex++;
    }
    
    if (pcPileIndex >= gameState.pcPiles.length) {
        endGame();
        return;
    }
    
    const pcCard = gameState.pcPiles[pcPileIndex].shift();
    
    // Actualizar estado
    gameState.currentPlayerCard = playerCard;
    gameState.currentPcCard = pcCard;
    
    // Mostrar cartas
    showCards(playerCard, pcCard);
    
    // Comparar cartas
    compareCards(playerCard, pcCard);
}

function showCards(playerCard, pcCard) {
    // Mostrar carta del jugador
    elements.playerCard.innerHTML = '';
    const playerCardElement = createCardElement(playerCard);
    elements.playerCard.appendChild(playerCardElement);
    
    // Mostrar carta de la PC
    elements.pcCard.innerHTML = '';
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
    elements.statusMessage.textContent = 'La PC ganó esta ronda.';
    
    // La PC se lleva todas las cartas en juego
    // Las agregamos a un montón aleatorio de la PC
    const randomPileIndex = Math.floor(Math.random() * gameState.pcPiles.length);
    gameState.pcPiles[randomPileIndex].push(...gameState.warCards);
    gameState.warCards = [];
    
    updateCounters();
    checkGameEnd();
    
    // Preparar para la siguiente ronda
    gameState.phase = 'playing';
}

function startWar() {
    elements.statusMessage.textContent = '¡Guerra! Empate. Se juegan más cartas...';
    gameState.phase = 'war';
    
    // Verificar si hay suficientes cartas para la guerra
    if (gameState.playerPile.length === 0 || gameState.pcPiles.flat().length === 0) {
        endGame();
        return;
    }
    
    // Sacar cartas adicionales para la guerra
    setTimeout(() => {
        playRound();
    }, 1500);
}

// Actualización del Estado del Juego
function updateCounters() {
    elements.playerCounter.textContent = `Cartas: ${gameState.playerPile.length}`;
    
    const pcTotalCards = gameState.pcPiles.reduce((total, pile) => total + pile.length, 0);
    elements.pcCounter.textContent = `Cartas: ${pcTotalCards}`;
}

function checkGameEnd() {
    if (gameState.playerPile.length === 0) {
        endGame('PC');
    } else if (gameState.pcPiles.flat().length === 0) {
        endGame('Jugador');
    }
}

// Fin del Juego
function endGame(winner = null) {
    if (!winner) {
        const playerCards = gameState.playerPile.length;
        const pcCards = gameState.pcPiles.flat().length;
        
        winner = playerCards > pcCards ? 'Jugador' : 'PC';
        if (playerCards === pcCards) winner = 'Empate';
    }
    
    gameState.phase = 'gameOver';
    
    if (winner === 'Empate') {
        elements.statusMessage.textContent = '¡Juego terminado en empate!';
    } else {
        elements.statusMessage.textContent = `¡Juego terminado! Ganó el ${winner}.`;
    }
    
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