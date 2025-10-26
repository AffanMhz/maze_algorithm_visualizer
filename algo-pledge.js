// PLEDGE ALGORITHM
// Maintains angular orientation to avoid loops

function pledgeAlgorithm(pos, facing, algorithmState = {}) {
    // Initialize state
    if (!algorithmState.initialized) {
        algorithmState.angle = 0;
        algorithmState.mode = 'straight'; // 'straight' or 'wall-follow'
        algorithmState.preferredDirection = facing;
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
            explanation: '🚀 Pledge: Initial forward move into maze',
            sensorReadings: {
                left: walls.left ? 'WALL' : 'OPEN',
                front: walls.front ? 'WALL' : 'OPEN',
                right: walls.right ? 'WALL' : 'OPEN'
            },
            angle: algorithmState.angle,
            mode: algorithmState.mode
        };
    }
    
    const walls = getRelativeWalls(pos, facing);
    let move, explanation;
    
    if (algorithmState.mode === 'straight' && algorithmState.angle === 0) {
        // Try to go straight in preferred direction
        if (!walls.front) {
            move = 'FORWARD';
            explanation = 'Pledge: Going straight in preferred direction';
        } else {
            // Hit obstacle, switch to wall-following mode
            algorithmState.mode = 'wall-follow';
            move = 'RIGHT';
            algorithmState.angle += 90;
            explanation = 'Pledge: Hit wall, starting wall-follow (turn right, angle=90°)';
        }
    } else {
        // Wall-following mode - use left-hand rule but track angle
        if (!walls.left) {
            move = 'LEFT';
            algorithmState.angle -= 90;
            explanation = `Pledge: Left-hand rule - turn left (angle=${algorithmState.angle}°)`;
        } else if (!walls.front) {
            move = 'FORWARD';
            explanation = `Pledge: Left-hand rule - go forward (angle=${algorithmState.angle}°)`;
        } else if (!walls.right) {
            move = 'RIGHT';
            algorithmState.angle += 90;
            explanation = `Pledge: Left-hand rule - turn right (angle=${algorithmState.angle}°)`;
        } else {
            move = 'UTURN';
            algorithmState.angle += 180;
            explanation = `Pledge: Left-hand rule - U-turn (angle=${algorithmState.angle}°)`;
        }
        
        // Check if we can return to straight mode
        if (algorithmState.angle === 0) {
            algorithmState.mode = 'straight';
            explanation += ' - Returned to straight mode!';
        }
    }
    
    // Normalize angle to [-180, 180]
    while (algorithmState.angle > 180) algorithmState.angle -= 360;
    while (algorithmState.angle <= -180) algorithmState.angle += 360;
    
    return {
        move,
        state: algorithmState,
        explanation,
        sensorReadings: {
            left: walls.left ? 'WALL' : 'OPEN',
            front: walls.front ? 'WALL' : 'OPEN',
            right: walls.right ? 'WALL' : 'OPEN'
        },
        angle: algorithmState.angle,
        mode: algorithmState.mode
    };
}
