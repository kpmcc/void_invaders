let roundNumber = 0
// https://opengameart.org/content/assets-for-a-space-invader-like-game
const constants = {
  canvasWidth: 448,
  canvasHeight: 512,
  shieldYPos: 380,
  shieldWidth: 48,
  shieldHeight: 32,
  shieldXOffset: 60,
  playerStartCoords: [50, 440],
  playerBound: 40,
  playerWidth: 20,
  playerHeight: 16,
  alienTickDecrement: 10, // Adjusts frequency that aliens update early in the game
  alienWidth: 20,
  alienHeight: 16,
  initialAlienSpeed: 1,
  initialAlienTickPeriod: 80,
  initialAlienXDirection: 1,
  missileWidth: 2,
  missileLength: 10,
  playerMissileSpeed: 10
}

const assetBaseUrl = 'https://raw.githubusercontent.com/kpmcc/void_invaders/main/assets/'

const playerImg = new Image()
playerImg.src = assetBaseUrl + 'player.png'

const alienImagesByColor = {}
const alienColors = ['red', 'yellow', 'green']
const alienImageSuffixes = ['_one', '_two']
const alienImageFileFormat = 'png'
const rowColors = ['red', 'yellow', 'yellow', 'green', 'green']

// This loop populates the alienImagesByColor map
// of color strings like 'red' to the corresponding Images for
// the alien colors, each alien color has two images that are cycled between
// {'red' -> [`redOneImage`, `redTwoImage`]}
for (let i = 0; i < alienColors.length; i = i + 1) {
  const alienImagesForColor = []
  const currAlienColor = alienColors[i]
  for (let j = 0; j < alienImageSuffixes.length; j = j + 1) {
    const currSuffix = alienImageSuffixes[j]
    const currSrc = currAlienColor + currSuffix + '.' + alienImageFileFormat
    const currAlienImage = new Image()
    currAlienImage.src = assetBaseUrl + currSrc
    alienImagesForColor.push(currAlienImage)
  }
  alienImagesByColor[currAlienColor] = alienImagesForColor
}

class Coord {
  constructor (x, y) {
    this.x = x
    this.y = y
  }
}

class Missile {
  constructor (x, y, direction) {
    this.x = x
    this.y = y
    this.direction = direction
    this.width = constants.missileWidth
    this.length = constants.missileLength
    this.speed = constants.playerMissileSpeed
  }

  move (x, y) {
    this.x = this.x + x
    this.y = this.y + (this.direction * this.speed)
  }

  update () {
    this.move(0, 1)
  }

  draw (context) {
    const ctx = context
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = this.width
    ctx.beginPath()
    ctx.moveTo(this.x, this.y)
    ctx.lineTo(this.x, this.y - this.length)
    ctx.stroke()
    ctx.fillStyle = '#FF0000'
    ctx.fillRect(this.x, this.y, 1, 1)
  }
}

class MissileContainer {
  constructor () {
    this.playerMissiles = []
    this.alienMissiles = []
    this.verticleBounds = [0, constants.canvasHeight]
  }

  newPlayerMissile (c) {
    if (this.playerMissiles.length === 0) {
      const playerMissile = new Missile(c.x, c.y, -1)
      this.playerMissiles.push(playerMissile)
    }
  }

  outOfBounds (missile) {
    if (((missile.y + missile.length) < this.verticleBounds[0]) ||
        (missile.y > this.verticleBounds[1])) {
      return true
    } else {
      return false
    }
  }

  update () {
    const playerMissileDeletions = []
    const alienMissileDeletions = []
    for (let i = 0; i < this.playerMissiles.length; i += 1) {
      const currMissile = this.playerMissiles[i]
      currMissile.update()
      if (this.outOfBounds(currMissile)) {
        playerMissileDeletions.push(i)
      }
    }

    for (let i = 0; i < this.alienMissiles.length; i += 1) {
      const currAlienMissile = this.alienMissiles[i]
      currAlienMissile.update()
      if (this.outOfBounds(currAlienMissile)) {
        alienMissileDeletions.push(i)
      }
    }

    for (let i = 0; i < playerMissileDeletions.length; i += 1) {
      this.playerMissiles.splice(playerMissileDeletions[i], 1)
    }
    for (let i = 0; i < alienMissileDeletions.length; i += 1) {
      this.alienMissiles.splice(alienMissileDeletions[i], 1)
    }
  }

