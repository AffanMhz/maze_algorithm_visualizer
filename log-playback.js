/**
 * Verilog Log Playback Module
 * 
 * This module parses Verilog testbench output logs and plays back the bot's
 * movements on the maze visualization. It's designed to work with logs that
 * contain step-by-step position, facing, and move information.
 * 
 * Expected log format:
 * Step 0: Pos=[4, 8] Facing=N Walls=101 Move=001
 * Step 1: Pos=[4, 7] Facing=N Walls=010 Move=001
 * ...
 */

class VerilogLogPlayback {
    constructor() {
        this.playbackSteps = [];
        this.playbackIndex = 0;
        this.playbackInterval = null;
        this.playbackSpeed = 300; // ms
        this.isPlaying = false;
        
        // Callbacks for integration
        this.onStepUpdate = null;
        this.onPlaybackComplete = null;
        this.onPlaybackStart = null;
        this.onPlaybackPause = null;
        
        // Maze configuration
        this.mazeSize = 9;
        this.deadEndPositions = new Set([11, 20, 26, 34, 45, 48, 56, 64, 80]);
        
        console.log('✅ Verilog Log Playback Module initialized');
    }
    
    /**
     * Parse Verilog log text into structured step data
     * @param {string} logText - Raw log output from testbench
     * @returns {Array} Array of parsed step objects
     */
    parseLog(logText) {
        const steps = [];
        const lines = logText.split('\n');
        
        // Regex pattern to match log lines (with optional # comment prefix)
        // Matches: Step 0: Pos=[4, 8] Facing=N Walls=101 Move=001
        // Also matches: # Step 0: Pos=[4, 8] Facing=N Walls=101 Move=001
        const regex = /^\s*#?\s*Step\s+(\d+):\s*Pos=\[(\d+),\s*(\d+)\]\s*Facing=(\w)\s*Walls=([\d]+)\s*Move=([\d]+)/i;
        
        // Facing direction mapping
        const facingMap = {
            'N': 0, // North
            'E': 1, // East
            'S': 2, // South
            'W': 3  // West
        };
        
        // Move command mapping (binary to string)
        const moveMap = {
            '000': 'STOP',
            '001': 'FORWARD',
            '010': 'LEFT',
            '011': 'RIGHT',
            '100': 'UTURN'
        };
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const match = trimmed.match(regex);
            if (match) {
                const [_, stepNum, x, y, facingChar, wallsBinary, moveBinary] = match;
                
                // Convert coordinates to position index
                const posX = parseInt(x, 10);
                const posY = parseInt(y, 10);
                const pos = posY * this.mazeSize + posX;
                
                // Get facing direction
                const facing = facingMap[facingChar.toUpperCase()];
                
                // Parse walls (3-bit binary: left, mid, right)
                const walls = {
                    left: parseInt(wallsBinary[0], 10),
                    mid: parseInt(wallsBinary[1], 10),
                    right: parseInt(wallsBinary[2], 10)
                };
                
                // Get move command
                const move = moveMap[moveBinary] || 'UNKNOWN';
                
                // Validate position
                if (pos >= 0 && pos < this.mazeSize * this.mazeSize && facing !== undefined) {
                    steps.push({
                        step: parseInt(stepNum, 10),
                        pos: pos,
                        x: posX,
                        y: posY,
                        facing: facing,
                        facingChar: facingChar.toUpperCase(),
                        walls: walls,
                        wallsBinary: wallsBinary,
                        move: move,
                        moveBinary: moveBinary,
                        isDeadEnd: this.deadEndPositions.has(pos)
                    });
                } else {
                    console.warn(`⚠️ Skipping invalid log line: ${trimmed}`);
                }
            } else if (trimmed.toLowerCase().includes('step')) {
                console.warn(`⚠️ Could not parse log line: ${trimmed}`);
            }
        }
        
