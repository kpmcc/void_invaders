let myGamePiece = 0
let alienTickFrequency = 79
let alienTickCount = 0

// https://opengameart.org/content/assets-for-a-space-invader-like-game

const alien = new Image()
alien.src = 'https://raw.githubusercontent.com/kpmcc/void_invaders/main/assets/green_one.png'

const alienTock = new Image()
alienTock.src = 'https://raw.githubusercontent.com/kpmcc/void_invaders/main/assets/green_two.png'

const img = new Image()
img.src = 'https://raw.githubusercontent.com/kpmcc/void_invaders/main/assets/player.png'

const aliens = []

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
  const firstAlienRowYPos = 80
  const initialRowYCoords = []

  for (let i = 0; i < numAlienRows; i += 1) {
    initialRowYCoords.push(firstAlienRowYPos + alienRowSpacing * i)
  }

  myGamePiece = new Invader(50, 440, img)
  for (let row = 0; row < numAlienRows; row += 1) {
    const alienYPos = initialRowYCoords[row]
    for (let x = 0; x < numAlienColumns; x = x + 1) {
      myGameAlien = new Invader(x * 30 + 20, alienYPos, alien, alienTock)
      aliens.push(myGameAlien)
    }
  }
  myShield = new Shield(50, 360)
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
    this.canvas.width = 448
    this.canvas.height = 512
    this.context = this.canvas.getContext('2d')
    document.body.insertBefore(this.canvas, document.body.childNodes[0])
    this.interval = setInterval(updateGameArea, 20)
  },
  clear: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
  },

  update_text: function (x_pos) {
    this.context.font = '20px Arial'
    this.context.fillStyle = 'white'
    this.context.fillText(x_pos.toString(), 400, 480)
  }
}

class Shield {
  constructor (x, y) {
    this.x = x
    this.y = y
    this.defenses = []
    for (let i = 0; i < 6; i+=1) {
      let columnStrength = []
      for (let j = 0; j < 4; j+=1) {
        columnStrength.push(true)
      }
      this.defenses.push(columnStrength)
    }
    console.log(this.defenses)
  }

  update () {
    const ctx = myGameArea.context
    ctx.fillStyle = 'blue'
    ctx.fillRect(this.x, this.y, 50, 50)
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


function advanceAliens (aliens) {
    for (let i = 0; i < aliens.length; i += 1) {
      aliens[i].move(0, 20)
    }

    xDirection *= -1
}

function checkAlienBounds(aliens) {
    leftmostAlien = getFurthestAlien(aliens, leftmostComp)
    rightmostAlien = getFurthestAlien(aliens, rightmostComp)

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

  myGamePiece.update()
  myShield.update()
  myGameArea.update_text(myGameAlien.x)
}

const movementIncrement = 2

window.addEventListener('keydown', event => {
  if (event.key === 'w') {
    // myGamePiece.y -= movementIncrement;
  } else if (event.key === 's') {
    // myGamePiece.y += movementIncrement;
  } else if (event.key === 'a') {
    myGamePiece.x -= movementIncrement
  } else if (event.key === 'd') {
    myGamePiece.x += movementIncrement
  }
  if (myGamePiece.x < 0) { myGamePiece.x = 0 }
  if (myGamePiece.x > (myGameArea.canvas.width - 40)) { myGamePiece.x = (myGameArea.canvas.width - 40) }
})
