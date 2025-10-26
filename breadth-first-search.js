/**
 * Breadth-First Search (BFS) Maze Solver
 * 
 * BFS explores the maze level by level, guaranteeing the shortest path
 * from start to exit. It uses a queue to process nodes in FIFO order.
 * 
 * Key Features:
 * - Guaranteed shortest path
 * - Complete exploration (finds solution if one exists)
 * - Memory intensive (stores all frontier nodes)
 * - Optimal for unweighted graphs/mazes
 */

class BreadthFirstSearch {
    constructor() {
        this.name = "Breadth-First Search";
        this.shortName = "BFS";
        this.description = "Level-by-level exploration guaranteeing shortest path";
    }

    /**
     * Initialize BFS algorithm state
     */
    initialize() {
        return {
            queue: [],              // FIFO queue for BFS
            visited: new Set(),     // Visited positions
            parent: new Map(),      // Parent tracking for path reconstruction
            deadEndsFound: new Set(), // Dead ends discovered
            path: [],               // Current shortest path
            level: 0,               // Current BFS level/distance
            steps: 0,               // Total algorithm steps
            phase: 'exploring',     // 'exploring' | 'path_found' | 'following_path'
            pathIndex: 0,           // Index in path when following
            initialized: true
        };
    }

    /**
     * Main BFS algorithm step
     */
    solve(pos, facing, algorithmState = {}) {
        // Initialize if needed
        if (!algorithmState.initialized) {
            algorithmState = this.initialize();
            
            // Add starting position to queue
            algorithmState.queue.push({
                position: pos,
                level: 0,
                parent: null
            });
            algorithmState.visited.add(pos);
        }

        const walls = getRelativeWalls(pos, facing);
        algorithmState.steps++;

        // Check if current position is a dead end
        this.detectDeadEnd(pos, walls, algorithmState);

        let move, explanation;

        if (algorithmState.phase === 'exploring') {
            // BFS exploration phase
            const result = this.exploreWithBFS(pos, facing, algorithmState);
            move = result.move;
            explanation = result.explanation;
        } else if (algorithmState.phase === 'path_found') {
            // Path found, start following it
            algorithmState.phase = 'following_path';
            algorithmState.pathIndex = 0;
            const result = this.followPath(pos, facing, algorithmState);
            move = result.move;
            explanation = result.explanation;
        } else {
            // Following optimal path
            const result = this.followPath(pos, facing, algorithmState);
            move = result.move;
            explanation = result.explanation;
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
            // BFS specific metrics
            queueSize: algorithmState.queue.length,
            visitedCount: algorithmState.visited.size,
            currentLevel: algorithmState.level,
            deadEndsFound: algorithmState.deadEndsFound.size,
            phase: algorithmState.phase,
            pathLength: algorithmState.path.length,
            steps: algorithmState.steps
        };
    }

    /**
     * BFS exploration using queue
     */
    exploreWithBFS(pos, facing, algorithmState) {
        // Process current level in BFS
        if (algorithmState.queue.length === 0) {
            return {
                move: 'FORWARD',
                explanation: 'BFS: No more nodes to explore'
            };
        }

        // Get current node from queue
        const currentNode = algorithmState.queue.shift();
        const currentPos = currentNode.position;
        algorithmState.level = currentNode.level;

        // Check if we reached the exit
        try {
            const exitPos = getMazeConfig().exitPos;
            if (currentPos === exitPos) {
                // Reconstruct path
                algorithmState.path = this.reconstructPath(currentPos, algorithmState.parent);
                algorithmState.phase = 'path_found';
                return {
                    move: 'FORWARD',
                    explanation: `BFS: Exit found! Path length: ${algorithmState.path.length}`
                };
            }
        } catch (error) {
            // Fallback exit detection
            if (currentPos === 4) { // Top center (0,4) = position 4
                algorithmState.path = this.reconstructPath(currentPos, algorithmState.parent);
                algorithmState.phase = 'path_found';
                return {
                    move: 'FORWARD',
                    explanation: `BFS: Exit found! Path length: ${algorithmState.path.length}`
                };
            }
        }

        // Add all valid neighbors to queue
        const neighbors = this.getValidNeighbors(currentPos);
        for (const neighbor of neighbors) {
            if (!algorithmState.visited.has(neighbor)) {
                algorithmState.visited.add(neighbor);
                algorithmState.parent.set(neighbor, currentPos);
                algorithmState.queue.push({
                    position: neighbor,
                    level: currentNode.level + 1,
                    parent: currentPos
                });
            }
        }

        // Move towards current BFS target
        if (currentPos !== pos) {
            // Navigate to the position we're exploring
            const direction = this.getDirectionToTarget(pos, currentPos, facing);
            return {
                move: direction,
                explanation: `BFS: Exploring level ${algorithmState.level}, node ${currentPos} (Queue: ${algorithmState.queue.length})`
            };
        } else {
            // We're at the target, continue BFS
            return {
                move: 'FORWARD',
                explanation: `BFS: At exploration node ${currentPos}, continuing search`
            };
        }
    }

