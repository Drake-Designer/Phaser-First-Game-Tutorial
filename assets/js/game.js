var platforms;
var player;
var cursors;
var stars;
var bombs;
var score = 0;
var scoreText;
var gameOver = false;
var gameOverText;
var restartText;
var gameOverBlinkEvent;

// Simple mobile check
var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

var config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: { preload, create, update },
};

var game = new Phaser.Game(config);

function preload() {
  // Load all game assets
  this.load.image('sky', 'assets/images/sky.png');
  this.load.image('ground', 'assets/images/platform.png');
  this.load.image('star', 'assets/images/star.png');
  this.load.image('bomb', 'assets/images/bomb.png');
  this.load.spritesheet('dude', 'assets/images/dude.png', { frameWidth: 32, frameHeight: 48 });
}

function create() {
  // Add sky background
  this.add.image(400, 300, 'sky');

  // Create static platforms
  platforms = this.physics.add.staticGroup();
  platforms.create(400, 568, 'ground').setScale(2).refreshBody();
  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  // Create player
  player = this.physics.add.sprite(100, 450, 'dude');
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);
  this.physics.add.collider(player, platforms);

  // Create stars (collectibles)
  stars = this.physics.add.group({
    key: 'star',
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 },
  });

  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  this.physics.add.collider(stars, platforms);
  this.physics.add.overlap(player, stars, collectStar, null, this);

  // Create bombs (enemies)
  bombs = this.physics.add.group();
  this.physics.add.collider(bombs, platforms);
  this.physics.add.collider(player, bombs, hitBomb, null, this);

  // Create player animations
  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: 'turn',
    frames: [{ key: 'dude', frame: 4 }],
    frameRate: 20,
  });

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  // Setup controls
  if (isMobile) {
    this.touchDirection = null;
    this.lastTapTime = 0;
    this.tapCount = 0;

    this.input.on(
      'pointerdown',
      (pointer) => {
        // 1. GAME OVER? => Restart game & exit
        if (gameOver) {
          if (gameOverBlinkEvent) {
            gameOverBlinkEvent.remove();
            gameOverBlinkEvent = null;
          }
          score = 0;
          this.scene.restart();
          gameOver = false;
          return;
        }

        // 2. Movement (left/right)
        const half = this.sys.game.config.width / 2;
        this.touchDirection = pointer.x < half ? 'left' : 'right';

        // 3. Double tap for jump
        const now = pointer.downTime;
        if (now - this.lastTapTime < 300) {
          this.tapCount++;
        } else {
          this.tapCount = 1;
        }
        this.lastTapTime = now;

        if (this.tapCount === 2 && player.body.touching.down) {
          player.setVelocityY(-330);
          this.tapCount = 0;
        }
      },
      this
    );

    this.input.on(
      'pointerup',
      () => {
        this.touchDirection = null;
      },
      this
    );

    this.input.on(
      'pointerout',
      () => {
        this.touchDirection = null;
      },
      this
    );
  } else {
    // Keyboard controls for desktop only
    cursors = this.input.keyboard.createCursorKeys();
    cursors.enter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  // Add score display
  scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

  // Add GAME OVER text (centered, hidden by default)
  gameOverText = this.add
    .text(400, 250, 'GAME OVER', {
      fontSize: '64px',
      fontStyle: 'bold',
      fill: '#000',
      stroke: '#fff',
      strokeThickness: 6,
      align: 'center',
    })
    .setOrigin(0.5)
    .setVisible(false);

  // Add restart prompt text (centered, hidden by default)
  restartText = this.add
    .text(400, 340, 'Press Enter to start a new game!', {
      fontSize: '32px',
      fill: '#000',
      align: 'center',
    })
    .setOrigin(0.5)
    .setVisible(false);
}

function update() {
  // --- GAME OVER logic ---
  if (gameOver) {
    if (!isMobile && cursors && Phaser.Input.Keyboard.JustDown(cursors.enter)) {
      if (gameOverBlinkEvent) {
        gameOverBlinkEvent.remove();
        gameOverBlinkEvent = null;
      }
      score = 0;
      this.scene.restart();
      gameOver = false;
    }
    return;
  }

  // --- Controls logic ---
  if (isMobile) {
    // Touch controls
    if (this.touchDirection === 'left') {
      player.setVelocityX(-160);
      player.anims.play('left', true);
    } else if (this.touchDirection === 'right') {
      player.setVelocityX(160);
      player.anims.play('right', true);
    } else {
      player.setVelocityX(0);
      player.anims.play('turn');
    }
    // Jump handled in pointerdown/double tap
  } else if (cursors) {
    // Keyboard controls
    if (cursors.left.isDown) {
      player.setVelocityX(-160);
      player.anims.play('left', true);
    } else if (cursors.right.isDown) {
      player.setVelocityX(160);
      player.anims.play('right', true);
    } else {
      player.setVelocityX(0);
      player.anims.play('turn');
    }
    if (cursors.up.isDown && player.body.touching.down) {
      player.setVelocityY(-330);
    }
  }
}

// Function to handle star collection
function collectStar(player, star) {
  star.disableBody(true, true);
  score += 10;
  scoreText.setText('Score: ' + score);

  if (stars.countActive(true) === 0) {
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    var x = player.x < 400 ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

    var bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }
}

// Function to handle player collision with a bomb
function hitBomb(player, bomb) {
  this.physics.pause();
  player.setTint(0xff0000);
  player.anims.play('turn');
  gameOver = true;

  // Show GAME OVER and restart texts
  gameOverText.setVisible(true);
  restartText.setVisible(true);

  // Make GAME OVER text blink red and black using a timed event
  var isRed = false;
  gameOverBlinkEvent = this.time.addEvent({
    delay: 250, // milliseconds between color changes
    loop: true,
    callback: function () {
      isRed = !isRed;
      gameOverText.setColor(isRed ? '#ff0000' : '#000000');
    },
  });
}
