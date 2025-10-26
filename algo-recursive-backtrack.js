// RECURSIVE BACKTRACKING ALGORITHM
// Systematically explores all paths using depth-first approach with backtracking

function recursiveBacktrack(pos, facing, algorithmState = {}) {
    // Initialize state
    if (!algorithmState.initialized) {
        algorithmState.visited = new Set();
        algorithmState.stack = [];
        algorithmState.initialized = true;
        algorithmState.firstMove = false;
    }
    
    // HARDCODED STEP 1: Always move forward first to enter the maze
    if (!algorithmState.firstMove) {
        algorithmState.firstMove = true;
        algorithmState.visited.add(pos);
        
        const walls = getRelativeWalls(pos, facing);
        return {
            move: 'FORWARD',
            state: algorithmState,
            explanation: '🚀 Recursive Backtrack: Initial forward move into maze',
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
    
    const walls = getRelativeWalls(pos, facing);
    
    // Find unvisited neighbors  
    const possibleMoves = [];
    
    // Check FRONT
    if (!walls.front) {
        const newPos = getForwardPosition(pos, facing);
        if (newPos >= 0 && !algorithmState.visited.has(newPos)) {
            possibleMoves.push({ direction: 'FORWARD', pos: newPos });
        }
    }
    
    // Check LEFT
    if (!walls.left) {
        const newFacing = (facing + 3) % 4; // Turn left
        const newPos = getForwardPosition(pos, newFacing);
        if (newPos >= 0 && !algorithmState.visited.has(newPos)) {
            possibleMoves.push({ direction: 'LEFT', pos: newPos });
        }
    }
    
    // Check RIGHT
    if (!walls.right) {
        const newFacing = (facing + 1) % 4; // Turn right
        const newPos = getForwardPosition(pos, newFacing);
        if (newPos >= 0 && !algorithmState.visited.has(newPos)) {
            possibleMoves.push({ direction: 'RIGHT', pos: newPos });
        }
    }
    
    let move, explanation;
    
    if (possibleMoves.length > 0) {
        // Explore first unvisited neighbor
        const chosen = possibleMoves[0];
        algorithmState.stack.push({ pos, facing });
        move = chosen.direction;
        explanation = `Recursive: Exploring unvisited cell ${chosen.pos} (${algorithmState.visited.size} visited)`;
    } else {
        // All neighbors visited - backtrack
        if (algorithmState.stack.length > 0) {
            const prev = algorithmState.stack.pop();
            
            // Determine direction to previous position
            if (!walls.front && getForwardPosition(pos, facing) === prev.pos) {
                move = 'FORWARD';
            } else if (!walls.left) {
                move = 'LEFT';
            } else if (!walls.right) {
                move = 'RIGHT';
            } else {
                move = 'UTURN';
            }
            explanation = `Recursive: Backtracking (${algorithmState.stack.length} in stack)`;
        } else {
            // Exploration complete
            move = 'FORWARD';
            if (walls.front) move = walls.left ? (walls.right ? 'UTURN' : 'RIGHT') : 'LEFT';
            explanation = 'Recursive: Exploration complete - navigating to exit';
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
        stackSize: algorithmState.stack.length
    };
}
