var platforms;
var player;
var cursors;
var stars;
var bombs;
var score = 0;
var scoreText;
var gameOver = false;

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
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
  this.load.image('sky', 'assets/images/sky.png');
  this.load.image('ground', 'assets/images/platform.png');
  this.load.image('star', 'assets/images/star.png');
  this.load.image('bomb', 'assets/images/bomb.png');
  this.load.spritesheet('dude', 'assets/images/dude.png', { frameWidth: 32, frameHeight: 48 });
}

function create() {
  // Sky background
  this.add.image(400, 300, 'sky');

  // Static platforms
  platforms = this.physics.add.staticGroup();
  platforms.create(400, 568, 'ground').setScale(2).refreshBody();
  platforms.create(600, 400, 'ground');
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  // Player
  player = this.physics.add.sprite(100, 450, 'dude');
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);
  this.physics.add.collider(player, platforms);

  // Stars - Adding 12 stars: bouncing, collide, collecting
  stars = this.physics.add.group({
    key: 'star',
    repeat: 11, // <-- correzione! ora sono 12 stelle come nel tutorial
    setXY: { x: 12, y: 0, stepX: 70 },
  });

  stars.children.iterate(function (child) {
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  this.physics.add.collider(stars, platforms);

  this.physics.add.overlap(player, stars, collectStar, null, this);

  // Bombs
  bombs = this.physics.add.group();

  this.physics.add.collider(bombs, platforms);

  this.physics.add.collider(player, bombs, hitBomb, null, this);

  // Player animations
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

  // Keyboard controls
  cursors = this.input.keyboard.createCursorKeys();

  // Score
  scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' }); // "Score" maiuscolo come nel tutorial
}

function update() {
  // Blocca i comandi se il gioco è finito
  if (gameOver) {
    return;
  }

  // Player animation
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

// Collect star function
function collectStar(player, star) {
  star.disableBody(true, true);
  score += 10;
  scoreText.setText('Score: ' + score);

  if (stars.countActive(true) === 0) {
    // Se non ci sono più stelle attive
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

// Hit bomb function
function hitBomb(player, bomb) {
  this.physics.pause();
  player.setTint(0xff0000);
  player.anims.play('turn');
  gameOver = true;
}
