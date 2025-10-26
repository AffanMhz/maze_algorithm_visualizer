/**
 * Depth-First Search (DFS) Maze Solver
 * 
 * DFS explores the maze by going as deep as possible along each branch
 * before backtracking. It uses a stack (or recursion) to process nodes in LIFO order.
 * 
 * Key Features:
 * - Memory efficient (only stores current path)
 * - May not find shortest path
 * - Excellent for maze exploration and dead-end discovery
 * - Natural backtracking behavior
 * - Good for finding ANY solution quickly
 */

class DepthFirstSearch {
    constructor() {
        this.name = "Depth-First Search";
        this.shortName = "DFS";
        this.description = "Deep exploration with systematic backtracking";
    }

    /**
     * Initialize DFS algorithm state
     */
    initialize() {
        return {
            stack: [],              // LIFO stack for DFS
            visited: new Set(),     // Visited positions  
            path: [],               // Current exploration path
            deadEndsFound: new Set(), // Dead ends discovered
            backtrackPath: [],      // Path for backtracking
            steps: 0,               // Total algorithm steps
            phase: 'exploring',     // 'exploring' | 'backtracking' | 'path_found'
            currentDepth: 0,        // Current exploration depth
            maxDepth: 0,            // Maximum depth reached
            branchPoints: new Map(), // Junctions with unexplored paths
            targetFound: false,     // Whether exit has been found
            solutionPath: [],       // Final solution path
            initialized: true
        };
    }

    /**
     * Main DFS algorithm step
     */
    solve(pos, facing, algorithmState = {}) {
        // Initialize if needed
        if (!algorithmState.initialized) {
            algorithmState = this.initialize();
            algorithmState.stack.push(pos);
            algorithmState.visited.add(pos);
            algorithmState.path.push(pos);
        }

        const walls = getRelativeWalls(pos, facing);
        algorithmState.steps++;

        // Check if current position is a dead end
        this.detectDeadEnd(pos, walls, algorithmState);

        // Check if we reached the exit
        if (!algorithmState.targetFound) {
            algorithmState.targetFound = this.checkIfExit(pos);
            if (algorithmState.targetFound) {
                algorithmState.solutionPath = [...algorithmState.path];
                algorithmState.phase = 'path_found';
            }
        }

        let move, explanation;

        if (algorithmState.phase === 'exploring') {
            const result = this.exploreWithDFS(pos, facing, algorithmState);
            move = result.move;
            explanation = result.explanation;
        } else if (algorithmState.phase === 'backtracking') {
            const result = this.backtrack(pos, facing, algorithmState);
            move = result.move;
            explanation = result.explanation;
        } else {
            // Path found, continue or stop
            move = 'FORWARD';
            explanation = `DFS: Solution found! Path length: ${algorithmState.solutionPath.length}`;
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
            // DFS specific metrics
            stackSize: algorithmState.stack.length,
            visitedCount: algorithmState.visited.size,
            currentDepth: algorithmState.currentDepth,
            maxDepth: algorithmState.maxDepth,
            deadEndsFound: algorithmState.deadEndsFound.size,
            phase: algorithmState.phase,
            pathLength: algorithmState.path.length,
            branchPoints: algorithmState.branchPoints.size,
            steps: algorithmState.steps
        };
    }

