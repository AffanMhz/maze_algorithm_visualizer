// Maze Data - Extracted from your maze_solver_v6.html
// 4'bNNESW (North, East, South, West) - 1 = wall, 0 = no wall

const b = (s) => parseInt(s, 2); // Helper to convert binary string to int

// Given Maze (9×9) - Your current maze from maze_solver_v6.html  
const GIVEN_MAZE_DATA = [
    b('1011'), b('1000'), b('1000'), b('1100'), b('0001'), b('1110'), b('1001'), b('1010'), b('1100'),
    b('1001'), b('0110'), b('0111'), b('0101'), b('0101'), b('1001'), b('0110'), b('1001'), b('0100'),
    b('0011'), b('1110'), b('1001'), b('0110'), b('0011'), b('0110'), b('1001'), b('0110'), b('0101'),
    b('1001'), b('1010'), b('0110'), b('1001'), b('1010'), b('1100'), b('0101'), b('1101'), b('0101'),
    b('0011'), b('1000'), b('1100'), b('0011'), b('1100'), b('0101'), b('0011'), b('0110'), b('0101'),
    b('1011'), b('0100'), b('0101'), b('1101'), b('0101'), b('0011'), b('1010'), b('1100'), b('0101'),
    b('1001'), b('0110'), b('0001'), b('0010'), b('0010'), b('1010'), b('1100'), b('0011'), b('0110'),
    b('0101'), b('1011'), b('0110'), b('1001'), b('1100'), b('1001'), b('0110'), b('1001'), b('1100'),
    b('0011'), b('1010'), b('1010'), b('0110'), b('0101'), b('0011'), b('1010'), b('0110'), b('0111')
];

// Surprise Maze (8×8) - Based on the specifications you provided
const SURPRISE_MAZE_DATA = [
    b('1011'), b('1001'), b('1001'), b('0100'), b('0101'), b('1001'), b('1010'), b('1100'),
    b('1001'), b('0110'), b('0011'), b('0110'), b('0001'), b('0110'), b('1001'), b('0100'),
    b('0011'), b('1100'), b('1001'), b('1100'), b('0011'), b('1100'), b('0011'), b('0110'),
    b('1001'), b('0101'), b('0011'), b('0110'), b('1001'), b('0110'), b('1001'), b('1100'),
    b('0011'), b('0010'), b('1100'), b('1001'), b('0110'), b('1001'), b('0110'), b('0101'),
    b('1011'), b('1100'), b('0101'), b('0011'), b('1100'), b('0011'), b('1100'), b('0101'),
    b('1001'), b('0110'), b('0001'), b('1100'), b('0101'), b('1001'), b('0110'), b('0101'),
    b('0011'), b('1010'), b('0110'), b('0111'), b('0011'), b('0110'), b('1010'), b('0111')
];

// Maze configurations
const MAZE_CONFIGS = {
    given: {
        data: GIVEN_MAZE_DATA,
        size: 9,
        startPos: 76, // (4, 8) - bottom center
        exitPos: 4,   // (4, 0) - top center  
        startFacing: 0, // North
        deadEnds: new Set([11, 20, 26, 34, 45, 48, 56, 64, 80]),
        totalDeadEnds: 9,
        minSteps: 112,
        maxSteps: 250,
        maxScore: 20
    },
    surprise: {
        data: SURPRISE_MAZE_DATA,
        size: 8,
        startPos: 24, // (3, 0) - top center (3*8 + 0 = 24)
        exitPos: 60,  // (4, 7) - bottom center (4 + 7*8 = 60)
        startFacing: 2, // South
        deadEnds: new Set([7, 16, 23, 41, 48]), // Example dead ends for 8x8 maze
        totalDeadEnds: 5,
        minSteps: 110,
        maxSteps: 200,
        maxScore: 10
    }
};

// Current maze configuration
let currentMaze = 'given';

// Helper functions for maze navigation
function getMazeConfig() {
    return MAZE_CONFIGS[currentMaze];
}

