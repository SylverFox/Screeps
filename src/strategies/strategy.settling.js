exports.run = function() {
  // list all my bases
  const bases = Object.keys(Game.rooms).map(r => Game.rooms[r]).filter(r => r.base)

  // list all diagonal rooms from bases
  let diagRooms = new Set()
  for (let base of bases) {
    if (base.topleft)
      diagRooms.add(base.topleft)
    if (base.topright)
      diagRooms.add(base.topright)
    if (base.bottomleft)
      diagRooms.add(base.bottomleft)
    if (base.bottomright)
      diagRooms.add(base.bottomright)
  }

  // filter on room type (not hostile, empty, fogged)
  let chosenRooms = [...diagRooms].filter(r =>
    Game.rooms[r] &&
    Game.rooms[r].roomType === ROOM_TYPE_FARM
  ).map(r => Game.rooms[r])

  // filter on at least 2 sources
  chosenRooms = chosenRooms.filter(r => r.sources.length >= 2)

  if (!chosenRooms.length) {
    return
  }

  // sort by distance between sources
  chosenRooms = chosenRooms.sort(sortBySourcesDist)

  const chosenRoom = chosenRooms[0]

  // fluid fill to find best spawn point
  const spawnPos = findSpawnPoint(chosenRoom)

  // return roomname and spawn location
  return {roomName: chosenRoom.name, spawnPos: spawnPos}
}

function sortBySourcesDist(roomA, roomB) {
  return roomA.sources[0].pos.findPathTo(roomA.sources[1]).length -
    roomB.sources[0].pos.findPathTo(roomB.sources[1]).length
}

function findSpawnPoint(room) {
  const roomMap = []
  // copy terrain from room
  for (let y = 0; y < 50; y++) {
    roomMap[y] = []
    for (let x = 0; x < 50; x++) {
      roomMap[y][x] = Game.map.getTerrainAt(x, y, room.name) === 'wall' ? 1 : 0
    }
  }

  // fill in borders
  roomMap[0].fill(1)
  roomMap[1].fill(1)
  roomMap[2].fill(1)
  roomMap[47].fill(1)
  roomMap[48].fill(1)
  roomMap[49].fill(1)
  for (let y = 0; y < 50; y++) {
    roomMap[y][0] = 1
    roomMap[y][1] = 1
    roomMap[y][2] = 1
    roomMap[y][47] = 1
    roomMap[y][48] = 1
    roomMap[y][49] = 1
  }

  const left = recursiveFill(roomMap)
  for (let y = 0; y < 50; y++) {
    for (let x = 0; x < 50; x++) {
      if(left[y][x] === 0)
        return new RoomPosition(x, y, room.name)
    }
  }
}

function recursiveFill(matrix) {
  const newMatrix = []
  for (let y = 0; y < 50; y++) {
    newMatrix[y] = []
    for (let x = 0; x < 50; x++) {
      if (matrix[y][x] === 1)
        newMatrix[y][x] = 1
      else {
        newMatrix[y][x] = checkSurrounding(matrix, y, x) ? 1 : 0
      }
    }
  }

  const spaceLeft = checkSpaceLeft(newMatrix)
  if(spaceLeft === 0) {
    return matrix
  } else {
    return recursiveFill(newMatrix)
  }
}

function checkSurrounding(matrix, r, c) {
  let surrounding = matrix[r-1][c-1] + matrix[r-1][c] + matrix[r-1][c+1] +
    matrix[r][c-1] + matrix[r][c] + matrix[r][c+1] +
    matrix[r+1][c-1] + matrix[r+1][c] + matrix[r+1][c+1]

  surrounding = matrix[r-1][c] + matrix[r][c-1] + matrix[r][c+1] + matrix[r+1][c]

  return surrounding > 0
}

function checkSpaceLeft(matrix) {
  const left = matrix.reduce((a, b) => a.concat(b), []).filter(x => x === 0).length
  return left
}
