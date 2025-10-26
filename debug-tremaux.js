// Debug test for Trémaux Algorithm
// Load the required functions and test the Trémaux algorithm

// Mock the required maze functions for testing
function getMazeConfig() {
    return {
        size: 9,
        startPos: 76,
        exitPos: 4,
        deadEnds: new Set([11, 20, 26, 34, 45, 48, 56, 64, 80]),
        totalDeadEnds: 9
    };
}

function getRelativeWalls(pos, facing) {
    // Mock wall data - return some test walls
    return { left: 0, front: 1, right: 0 }; // Left and right open, front blocked
}

function getForwardPosition(pos, facing) {
    // Mock forward position calculation
    const config = getMazeConfig();
    const size = config.size;
    const x = pos % size;
    const y = Math.floor(pos / size);
    
    switch (facing) {
        case 0: // North
            return y > 0 ? (y - 1) * size + x : -1;
        case 1: // East
            return x < size - 1 ? y * size + (x + 1) : -1;
        case 2: // South
            return y < size - 1 ? (y + 1) * size + x : -1;
        case 3: // West
            return x > 0 ? y * size + (x - 1) : -1;
        default:
            return -1;
    }
}

// Test the getNewFacing function
function getNewFacing(currentFacing, moveDirection) {
    switch (moveDirection) {
        case 'LEFT': return (currentFacing + 3) % 4;
        case 'RIGHT': return (currentFacing + 1) % 4;
        case 'UTURN': return (currentFacing + 2) % 4;
        case 'FORWARD': return currentFacing;
        default: return currentFacing;
    }
}

// Simplified Trémaux Algorithm for testing
function testTremauxAlgorithm(pos, facing, algorithmState = {}) {
    console.log('Testing Trémaux Algorithm...');
    console.log('Input:', { pos, facing, algorithmState });
    
    // Initialize state
    if (!algorithmState.pathMarks) {
        algorithmState.pathMarks = new Map();
        algorithmState.visitedEdges = new Set();
        algorithmState.backtrackStack = [];
        console.log('Initialized algorithm state');
    }
    
    const walls = getRelativeWalls(pos, facing);
    console.log('Walls:', walls);
    
    const currentMarks = algorithmState.pathMarks.get(pos) || 0;
    algorithmState.pathMarks.set(pos, currentMarks + 1);
    console.log('Current position marks:', currentMarks + 1);
    
    // Get possible moves
    const possibleMoves = [];
    const directions = ['LEFT', 'FORWARD', 'RIGHT'];
    const wallChecks = [walls.left, walls.front, walls.right];
    
    for (let i = 0; i < directions.length; i++) {
        if (!wallChecks[i]) {
            const newFacing = getNewFacing(facing, directions[i]);
            const newPos = getForwardPosition(pos, newFacing);
            console.log(`Direction ${directions[i]}: newFacing=${newFacing}, newPos=${newPos}`);
            
            if (newPos >= 0) {
                const marks = algorithmState.pathMarks.get(newPos) || 0;
                possibleMoves.push({
                    direction: directions[i],
                    pos: newPos,
                    marks
                });
            }
        }
    }
    
    console.log('Possible moves:', possibleMoves);
    
    let move, explanation;
    
    if (possibleMoves.length === 0) {
        move = 'UTURN';
        explanation = 'Trémaux: Dead end - backtrack';
    } else {
        const unmarked = possibleMoves.filter(m => m.marks === 0);
        const markedOnce = possibleMoves.filter(m => m.marks === 1);
        
        console.log('Unmarked paths:', unmarked);
        console.log('Marked once paths:', markedOnce);
        
        if (unmarked.length > 0) {
            const chosen = unmarked[0];
            move = chosen.direction;
            explanation = `Trémaux: Taking unmarked path to ${chosen.pos}`;
        } else if (markedOnce.length > 0) {
            const chosen = markedOnce[0];
            move = chosen.direction;
            explanation = `Trémaux: Taking path marked once to ${chosen.pos}`;
        } else {
            move = 'UTURN';
            explanation = 'Trémaux: All paths marked twice - backtrack';
        }
    }
    
    const result = {
        move,
        state: algorithmState,
        explanation,
        sensorReadings: {
            left: walls.left ? 'WALL' : 'OPEN',
            front: walls.front ? 'WALL' : 'OPEN',
            right: walls.right ? 'WALL' : 'OPEN'
        },
        pathMarks: algorithmState.pathMarks.size
    };
    
    console.log('Result:', result);
    return result;
}

// Run the test
console.log('=== Trémaux Algorithm Debug Test ===');
try {
    const testResult = testTremauxAlgorithm(76, 0, {});
    console.log('Test completed successfully');
} catch (error) {
    console.error('Test failed:', error);
}