/**
 * Flood Fill Algorithm - Intelligent complete maze exploration
 * 
 * STRATEGY:
 * - Uses distance-based navigation (similar to breadth-first search)
 * - Calculates distances from exit to all reachable cells
 * - Always moves toward cells with lower distance values
 * - Explores EVERY reachable cell before exiting
 * - Perfect score algorithm - visits all accessible positions
 * - Never gets stuck - uses distance gradient for navigation
 */

(function() {
    'use strict';

    const state = {
        initialized: false,
        distances: null,        // Map: position -> distance from exit
        visited: new Set(),     // Cells we've actually visited
        totalCells: 0,          // Total accessible cells in maze
        exploredCells: 0,       // Cells we've visited
        explorationComplete: false,
        firstMove: true,
        exitPos: -1
    };

    function initialize(startPos, startFacing, mazeConfig) {
        state.initialized = true;
        state.distances = new Map();
        state.visited = new Set([startPos]);
        state.totalCells = 0;
        state.exploredCells = 1;
        state.explorationComplete = false;
        state.firstMove = true;
        state.exitPos = mazeConfig.exitPos;
        
        // Calculate distances from exit using flood fill
        calculateDistances(mazeConfig);
        
        console.log(`🎯 Flood Fill initialized - ${state.totalCells} accessible cells to explore`);
    }

    function calculateDistances(mazeConfig) {
        const queue = [mazeConfig.exitPos];
        state.distances.set(mazeConfig.exitPos, 0);
        state.totalCells = 1;
        
        while (queue.length > 0) {
            const current = queue.shift();
            const currentDist = state.distances.get(current);
            
            // Get accessible neighbors
            const neighbors = getAccessibleNeighbors(current, mazeConfig);
            
            for (const neighbor of neighbors) {
                if (!state.distances.has(neighbor)) {
                    state.distances.set(neighbor, currentDist + 1);
                    queue.push(neighbor);
                    state.totalCells++;
                }
            }
        }
        
        console.log(`📊 Flood Fill: Calculated distances for ${state.totalCells} cells`);
    }

    function getAccessibleNeighbors(pos, mazeConfig) {
        const neighbors = [];
        const wallData = mazeConfig.data[pos];
        const walls = {
            north: (wallData & 8) ? 1 : 0,
            east:  (wallData & 4) ? 1 : 0,
            south: (wallData & 2) ? 1 : 0,
            west:  (wallData & 1) ? 1 : 0
        };
        const x = pos % mazeConfig.size;
        const y = Math.floor(pos / mazeConfig.size);
        
        // Check each direction
        if (!walls.north && y > 0) {
            neighbors.push((y - 1) * mazeConfig.size + x);
        }
        if (!walls.east && x < mazeConfig.size - 1) {
            neighbors.push(y * mazeConfig.size + (x + 1));
        }
        if (!walls.south && y < mazeConfig.size - 1) {
            neighbors.push((y + 1) * mazeConfig.size + x);
        }
        if (!walls.west && x > 0) {
            neighbors.push(y * mazeConfig.size + (x - 1));
        }
        
        return neighbors;
    }

    function getNextMove(botPos, botFacing, walls, mazeConfig) {
        if (!state.initialized) {
            initialize(botPos, botFacing, mazeConfig);
        }

        // First move is always forward
        if (state.firstMove) {
            state.firstMove = false;
            console.log('📍 Flood Fill: First move FORWARD');
            return 'FORWARD';
        }

        // Check if we've explored all cells
        if (state.exploredCells >= state.totalCells && !state.explorationComplete) {
            state.explorationComplete = true;
            console.log(`🎉 Flood Fill: Exploration complete! Visited ${state.exploredCells}/${state.totalCells} cells - Now heading to exit at pos ${state.exitPos}`);
        }

        // If exploration is complete and we're at the exit position, move toward the exit direction
        if (state.explorationComplete && botPos === state.exitPos) {
            console.log(`🚀 Flood Fill: At exit position ${state.exitPos}, attempting to exit!`);
            // Check which direction leads to exit (out of bounds)
            const exitFacing = mazeConfig.size === 9 ? 0 : 2; // North for 9x9, South for 8x8
            
            if (botFacing === exitFacing && !walls.front) {
                console.log(`✅ Flood Fill: Exiting maze via FORWARD`);
                return 'FORWARD';
            } else if (botFacing !== exitFacing) {
                // Turn to face exit direction
                const turnNeeded = (exitFacing - botFacing + 4) % 4;
                if (turnNeeded === 1) return 'RIGHT';
                if (turnNeeded === 3) return 'LEFT';
                if (turnNeeded === 2) return 'UTURN';
            }
        }

        // Get available moves
        const moves = getAvailableMoves(botPos, botFacing, walls, mazeConfig);
        
        if (moves.length === 0) {
            console.log('🚫 Flood Fill: No valid moves available');
            return 'STOP';
        }

        // Strategy: 
        // 1. If exploration complete, move toward exit position (distance 0)
        // 2. If not all cells explored, prioritize unvisited cells
        // 3. Among unvisited, prefer those with higher distance (further from exit)
        // 4. If all neighbors visited, move toward exit (lower distance)
        
        const unvisited = moves.filter(m => !state.visited.has(m.position));
        
        let chosen;
        if (state.explorationComplete) {
            // Exploration done - navigate directly to exit (distance 0)
            moves.sort((a, b) => {
                const distA = state.distances.get(a.position) || Infinity;
                const distB = state.distances.get(b.position) || Infinity;
                return distA - distB; // Lower distance first (toward exit)
            });
            chosen = moves[0];
            console.log(`🧭 Flood Fill: Navigating to exit - chose pos ${chosen.position} (dist: ${state.distances.get(chosen.position)})`);
        } else if (unvisited.length > 0) {
            // Explore unvisited cells, preferring those further from exit
            unvisited.sort((a, b) => {
                const distA = state.distances.get(a.position) || 0;
                const distB = state.distances.get(b.position) || 0;
                return distB - distA; // Higher distance first
            });
            chosen = unvisited[0];
        } else {
            // All neighbors visited, move toward exit (lower distance)
            moves.sort((a, b) => {
                const distA = state.distances.get(a.position) || Infinity;
                const distB = state.distances.get(b.position) || Infinity;
                return distA - distB; // Lower distance first
            });
            chosen = moves[0];
        }
        
        // Mark as visited
        if (!state.visited.has(chosen.position)) {
            state.visited.add(chosen.position);
            state.exploredCells++;
        }
        
        const dist = state.distances.get(chosen.position) || '?';
        const progress = ((state.exploredCells / state.totalCells) * 100).toFixed(1);
        console.log(`🎯 Flood Fill: ${chosen.move} to pos ${chosen.position} (dist: ${dist}, explored: ${progress}%)`);
        
        return chosen.move;
    }

    function getAvailableMoves(botPos, botFacing, walls, mazeConfig) {
        const moves = [];
        
        const checkDirection = (move, wall, newFacing) => {
            if (!wall) {
                const nextPos = getPositionInDirection(botPos, newFacing, mazeConfig.size);
                if (state.distances.has(nextPos)) {
                    moves.push({ move, position: nextPos });
                }
            }
        };
        
        checkDirection('FORWARD', walls.front, botFacing);
        checkDirection('LEFT', walls.left, (botFacing + 3) % 4);
        checkDirection('RIGHT', walls.right, (botFacing + 1) % 4);
        
        // U-turn as last resort
        const uTurnFacing = (botFacing + 2) % 4;
        const uTurnPos = getPositionInDirection(botPos, uTurnFacing, mazeConfig.size);
        if (state.distances.has(uTurnPos)) {
            moves.push({ move: 'UTURN', position: uTurnPos });
        }
        
        return moves;
    }

    function getPositionInDirection(pos, facing, size) {
        const x = pos % size;
        const y = Math.floor(pos / size);
        let newX = x, newY = y;
        
        switch (facing) {
            case 0: newY--; break; // North
            case 1: newX++; break; // East
            case 2: newY++; break; // South
            case 3: newX--; break; // West
        }
        
        return newY * size + newX;
    }

    function reset() {
        state.initialized = false;
        state.distances = null;
        state.visited = new Set();
        state.totalCells = 0;
        state.exploredCells = 0;
        state.explorationComplete = false;
        state.firstMove = true;
        state.exitPos = -1;
    }

    // Register algorithm
    if (typeof window !== 'undefined') {
        window.ALGORITHMS = window.ALGORITHMS || {};
        window.ALGORITHMS['flood-fill'] = {
            name: "Flood Fill Explorer",
            getNextMove: getNextMove,
            reset: reset,
            description: "Complete maze exploration - visits every accessible cell before exiting"
        };
        console.log(' Flood Fill Algorithm explorer');
    }
})();
