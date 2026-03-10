(function() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const internalUI = document.getElementById('internal-game-ui');
    const startBtn = document.getElementById('start-internal-btn');
    const statusText = document.getElementById('internal-status');
    const nameInput = document.getElementById('player-name-input');
    const durationSelect = document.getElementById('game-duration-select');
    const gameHud = document.getElementById('game-hud');
    const upgradeBtn = document.getElementById('upgrade-btn');

    let gameActive = false;
    let animationId = null;
    let playerName = "Player";
    let score = 0;
    let money = 0;
    let round = 1;
    let isIntermission = false;
    let intermissionTimer = 0;
    let gameTimer = 0;
    let totalGameTime = 0;

    const WORLD_WIDTH = 2000;
    const WORLD_HEIGHT = 2000;

    const BOT_NAMES = [
        "Speedy", "Turbo", "Drifter", "RacerX", "Nitro", 
        "Shadow", "Ghost", "Blaze", "Vortex", "Rogue",
        "Ace", "Bullet", "Crash", "Dash", "Flash",
        "Hunter", "Interceptor", "Joker", "Killer", "Legend",
        "Maverick", "Nomad", "Outlaw", "Phantom", "Rebel",
        "Slayer", "Titan", "Viper", "Warrior", "Zenith"
    ];

    const player = {
        x: WORLD_WIDTH / 2,
        y: WORLD_HEIGHT / 2,
        angle: 0,
        speed: 0,
        maxSpeed: 5,
        accel: 0.1,
        friction: 0.98,
        steerSpeed: 0.05,
        width: 40,
        height: 20,
        color: '#10b981',
        health: 100,
        maxHealth: 100,
        swordLevel: 1,
        swordAngle: 0,
        isAttacking: false,
        attackCooldown: 0,
        name: "Player"
    };

    const bots = [];
    const particles = [];
    const keys = {};

    function init() {
        player.x = WORLD_WIDTH / 2;
        player.y = WORLD_HEIGHT / 2;
        player.angle = 0;
        player.speed = 0;
        player.health = 100;
        player.swordLevel = 1;
        score = 0;
        money = 0;
        round = 1;
        isIntermission = false;
        intermissionTimer = 0;
        bots.length = 0;
        particles.length = 0;

        startRound();
    }

    function startRound() {
        isIntermission = false;
        const botCount = 5 + (round * 2);
        for (let i = 0; i < botCount; i++) {
            spawnBot();
        }
    }

    function startIntermission() {
        isIntermission = true;
        intermissionTimer = 120 * 60; // 2 minutes at 60fps
        round++;
        // Heal player a bit
        player.health = Math.min(player.maxHealth, player.health + 20);
    }

    function spawnBot() {
        const randomName = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
        bots.push({
            x: Math.random() * WORLD_WIDTH,
            y: Math.random() * WORLD_HEIGHT,
            angle: Math.random() * Math.PI * 2,
            speed: 2 + Math.random() * 2,
            width: 40,
            height: 20,
            color: '#ef4444',
            health: 50,
            maxHealth: 50,
            targetAngle: Math.random() * Math.PI * 2,
            changeTargetTimer: 0,
            name: randomName + " " + (Math.floor(Math.random() * 999))
        });
    }

    function spawnParticle(x, y, color) {
        for (let i = 0; i < 5; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1,
                color
            });
        }
    }

    function update() {
        if (!gameActive) return;

        // Update game timer
        if (gameTimer > 0) {
            gameTimer--;
            if (gameTimer <= 0) {
                gameOver("TIME'S UP!");
            }
        }

        if (isIntermission) {
            intermissionTimer--;
            if (intermissionTimer <= 0) {
                startRound();
            }
            // Still allow player to move during intermission
        }

        // Player movement
        const isMoving = Math.abs(player.speed) > 0.1;
        
        if (keys['ArrowUp'] || keys['w'] || keys['W']) {
            player.speed += player.accel;
        } else if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            player.speed -= player.accel;
        } else {
            player.speed *= player.friction;
        }

        // Steering - only works when moving
        if (isMoving) {
            const steerDir = player.speed > 0 ? 1 : -1;
            if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
                player.angle -= player.steerSpeed * steerDir;
            }
            if (keys['ArrowRight'] || keys['d'] || keys['D']) {
                player.angle += player.steerSpeed * steerDir;
            }
        }

        if (Math.abs(player.speed) > player.maxSpeed) {
            player.speed = Math.sign(player.speed) * player.maxSpeed;
        }

        player.x += Math.cos(player.angle) * player.speed;
        player.y += Math.sin(player.angle) * player.speed;

        // Slow health regeneration
        if (player.health < player.maxHealth) {
            player.health += 0.02; // Regenerate slowly
        }

        // Keep in bounds
        player.x = Math.max(0, Math.min(WORLD_WIDTH, player.x));
        player.y = Math.max(0, Math.min(WORLD_HEIGHT, player.y));

        // Update Upgrade Button State
        const upgradeCost = 200 * player.swordLevel;
        upgradeBtn.textContent = `UPGRADE ($${upgradeCost})`;
        if (money >= upgradeCost) {
            upgradeBtn.classList.remove('opacity-30', 'cursor-not-allowed');
            upgradeBtn.classList.add('opacity-100', 'cursor-pointer');
        } else {
            upgradeBtn.classList.add('opacity-30', 'cursor-not-allowed');
            upgradeBtn.classList.remove('opacity-100', 'cursor-pointer');
        }

        // Sword logic
        player.swordAngle += 0.1;
        if (player.attackCooldown > 0) player.attackCooldown--;

        if ((keys[' '] || keys['Enter']) && player.attackCooldown <= 0) {
            player.isAttacking = true;
            player.attackCooldown = 20;
            setTimeout(() => player.isAttacking = false, 150);
        }

        // Update bots
        bots.forEach((bot, index) => {
            bot.changeTargetTimer--;
            if (bot.changeTargetTimer <= 0) {
                // Chase player or wander
                const dx = player.x - bot.x;
                const dy = player.y - bot.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 400) {
                    bot.targetAngle = Math.atan2(dy, dx);
                } else {
                    bot.targetAngle = Math.random() * Math.PI * 2;
                }
                bot.changeTargetTimer = 60 + Math.random() * 60;
            }

            // Smoothly rotate towards target
            let diff = bot.targetAngle - bot.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            bot.angle += diff * 0.05;

            bot.x += Math.cos(bot.angle) * bot.speed;
            bot.y += Math.sin(bot.angle) * bot.speed;

            // Keep in bounds
            if (bot.x < 0 || bot.x > WORLD_WIDTH) bot.angle = Math.PI - bot.angle;
            if (bot.y < 0 || bot.y > WORLD_HEIGHT) bot.angle = -bot.angle;

            // Collision with player sword
            if (player.isAttacking) {
                const swordLen = 30 + (player.swordLevel * 5);
                const swordX = player.x + Math.cos(player.angle) * (player.width/2 + swordLen/2);
                const swordY = player.y + Math.sin(player.angle) * (player.width/2 + swordLen/2);
                const dx = bot.x - swordX;
                const dy = bot.y - swordY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 40 + (player.swordLevel * 5)) {
                    bot.health -= 10 * player.swordLevel;
                    spawnParticle(bot.x, bot.y, bot.color);
                    if (bot.health <= 0) {
                        bots.splice(index, 1);
                        score += 100;
                        money += 50;
                        
                        if (bots.length === 0 && !isIntermission) {
                            startIntermission();
                        }
                    }
                }
            }

            // Bot attacking player (simple touch damage)
            const dx = player.x - bot.x;
            const dy = player.y - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 30) {
                player.health -= 0.5;
                if (player.health <= 0) {
                    gameOver();
                }
            }
        });

        // Update particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
            if (p.life <= 0) particles.splice(i, 1);
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const camX = player.x - canvas.width / 2;
        const camY = player.y - canvas.height / 2;

        ctx.save();
        ctx.translate(-camX, -camY);

        // Draw Road Background
        ctx.fillStyle = '#262626'; // Asphalt color
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

        // Draw lane lines
        ctx.strokeStyle = '#fbbf24'; // Yellow line
        ctx.setLineDash([40, 40]);
        ctx.lineWidth = 4;
        for (let x = 200; x < WORLD_WIDTH; x += 400) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, WORLD_HEIGHT);
            ctx.stroke();
        }
        for (let y = 200; y < WORLD_HEIGHT; y += 400) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(WORLD_WIDTH, y);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Draw grid (subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= WORLD_WIDTH; x += 100) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, WORLD_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y <= WORLD_HEIGHT; y += 100) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(WORLD_WIDTH, y);
            ctx.stroke();
        }

        // Draw particles
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 4, 4);
        });
        ctx.globalAlpha = 1;

        // Draw bots
        bots.forEach(bot => {
            ctx.save();
            ctx.translate(bot.x, bot.y);
            ctx.rotate(bot.angle);
            ctx.fillStyle = bot.color;
            ctx.fillRect(-bot.width/2, -bot.height/2, bot.width, bot.height);
            // Wheels
            ctx.fillStyle = '#000';
            ctx.fillRect(-15, -12, 10, 4);
            ctx.fillRect(5, -12, 10, 4);
            ctx.fillRect(-15, 8, 10, 4);
            ctx.fillRect(5, 8, 10, 4);
            ctx.restore();

            // Bot health bar
            ctx.fillStyle = '#333';
            ctx.fillRect(bot.x - 20, bot.y - 25, 40, 4);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(bot.x - 20, bot.y - 25, (bot.health / bot.maxHealth) * 40, 4);
            
            // Bot name
            ctx.fillStyle = '#fff';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(bot.name, bot.x, bot.y - 30);
        });

        // Draw player
        ctx.save();
        ctx.translate(player.x, player.y);
        ctx.rotate(player.angle);
        ctx.fillStyle = player.color;
        ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);
        // Wheels
        ctx.fillStyle = '#000';
        ctx.fillRect(-15, -12, 10, 4);
        ctx.fillRect(5, -12, 10, 4);
        ctx.fillRect(-15, 8, 10, 4);
        ctx.fillRect(5, 8, 10, 4);
        
        // Sword at the front
        ctx.save();
        ctx.translate(player.width / 2, 0);
        ctx.rotate(player.isAttacking ? Math.sin(Date.now() * 0.1) : 0);
        ctx.fillStyle = '#94a3b8';
        const swordLen = 30 + (player.swordLevel * 5);
        ctx.fillRect(0, -2, swordLen, 4);
        ctx.fillStyle = '#fbbf24'; // Hilt
        ctx.fillRect(0, -6, 4, 12);
        ctx.restore();

        ctx.restore();

        // Player name
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(playerName, player.x, player.y - 35);

        ctx.restore();

        // UI Overlay (Fixed)
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(10, 10, 200, 140);
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        const minutesLeft = Math.floor(gameTimer / 3600);
        const secondsLeft = Math.floor((gameTimer % 3600) / 60);
        ctx.fillText(`Time Left: ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`, 20, 30);
        ctx.fillText(`Round: ${round}`, 20, 50);
        ctx.fillText(`Score: ${score}`, 20, 70);
        ctx.fillText(`Money: $${money}`, 20, 90);
        ctx.fillText(`Sword Level: ${player.swordLevel}`, 20, 110);
        ctx.fillText(`Next Upgrade: $${200 * player.swordLevel}`, 20, 130);

        if (isIntermission) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, canvas.height / 2 - 50, canvas.width, 100);
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 30px sans-serif';
            ctx.textAlign = 'center';
            const iMin = Math.floor(intermissionTimer / 3600);
            const iSec = Math.floor((intermissionTimer % 3600) / 60);
            ctx.fillText(`INTERMISSION - ROUND ${round} STARTING IN ${iMin}:${iSec.toString().padStart(2, '0')}`, canvas.width / 2, canvas.height / 2 + 10);
        }

        // Health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(canvas.width/2 - 100, canvas.height - 40, 200, 20);
        ctx.fillStyle = '#10b981';
        ctx.fillRect(canvas.width/2 - 100, canvas.height - 40, (player.health / player.maxHealth) * 200, 20);
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText("HEALTH", canvas.width/2, canvas.height - 25);
    }

    function gameLoop() {
        update();
        draw();
        animationId = requestAnimationFrame(gameLoop);
    }

    function gameOver(reason = "GAME OVER") {
        gameActive = false;
        statusText.textContent = reason;
        statusText.style.color = "#ef4444";
        internalUI.classList.remove('hidden');
        gameHud.classList.add('hidden');
        startBtn.textContent = "TRY AGAIN";
    }

    startBtn.onclick = () => {
        playerName = nameInput.value.trim() || "Player";
        const duration = parseInt(durationSelect.value) || 2;
        gameTimer = duration * 60 * 60;
        totalGameTime = gameTimer;
        
        internalUI.classList.add('hidden');
        gameHud.classList.remove('hidden');
        gameActive = true;
        init();
        if (!animationId) gameLoop();
    };

    upgradeBtn.onclick = () => {
        const upgradeCost = 200 * player.swordLevel;
        if (money >= upgradeCost) {
            money -= upgradeCost;
            player.swordLevel++;
            player.maxSpeed += 0.5;
            player.accel += 0.02;
            spawnParticle(player.x, player.y, '#fbbf24');
        }
    };

    window.addEventListener('keydown', e => keys[e.key] = true);
    window.addEventListener('keyup', e => keys[e.key] = false);

    window.CarChaseGame = {
        start: () => {
            canvas.classList.remove('hidden');
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
            internalUI.classList.remove('hidden');
            gameHud.classList.add('hidden');
            statusText.textContent = "CAR CHASE";
            statusText.style.color = "#10b981";
            startBtn.textContent = "START GAME";
        },
        stop: () => {
            gameActive = false;
            canvas.classList.add('hidden');
            internalUI.classList.add('hidden');
            gameHud.classList.add('hidden');
            if (animationId) {
                cancelAnimationFrame(animationId);
                animationId = null;
            }
        }
    };

    window.addEventListener('resize', () => {
        if (gameActive) {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = canvas.parentElement.clientHeight;
        }
    });
})();