  draw (context) {
    for (let i = 0; i < this.playerMissiles.length; i += 1) {
      this.playerMissiles[i].draw(context)
    }

    for (let i = 0; i < this.alienMissiles.length; i += 1) {
      this.alienMissiles[i].draw(context)
    }
  }
}

class Shield {
  // This class manages the shield defenses
  // There is a 2D Array of defense strength to account
  // for the state of decay after suffering missile strikes
  // but currently this is NOT used when rendering the shield
  constructor (x, y) {
    this.x = x
    this.y = y
    this.defenses = []
    for (let i = 0; i < 6; i += 1) {
      const columnStrength = []
      for (let j = 0; j < 4; j += 1) {
        columnStrength.push(true)
      }
      this.defenses.push(columnStrength)
    }
    // console.log('New shield at (' + String(this.x) + ',' + String(this.y) + ')')
  }

  draw (context) {
    const sw = constants.shieldWidth
    const sh = constants.shieldHeight
    const ctx = context
    ctx.fillStyle = 'blue'
    ctx.fillRect(this.x, this.y, sw, sh)
  }
}

class GamePiece {
  // This class is used to draw the aliens and playerShip
  // It keeps track of the images used to render the entities,
  // and manages their positions
  constructor (x, y, tickImg, tockImg) {
    // console.log('New invader at (' + String(x) + ',' + String(y) + ')')
    this.x = x
    this.y = y
    this.tick = true
    this.tickImg = tickImg
    this.tockImg = tockImg
    this.img = tickImg
  }

  move (x, y) {
    this.img = this.tick ? this.tickImg : this.tockImg
    this.tick = !this.tick
    this.x = this.x + x
    this.y = this.y + y
  }

  draw (context) {
    context.drawImage(this.img, this.x, this.y)
  }
}

class ShieldContainer {
  constructor () {
    this.numShields = 4
    this.shields = []
    this.initialized = false
    this.initializeShields()
  }

  initializeShields () {
    // Instantiate the shields
    const horizontalSpacing = constants.shieldWidth * 2
    const xOffset = constants.shieldXOffset
    const yPos = constants.shieldYPos
    for (let n = 0; n < this.numShields; n += 1) {
      const xPos = (n * horizontalSpacing) + xOffset
      const myShield = new Shield(xPos, yPos)
      this.shields.push(myShield)
    }
    this.initialized = true
  }

  update () {}

  draw (context) {
    for (let i = 0; i < this.shields.length; i += 1) {
      this.shields[i].draw(context)
    }
  }
}

class AlienContainer {
  // AlienContainer: Class to wrap and manage all the alien entities
  constructor () {
    this.maxAlienSpeed = 16
    this.xDirection = constants.initialAlienXDirection
    this.alienSpeed = constants.initialAlienSpeed
    this.alienYIncrement = 18
    this.alienTickCount = 0
    const atp = constants.initialAlienTickPeriod
    const roundModifier = constants.alienTickDecrement * roundNumber
    this.alienTickPeriod = atp - roundModifier
    this.aliens = []
    this.xMin = 19
    this.xMax = 400
    this.initializeAliens()
    this.initialized = true
  }