    /**
     * Follow the optimal path found by BFS
     */
    followPath(pos, facing, algorithmState) {
        if (algorithmState.pathIndex >= algorithmState.path.length - 1) {
            return {
                move: 'FORWARD',
                explanation: 'BFS: Path complete - at exit!'
            };
        }

        const targetPos = algorithmState.path[algorithmState.pathIndex + 1];
        const direction = this.getDirectionToTarget(pos, targetPos, facing);
        
        algorithmState.pathIndex++;

        return {
            move: direction,
            explanation: `BFS: Following optimal path (${algorithmState.pathIndex}/${algorithmState.path.length}) to ${targetPos}`
        };
    }

    /**
     * Get valid neighboring positions
     */
    getValidNeighbors(pos) {
        const neighbors = [];
        const walls = getWalls(pos);
        
        // Check each direction for valid moves
        if (!walls.north && pos >= 9) neighbors.push(pos - 9);  // North
        if (!walls.east && (pos % 9) < 8) neighbors.push(pos + 1);   // East  
        if (!walls.south && pos < 72) neighbors.push(pos + 9);  // South
        if (!walls.west && (pos % 9) > 0) neighbors.push(pos - 1);   // West
        
        return neighbors.filter(n => n >= 0 && n < 81); // Valid maze positions
    }

    /**
     * Reconstruct path from start to target using parent tracking
     */
    reconstructPath(target, parentMap) {
        const path = [];
        let current = target;
        
        while (current !== null && current !== undefined) {
            path.unshift(current);
            current = parentMap.get(current);
        }
        
        return path;
    }

    /**
     * Calculate direction to move from current position to target
     */
    getDirectionToTarget(currentPos, targetPos, facing) {
        const diff = targetPos - currentPos;
        let targetDirection;
        
        // Determine target direction
        if (diff === -9) targetDirection = 0; // North
        else if (diff === 1) targetDirection = 1; // East
        else if (diff === 9) targetDirection = 2; // South
        else if (diff === -1) targetDirection = 3; // West
        else return 'FORWARD'; // Same position or invalid
        
        // Calculate turn needed
        const turnDiff = (targetDirection - facing + 4) % 4;
        
        switch (turnDiff) {
            case 0: return 'FORWARD';
            case 1: return 'RIGHT';
            case 2: return 'UTURN';
            case 3: return 'LEFT';
            default: return 'FORWARD';
        }
    }

    /**
     * Detect dead ends for scoring
     */
    detectDeadEnd(pos, walls, algorithmState) {
        const wallCount = (walls.left ? 1 : 0) + (walls.front ? 1 : 0) + (walls.right ? 1 : 0);
        if (wallCount >= 2) {
            algorithmState.deadEndsFound.add(pos);
        }
    }
}

// Create BFS algorithm function for integration
function breadthFirstSearch(pos, facing, algorithmState = {}) {
    if (!algorithmState.bfsInstance) {
        algorithmState.bfsInstance = new BreadthFirstSearch();
    }
    
    return algorithmState.bfsInstance.solve(pos, facing, algorithmState);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BreadthFirstSearch,
        breadthFirstSearch
    };
}
