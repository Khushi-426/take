document.addEventListener('DOMContentLoaded', function() {

    // Fetch the finalized report data from the backend
    fetch('/report_data')
        .then(response => response.json())
        .then(data => {
            console.log('Report Data Received:', data);
            renderSummary(data);
            renderAngleChart(data.history);
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


    function renderAngleChart(history) {
        const ctx = document.getElementById('angleChart').getContext('2d');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: history.time,
                datasets: [
                    {
                        label: 'Right Elbow Angle',
                        data: history.right_angle,
                        borderColor: 'rgb(244, 67, 54)', // Danger Red
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        borderWidth: 2,
                        tension: 0.1,
                        pointRadius: 0
                    },
                    {
                        label: 'Left Elbow Angle',
                        data: history.left_angle,
                        borderColor: 'rgb(0, 188, 212)', // Primary Cyan
                        backgroundColor: 'rgba(0, 188, 212, 0.1)',
                        borderWidth: 2,
                        tension: 0.1,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0,
                        max: 180,
                        title: { display: true, text: 'Angle (Degrees)', color: 'var(--color-text-dim)' },
                        ticks: { color: 'var(--color-text-dim)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                        title: { display: true, text: 'Time (Seconds)', color: 'var(--color-text-dim)' },
                        ticks: { color: 'var(--color-text-dim)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: 'var(--color-text-light)' }
                    },
                    title: {
                        display: true,
                        text: 'Elbow Angle vs. Time',
                        color: 'var(--color-text-light)'
                    }
                }
            }
        });
    }
});