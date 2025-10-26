// RIGHT-HAND RULE ALGORITHM
// Simple wall-following algorithm - always prefers turning right

function rightHandRule(pos, facing, algorithmState = {}) {
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
            explanation: '🚀 Right-Hand Rule: Initial forward move into maze',
            sensorReadings: {
                left: walls.left ? 'WALL' : 'OPEN',
                front: walls.front ? 'WALL' : 'OPEN',
                right: walls.right ? 'WALL' : 'OPEN'
            }
        };
    }
    
    const walls = getRelativeWalls(pos, facing);
    let move, explanation;
    
    // Right-Hand Rule: Prefer right, then front, then left, finally U-turn
    if (!walls.right) {
        move = 'RIGHT';
        explanation = 'Right wall is open - turn right (Right-Hand Rule)';
    } else if (!walls.front) {
        move = 'FORWARD';
        explanation = 'Right blocked, front open - move forward';
    } else if (!walls.left) {
        move = 'LEFT';
        explanation = 'Right and front blocked, left open - turn left';
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