  initializeAliens () {
    // Instantiates aliens in their initial positions
    const numAlienRows = 5
    const numAlienColumns = 11
    const alienRowSpacing = 36
    const alienColumnSpacing = 30
    const alienColumnOffset = 20
    const firstAlienRowYPos = 120
    const initialRowYCoords = []

    // Populate array for initial Y coordinates of alien rows
    for (let i = 0; i < numAlienRows; i += 1) {
      initialRowYCoords.push(firstAlienRowYPos + alienRowSpacing * i)
    }

    for (let row = 0; row < numAlienRows; row += 1) {
      const alienYPos = initialRowYCoords[row]
      for (let x = 0; x < numAlienColumns; x = x + 1) {
        // select the color of the alien row
        const rowColor = rowColors[row]
        // each alien has two associate images that are toggled
        // between every time they move to animate their march
        const alienImgOne = alienImagesByColor[rowColor][0]
        const alienImgTwo = alienImagesByColor[rowColor][1]
        // get the x position of the alien
        const alienXPos = x * alienColumnSpacing + alienColumnOffset
        // get a new alien
        const myGameAlien = new GamePiece(alienXPos, alienYPos, alienImgOne, alienImgTwo)
        // and add it to the array
        this.aliens.push(myGameAlien)
      }
    }
  }

  increaseAlienSpeed () {
    // Alien Speed is governed by two variables,
    // alienTickPeriod, and alienSpeed
    // Early in the game we adjust how often the aliens move
    // by changing how often their positions are updated
    // later on we adjust the distance they move per update
    if (this.alienTickPeriod > 10) {
      this.alienTickPeriod -= constants.alienTickDecrement
    } else {
      if (this.alienTickPeriod > 5) {
        this.alienTickPeriod = this.alienTickPeriod / 2
      } else {
        if (this.alienSpeed < this.maxAlienSpeed) {
          this.alienSpeed *= 2
        }
      }
    }
  }

  alienTick () {
    // This function determines whether or not
    // it's time for the aliens to move
    // It is called every game update, and returns true
    // if we've proceeded through one cycle of the alienTickPeriod
    this.alienTickCount += 1
    if (this.alienTickCount === (this.alienTickPeriod - 1)) {
      this.alienTickCount = 0
      return true
    } else {
      return false
    }
  }

  leftmostComp (most, curr) {
    return curr.x < most.x
  }

  rightmostComp (most, curr) {
    return curr.x > most.x
  }

  getFurthestAlien (comparisonFn) {
    // !!! TODO This will cause a problem if all aliens are eliminated
    // !!! TODO check if this.aliens is empty
    let furthestAlien = this.aliens[0]
    for (let i = 1; i < this.aliens.length; i = i + 1) {
      const currAlien = this.aliens[i]
      if (comparisonFn(furthestAlien, currAlien)) {
        furthestAlien = currAlien
      }
    }
    return furthestAlien
  }

  checkAlienBounds (aliens) {
    // Checks if the left most alien is at the left bound,
    // and if the right most alien is at the right bound,
    const leftmostAlien = this.getFurthestAlien(this.leftmostComp)
    const rightmostAlien = this.getFurthestAlien(this.rightmostComp)
    if (leftmostAlien.x <= this.xMin) {
      return true
    }
    if (rightmostAlien.x >= this.xMax) {
      return true
    }
    return false
  }

  update () {
    // First, Determine whether it's time to move the aliens
    const tickAliens = this.alienTick()
    let alienVerticalUpdate = 0

    if (tickAliens) {
      // It's time to move the aliens
      if (this.checkAlienBounds(this.aliens)) {
        // Furthest left or right alien has reached boundary
        // so it's time for the aliens to advance downward
        // to do this we set the vertical update,
        // and reverse the xDirection so they go back the other way
        alienVerticalUpdate = 1
        this.xDirection *= -1
        // Currently we also increase the speed here,
        // but this will change once firing has been implemented
        this.increaseAlienSpeed()
      }
    }
    if (tickAliens) {
      for (let i = 0; i < this.aliens.length; i = i + 1) {
        // Here is where we actually move the aliens
        const xMove = this.xDirection * this.alienSpeed
        const yMove = this.alienYIncrement * alienVerticalUpdate
        this.aliens[i].move(xMove, yMove)
      }
    }
  }

  draw (ctx) {
    for (let i = 0; i < this.aliens.length; i = i + 1) {
      this.aliens[i].draw(ctx)
    }
  }
}

