// Ensure behaviors exist before defining the element
if (!enabledMods.includes("life") && typeof behaviors === "undefined") {
    // Fallback if the life category mechanics aren't fully loaded
}

elements.sonic = {
    color: ["#0055ff", "#0044dd", "#ffffff", "#e0a060"], // Blue body, white gloves/socks, peach skin
    behavior: [
        "XX|XX|XX",
        "XX|FX|XX",
        "XX|M1|XX"
    ], // Base physics: falls down, stands on solids
    category: "life",
    state: "solid",
    density: 1000,
    tempHigh: 100,
    tempLow: -20,
    burn: 0, // Invincible to fire, matching your previous preference!
    tick: function(pixel) {
        // --- 1. INITIALIZE CUSTOM VARIABLES ---
        if (pixel.dir === undefined) { pixel.dir = Math.random() > 0.5 ? 1 : -1; } // Walking direction (1 = right, -1 = left)
        if (pixel.isSpindashing === undefined) { pixel.isSpindashing = false; }
        if (pixel.spindashTimer === undefined) { pixel.spindashTimer = 0; }

        let x = pixel.x;
        let y = pixel.y;

        // Check environment
        let pixelBelow = pixelMap[x]?.[y + 1];
        let isGrounded = pixelBelow && pixelBelow.element !== "air";

        // --- 2. THE AI DECISION ENGINE ---
        if (isGrounded) {
            // Randomly decide to charge a Spindash if moving normally
            if (!pixel.isSpindashing && Math.random() < 0.02) {
                pixel.isSpindashing = true;
                pixel.spindashTimer = Math.floor(Math.random() * 15) + 10; // Charge for 10-25 frames
                pixel.color = "#ffaa00"; // Flash yellow/orange while charging spindash
            }
        } else {
            // If airborne, stop spindashing
            pixel.isSpindashing = false;
        }

        // --- 3. EXECUTE BEHAVIORS ---
        if (pixel.isSpindashing) {
            // SPINDASH MODE: Wait and charge up
            pixel.spindashTimer--;
            
            // Shake in place visually while charging
            if (Math.random() < 0.5) {
                pixel.color = "#ffdd00"; // Super bright yellow flash
            } else {
                pixel.color = "#0055ff"; // Regular blue
            }

            // Spindash charge ends -> Release the dash!
            if (pixel.spindashTimer <= 0) {
                pixel.isSpindashing = false;
                pixel.color = "#0055ff"; // Reset color

                // Smash through obstacles ahead with absolute speed (Spindash Release)
                let dashDistance = 12; // How many pixels he bursts through
                for (let i = 1; i <= dashDistance; i++) {
                    let targetX = x + (pixel.dir * i);
                    let targetPixel = pixelMap[targetX]?.[y];

                    if (targetPixel) {
                        if (targetPixel.element === "air") {
                            // Keep moving through open air
                            continue;
                        } else if (targetPixel.element !== "boundary" && targetPixel.element !== "sonic") {
                            // Sonic completely smashes/destroys walls in his way during a spindash
                            deletePixel(targetX, y);
                        } else if (targetPixel.element === "boundary") {
                            // Bounce off map boundaries
                            pixel.dir *= -1;
                            break;
                        }
                    }
                }
                // Instantly teleport Sonic to the end of his dash line
                pixelMove(pixel, x + (pixel.dir * dashDistance), y);
            }
        } else {
            // RUN FAST MODE: High speed running AI
            let runSpeed = 4; // Moves 4 pixels per game tick (4x faster than humans)
            
            for (let i = 0; i < runSpeed; i++) {
                let nextX = pixel.x + pixel.dir;
                let nextY = pixel.y;
                let frontPixel = pixelMap[nextX]?.[nextY];
                let frontDiagonalPixel = pixelMap[nextX]?.[nextY - 1];

                // Turn around if hitting an unbreakable border
                if (nextX <= 0 || nextX >= width - 1) {
                    pixel.dir *= -1;
                    break;
                }

                if (!frontPixel || frontPixel.element === "air") {
                    // Path is completely clear, keep sprinting forward
                    pixelMove(pixel, nextX, nextY);
                } else if (!frontDiagonalPixel || frontDiagonalPixel.element === "air") {
                    // Path has a small 1-pixel step, Sonic automatically runs up it smoothly
                    pixelMove(pixel, nextX, nextY - 1);
                } else {
                    // Hit a solid wall! Turn around instantly to keep running
                    pixel.dir *= -1;
                    break;
                }
            }
        }
    }
};
