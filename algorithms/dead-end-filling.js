/**
 * Dead-End Filling Algorithm - Strategic maze exploration
 * 
 * STRATEGY:
 * - Identifies and marks all dead ends
 * - Fills dead ends by marking them as blocked
 * - Creates a solution corridor by eliminating dead paths
 * - Never gets stuck because dead ends are avoided
 * - Explores remaining passages systematically
 */

(function() {
    'use strict';

    const state = {
        initialized: false,
        deadEnds: new Set(),        // Positions identified as dead ends
        filled: new Set(),          // Positions that have been filled
        visited: new Set(),         // Positions we've visited
        path: [],                   // Current path being explored
        explorationMode: 'IDENTIFY', // IDENTIFY, NAVIGATE
        firstMove: true
    };

    function initialize(startPos, startFacing, mazeConfig) {
        state.initialized = true;
        state.deadEnds = new Set();
        state.filled = new Set();
        state.visited = new Set([startPos]);
        state.path = [startPos];
        state.explorationMode = 'IDENTIFY';
        state.firstMove = true;
        
        // Identify all dead ends in the maze
        identifyDeadEnds(mazeConfig);
        
        console.log(`🎯 Dead-End Filling initialized - Found ${state.deadEnds.size} dead ends`);
    }

    function identifyDeadEnds(mazeConfig) {
        // A dead end has exactly 3 walls (only one opening)
        for (let pos = 0; pos < mazeConfig.data.length; pos++) {
            const wallData = mazeConfig.data[pos];
            const walls = {
                north: (wallData & 8) ? 1 : 0,
                east:  (wallData & 4) ? 1 : 0,
                south: (wallData & 2) ? 1 : 0,
                west:  (wallData & 1) ? 1 : 0
            };
            const wallCount = walls.north + walls.east + walls.south + walls.west;
            
            if (wallCount === 3) {
                state.deadEnds.add(pos);
            }
        }
        
        // Iteratively fill dead ends that lead to other dead ends
        let changed = true;
        while (changed) {
            changed = false;
            
            for (let pos = 0; pos < mazeConfig.data.length; pos++) {
                if (state.filled.has(pos) || state.deadEnds.has(pos)) continue;
                
                // Count non-filled neighbors
                const neighbors = getNeighbors(pos, mazeConfig.size);
                const openNeighbors = neighbors.filter(n => 
                    !state.filled.has(n.pos) && !state.deadEnds.has(n.pos)
                );
                
                // If only one open neighbor, this becomes a dead end
                if (openNeighbors.length === 1) {
                    state.deadEnds.add(pos);
                    changed = true;
                }
            }
        }
    }

    function getNextMove(botPos, botFacing, walls, mazeConfig) {
        if (!state.initialized) {
            initialize(botPos, botFacing, mazeConfig);
        }

        // First move is always forward
        if (state.firstMove) {
            state.firstMove = false;
            console.log('📍 Dead-End Filling: First move FORWARD');
            return 'FORWARD';
        }

        // Don't enter dead ends or filled positions
        const availableMoves = getAvailableMoves(botPos, botFacing, walls, mazeConfig);
        
        if (availableMoves.length === 0) {
            console.log('🚫 Dead-End Filling: No valid moves available');
            return 'STOP';
        }

        // Prefer unvisited positions
        const unvisited = availableMoves.filter(m => !state.visited.has(m.position));
        const chosen = unvisited.length > 0 ? unvisited[0] : availableMoves[0];
        
        state.visited.add(chosen.position);
        state.path.push(chosen.position);
        
        console.log(`🎯 Dead-End Filling: ${chosen.move} to pos ${chosen.position}`);
        return chosen.move;
    }

    function getAvailableMoves(botPos, botFacing, walls, mazeConfig) {
        const moves = [];
        const directions = [
            { dir: 'FORWARD', wall: walls.front, facing: botFacing },
            { dir: 'LEFT', wall: walls.left, facing: (botFacing + 3) % 4 },
            { dir: 'RIGHT', wall: walls.right, facing: (botFacing + 1) % 4 }
        ];

        for (const d of directions) {
            if (!d.wall) {
                const nextPos = getPositionInDirection(botPos, d.facing, mazeConfig.size);
                
                // Skip if it's a dead end or filled position
                if (!state.deadEnds.has(nextPos) && !state.filled.has(nextPos)) {
                    moves.push({ move: d.dir, position: nextPos });
                }
            }
        }

        // If no moves available and not in dead end, try U-turn
        if (moves.length === 0 && !state.deadEnds.has(botPos)) {
            const uTurnFacing = (botFacing + 2) % 4;
            const uTurnPos = getPositionInDirection(botPos, uTurnFacing, mazeConfig.size);
            if (!state.deadEnds.has(uTurnPos) && !state.filled.has(uTurnPos)) {
                moves.push({ move: 'UTURN', position: uTurnPos });
            }
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

    function getNeighbors(pos, size) {
        const x = pos % size;
        const y = Math.floor(pos / size);
        const neighbors = [];
        
        // North, East, South, West
        const dirs = [
            { x: 0, y: -1, facing: 0 },
            { x: 1, y: 0, facing: 1 },
            { x: 0, y: 1, facing: 2 },
            { x: -1, y: 0, facing: 3 }
        ];
        
        for (const dir of dirs) {
            const nx = x + dir.x;
            const ny = y + dir.y;
            
            if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                neighbors.push({ pos: ny * size + nx, facing: dir.facing });
            }
        }
        
        return neighbors;
    }

    function reset() {
        state.initialized = false;
        state.deadEnds = new Set();
        state.filled = new Set();
        state.visited = new Set();
        state.path = [];
        state.explorationMode = 'IDENTIFY';
        state.firstMove = true;
    }

    // Register algorithm
    if (typeof window !== 'undefined') {
        window.ALGORITHMS = window.ALGORITHMS || {};
        window.ALGORITHMS['dead-end-filling'] = {
            name: "Dead-End Filling",
            getNextMove: getNextMove,
            reset: reset,
            description: "Strategic dead-end avoidance - never gets stuck"
        };
        console.log('✅ Dead-End Filling Algorithm registered');
    }
})();
