let playerShip = 0
let myShield = 0
let alienTickFrequency = 79
let alienTickCount = 0
const canvasWidth = 448
const canvasHeight = 512
const shieldWidth = 48
const shieldHeight = 32
const playerStartCoords = [50, 440]

const playerDims = [20, 16]

// https://opengameart.org/content/assets-for-a-space-invader-like-game
//
const assetBaseUrl = 'https://raw.githubusercontent.com/kpmcc/void_invaders/main/assets/'

const greenOne = new Image()
greenOne.src = assetBaseUrl + 'green_one.png'

const greenTwo = new Image()
greenTwo.src = assetBaseUrl + 'green_two.png'

const redOne = new Image()
redOne.src = assetBaseUrl + 'red_one.png'

const redTwo = new Image()
redTwo.src = assetBaseUrl + 'red_two.png'

const yellowOne = new Image()
yellowOne.src = assetBaseUrl + 'yellow_one.png'

const yellowTwo = new Image()
yellowTwo.src = assetBaseUrl + 'yellow_two.png'

const rowColors = ['red', 'yellow', 'yellow', 'green', 'green']

const colorImages = {
  red: [redOne, redTwo],
  yellow: [yellowOne, yellowTwo],
  green: [greenOne, greenTwo]
}

const img = new Image()
img.src = 'https://raw.githubusercontent.com/kpmcc/void_invaders/main/assets/player.png'

const aliens = []
const shields = []

function alienTick () {
  alienTickCount += 1
  if (alienTickCount === alienTickFrequency) {
    alienTickCount = 0
    return true
  } else {
    return false
  }
}

function startGame () {
  const numAlienRows = 5
  const numAlienColumns = 11
  const alienRowSpacing = 36
  const firstAlienRowYPos = 120
  const initialRowYCoords = []
  const shieldHorizontalSpacing = shieldWidth * 2
  const numShields = 4

  for (let i = 0; i < numAlienRows; i += 1) {
    initialRowYCoords.push(firstAlienRowYPos + alienRowSpacing * i)
  }

  playerShip = new Invader(playerStartCoords[0], playerStartCoords[1], img)
  for (let row = 0; row < numAlienRows; row += 1) {
    const alienYPos = initialRowYCoords[row]
    for (let x = 0; x < numAlienColumns; x = x + 1) {
      const rowColor = rowColors[row]
      const alienImgOne = colorImages[rowColor][0]
      const alienImgTwo = colorImages[rowColor][1]
      const myGameAlien = new Invader(x * 30 + 20, alienYPos, alienImgOne, alienImgTwo)
      aliens.push(myGameAlien)
    }
  }
  for (let n = 0; n < numShields; n += 1) {
    const myShield = new Shield(60 + (n * shieldHorizontalSpacing), 380)
    shields.push(myShield)
  }
  myGameArea.start()
}

function getFurthestAlien (aliens, comparisonFn) {
  let furthestAlien = aliens[0]
  for (let i = 1; i < aliens.length; i = i + 1) {
    if (comparisonFn(furthestAlien, aliens[i])) {
      furthestAlien = aliens[i]
    }
  }
  return furthestAlien
}

const myGameArea = {
  canvas: document.createElement('canvas'),
  start: function () {
    this.canvas.width = canvasWidth
    this.canvas.height = canvasHeight
    this.context = this.canvas.getContext('2d')
    document.body.insertBefore(this.canvas, document.body.childNodes[0])
    this.interval = setInterval(updateGameArea, 20)
  },
  clear: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  },

  update_text: function (xPos) {
    this.context.font = '20px Arial'
    this.context.fillStyle = 'white'
    this.context.fillText(xPos.toString(), 400, 480)
  }
}

class Shield {
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
    console.log('New shield at (' + String(this.x) + ',' + String(this.y) + ')')
  }

  update () {
    const ctx = myGameArea.context
    ctx.fillStyle = 'blue'
    ctx.fillRect(this.x, this.y, shieldWidth, shieldHeight)
  }
}

class Invader {
  constructor (x, y, tickImg, tockImg) {
    console.log('New invader at (' + String(x) + ',' + String(y) + ')')
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

  update () {
    const ctx = myGameArea.context
    ctx.drawImage(this.img, this.x, this.y)
  }
}

let xDirection = 1
let alienSpeed = 1
const maxAlienSpeed = 18
const xMax = 400
console.log(xMax)
const xMin = 19

const rightmostComp = function (most, curr) {
  return curr.x > most.x
}
const leftmostComp = function (most, curr) {
  return curr.x < most.x
}

function checkAlienBounds (aliens) {
  const leftmostAlien = getFurthestAlien(aliens, leftmostComp)
  const rightmostAlien = getFurthestAlien(aliens, rightmostComp)

  if (leftmostAlien.x <= xMin) {
    console.log('LeftmostAlien x: ' + String(leftmostAlien.x))
    return true
  }
  if (rightmostAlien.x >= xMax) {
    console.log('RightmostAlien x: ' + String(rightmostAlien.x))
    return true
  }

  return false
}

function increaseAlienSpeed () {
  if (alienTickFrequency > 10) {
    alienTickFrequency -= 10
  } else {
    if (alienTickFrequency > 5) {
      alienTickFrequency = alienTickFrequency / 2
    } else {
      alienSpeed *= 2
    }
  }
}

function updateGameArea () {
  myGameArea.clear()

  const tickAliens = alienTick()
  let alienYIncrement = 0

  if (tickAliens) {
    if (checkAlienBounds(aliens)) {
      alienYIncrement = 20
      xDirection *= -1
      increaseAlienSpeed()
    }
  }

  for (let i = 0; i < aliens.length; i = i + 1) {
    if (tickAliens) {
      aliens[i].move(xDirection * alienSpeed, alienYIncrement)
      aliens[i].x += (xDirection * alienSpeed)
    }
    aliens[i].update()
  }

  playerShip.update()
  for (let n = 0; n < shields.length; n += 1) {
    shields[n].update()
  }
}

const movementIncrement = 2
const playerShipLeftBound = 40
const playerShipRightBound = canvasWidth - (40 + 20)

window.addEventListener('keydown', event => {
  if (event.key === 'w') {
    // playerShip.y -= movementIncrement;
  } else if (event.key === 's') {
    // playerShip.y += movementIncrement;
  } else if (event.key === 'a') {
    playerShip.x -= movementIncrement
  } else if (event.key === 'd') {
    playerShip.x += movementIncrement
  }
  if (playerShip.x < playerShipLeftBound) {
    playerShip.x = playerShipLeftBound
  }
  if (playerShip.x > playerShipRightBound) {
    playerShip.x = (playerShipRightBound)
  }
})
