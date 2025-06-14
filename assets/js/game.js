var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
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
  this.add.image(400, 300, 'sky');
  this.add.image(400, 300, 'star');
}

function update() {}