        console.log(`📋 Parsed ${steps.length} valid steps from log`);
        return steps;
    }
    
    /**
     * Load log text and prepare for playback
     * @param {string} logText - Raw log text
     * @returns {boolean} Success status
     */
    loadLog(logText) {
        if (!logText || !logText.trim()) {
            console.error('❌ No log text provided');
            return false;
        }
        
        this.playbackSteps = this.parseLog(logText);
        
        if (this.playbackSteps.length === 0) {
            console.error('❌ No valid steps found in log');
            return false;
        }
        
        this.playbackIndex = 0;
        console.log(`✅ Loaded ${this.playbackSteps.length} steps for playback`);
        return true;
    }
    
    /**
     * Start or resume playback
     */
    start() {
        if (this.playbackSteps.length === 0) {
            console.error('❌ No log loaded. Call loadLog() first.');
            return;
        }
        
        if (this.isPlaying) {
            console.warn('⚠️ Playback already running');
            return;
        }
        
        this.isPlaying = true;
        
        if (this.onPlaybackStart) {
            this.onPlaybackStart();
        }
        
        console.log('▶️ Starting playback...');
        
        // Execute first step immediately
        this.executeStep();
        
        // Then continue with interval
        this.playbackInterval = setInterval(() => {
            this.executeStep();
        }, this.playbackSpeed);
    }
    
    /**
     * Pause playback
     */
    pause() {
        if (!this.isPlaying) {
            return;
        }
        
        this.isPlaying = false;
        
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
        
        if (this.onPlaybackPause) {
            this.onPlaybackPause();
        }
        
        console.log('⏸️ Playback paused');
    }
    
    /**
     * Stop and reset playback
     */
    stop() {
        this.pause();
        this.playbackIndex = 0;
        console.log('⏹️ Playback stopped');
    }
    
    /**
     * Execute current step and advance
     */
    executeStep() {
        if (this.playbackIndex >= this.playbackSteps.length) {
            this.pause();
            
            if (this.onPlaybackComplete) {
                const lastStep = this.playbackSteps[this.playbackSteps.length - 1];
                this.onPlaybackComplete(lastStep);
            }
            
            console.log('✅ Playback complete');
            return;
        }
        
        const stepData = this.playbackSteps[this.playbackIndex];
        
        // Call update callback
        if (this.onStepUpdate) {
            this.onStepUpdate(stepData);
        }
        
        console.log(`📍 Step ${stepData.step}: Pos=(${stepData.x},${stepData.y}) Facing=${stepData.facingChar} Move=${stepData.move}`);
        
        this.playbackIndex++;
    }
    
    /**
     * Set playback speed
     * @param {number} speed - Speed in milliseconds
     */
    setSpeed(speed) {
        this.playbackSpeed = speed;
        
        // Restart interval if playing
        if (this.isPlaying) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = setInterval(() => {
                this.executeStep();
            }, this.playbackSpeed);
        }
        
        console.log(`⚡ Playback speed set to ${speed}ms`);
    }
    
    /**
     * Jump to specific step
     * @param {number} stepIndex - Step index to jump to
     */
    jumpToStep(stepIndex) {
        if (stepIndex >= 0 && stepIndex < this.playbackSteps.length) {
            this.playbackIndex = stepIndex;
            console.log(`⏭️ Jumped to step ${stepIndex}`);
            
            // Execute the step if not playing
            if (!this.isPlaying) {
                this.executeStep();
                this.playbackIndex--; // Don't advance since we're not playing
            }
        }
    }
    
    /**
     * Get current step data
     * @returns {Object|null} Current step data
     */
    getCurrentStep() {
        if (this.playbackIndex > 0 && this.playbackIndex <= this.playbackSteps.length) {
            return this.playbackSteps[this.playbackIndex - 1];
        }
        return null;
    }
    
    /**
     * Get all steps
     * @returns {Array} All parsed steps
     */
    getAllSteps() {
        return this.playbackSteps;
    }
    
    /**
     * Get playback statistics
     * @returns {Object} Statistics object
     */
    getStats() {
        const uniquePositions = new Set(this.playbackSteps.map(s => s.pos));
        const deadEndsVisited = new Set(
            this.playbackSteps
                .filter(s => s.isDeadEnd)
                .map(s => s.pos)
        );
        
        const moveCount = {};
        this.playbackSteps.forEach(s => {
            moveCount[s.move] = (moveCount[s.move] || 0) + 1;
        });
        
        return {
            totalSteps: this.playbackSteps.length,
            uniquePositionsVisited: uniquePositions.size,
            deadEndsVisited: deadEndsVisited.size,
            totalDeadEnds: this.deadEndPositions.size,
            moveBreakdown: moveCount,
            currentStep: this.playbackIndex,
            isPlaying: this.isPlaying
        };
    }
    
    /**
     * Validate log format
     * @param {string} logText - Log text to validate
     * @returns {Object} Validation result
     */
    static validateLog(logText) {
        const lines = logText.split('\n');
        const regex = /Step\s+(\d+):\s*Pos=\[(\d+),\s*(\d+)\]\s*Facing=(\w)\s*Walls=([\d]+)\s*Move=([\d]+)/i;
        
        let validLines = 0;
        let invalidLines = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            if (regex.test(line)) {
                validLines++;
            } else if (line.toLowerCase().includes('step')) {
                invalidLines.push({ lineNum: i + 1, text: line });
            }
        }
        
        return {
            valid: validLines > 0,
            validLines: validLines,
            invalidLines: invalidLines,
            message: validLines > 0 
                ? `Found ${validLines} valid log entries` 
                : 'No valid log entries found'
        };
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.VerilogLogPlayback = VerilogLogPlayback;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = VerilogLogPlayback;
}
