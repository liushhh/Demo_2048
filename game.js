class Game {
  constructor () {
    this.grid = Array(4).fill().map(() => Array(4).fill(0))
    this.score = 0
    this.best = parseInt(localStorage.getItem('best2048') || '0')
    this.isGameOver = false
    this.previousStates = []
    this.init()
  }

  init () {
    // 初始化DOM元素
    this.scoreElement = document.getElementById('score')
    this.bestElement = document.getElementById('best')
    this.tileContainer = document.querySelector('.tile-container')
    document.getElementById('new-game').addEventListener('click', () => this.newGame())
    document.getElementById('undo').addEventListener('click', () => this.undoMove())
    document.addEventListener('keydown', this.handleKeyPress.bind(this))

    // 添加触摸事件支持
    let touchStartX = 0
    let touchStartY = 0
    let touchEndX = 0
    let touchEndY = 0

    document.addEventListener('touchstart', (event) => {
      touchStartX = event.touches[0].clientX
      touchStartY = event.touches[0].clientY
    }, false)

    document.addEventListener('touchmove', (event) => {
      event.preventDefault()
    }, { passive: false })

    document.addEventListener('touchend', (event) => {
      touchEndX = event.changedTouches[0].clientX
      touchEndY = event.changedTouches[0].clientY

      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY
      const minSwipeDistance = 30

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // 水平滑动
        if (Math.abs(deltaX) > minSwipeDistance) {
          if (deltaX > 0) {
            this.handleKeyPress({ key: 'ArrowRight' })
          } else {
            this.handleKeyPress({ key: 'ArrowLeft' })
          }
        }
      } else {
        // 垂直滑动
        if (Math.abs(deltaY) > minSwipeDistance) {
          if (deltaY > 0) {
            this.handleKeyPress({ key: 'ArrowDown' })
          } else {
            this.handleKeyPress({ key: 'ArrowUp' })
          }
        }
      }
    }, false)

    // 初始化背景设置
    document.getElementById('set-bg').addEventListener('click', () => {
      const bgUrl = document.getElementById('bg-url').value
      if (bgUrl) {
        document.querySelector('.game-container').style.backgroundImage = `url(${bgUrl})`
        localStorage.setItem('2048-bg', bgUrl)
      }
    })

    // 加载保存的背景
    const savedBg = localStorage.getItem('2048-bg')
    if (savedBg) {
      document.querySelector('.game-container').style.backgroundImage = `url(${savedBg})`
      document.getElementById('bg-url').value = savedBg
    }

    // 更新分数显示
    this.updateScore()
    this.bestElement.textContent = this.best

    // 开始新游戏
    this.newGame()
  }

  newGame () {
    this.grid = Array(4).fill().map(() => Array(4).fill(0))
    this.score = 0
    this.isGameOver = false
    this.previousStates = []
    this.updateScore()
    this.clearTiles()
    this.addRandomTile()
    this.addRandomTile()
  }

  clearTiles () {
    while (this.tileContainer.firstChild) {
      this.tileContainer.removeChild(this.tileContainer.firstChild)
    }
  }

  updateScore () {
    this.scoreElement.textContent = this.score
    if (this.score > this.best) {
      this.best = this.score
      this.bestElement.textContent = this.best
      localStorage.setItem('best2048', this.best.toString())
    }
  }

  addRandomTile () {
    const emptyCells = []
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.grid[i][j] === 0) {
          emptyCells.push({x: i, y: j})
        }
      }
    }

    if (emptyCells.length > 0) {
      const {x, y} = emptyCells[Math.floor(Math.random() * emptyCells.length)]
      //   this.grid[x][y] = Math.random() < 0.5 ? 2 : 4
      this.grid[x][y] = 2
      this.createTileElement(x, y, this.grid[x][y])
    }
  }

  createTileElement (x, y, value) {
    const tile = document.createElement('div')
    tile.className = `tile tile-${value}`
    tile.textContent = value
    const cellSize = 100; // 每个格子的大小
    const gap = 15; // 格子之间的间距
    const padding = 15; // 容器的内边距
    tile.style.left = `${padding + y * (cellSize + gap)}px`
    tile.style.top = `${padding + x * (cellSize + gap)}px`
    tile.style.width = `${cellSize}px`
    tile.style.height = `${cellSize}px`
    this.tileContainer.appendChild(tile)
    return tile
  }

  handleKeyPress (event) {
    if (this.isGameOver) return

    let moved = false
    // 保存当前状态
    const previousState = {
      grid: JSON.parse(JSON.stringify(this.grid)),
      score: this.score
    }

    switch (event.key) {
      case 'ArrowUp':
        moved = this.moveUp()
        break
      case 'ArrowDown':
        moved = this.moveDown()
        break
      case 'ArrowLeft':
        moved = this.moveLeft()
        break
      case 'ArrowRight':
        moved = this.moveRight()
        break
      default:
        return
    }

    if (moved) {
      this.previousStates.push(previousState)
      if (this.previousStates.length > 10) {
        this.previousStates.shift()
      }
      this.clearTiles()
      this.renderGrid()
      this.addRandomTile()

      if (this.isGameOverState()) {
        this.isGameOver = true
        alert('游戏结束！')
      }
    }
  }

  moveLeft () {
    return this.move(row => {
      const newRow = row.filter(cell => cell !== 0)
      for (let i = 0; i < newRow.length - 1; i++) {
        if (newRow[i] === newRow[i + 1]) {
          newRow[i] *= 2
          this.score += newRow[i]
          newRow.splice(i + 1, 1)
        }
      }
      while (newRow.length < 4) newRow.push(0)
      return newRow
    })
  }

  moveRight () {
    return this.move(row => {
      const newRow = row.filter(cell => cell !== 0)
      for (let i = newRow.length - 1; i > 0; i--) {
        if (newRow[i] === newRow[i - 1]) {
          newRow[i] *= 2
          this.score += newRow[i]
          newRow.splice(i - 1, 1)
          i--
        }
      }
      while (newRow.length < 4) newRow.unshift(0)
      return newRow
    })
  }

  moveUp () {
    return this.move(col => {
      const newCol = col.filter(cell => cell !== 0)
      for (let i = 0; i < newCol.length - 1; i++) {
        if (newCol[i] === newCol[i + 1]) {
          newCol[i] *= 2
          this.score += newCol[i]
          newCol.splice(i + 1, 1)
        }
      }
      while (newCol.length < 4) newCol.push(0)
      return newCol
    }, true)
  }

  moveDown () {
    return this.move(col => {
      const newCol = col.filter(cell => cell !== 0)
      for (let i = newCol.length - 1; i > 0; i--) {
        if (newCol[i] === newCol[i - 1]) {
          newCol[i] *= 2
          this.score += newCol[i]
          newCol.splice(i - 1, 1)
          i--
        }
      }
      while (newCol.length < 4) newCol.unshift(0)
      return newCol
    }, true)
  }

  move (moveFunction, isVertical = false) {
    const oldGrid = JSON.stringify(this.grid)

    if (isVertical) {
      for (let j = 0; j < 4; j++) {
        const column = this.grid.map(row => row[j])
        const newColumn = moveFunction(column)
        for (let i = 0; i < 4; i++) {
          this.grid[i][j] = newColumn[i]
        }
      }
    } else {
      for (let i = 0; i < 4; i++) {
        this.grid[i] = moveFunction([...this.grid[i]])
      }
    }

    const moved = oldGrid !== JSON.stringify(this.grid)
    if (moved) this.updateScore()
    return moved
  }

  renderGrid () {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.grid[i][j] !== 0) {
          this.createTileElement(i, j, this.grid[i][j])
        }
      }
    }
  }

  undoMove () {
    if (this.previousStates.length > 0) {
      const previousState = this.previousStates.pop()
      this.grid = previousState.grid
      this.score = previousState.score
      this.isGameOver = false
      this.clearTiles()
      this.renderGrid()
      this.updateScore()
    }
  }

  isGameOverState () {
    // 检查是否有空格
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.grid[i][j] === 0) return false
      }
    }

    // 检查是否有相邻的相同数字
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (j < 3 && this.grid[i][j] === this.grid[i][j + 1]) return false
        if (i < 3 && this.grid[i][j] === this.grid[i + 1][j]) return false
      }
    }

    return true
  }
}

// 初始化游戏
new Game()
