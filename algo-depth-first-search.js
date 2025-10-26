// DEPTH-FIRST SEARCH (DFS) ALGORITHM
// Deep exploration with systematic backtracking

function depthFirstSearch(pos, facing, algorithmState = {}) {
    // Initialize state
    if (!algorithmState.initialized) {
        algorithmState.visited = new Set([pos]);
        algorithmState.stack = [];
        algorithmState.deadEndsFound = new Set();
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
            explanation: '🚀 DFS: Initial forward move into maze',
            sensorReadings: {
                left: walls.left ? 'WALL' : 'OPEN',
                front: walls.front ? 'WALL' : 'OPEN',
                right: walls.right ? 'WALL' : 'OPEN'
            },
            visitedCount: algorithmState.visited.size
        };
    }
    
    // Mark current position as visited
    algorithmState.visited.add(pos);
    
    // Check if current position is a dead end
    if (isDeadEnd(pos)) {
        algorithmState.deadEndsFound.add(pos);
    }
    
    const walls = getRelativeWalls(pos, facing);
    
    // Find unvisited neighbors
    const possibleMoves = [];
    
    // FRONT
    if (!walls.front) {
        const newPos = getForwardPosition(pos, facing);
        if (newPos >= 0 && !algorithmState.visited.has(newPos)) {
            possibleMoves.push({ dir: 'FORWARD', pos: newPos });
        }
    }
    
    // LEFT
    if (!walls.left) {
        const newFacing = (facing + 3) % 4;
        const newPos = getForwardPosition(pos, newFacing);
        if (newPos >= 0 && !algorithmState.visited.has(newPos)) {
            possibleMoves.push({ dir: 'LEFT', pos: newPos });
        }
    }
    
    // RIGHT
    if (!walls.right) {
        const newFacing = (facing + 1) % 4;
        const newPos = getForwardPosition(pos, newFacing);
        if (newPos >= 0 && !algorithmState.visited.has(newPos)) {
            possibleMoves.push({ dir: 'RIGHT', pos: newPos });
        }
    }
    
    let move, explanation;
    
    if (possibleMoves.length > 0) {
        // Go deep - choose first unvisited direction
        const chosen = possibleMoves[0];
        algorithmState.stack.push({ pos, facing });
        move = chosen.dir;
        explanation = `DFS: Exploring ${chosen.pos} (${algorithmState.deadEndsFound.size} dead ends found)`;
    } else {
        // Backtrack
        if (algorithmState.stack.length > 0) {
            algorithmState.stack.pop();
            
            // Choose any available direction to backtrack
            if (!walls.front) {
                move = 'FORWARD';
            } else if (!walls.left) {
                move = 'LEFT';
            } else if (!walls.right) {
                move = 'RIGHT';
            } else {
                move = 'UTURN';
            }
            explanation = `DFS: Backtracking (${algorithmState.stack.length} depth)`;
        } else {
            // Exploration complete
            move = !walls.front ? 'FORWARD' : (!walls.left ? 'LEFT' : (!walls.right ? 'RIGHT' : 'UTURN'));
            explanation = 'DFS: Exploration complete - navigating to exit';
        }
    }
    
    return {
        move,
        state: algorithmState,
        explanation,
        sensorReadings: {
            left: walls.left ? 'WALL' : 'OPEN',
            front: walls.front ? 'WALL' : 'OPEN',
            right: walls.right ? 'WALL' : 'OPEN'
        },
        visitedCount: algorithmState.visited.size,
        deadEndsFound: algorithmState.deadEndsFound.size,
        stackSize: algorithmState.stack.length
    };
}
