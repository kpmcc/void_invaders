const roundNumber = 0
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
const rowColors = ['green', 'green', 'yellow', 'yellow', 'red']

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

  getPoints () {
    const points = []
    points.push(new Coord(this.x, this.y))
    points.push(new Coord(this.x, this.y - this.length))
    return points
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
  constructor (x, y, tickImg, tockImg, phaseOffset) {
    // console.log('New invader at (' + String(x) + ',' + String(y) + ')')
    this.x = x
    this.y = y
    this.size = [constants.alienWidth, constants.alienHeight]
    this.tick = true
    this.tickImg = tickImg
    this.tockImg = tockImg
    this.img = tickImg
    this.phaseOffset = phaseOffset
    this.intersected = false
    this.advance = false
  }

  containsCoord (c) {
    const width = this.size[0]
    const height = this.size[1]
    if ((c.x >= this.x) && (c.x <= (this.x + width)) &&
        (c.y >= this.y) && (c.y <= (this.y + height))) {
      return true
    } else {
      return false
    }
  }

  remove () {
    this.intersected = true
  }

  checkIntersections (points) {
    for (let pi = 0; pi < points.length; pi += 1) {
      const p = points[pi]
      if (this.containsCoord(p)) {
        return true
      }
    }
    return false
  }

  setAdvance () {
    this.advance = true
  }

  getIntersected () {
    return this.intersected
  }

  update (x, y) {
    let yMove = 0
    if (this.advance) {
      yMove = y
    }
    this.move(x, yMove)
    this.advance = false
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
    this.numAliens = 0
    this.numAlienRows = 5
    this.numAlienColumns = 11
    this.alienToUpdateIndex = [0, 0]
    this.initializeAliens()
    this.initialized = true
    this.recentlyAdvanced = false

  }

  initializeAliens () {
    // Instantiates aliens in their initial positions
    const numAlienRows = this.numAlienRows
    const numAlienColumns = this.numAlienColumns
    const alienRowSpacing = 36
    const alienColumnSpacing = 30
    const alienColumnOffset = 20
    const firstAlienRowYPos = 264
    const initialRowYCoords = []
    this.numAliens = numAlienRows * numAlienColumns

    // Populate array for initial Y coordinates of alien rows
    for (let i = 0; i < numAlienRows; i += 1) {
      initialRowYCoords.push(firstAlienRowYPos - alienRowSpacing * i)
    }

    let phaseOffset = 1

    for (let row = 0; row < numAlienRows; row += 1) {
      const alienYPos = initialRowYCoords[row]
      const alienRow = []
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
        const myGameAlien = new GamePiece(alienXPos, alienYPos, alienImgOne, alienImgTwo, phaseOffset)
        // and add it to the array
        alienRow.push(myGameAlien)
        phaseOffset += 1
      }
      this.aliens.push(alienRow)
    }
  }

  getAliens () {
    const aliensArr = []
    for (let ri = 0; ri < this.aliens.length; ri += 1) {
      const row = this.aliens[ri]
      for (let ci = 0; ci < row.length; ci += 1) {
        const alien = row[ci]
        if (alien !== null) {
          aliensArr.push(alien)
        }
      }
    }
    return aliensArr
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

  advanceAliens () {
    for (let ri = this.aliens.length -1; ri >= 0; ri -= 1) {
      const row = this.aliens[ri]
      for (let ci = 0; ci < row.length; ci += 1) {
        if (row[ci]) {
          row[ci].setAdvance()
        }
      }
    }
  }

  alienTick () {
    // This function advances the game clock
    // that determines whether or not
    // it's time for a particular alien to move
    // It is called every game update, and returns true
    // if we've proceeded through one cycle of the alienTickPeriod
    if (this.alienTickCount === (this.alienTickPeriod - 1)) {
      this.alienTickCount = 0

      const numAliensModifier = (this.numAliens > 0) ? this.numAliens : 55
      this.alienTickPeriod = numAliensModifier + Math.floor(numAliensModifier / 2)
      return true
    } else {
      this.alienTickCount += 1
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
    let furthestAlien
    for (let ri = 0; ri < this.aliens.length; ri = ri + 1) {
      const row = this.aliens[ri]
      for (let ci = 0; ci < row.length; ci += 1) {
        const currAlien = row[ci]
        if ((furthestAlien === undefined) || (currAlien && comparisonFn(furthestAlien, currAlien))) {
          furthestAlien = currAlien
        }
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

  removeAlienIndices (alienIndices) {
    // This will only work correctly if alienIndices.length == 1
    // because the indices will change after every removal with splicing
    if (alienIndices.length !== 1) {
      console.log('Error: removeAlienIndices - alienIndices.length: ' + alienIndices.length.toString())
    }
    for (let i = 0; i < alienIndices.length; i += 1) {
      this.aliens.splice(alienIndices[i], 1)
    }
  }

  getNextAlien () {
    let index = this.alienToUpdateIndex
    let rowIndex = index[0]
    let colIndex = index[1]
    let alien = null
    let alienRow = null
    let count = 0
    while (alien === null) {
      if (count == 55) {
        console.log("error (getNextAlien): all aliens null")
        return null
      }
      if (colIndex === this.numAlienColumns) {
        rowIndex += 1
        colIndex = 0
      }
      if (rowIndex === this.numAlienRows) {
        rowIndex = 0
      }

      alienRow = this.aliens[rowIndex]
      alien = alienRow[colIndex]

      colIndex += 1
      count += 1
    }
    this.alienToUpdateIndex = [rowIndex, colIndex]
    return alien
  }

  update () {
    this.alienTick()

    let advance = this.checkAlienBounds(this.aliens)

    const aliens = this.getAliens()
    for (let i = 0; i < aliens.length; i += 1) {
      const a = aliens[i]
      if (a && a.advance) {
        advance = false
        break
      }
    }

    if (advance) {
      this.xDirection = this.xDirection * -1
      this.advanceAliens()
    }

    let intersected = false
    const scheduledDeletions = []

    for (let ri = 0; ri < this.aliens.length; ri += 1) {
      const row = this.aliens[ri]
      for (let ci = 0; ci < row.length; ci += 1) {
        intersected = (row[ci] != null) && row[ci].getIntersected()
        if (intersected) {
          scheduledDeletions.push([ri, ci])
        }
      }
    }

    const alienToUpdate = this.getNextAlien()
    const xMove = this.xDirection * this.alienSpeed
    const yMove = this.alienYIncrement

    if (alienToUpdate) {
      alienToUpdate.update(xMove, yMove)
    }

    for (let di = 0; di < scheduledDeletions.length; di += 1) {
      const deletionIndices = scheduledDeletions[di]
      const deletionRi = deletionIndices[0]
      const deletionCi = deletionIndices[1]
      const deletionRow = this.aliens[deletionRi]
      delete deletionRow[deletionCi]
      this.numAliens -= 1
    }
  }

  draw (ctx) {
    if (this.xDirection === 1) {
      for (let ri = this.aliens.length - 1; ri >= 0; ri -= 1) {
        const row = this.aliens[ri]
        for (let ci = 0; ci < row.length; ci += 1) {
          if (row[ci]) {
            row[ci].draw(ctx)
          }
        }
      }
    } else if (this.xDirection === -1) {
      for (let ri = this.aliens.length - 1; ri >= 0; ri -= 1) {
        const row = this.aliens[ri]
        for (let ci = row.length - 1; ci >= 0; ci -= 1) {
          if (row[ci]) {
            row[ci].draw(ctx)
          }
        }
      }
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

  checkCollisions (missileArray, targetArray) {
    let removeMissile = false
    for (let mi = 0; mi < missileArray.length; mi += 1) {
      const m = missileArray[mi]
      for (let ti = 0; ti < targetArray.length; ti += 1) {
        const t = targetArray[ti]
        const missilePoints = m.getPoints()
        if (t && t.checkIntersections(missilePoints)) {
          t.remove()
          removeMissile = true
        }
      }
    }
    return removeMissile
  }

  update () {
    this.missileContainer.update()
    // check intersections with aliens
    const aliens = this.alienContainer.getAliens()
    const playerMissiles = this.missileContainer.playerMissiles
    const removeMissile = this.checkCollisions(playerMissiles, aliens)
    if (removeMissile) {
      this.missileContainer.playerMissiles.pop()
    }
    this.alienContainer.update()
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
