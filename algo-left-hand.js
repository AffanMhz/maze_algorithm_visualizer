// LEFT-HAND RULE ALGORITHM
// Simple wall-following algorithm - always prefers turning left

function leftHandRule(pos, facing, algorithmState = {}) {
    // Initialize state
    if (!algorithmState.initialized) {
        algorithmState.initialized = true;
        algorithmState.firstMove = false;
    }
    
    // HARDCODED STEP 1: Always move forward first to enter the maze
    if (!algorithmState.firstMove) {
        algorithmState.firstMove = true;
        const walls = getRelativeWalls(pos, facing);
        return {
            move: 'FORWARD',
            state: algorithmState,
            explanation: '🚀 Left-Hand Rule: Initial forward move into maze',
            sensorReadings: {
                left: walls.left ? 'WALL' : 'OPEN',
                front: walls.front ? 'WALL' : 'OPEN',
                right: walls.right ? 'WALL' : 'OPEN'
            }
        };
    }
    
    const walls = getRelativeWalls(pos, facing);
    let move, explanation;
    
    // Left-Hand Rule: Prefer left, then front, then right, finally U-turn
    if (!walls.left) {
        move = 'LEFT';
        explanation = 'Left wall is open - turn left (Left-Hand Rule)';
    } else if (!walls.front) {
        move = 'FORWARD';
        explanation = 'Left blocked, front open - move forward';
    } else if (!walls.right) {
        move = 'RIGHT';
        explanation = 'Left and front blocked, right open - turn right';
    } else {
        move = 'UTURN';
        explanation = 'All directions blocked - U-turn (backtrack)';
    }
    
    return {
        move,
        state: algorithmState,
        explanation,
        sensorReadings: {
            left: walls.left ? 'WALL' : 'OPEN',
            front: walls.front ? 'WALL' : 'OPEN',
            right: walls.right ? 'WALL' : 'OPEN'
        }
    };
}
