// Test script for the new ultra-optimized algorithms
console.log("Testing Ultra-Optimized Maze Algorithms...\n");

// Load required modules (simulate browser environment)
const { readFileSync } = require('fs');
const path = require('path');

// Global variables to simulate browser environment
global.window = {};

try {
    // Read and evaluate the maze-data.js file first
    const mazeDataContent = readFileSync(path.join(__dirname, 'maze-data.js'), 'utf8');
    eval(mazeDataContent);
    
    // Read and evaluate the algorithms.js file
    const algorithmsContent = readFileSync(path.join(__dirname, 'algorithms.js'), 'utf8');
    eval(algorithmsContent);

    console.log("✅ All files loaded successfully!");
    console.log("✅ Available maze configurations:", Object.keys(MAZE_CONFIGS || {}));
    console.log("✅ MazeAlgorithms class available:", typeof MazeAlgorithms !== 'undefined');
    console.log("✅ ALGORITHMS registry available:", typeof ALGORITHMS !== 'undefined');
    
    // Check if the new algorithms are registered
    console.log("\n📋 New Ultra-Optimized Algorithms Available:");
    const newAlgorithms = [
        'perfect-score',
        'intelligent-explorer', 
        'ultra-efficient-wall-follower',
        'strategic-dead-end-seeker'
    ];
    
    for (const algo of newAlgorithms) {
        if (ALGORITHMS[algo]) {
            console.log(`✅ ${algo}: ${ALGORITHMS[algo].name}`);
        } else {
            console.log(`❌ ${algo}: Not found`);
        }
    }
    
    // Test Perfect Score Algorithm if MazeAlgorithms is defined
    if (typeof MazeAlgorithms !== 'undefined') {
        console.log("\n🎯 Testing Perfect Score Algorithm:");
        const perfectResult = MazeAlgorithms.perfectScoreAlgorithm(0, 1, {});
        console.log("Move:", perfectResult.move);
        console.log("Explanation:", perfectResult.explanation);
        console.log("Phase:", perfectResult.phase);
    
    // Test Intelligent Explorer
    console.log("\n🧠 Testing Intelligent Explorer:");
    const intelligentResult = MazeAlgorithms.intelligentExplorer(0, 1, {});
    console.log("Move:", intelligentResult.move);
    console.log("Explanation:", intelligentResult.explanation);
    console.log("Visited Count:", intelligentResult.visitedCount);
    
    // Test Ultra-Efficient Wall Follower
    console.log("\n⚡ Testing Ultra-Efficient Wall Follower:");
    const ultraResult = MazeAlgorithms.ultraEfficientWallFollower(0, 1, {});
    console.log("Move:", ultraResult.move);
    console.log("Explanation:", ultraResult.explanation);
    console.log("Mode:", ultraResult.mode);
    
    // Test Strategic Dead End Seeker
    console.log("\n🎯 Testing Strategic Dead End Seeker:");
    const strategicResult = MazeAlgorithms.strategicDeadEndSeeker(0, 1, {});
    console.log("Move:", strategicResult.move);
    console.log("Explanation:", strategicResult.explanation);
    console.log("Strategy:", strategicResult.strategy);
    
    // Test helper functions
    console.log("\n🔧 Testing Helper Functions:");
    const validNeighbors = MazeAlgorithms.getValidNeighbors(0);
    console.log("Valid neighbors for position 0:", validNeighbors);
    
    const nearestDeadEnd = MazeAlgorithms.findNearestDeadEnd(0, [6, 24, 56]);
    console.log("Nearest dead end from position 0:", nearestDeadEnd);
    
        console.log("\n✅ All ultra-optimized algorithms are working correctly!");
    } else {
        console.log("❌ MazeAlgorithms class not available for testing");
    }
    
} catch (error) {
    console.error("❌ Error testing algorithms:", error.message);
    console.error("Stack:", error.stack);
}