class PlayerShip {
  // This class wraps the player GamePiece
  // and handles logic related to the player
  constructor () {
    const playerX = constants.playerStartCoords[0]
    const playerY = constants.playerStartCoords[1]
    this.ship = new GamePiece(playerX, playerY, playerImg)
    this.movementIncrement = 2
    this.leftBound = constants.playerBound
    this.rightBound = constants.canvasWidth - constants.playerBound + constants.playerWidth
  }

  getFiringCoords () {
    const shipX = this.ship.x
    const shipY = this.ship.y
    const missileXOffset = constants.playerWidth / 2
    const missileYOffset = 18
    const firingCoords = new Coord(shipX + missileXOffset, shipY + missileYOffset)
    return firingCoords
  }

  applyBounds () {
    if (this.ship.x < this.leftBound) {
      this.ship.x = this.leftBound
    }

    if (this.ship.x > this.rightBound) {
      this.ship.x = this.rightBound
    }
  }

  move (xDirection) {
    // When moving the player we apply the requested keyboard input
    // and then make sure we do not move past the boundaries
    this.ship.x += this.movementIncrement * xDirection
    this.applyBounds()
  }

  update () {
  }

  draw (ctx) {
    this.ship.draw(ctx)
  }
}

class Game {
  // Game logic class
  // Initializes and holds game entities
  // Controls ordering of updates and drawing of entities
  constructor () {
    this.shields = []
    this.gameInitialized = false
    this.alienContainer = new AlienContainer()
    this.shieldContainer = new ShieldContainer()
    this.playerShip = new PlayerShip()
    this.missileContainer = new MissileContainer()
    this.gameInitialized = true
  }

  firePlayerMissile () {
    const playerMissileCoords = this.playerShip.getFiringCoords()
    this.missileContainer.newPlayerMissile(playerMissileCoords)
  }

  update () {
    this.alienContainer.update()
    this.missileContainer.update()
    // this.shieldContainer.update()
    // this.playerShip.update()
  }

  draw (ctx) {
    if (this.gameInitialized) {
      this.playerShip.draw(ctx)
      this.alienContainer.draw(ctx)
      this.missileContainer.draw(ctx)
      this.shieldContainer.draw(ctx)
    }
  }
}

const myGameArea = {
  // Wrapper for the html canvas and the game class
  // Adds the canvas to the document, sets update Interval for updateGameArea
  canvas: document.createElement('canvas'),
  context: null,
  game: null,
  clear: function () {
    // Clear the canvas, happens every update
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  },
  start: function () {
    this.canvas.width = constants.canvasWidth
    this.canvas.height = constants.canvasHeight
    this.context = this.canvas.getContext('2d')
    document.body.insertBefore(this.canvas, document.body.childNodes[0])
    this.game = new Game()
    this.interval = setInterval(updateGameArea, 20)
  },
  update_text: function (xPos) {
    // This was used at one point for debugging and can
    // probably be removed
    this.context.font = '20px Arial'
    this.context.fillStyle = 'white'
    this.context.fillText(xPos.toString(), 400, 480)
  }
}

function updateGameArea () {
  // This is the main update function, it is called every 20 milliseconds
  myGameArea.clear()
  myGameArea.game.update()
  myGameArea.game.draw(myGameArea.context)
}

// Listen for keyboard input
window.addEventListener('keydown', event => {
  const g = myGameArea.game
  let xDirection = 0
  if (event.key === 'a') {
    xDirection = -1
    g.playerShip.move(xDirection)
  } else if (event.key === 'd') {
    xDirection = 1
    g.playerShip.move(xDirection)
  } else if (event.key === ' ') {
    g.firePlayerMissile()
  }
})

function startGame () {
  // This is called by index.html at load time
  myGameArea.start()
}

// For writing text on canvas
//  ctx.font = '20px Arial'
//  ctx.fillStyle = 'white'
//
//  ctx.fillText(alienSpeed.toString() + ',' + alienTickPeriod.toString(),
//               400, 480)
//
// For deleting aliens from the array
// function popAliens () {
//   for (let i = 0; i < alienDeletions.length; i = i + 1) {
//     aliens.splice(alienDeletions[i], 1)
//   }
//   alienDeletions = []
// }
