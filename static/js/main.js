document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const videoStream = document.getElementById('video_stream');
    const mainHeader = document.getElementById('main-header');
    const feedbackDiv = document.getElementById('overall-feedback');
    let dataInterval = null; 

    // --- UTILITY FUNCTIONS ---

    function setTrackingState(isActive) {
        startBtn.disabled = isActive;
        stopBtn.disabled = !isActive;
        mainHeader.innerText = isActive ? "PhysioCheck: Tracking Active" : "PhysioCheck: Inactive";
        
        if (isActive) {
            // Start video stream and data polling
            // The timestamp prevents browser caching the video stream placeholder
            videoStream.src = "/video_feed?" + new Date().getTime(); 
            dataInterval = setInterval(updateMetrics, 100);
            feedbackDiv.style.backgroundColor = 'var(--color-warning)';
            feedbackDiv.style.color = 'var(--color-dark-bg)';
            feedbackDiv.innerText = "Tracking started. Countdown in progress...";
        } else {
            // Stop tracking, clear resources
            videoStream.src = "";
            clearInterval(dataInterval);
            resetMetricsDisplay();
            feedbackDiv.style.backgroundColor = 'var(--color-warning)';
            feedbackDiv.style.color = 'var(--color-dark-bg)';
            feedbackDiv.innerText = "Tracking stopped. Press START to begin tracking your workout.";
        }
    }

    function resetMetricsDisplay() {
        // Reset all metric displays to inactive state ('--')
        const arms = ['right', 'left'];
        arms.forEach(armPrefix => {
            document.getElementById(`${armPrefix}-reps`).innerText = '--';
            document.getElementById(`${armPrefix}-stage`).innerText = 'INACTIVE';
            document.getElementById(`${armPrefix}-angle`).innerText = '--°';
            document.getElementById(`${armPrefix}-curr-time`).innerText = '--';
            document.getElementById(`${armPrefix}-min-time`).innerText = '--';
            document.getElementById(`${armPrefix}-time`).innerText = '--';
        });
    }

    /**
     * Updates metrics for a single arm and checks if the pose is lost.
     * Returns true if pose is lost/unreliable (angle 0 while active).
     */
    function updateMetricValue(armPrefix, metrics) {
        const angleElement = document.getElementById(`${armPrefix}-angle`);
        
        // 1. Check for LOST POSE (angle 0 while tracking is active)
        if (metrics.angle === 0 && metrics.stage !== 'INACTIVE') {
            // Pose is lost but tracking is active
            document.getElementById(`${armPrefix}-reps`).innerText = metrics.rep_count;
            document.getElementById(`${armPrefix}-stage`).innerText = 'LOST POSE';
            angleElement.innerText = '0°';
            angleElement.style.color = 'var(--color-danger)';
            return true; // Indicate that a critical state was found
        } else {
            // Metrics are being received successfully
            document.getElementById(`${armPrefix}-reps`).innerText = metrics.rep_count;
            document.getElementById(`${armPrefix}-stage`).innerText = metrics.stage;
            angleElement.innerText = metrics.angle + '°';
            angleElement.style.color = 'var(--color-success)';

            // Update timing metrics
            const currTime = metrics.curr_rep_time > 0.01 ? metrics.curr_rep_time.toFixed(2) + 's' : '--';
            const minTime = metrics.min_rep_time > 0.01 ? metrics.min_rep_time.toFixed(2) + 's' : '--';
            const lastTime = metrics.rep_time > 0.01 ? metrics.rep_time.toFixed(2) + 's' : '--';

            document.getElementById(`${armPrefix}-curr-time`).innerText = currTime;
            document.getElementById(`${armPrefix}-min-time`).innerText = minTime;
            document.getElementById(`${armPrefix}-time`).innerText = lastTime;
            return false; // Indicate normal operation
        }
    }

    // --- DATA POLLING FUNCTION ---
    function updateMetrics() {
        fetch('/data_feed')
            .then(response => response.json())
            .then(data => {
                
                // --- STATUS CHECK ---
                if (data.status === 'INACTIVE') {
                    setTrackingState(false);
                    return; 
                } else if (data.status === 'COUNTDOWN') {
                    mainHeader.innerText = `STARTING IN ${data.remaining} SECONDS`;
                    feedbackDiv.style.backgroundColor = 'var(--color-warning)';
                    feedbackDiv.style.color = 'var(--color-dark-bg)';
                    feedbackDiv.innerText = `Get Ready: Countdown ${data.remaining}...`;
                    return;
                }
                
                let hasFeedback = false;
                let poseLost = false;

                for (const arm of ['RIGHT', 'LEFT']) {
                    const metrics = data[arm];
                    const armPrefix = arm.toLowerCase();

                    // Check if pose is lost for this arm
                    if (updateMetricValue(armPrefix, metrics)) {
                        poseLost = true;
                    }
                    
                    // --- FEEDBACK LOGIC ---
                    if (metrics.feedback) {
                        feedbackDiv.innerText = `${arm}: ${metrics.feedback}`;
                        
                        // CRITICAL DANGER (Red) or WARNING (Orange/Yellow)
                        if (metrics.feedback.includes("OVER-") || metrics.feedback.includes("DEEPER")) {
                            feedbackDiv.style.backgroundColor = 'var(--color-danger)'; 
                            feedbackDiv.style.color = 'var(--color-text-light)';
                        } 
                        else { // STRAIGHTEN ARM (Warning)
                            feedbackDiv.style.backgroundColor = 'var(--color-warning)';
                            feedbackDiv.style.color = 'var(--color-dark-bg)';
                        }
                        hasFeedback = true;
                        break; 
                    }
                }

                // --- Overall Dashboard Status ---
                if (poseLost && !hasFeedback) {
                    feedbackDiv.innerText = "CRITICAL: STEP BACK, POSE LOST!";
                    feedbackDiv.style.backgroundColor = 'var(--color-danger)'; 
                    feedbackDiv.style.color = 'var(--color-text-light)';
                }
                else if (!hasFeedback && data.status === 'ACTIVE') {
                    feedbackDiv.innerText = "PERFECT FORM! KEEP UP THE TEMPO.";
                    feedbackDiv.style.backgroundColor = 'var(--color-success)';
                    feedbackDiv.style.color = 'var(--color-dark-bg)';
                }

            })
            .catch(error => console.error('Error fetching data:', error));
    }
    
    // --- EVENT LISTENERS ---
    startBtn.addEventListener('click', () => {
        fetch('/start_tracking')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    setTrackingState(true);
                } else if (data.status === 'already_active') {
                    alert('Tracking is already active.');
                } else {
                    alert('Error starting tracking: ' + data.message);
                }
            })
            .catch(error => alert('Network error while starting tracking. Check Python console for details.'));
    });

    stopBtn.addEventListener('click', () => {
        // Send stop request to backend
        fetch('/stop_tracking')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Check for redirect instruction to the report page
                    if (data.redirect) {
                        window.location.href = data.redirect;
                    } else {
                        setTrackingState(false);
                    }
                } else {
                    alert('Error stopping tracking: ' + data.message);
                }
            })
            .catch(error => alert('Network error while stopping tracking.'));
    });
});