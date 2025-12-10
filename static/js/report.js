document.addEventListener('DOMContentLoaded', function() {

    // Fetch the finalized report data from the backend
    fetch('/report_data')
        .then(response => response.json())
        .then(data => {
            console.log('Report Data Received:', data);
            renderSummary(data);
            renderRecommendations(data); // Calls the new function
        })
        .catch(error => {
            console.error('Error fetching report data:', error);
            document.getElementById('report-title').innerText = "ERROR: Failed to load report data.";
        });


    function renderSummary(data) {
        const summary = data.summary;
        const totalReps = summary.RIGHT.total_reps + summary.LEFT.total_reps;

        document.getElementById('duration-display').innerText = data.duration + 's';
        document.getElementById('total-reps-display').innerText = totalReps;

        // Right Arm Summary
        document.getElementById('r-reps').innerText = summary.RIGHT.total_reps;
        document.getElementById('r-min-time').innerText = summary.RIGHT.min_time > 0 ? summary.RIGHT.min_time.toFixed(2) + 's' : '--';
        document.getElementById('r-errors').innerText = summary.RIGHT.error_count;

        // Left Arm Summary
        document.getElementById('l-reps').innerText = summary.LEFT.total_reps;
        document.getElementById('l-min-time').innerText = summary.LEFT.min_time > 0 ? summary.LEFT.min_time.toFixed(2) + 's' : '--';
        document.getElementById('l-errors').innerText = summary.LEFT.error_count;
    }


    function renderRecommendations(data) {
        const summary = data.summary;
        const recContent = document.getElementById('recommendation-content');
        recContent.innerHTML = '';
        
        const recommendations = [];

        // Overall Check
        const totalReps = summary.RIGHT.total_reps + summary.LEFT.total_reps;
        if (totalReps === 0) {
            recommendations.push({ title: 'STARTING TIP', text: 'Ensure your entire body is visible in the frame, particularly your elbows, for tracking to begin.' });
        } else {
            // Rep Time Consistency
            const rightTime = summary.RIGHT.min_time;
            const leftTime = summary.LEFT.min_time;
            
            if (rightTime > 0.0 && leftTime > 0.0) {
                const ratio = Math.max(rightTime, leftTime) / Math.min(rightTime, leftTime);
                if (ratio > 1.25) {
                    const slowerArm = rightTime > leftTime ? 'RIGHT' : 'LEFT';
                    recommendations.push({ title: 'TEMPO', text: `Your ${slowerArm} arm is significantly slower (${Math.max(rightTime, leftTime).toFixed(2)}s vs ${Math.min(rightTime, leftTime).toFixed(2)}s). Focus on maintaining a consistent tempo for both arms.` });
                } else if (rightTime < 1.5 || leftTime < 1.5) {
                    recommendations.push({ title: 'SLOW DOWN', text: 'Your best rep time is very fast. Aim for a controlled tempo (e.g., 2 seconds up, 2 seconds down) to maximize muscle tension and results.' });
                } else {
                    recommendations.push({ title: 'TEMPO', text: 'Excellent rep timing consistency! Keep up the controlled pace.' });
                }
            } else if (totalReps > 0) {
                 recommendations.push({ title: 'CONSISTENCY', text: 'Ensure both arms are tracked for accurate tempo comparison.' });
            }

            // Error Checks
            if (summary.RIGHT.error_count > summary.LEFT.error_count && summary.RIGHT.error_count > 0) {
                recommendations.push({ title: 'FORM FOCUS (RIGHT)', text: `The RIGHT arm had more (${summary.RIGHT.error_count}) form errors. Pay close attention to over-extending (locking the elbow) or over-curling.` });
            } else if (summary.LEFT.error_count > summary.RIGHT.error_count && summary.LEFT.error_count > 0) {
                 recommendations.push({ title: 'FORM FOCUS (LEFT)', text: `The LEFT arm had more (${summary.LEFT.error_count}) form errors. Pay close attention to over-extending (locking the elbow) or over-curling.` });
            } else if (summary.RIGHT.error_count > 0 || summary.LEFT.error_count > 0) {
                recommendations.push({ title: 'FORM FOCUS', text: `You had a few form errors. Ensure you achieve full contraction (ideally < 45° angle) and full extension (ideally > 170° angle) without hyper-extending.` });
            } else {
                recommendations.push({ title: 'PERFECT FORM', text: 'Congratulations! No major form errors detected. Maintain this excellent technique.' });
            }

            // Rep Count Balance
            if (Math.abs(summary.RIGHT.total_reps - summary.LEFT.total_reps) > 1) {
                recommendations.push({ title: 'BALANCE', text: `Rep count imbalance: ${summary.RIGHT.total_reps} (R) vs ${summary.LEFT.total_reps} (L). Make sure to complete the same number of reps for both arms for balanced strength development.` });
            }
        }

        // Display Recommendations
        if (recommendations.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'recommendation-list';
            recommendations.forEach(rec => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="recommendation-title">${rec.title}:</span> <span class="recommendation-text">${rec.text}</span>`;
                ul.appendChild(li);
            });
            recContent.appendChild(ul);
        } else {
            recContent.innerHTML = '<p style="color: var(--color-text-dim);">No specific recommendations generated based on the available data.</p>';
        }
    }
});