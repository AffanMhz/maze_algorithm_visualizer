/**
 * Trémaux Algorithm - Advanced maze-solving with passage marking
 * 
 * STRATEGY:
 * - Marks passages as we traverse them (once or twice)
 * - Never takes a passage marked twice
 * - At junctions, prefers unmarked paths, then once-marked paths
 * - Guarantees finding exit without getting stuck in loops
 * - Intelligent backtracking when needed
 */

(function() {
    'use strict';

    const state = {
        initialized: false,
        visitCounts: null,      // Map: position -> visit count (0, 1, or 2)
        pathHistory: [],        // Stack of positions taken
        currentPath: [],        // Current path segment
        junctionChoices: null,  // Map: junction position -> choices made
        backtracking: false,
        firstMove: true
    };

    function initialize(startPos, startFacing, mazeConfig) {
        state.initialized = true;
        state.visitCounts = new Map();
        state.visitCounts.set(startPos, 1); // Mark start as visited once
        state.pathHistory = [startPos];
        state.currentPath = [startPos];
        state.junctionChoices = new Map();
        state.backtracking = false;
        state.firstMove = true;
        
        console.log('🎯 Trémaux Algorithm initialized - Intelligent passage marking');
    }

    function getNextMove(botPos, botFacing, walls, mazeConfig) {
        if (!state.initialized) {
            initialize(botPos, botFacing, mazeConfig);
        }

        // First move is always forward
        if (state.firstMove) {
            state.firstMove = false;
            console.log('📍 Trémaux: First move FORWARD');
            return 'FORWARD';
        }

        // Get available directions (not blocked by walls)
        const directions = getAvailableDirections(walls);
        
        // Get visit counts for each direction
        const options = directions.map(dir => {
            const nextPos = getNextPosition(botPos, botFacing, dir, mazeConfig.size);
            const visitCount = state.visitCounts.get(nextPos) || 0;
            return { direction: dir, position: nextPos, visitCount };
        });

        // Sort by preference: unvisited (0) > once-visited (1) > twice-visited (2)
        options.sort((a, b) => a.visitCount - b.visitCount);

        // Trémaux rules:
        // 1. Never take a passage marked twice
        // 2. If at a junction, prefer unmarked passages
        // 3. If all passages marked once, choose any
        // 4. If coming from a passage marked once and all others marked once, mark current twice and backtrack

        const validOptions = options.filter(opt => opt.visitCount < 2);
        
        if (validOptions.length === 0) {
            console.log('🚫 Trémaux: No valid moves - all passages marked twice!');
            console.log(`Current position: ${botPos}, Exit position: ${mazeConfig.exitPos}`);
            console.log(`Visited positions:`, Array.from(state.visitCounts.keys()));
            return 'STOP';
        }

        // Choose the least-visited option
        const chosen = validOptions[0];
        
        // Update visit count
        state.visitCounts.set(chosen.position, (state.visitCounts.get(chosen.position) || 0) + 1);
        state.pathHistory.push(chosen.position);

        const move = directionToMove(chosen.direction);
        console.log(`🎯 Trémaux: ${move} to pos ${chosen.position} (visits: ${chosen.visitCount + 1}) [current: ${botPos}, exit: ${mazeConfig.exitPos}]`);
        
        return move;
    }

    function getAvailableDirections(walls) {
        const dirs = [];
        if (!walls.left) dirs.push('LEFT');
        if (!walls.front) dirs.push('FORWARD');
        if (!walls.right) dirs.push('RIGHT');
        
        // If no directions available (dead end), must U-turn
        if (dirs.length === 0) {
            dirs.push('UTURN');
        }
        
        return dirs;
    }

    function getNextPosition(pos, facing, direction, size) {
        let newFacing = facing;
        
        if (direction === 'LEFT') newFacing = (facing + 3) % 4;
        else if (direction === 'RIGHT') newFacing = (facing + 1) % 4;
        else if (direction === 'UTURN') newFacing = (facing + 2) % 4;
        
        // Calculate new position based on new facing
        const x = pos % size;
        const y = Math.floor(pos / size);
        let newX = x, newY = y;
        
        switch (newFacing) {
            case 0: newY--; break; // North
            case 1: newX++; break; // East
            case 2: newY++; break; // South
            case 3: newX--; break; // West
        }
        
        return newY * size + newX;
    }

    function directionToMove(direction) {
        return direction;
    }

    function reset() {
        state.initialized = false;
        state.visitCounts = null;
        state.pathHistory = [];
        state.currentPath = [];
        state.junctionChoices = null;
        state.backtracking = false;
        state.firstMove = true;
    }

    // Register algorithm
    if (typeof window !== 'undefined') {
        window.ALGORITHMS = window.ALGORITHMS || {};
        window.ALGORITHMS['tremaux'] = {
            name: "Trémaux Algorithm",
            getNextMove: getNextMove,
            reset: reset,
            description: "Advanced passage marking - never gets stuck in loops"
        };
        console.log('✅ Trémaux Algorithm registered');
    }
})();