    /**
     * DFS exploration using stack
     */
    exploreWithDFS(pos, facing, algorithmState) {
        // Get unvisited neighbors
        const neighbors = this.getValidNeighbors(pos);
        const unvisitedNeighbors = neighbors.filter(n => !algorithmState.visited.has(n));

        if (unvisitedNeighbors.length > 0) {
            // Store branch point if multiple choices
            if (unvisitedNeighbors.length > 1) {
                algorithmState.branchPoints.set(pos, unvisitedNeighbors.slice(1));
            }

            // Choose next position (prioritize forward for efficiency)
            const nextPos = this.selectNextPosition(pos, unvisitedNeighbors, facing);
            
            // Move to next position
            algorithmState.visited.add(nextPos);
            algorithmState.stack.push(nextPos);
            algorithmState.path.push(nextPos);
            algorithmState.currentDepth++;
            
            if (algorithmState.currentDepth > algorithmState.maxDepth) {
                algorithmState.maxDepth = algorithmState.currentDepth;
            }

            const direction = this.getDirectionToTarget(pos, nextPos, facing);
            return {
                move: direction,
                explanation: `DFS: Exploring depth ${algorithmState.currentDepth}, moving to ${nextPos} (${algorithmState.deadEndsFound.size} dead ends found)`
            };
        } else {
            // No unvisited neighbors, start backtracking
            algorithmState.phase = 'backtracking';
            return this.backtrack(pos, facing, algorithmState);
        }
    }

    /**
     * Backtrack to find alternative paths
     */
    backtrack(pos, facing, algorithmState) {
        // Remove current position from path
        if (algorithmState.path.length > 0) {
            algorithmState.path.pop();
            algorithmState.currentDepth--;
        }

        // Pop from stack
        if (algorithmState.stack.length > 0) {
            algorithmState.stack.pop();
        }

        // Check if we have unexplored branches
        for (const [branchPos, unexplored] of algorithmState.branchPoints.entries()) {
            const stillUnvisited = unexplored.filter(n => !algorithmState.visited.has(n));
            if (stillUnvisited.length > 0) {
                // Found a branch point with unexplored paths
                algorithmState.branchPoints.set(branchPos, stillUnvisited);
                algorithmState.phase = 'exploring';
                
                // Navigate to branch point
                const direction = this.getDirectionToTarget(pos, branchPos, facing);
                return {
                    move: direction,
                    explanation: `DFS: Backtracking to branch point ${branchPos} (${stillUnvisited.length} unexplored paths)`
                };
            } else {
                // Remove exhausted branch point
                algorithmState.branchPoints.delete(branchPos);
            }
        }

        // Continue backtracking if no branches found
        if (algorithmState.path.length > 0) {
            const targetPos = algorithmState.path[algorithmState.path.length - 1];
            const direction = this.getDirectionToTarget(pos, targetPos, facing);
            return {
                move: direction,
                explanation: `DFS: Backtracking to ${targetPos} (depth ${algorithmState.currentDepth})`
            };
        } else {
            // Exploration complete
            algorithmState.phase = 'path_found';
            return {
                move: 'FORWARD',
                explanation: `DFS: Exploration complete! Found ${algorithmState.deadEndsFound.size} dead ends`
            };
        }
    }

    /**
     * Select next position for DFS exploration
     */
    selectNextPosition(currentPos, unvisitedNeighbors, facing) {
        // Priority order: Forward, Left, Right, Back
        const directions = [
            { pos: currentPos - 9, dir: 0 },  // North
            { pos: currentPos + 1, dir: 1 },  // East
            { pos: currentPos + 9, dir: 2 },  // South
            { pos: currentPos - 1, dir: 3 }   // West
        ];

        // Find direction closest to current facing
        for (let offset = 0; offset < 4; offset++) {
            const targetDir = (facing + offset) % 4;
            const dirInfo = directions[targetDir];
            if (unvisitedNeighbors.includes(dirInfo.pos)) {
                return dirInfo.pos;
            }
        }

        // Fallback to first unvisited neighbor
        return unvisitedNeighbors[0];
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
     * Check if current position is the exit
     */
    checkIfExit(pos) {
        try {
            const exitPos = getMazeConfig().exitPos;
            return pos === exitPos;
        } catch (error) {
            // Fallback exit detection (top center)
            return pos === 4;
        }
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

// Create DFS algorithm function for integration
function depthFirstSearch(pos, facing, algorithmState = {}) {
    if (!algorithmState.dfsInstance) {
        algorithmState.dfsInstance = new DepthFirstSearch();
    }
    
    return algorithmState.dfsInstance.solve(pos, facing, algorithmState);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DepthFirstSearch,
        depthFirstSearch
    };
}
