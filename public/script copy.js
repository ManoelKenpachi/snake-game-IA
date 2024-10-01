// Classe SnakeAI para implementar Q-learning
class SnakeAI {
  constructor() {
    this.qTable = {}; // Tabela Q que armazena recompensas
    this.learningRate = 0.1; // Taxa de aprendizado
    this.discountFactor = 0.9; // Fator de desconto para recompensas futuras
    this.explorationRate = 0.2; // Taxa de exploração (probabilidade de escolher uma ação aleatória)
    this.actions = ['up', 'down', 'left', 'right']; // Ações possíveis
  }

  // Função para obter o estado atual do jogo (posição da cobra e da comida)
  getState(snake, food) {
    const head = snake[0]; // Pega a cabeça da cobra
    const foodDir = [Math.sign(food.x - head.x), Math.sign(food.y - head.y)];
    return `${foodDir[0]},${foodDir[1]},${snake.direction}`; // Estado representado pela direção da comida e da cobra
  }

  // Função para escolher a próxima ação (exploração vs. exploração)
  chooseAction(state) {
    if (Math.random() < this.explorationRate) {
      return this.actions[Math.floor(Math.random() * this.actions.length)]; // Exploração: Escolher uma ação aleatória
    }
    return this.bestAction(state); // Exploração: Escolher a melhor ação conhecida
  }

  // Função para determinar a melhor ação com base na tabela Q
  bestAction(state) {
    if (!this.qTable[state]) {
      this.qTable[state] = { up: 0, down: 0, left: 0, right: 0 };
    }
    let maxAction = 'up';
    let maxQValue = this.qTable[state][maxAction];
    for (const action of this.actions) {
      if (this.qTable[state][action] > maxQValue) {
        maxQValue = this.qTable[state][action];
        maxAction = action;
      }
    }
    return maxAction;
  }

  // Atualizar valores da tabela Q com base no aprendizado
  updateQValue(state, action, reward, nextState) {
    if (!this.qTable[state]) {
      this.qTable[state] = { up: 0, down: 0, left: 0, right: 0 };
    }
    if (!this.qTable[nextState]) {
      this.qTable[nextState] = { up: 0, down: 0, left: 0, right: 0 };
    }
    const qValue = this.qTable[state][action];
    const bestNextAction = this.bestAction(nextState);
    const bestNextQValue = this.qTable[nextState][bestNextAction];

    this.qTable[state][action] = qValue + this.learningRate * (reward + this.discountFactor * bestNextQValue - qValue);
  }
}

// Número de cobras (pode ser configurado pelo usuário)
const numberOfSnakes = parseInt(prompt("Digite a quantidade de jogos simultâneos: ", 4)); 

// Variáveis do jogo para múltiplas cobras
const snakes = []; // Array para armazenar múltiplas cobras

for (let i = 0; i < numberOfSnakes; i++) {
  snakes.push({
    snake: [{ x: 160, y: 160 }],
    direction: { x: gridSize, y: 0 },
    food: { x: Math.floor(Math.random() * canvas.width / gridSize) * gridSize, y: Math.floor(Math.random() * canvas.height / gridSize) * gridSize },
    score: 0,
    isGameOver: false
  });
}

// Instanciar a IA e carregar a tabela Q
const snakeAI = new SnakeAI();
loadQTable();

// Função para atualizar a cobra
function updateSnake(game) {
  const head = { x: game.snake[0].x + game.direction.x, y: game.snake[0].y + game.direction.y };
  game.snake.unshift(head);
  if (head.x === game.food.x && head.y === game.food.y) {
    game.score += 10;
    placeFood(game); 
  } else {
    game.snake.pop(); 
  }
}

// Função para verificar colisões
function checkCollision(game) {
  const head = game.snake[0];
  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
    return true;
  }
  for (let i = 1; i < game.snake.length; i++) {
    if (head.x === game.snake[i].x && head.y === game.snake[i].y) {
      return true;
    }
  }
  return false;
}

// Função para reiniciar uma cobra
function resetGame(game) {
  game.snake = [{ x: 160, y: 160 }];
  game.direction = { x: gridSize, y: 0 };
  placeFood(game);
  game.score = 0;
  game.isGameOver = false;
}

// Função para salvar a tabela Q no localStorage
function saveQTable() {
  const qTableString = JSON.stringify(snakeAI.qTable);
  localStorage.setItem('qTable', qTableString);
}

// Função para carregar a tabela Q do localStorage
function loadQTable() {
  const qTableString = localStorage.getItem('qTable');
  if (qTableString) {
    snakeAI.qTable = JSON.parse(qTableString);
  }
}

// Função para exibir a tabela Q
function updateQTableDisplay() {
  const qTableDisplay = document.getElementById('qTableDisplay');
  let qTableString = JSON.stringify(snakeAI.qTable, null, 2);
  qTableDisplay.textContent = qTableString;
}

// Função principal do loop do jogo
function gameLoop() {
  snakes.forEach((game, index) => {
    if (game.isGameOver) return;

    const currentState = snakeAI.getState(game.snake, game.food);
    const action = snakeAI.chooseAction(currentState);

    switch (action) {
      case 'up': if (game.direction.y === 0) game.direction = { x: 0, y: -gridSize }; break;
      case 'down': if (game.direction.y === 0) game.direction = { x: 0, y: gridSize }; break;
      case 'left': if (game.direction.x === 0) game.direction = { x: -gridSize, y: 0 }; break;
      case 'right': if (game.direction.x === 0) game.direction = { x: gridSize, y: 0 }; break;
    }

    updateSnake(game);

    let reward = -1; 
    if (checkCollision(game)) {
      reward = -100; 
      game.isGameOver = true;
      setTimeout(() => resetGame(game), 1000);
    } else if (game.snake[0].x === game.food.x && game.snake[0].y === game.food.y) {
      reward = 10; 
      placeFood(game);
    }

    const nextState = snakeAI.getState(game.snake, game.food);
    snakeAI.updateQValue(currentState, action, reward, nextState);
  });

  clearCanvas();
  snakes.forEach(game => {
    drawSnake(game);
    drawFood(game);
  });

  updateQTableDisplay();
  saveQTable();
}

// Função para iniciar o loop do jogo
setInterval(gameLoop, 100);
