// Visualization Engine for Maze Algorithm Analyzer

class MazeVisualizer {
    constructor() {
        this.mazeGrid = document.getElementById('maze-grid');
        this.botEl = document.getElementById('bot');
        this.botIconEl = document.getElementById('bot-icon');
        this.coordToggle = document.getElementById('coord-toggle');
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Coordinate toggle
        this.coordToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.mazeGrid.classList.add('show-coordinates');
            } else {
                this.mazeGrid.classList.remove('show-coordinates');
            }
        });
    }
    
    drawMaze(mazeType = 'given') {
        const config = MAZE_CONFIGS[mazeType];
        const size = config.size;
        
        // Update grid template
        this.mazeGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        this.mazeGrid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        
        // Clear existing cells
        this.mazeGrid.innerHTML = '';
        this.mazeGrid.appendChild(this.botEl); // Keep bot element
        
        // Create maze cells
        for (let i = 0; i < size * size; i++) {
            const cell = this.createMazeCell(i, config);
            this.mazeGrid.appendChild(cell);
        }
    }
    
    createMazeCell(index, config) {
        const cell = document.createElement('div');
        cell.id = `cell-${index}`;
        cell.className = 'maze-cell';
        
        // Add walls based on maze data
        const walls = getWallsAtPosition(index);
        if (walls.north) cell.classList.add('wall-n');
        if (walls.east) cell.classList.add('wall-e');
        if (walls.south) cell.classList.add('wall-s');
        if (walls.west) cell.classList.add('wall-w');
        
        // Add coordinate text
        const coords = posToCoords(index, config.size);
        const coordText = document.createElement('span');
        coordText.className = 'coordinate-text';
        coordText.textContent = `(${coords.x},${coords.y})`;
        cell.appendChild(coordText);
        
        // Mark special positions
        if (index === config.startPos) {
            cell.classList.add('bg-green-300');
            const startLabel = document.createElement('span');
            startLabel.className = 'text-xs font-bold text-green-800';
            startLabel.style.cssText = 'position:relative; z-index:2;';
            startLabel.textContent = 'START';
            cell.appendChild(startLabel);
        } else if (index === config.exitPos) {
            cell.classList.add('bg-blue-300');
            const exitLabel = document.createElement('span');
            exitLabel.className = 'text-xs font-bold text-blue-800';
            exitLabel.style.cssText = 'position:relative; z-index:2;';
            exitLabel.textContent = 'EXIT';
            cell.appendChild(exitLabel);
        }
        
        return cell;
    }
    
    updateBotPosition(pos, facing) {
        const config = getMazeConfig();
        const size = config.size;
        const coords = posToCoords(pos, size);
        
        // Update grid position (CSS Grid is 1-indexed)
        this.botEl.style.gridRowStart = coords.y + 1;
        this.botEl.style.gridColumnStart = coords.x + 1;
        
        // Update bot icon width/height based on grid size
        this.botEl.style.width = `${100/size}%`;
        this.botEl.style.height = `${100/size}%`;
        
        // Update rotation based on facing direction
        this.botIconEl.style.transform = `rotate(${facing * 90}deg)`;
    }
    
    markVisitedCell(pos, isDeadEnd = false) {
        const cell = document.getElementById(`cell-${pos}`);
        if (cell) {
            if (isDeadEnd) {
                cell.classList.add('dead-end-cell');
            } else if (!cell.classList.contains('bg-green-300') && 
                      !cell.classList.contains('bg-blue-300') &&
                      !cell.classList.contains('dead-end-cell')) {
                cell.classList.add('path-cell');
            }
        }
    }
    
    highlightCurrentCell(pos) {
        // Remove previous highlight
        document.querySelectorAll('.current-cell').forEach(cell => {
            cell.classList.remove('current-cell');
        });
        
        // Add current highlight
        const cell = document.getElementById(`cell-${pos}`);
        if (cell) {
            cell.classList.add('current-cell');
        }
    }
    
    clearPathVisualization() {
        document.querySelectorAll('.maze-cell').forEach(cell => {
            cell.classList.remove('path-cell', 'dead-end-cell', 'current-cell');
        });
    }
    
    updateSensorDisplay(sensorReadings) {
        document.getElementById('left-sensor').textContent = sensorReadings.left;
        document.getElementById('front-sensor').textContent = sensorReadings.front;
        document.getElementById('right-sensor').textContent = sensorReadings.right;
        
        // Color code sensors
        const leftEl = document.getElementById('left-sensor');
        const frontEl = document.getElementById('front-sensor');
        const rightEl = document.getElementById('right-sensor');
        
        [leftEl, frontEl, rightEl].forEach(el => {
            el.className = el.textContent === 'WALL' ? 'text-red-600 font-bold' : 'text-green-600 font-bold';
        });
    }
    
    updateDecisionProcess(explanation, algorithmResult) {
        const decisionStepsEl = document.getElementById('decision-steps');
        const currentActionEl = document.getElementById('current-action');
        
        // Clear previous steps
        decisionStepsEl.innerHTML = '';
        
        // Add explanation as steps
        const step = document.createElement('div');
        step.className = 'text-sm text-gray-700';
        step.textContent = explanation;
        decisionStepsEl.appendChild(step);
        
        // Add algorithm-specific information
        if (algorithmResult.possibleMoves) {
            const movesStep = document.createElement('div');
            movesStep.className = 'text-xs text-gray-500 mt-1';
            movesStep.textContent = `Available moves: [${algorithmResult.possibleMoves.join(', ')}]`;
            decisionStepsEl.appendChild(movesStep);
        }
        
        // Update current action
        currentActionEl.textContent = algorithmResult.move;
        currentActionEl.className = `font-mono text-lg font-bold ${this.getActionColor(algorithmResult.move)}`;
    }
    
    updateAdvancedLogic(algorithmResult, algorithmName) {
        const advancedLogic = document.getElementById('advanced-logic');
        const algorithmState = document.getElementById('algorithm-state');
        const algorithmMemory = document.getElementById('algorithm-memory');
        
        // Show/hide advanced logic for complex algorithms
        const complexAlgorithms = [
            'pledge', 'tremaux', 'dead-end-filling', 'recursive-backtrack', 'flood-fill',
            'optimized-dead-end-hunter', 'smart-wall-follower', 'hybrid-explorer', 'minimum-steps-explorer'
        ];
        
        if (complexAlgorithms.includes(algorithmName)) {
            advancedLogic.classList.remove('hidden');
            
            // Update algorithm state
            let stateText = this.getAlgorithmStateText(algorithmName, algorithmResult);
            algorithmState.textContent = stateText;
            
            // Update memory/map information
            let memoryText = this.getMemoryText(algorithmName, algorithmResult);
            algorithmMemory.textContent = memoryText;
        } else {
            advancedLogic.classList.add('hidden');
        }
    }
    
    getActionColor(action) {
        switch (action) {
            case 'FORWARD': return 'text-green-800';
            case 'LEFT': return 'text-blue-800';
            case 'RIGHT': return 'text-yellow-800';
            case 'UTURN': return 'text-red-800';
            default: return 'text-gray-800';
        }
    }
    
    getAlgorithmStateText(algorithmName, result) {
        switch (algorithmName) {
            case 'pledge':
                return `Mode: ${result.state.mode || 'straight'}, Angle: ${result.state.angle || 0}°`;
            case 'tremaux':
                return `Paths marked: ${result.pathMarks || 0}`;
            case 'dead-end-filling':
                return `Cells filled: ${result.filledCells || 0}`;
            case 'recursive-backtrack':
                return `Cells visited: ${result.visitedCount || 0}`;
            case 'flood-fill':
                return `Current distance: ${result.currentDistance || '∞'}`;
            case 'optimized-dead-end-hunter':
                return `Dead ends found: ${result.deadEndsFound || 0}, Target: ${result.currentTarget || 'None'}`;
            case 'smart-wall-follower':
                return `Turns made: ${result.turnEfficiency || 0}, Cells visited: ${result.visitedCount || 0}`;
            case 'hybrid-explorer':
                return `Phase: ${result.currentPhase || 'initial'}, Steps in phase: ${result.phaseSteps || 0}`;
            case 'minimum-steps-explorer':
                return `Progress: ${result.progress || '0/0'}, Target: ${result.targetDeadEnd || 'None'}`;
            default:
                return 'Active';
        }
    }
    
    getMemoryText(algorithmName, result) {
        switch (algorithmName) {
            case 'pledge':
                return `Tracking angle from start direction`;
            case 'tremaux':
                return `Marking paths to avoid cycles`;
            case 'dead-end-filling':
                return `Building solution by elimination`;
            case 'recursive-backtrack':
                return `Stack-based systematic exploration`;
            case 'flood-fill':
                return `Following distance gradient to goal`;
            case 'optimized-dead-end-hunter':
                return `Precomputed dead end locations and paths`;
            case 'smart-wall-follower':
                return `Tracking visited cells and turn efficiency`;
            case 'hybrid-explorer':
                return `Multi-phase strategy with adaptive switching`;
            case 'minimum-steps-explorer':
                return `Precomputed optimal paths between key points`;
            default:
                return 'No memory required';
        }
    }
    
    updateStatistics(steps, deadEndsFound, totalDeadEnds, score) {
        document.getElementById('step-count').textContent = steps;
        document.getElementById('dead-end-count').textContent = `${deadEndsFound}/${totalDeadEnds}`;
        document.getElementById('current-score').textContent = `${score.toFixed(2)}/20`;
        
        // Update score display based on speed slider value for appropriate maze
        const speedEl = document.getElementById('speed-display');
        if (speedEl) {
            const speedSlider = document.getElementById('speed-slider');
            speedEl.textContent = `${speedSlider.value}ms`;
        }
    }
    
    showCompletionMessage(steps, deadEndsFound, score, success = true) {
        const message = success 
            ? `🎉 Maze completed!\n\nSteps: ${steps}\nDead ends found: ${deadEndsFound}\nFinal score: ${score.toFixed(2)}/20`
            : `⏰ Simulation stopped.\n\nSteps: ${steps}\nDead ends found: ${deadEndsFound}\nCurrent score: ${score.toFixed(2)}/20`;
            
        alert(message);
    }
    
    displayComparisonResults(results) {
        const comparisonDiv = document.getElementById('comparison-results');
        const tbody = document.getElementById('results-tbody');
        const recommendationsDiv = document.getElementById('recommendations');
        
        // Clear existing results
        tbody.innerHTML = '';
        
        // Sort results by overall score (given maze + surprise maze)
        const sortedResults = Object.entries(results).sort((a, b) => {
            const scoreA = a[1].givenMazeScore + a[1].surpriseMazeScore;
            const scoreB = b[1].givenMazeScore + b[1].surpriseMazeScore;
            return scoreB - scoreA;
        });
        
        // Populate table
        sortedResults.forEach(([algorithm, data], index) => {
            const row = document.createElement('tr');
            const completionRate = (data.deadEndsFound / data.totalDeadEnds * 100).toFixed(1);
            const overallScore = data.givenMazeScore + data.surpriseMazeScore;
            
            row.innerHTML = `
                <td class="font-medium">${this.getAlgorithmDisplayName(algorithm)}</td>
                <td>${data.steps}</td>
                <td>${data.deadEndsFound}/${data.totalDeadEnds}</td>
                <td>${completionRate}%</td>
                <td class="${this.getScoreClass(data.givenMazeScore, 20)}">${data.givenMazeScore.toFixed(2)}/20</td>
                <td class="${this.getScoreClass(data.surpriseMazeScore, 10)}">${data.surpriseMazeScore.toFixed(2)}/10</td>
                <td class="font-bold ${this.getRankingClass(index + 1)}">#${index + 1}</td>
            `;
            tbody.appendChild(row);
        });
        
        // Generate recommendations
        const bestAlgorithm = sortedResults[0];
        const recommendations = this.generateRecommendations(sortedResults);
        recommendationsDiv.innerHTML = recommendations;
        
        // Show results
        comparisonDiv.classList.remove('hidden');
        comparisonDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    getAlgorithmDisplayName(algorithm) {
        const names = {
            'left-hand': 'Left-Hand Rule',
            'right-hand': 'Right-Hand Rule',
            'random-mouse': 'Random Mouse',
            'pledge': 'Pledge Algorithm',
            'tremaux': 'Trémaux Algorithm',
            'dead-end-filling': 'Dead-End Filling',
            'recursive-backtrack': 'Recursive Backtrack',
            'flood-fill': 'Flood Fill',
            'optimized-dead-end-hunter': 'Optimized Dead-End Hunter',
            'smart-wall-follower': 'Smart Wall Follower',
            'hybrid-explorer': 'Hybrid Explorer',
            'minimum-steps-explorer': 'Minimum Steps Explorer'
        };
        return names[algorithm] || algorithm;
    }
    
    getScoreClass(score, maxScore) {
        const percentage = (score / maxScore) * 100;
        if (percentage >= 80) return 'score-excellent';
        if (percentage >= 60) return 'score-good';
        return 'score-poor';
    }
    
    getRankingClass(rank) {
        if (rank === 1) return 'text-green-600';
        if (rank === 2) return 'text-blue-600';
        if (rank === 3) return 'text-yellow-600';
        return 'text-gray-600';
    }
    
    generateRecommendations(sortedResults) {
        const best = sortedResults[0][1];
        const bestName = this.getAlgorithmDisplayName(sortedResults[0][0]);
        
        let html = `<div class="space-y-2">`;
        
        html += `<div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
            </svg>
            <strong>Best Overall:</strong> ${bestName} with ${(best.givenMazeScore + best.surpriseMazeScore).toFixed(2)}/30 total points
        </div>`;
        
        // Find best for hardware implementation (memory-free algorithms)
        const hardwareFriendly = sortedResults.filter(([algo, _]) => 
            ['left-hand', 'right-hand', 'random-mouse'].includes(algo)
        );
        
        if (hardwareFriendly.length > 0) {
            const hardwareBest = hardwareFriendly[0];
            const hardwareBestName = this.getAlgorithmDisplayName(hardwareBest[0]);
            html += `<div class="flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"></path>
                </svg>
                <strong>Best for Hardware:</strong> ${hardwareBestName} (memory-free, ${(hardwareBest[1].givenMazeScore + hardwareBest[1].surpriseMazeScore).toFixed(2)}/30 points)
            </div>`;
        }
        
        // Analysis
        if (best.givenMazeScore >= 16) {
            html += `<div class="flex items-center gap-2 text-green-700">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <strong>Excellent Performance:</strong> Your best algorithm achieves ${best.givenMazeScore.toFixed(2)}/20 on the given maze - this should give you full marks!
            </div>`;
        } else if (best.givenMazeScore >= 12) {
            html += `<div class="flex items-center gap-2 text-yellow-700">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <strong>Good Performance:</strong> ${best.givenMazeScore.toFixed(2)}/20 on given maze. Consider optimizing wall-following logic for better efficiency.
            </div>`;
        } else {
            html += `<div class="flex items-center gap-2 text-red-700">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                <strong>Needs Improvement:</strong> Best score is ${best.givenMazeScore.toFixed(2)}/20. Focus on ensuring complete dead-end exploration.
            </div>`;
        }
        
        html += `</div>`;
        return html;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MazeVisualizer;
}