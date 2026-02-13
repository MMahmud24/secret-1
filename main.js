// Simple heart-maze Valentine game
function mustGet(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: ${id}`);
  return el;
}

const assets = {
  // Put your image paths here, e.g. 'images/her.png' and 'images/me.png'
  playerImage: 'images/gf.png',
  goalImage: 'images/me.jpg',
};

const canvas = mustGet('maze');
const ctx = canvas.getContext('2d');
const statusEl = mustGet('status');
const overlay = mustGet('overlay');
const yesBtn = mustGet('yesBtn');
const noBtn = mustGet('noBtn');
const celebrate = mustGet('celebrate');
const loadedImages = {};

function loadOptionalImage(key, src) {
  if (!src) return;
  const img = new Image();
  img.src = src;
  loadedImages[key] = img;
}

loadOptionalImage('player', assets.playerImage);
loadOptionalImage('goal', assets.goalImage);
// fireworks canvas created later
let fireCanvas, fireCtx;

const tile = 25; // size of each cell in px

// 0 = open, 1 = wall, 2 = goal
// Quick handcrafted maze; feel free to tweak
const maze = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,1,1,1,0,1,0,1,1,0,1,0,1,1,1,1,1,1,1,1,1,0,1],
  [1,0,1,0,0,0,0,0,1,0,1,0,1,0,0,1,0,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,0,1,1,1,0,1,0,1],
  [1,0,1,0,1,0,0,0,1,0,1,0,1,0,1,0,0,0,0,1,0,0,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,0,1,1,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,0,0,0,1,0,1,0,1],
  [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,0,1,0,1],
  [1,0,1,0,0,0,0,0,1,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1],
  [1,0,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,1,0,1,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,1],
  [1,1,1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,1,0,1,0,1,0,1],
  [1,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// derive grid size from maze data
const rows = maze.length;
const cols = maze[0].length;

// fit canvas to maze dimensions
canvas.width = cols * tile;
canvas.height = rows * tile;

const player = { row: 1, col: 1, color: '#ff5fa2' }; // her
const goal = { row: 19, col: 26, color: '#ff3d83' }; // you at the end
let gameWon = false;

const particles = [];
const heartBursts = [];

function ensureFireCanvas() {
  if (fireCanvas) return;
  fireCanvas = document.createElement('canvas');
  fireCanvas.className = 'fireworks';
  document.body.appendChild(fireCanvas);
  fireCtx = fireCanvas.getContext('2d');
  const resize = () => {
    fireCanvas.width = window.innerWidth;
    fireCanvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();
}

function spawnHearts(bursts = 12, heartsPerBurst = 45) {
  ensureFireCanvas();
  const colors = ['#ff0f6b', '#ff3d83', '#ff7aa8', '#ffa3c7', '#ffd6e8'];
  for (let b = 0; b < bursts; b++) {
    const originX = Math.random() * fireCanvas.width;
    const originY = Math.random() * fireCanvas.height;
    for (let i = 0; i < heartsPerBurst; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      heartBursts.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 140 + Math.random() * 40,
        maxLife: 140 + Math.random() * 40,
        size: 10 + Math.random() * 10,
        color: colors[(b + i) % colors.length],
        spin: (Math.random() - 0.5) * 0.1,
      });
    }
  }
}

function updateHearts() {
  if (!fireCtx) return;
  for (const h of heartBursts) {
    h.x += h.vx;
    h.y += h.vy;
    h.vx *= 0.99;
    h.vy *= 0.99;
    h.vy += 0.015; // gentle gravity for arc
    h.life--;
  }
  for (let i = heartBursts.length - 1; i >= 0; i--) {
    if (heartBursts[i].life <= 0) heartBursts.splice(i, 1);
  }
}

function drawHearts() {
  if (!fireCtx) return;
  fireCtx.clearRect(0, 0, fireCanvas.width, fireCanvas.height);
  for (const h of heartBursts) {
    fireCtx.save();
    fireCtx.translate(h.x, h.y);
    fireCtx.rotate(Math.PI + h.spin * (h.maxLife - h.life));
    fireCtx.scale(1, -1);
    fireCtx.beginPath();
    const s = h.size;
    fireCtx.moveTo(0, s / 2);
    fireCtx.bezierCurveTo(s / 2, s / 2, s / 2, s, 0, s);
    fireCtx.bezierCurveTo(-s / 2, s, -s / 2, s / 2, 0, s / 2);
    fireCtx.closePath();
    fireCtx.fillStyle = h.color;
    const alpha = Math.max(0, Math.min(1, h.life / h.maxLife * 1.2));
    fireCtx.globalAlpha = alpha;
    fireCtx.fill();
    fireCtx.restore();
  }
}

function drawCell(r, c, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(c * tile, r * tile, tile, tile);
}

function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (maze[r][c] === 1) {
        drawCell(r, c, '#ffd6e8');
      } else if (maze[r][c] === 2) {
        drawCell(r, c, '#ff8fb1');
      } else {
        drawCell(r, c, '#ffeef7');
      }
    }
  }

  // draw trapped you at goal
  const gx = goal.col * tile + tile / 2;
  const gy = goal.row * tile + tile / 2;
  renderCharacter(gx, gy, { body: goal.color, trapped: true, heartColor: '#fff', sprite: loadedImages.goal });

  // draw her (the player)
  renderCharacter(player.col * tile + tile / 2, player.row * tile + tile / 2, { body: player.color, heartColor: '#ffcee1', sprite: loadedImages.player });
}

function renderCharacter(x, y, { body, trapped = false, heartColor = '#ff3d83', sprite }) {
  // If sprite image is loaded, draw it scaled to the tile
  if (sprite && sprite.complete && sprite.naturalWidth) {
    const size = tile * 0.9;
    const offset = size / 2;
    ctx.drawImage(sprite, x - offset, y - offset, size, size);
    if (trapped) drawCage(x, y);
    return;
  }

  // Fallback: cute stick-heart character
  ctx.save();
  ctx.translate(x, y);

  // head
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(0, -8, 8, 0, Math.PI * 2);
  ctx.fill();

  // body
  ctx.strokeStyle = body;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 14);
  ctx.moveTo(0, 6);
  ctx.lineTo(-8, 0);
  ctx.moveTo(0, 6);
  ctx.lineTo(8, 0);
  ctx.moveTo(0, 14);
  ctx.lineTo(-6, 22);
  ctx.moveTo(0, 14);
  ctx.lineTo(6, 22);
  ctx.stroke();

  // chest heart
  drawTinyHeart(0, 4, 4, heartColor);

  if (trapped) {
    drawCage(0, 0);
  }

  ctx.restore();
}

function drawCage(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(255, 141, 177, 0.25)';
  ctx.fillRect(-14, -20, 28, 50);
  ctx.strokeStyle = '#ffb3cc';
  ctx.lineWidth = 2;
  ctx.strokeRect(-14, -20, 28, 50);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ff8fb1';
  ctx.beginPath();
  ctx.moveTo(-10, -20);
  ctx.lineTo(-10, 30);
  ctx.moveTo(-3, -20);
  ctx.lineTo(-3, 30);
  ctx.moveTo(4, -20);
  ctx.lineTo(4, 30);
  ctx.moveTo(11, -20);
  ctx.lineTo(11, 30);
  ctx.stroke();
  ctx.restore();
}

function drawTinyHeart(x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI);
  ctx.scale(1, -1);
  ctx.beginPath();
  ctx.moveTo(0, size / 2);
  ctx.bezierCurveTo(size / 2, size / 2, size / 2, size, 0, size);
  ctx.bezierCurveTo(-size / 2, size, -size / 2, size / 2, 0, size / 2);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function addParticles(x, y) {
  for (let i = 0; i < 30; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 40
    });
  }
}

function updateParticles() {
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05;
    p.life--;
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    if (particles[i].life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.fillStyle = 'rgba(255, 99, 146, 0.6)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tryMove(dr, dc) {
  if (gameWon) return;
  const nr = player.row + dr;
  const nc = player.col + dc;
  const cell = maze[nr]?.[nc];
  if (cell === 1 || cell === undefined) return; // wall or outside

  player.row = nr;
  player.col = nc;
  addParticles(player.col * tile + tile / 2, player.row * tile + tile / 2);

  if (cell === 2 || (nr === goal.row && nc === goal.col)) winGame();
}

function handleKey(e) {
  const key = e.key.toLowerCase();
  if (key === 'arrowup' || key === 'w') tryMove(-1, 0);
  else if (key === 'arrowdown' || key === 's') tryMove(1, 0);
  else if (key === 'arrowleft' || key === 'a') tryMove(0, -1);
  else if (key === 'arrowright' || key === 'd') tryMove(0, 1);
}

document.addEventListener('keydown', handleKey);

function loop() {
  drawMaze();
  updateParticles();
  drawParticles();
  updateHearts();
  drawHearts();
  if (!gameWon && player.row === goal.row && player.col === goal.col) {
    winGame();
  }
  requestAnimationFrame(loop);
}

overlay.hidden = true;
celebrate.hidden = true;

loop();

function winGame() {
  if (gameWon) return;
  gameWon = true;
  statusEl.textContent = 'You reached me! Time for the question...';
  overlay.hidden = false;
  overlay.setAttribute('aria-live', 'polite');
}

yesBtn.addEventListener('click', () => {
  overlay.hidden = true;
  celebrate.hidden = false;
  spawnHearts(16, 55);
});

noBtn.addEventListener('mousemove', (e) => {
  const btn = e.target;
  const rect = btn.getBoundingClientRect();
  const offset = 120;
  const randX = (Math.random() - 0.5) * offset;
  const randY = (Math.random() - 0.5) * offset;
  btn.style.transform = `translate(${randX}px, ${randY}px)`;
});