function posToCoords(pos, size = getMazeConfig().size) {
    return {
        x: pos % size,
        y: Math.floor(pos / size)
    };
}

function coordsToPos(x, y, size = getMazeConfig().size) {
    return y * size + x;
}

function getWallsAtPosition(pos) {
    const config = getMazeConfig();
    if (pos < 0 || pos >= config.data.length) {
        return { north: 1, east: 1, south: 1, west: 1 }; // All walls if out of bounds
    }
    
    const walls = config.data[pos];
    return {
        north: (walls & 8) ? 1 : 0, // Bit 3
        east:  (walls & 4) ? 1 : 0, // Bit 2
        south: (walls & 2) ? 1 : 0, // Bit 1
        west:  (walls & 1) ? 1 : 0  // Bit 0
    };
}

function getRelativeWalls(pos, facing) {
    const absWalls = getWallsAtPosition(pos);
    
    switch (facing) {
        case 0: // Facing North
            return { left: absWalls.west, front: absWalls.north, right: absWalls.east };
        case 1: // Facing East
            return { left: absWalls.north, front: absWalls.east, right: absWalls.south };
        case 2: // Facing South
            return { left: absWalls.east, front: absWalls.south, right: absWalls.west };
        case 3: // Facing West
            return { left: absWalls.south, front: absWalls.west, right: absWalls.north };
        default:
            return { left: 1, front: 1, right: 1 };
    }
}

function getForwardPosition(pos, facing) {
    const config = getMazeConfig();
    const size = config.size;
    const coords = posToCoords(pos, size);
    
    switch (facing) {
        case 0: // North
            return coords.y > 0 ? coordsToPos(coords.x, coords.y - 1, size) : -1;
        case 1: // East
            return coords.x < size - 1 ? coordsToPos(coords.x + 1, coords.y, size) : -1;
        case 2: // South
            return coords.y < size - 1 ? coordsToPos(coords.x, coords.y + 1, size) : -1;
        case 3: // West
            return coords.x > 0 ? coordsToPos(coords.x - 1, coords.y, size) : -1;
        default:
            return -1;
    }
}

function isDeadEnd(pos) {
    const walls = getWallsAtPosition(pos);
    const wallCount = walls.north + walls.east + walls.south + walls.west;
    return wallCount >= 3;
}

function getAllNeighbors(pos) {
    const config = getMazeConfig();
    const size = config.size;
    const coords = posToCoords(pos, size);
    const neighbors = [];
    const walls = getWallsAtPosition(pos);
    
    // North
    if (coords.y > 0 && !walls.north) {
        neighbors.push(coordsToPos(coords.x, coords.y - 1, size));
    }
    // East
    if (coords.x < size - 1 && !walls.east) {
        neighbors.push(coordsToPos(coords.x + 1, coords.y, size));
    }
    // South
    if (coords.y < size - 1 && !walls.south) {
        neighbors.push(coordsToPos(coords.x, coords.y + 1, size));
    }
    // West
    if (coords.x > 0 && !walls.west) {
        neighbors.push(coordsToPos(coords.x - 1, coords.y, size));
    }
    
    return neighbors;
}

// Scoring functions
function calculateScore(steps, deadEndsFound, totalDeadEnds, minSteps, maxScore) {
    if (steps === 0) return 0;
    
    const explorationRatio = deadEndsFound / totalDeadEnds;
    const efficiencyRatio = Math.min(minSteps / steps, 1);
    return maxScore * explorationRatio * efficiencyRatio;
}

function getScoreForMaze(steps, deadEndsFound, mazeType) {
    const config = MAZE_CONFIGS[mazeType];
    return calculateScore(steps, deadEndsFound, config.totalDeadEnds, config.minSteps, config.maxScore);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MAZE_CONFIGS,
        getMazeConfig,
        posToCoords,
        coordsToPos,
        getWallsAtPosition,
        getRelativeWalls,
        getForwardPosition,
        isDeadEnd,
        getAllNeighbors,
        calculateScore,
        getScoreForMaze
    };
}