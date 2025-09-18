let socket;
let currentPollId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeSocket();
    setupPollSelection();
});

function initializeSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
        updateConnectionStatus(true, 'Connected to server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        updateConnectionStatus(false, 'Disconnected from server');
    });

    socket.on('vote-update', (data) => {
        console.log('Vote update received:', data);
        if (data.pollId === currentPollId) {
            updatePollResults(data.results);
        }
        updateTotalVotes(data.pollId, data.results);
    });
}

function updateConnectionStatus(connected, message) {
    const statusDiv = document.getElementById('connection-status');
    const badge = statusDiv.querySelector('.badge');
    const statusText = document.getElementById('status-text');

    if (connected) {
        statusDiv.classList.add('connected');
        badge.textContent = 'Connected';
        badge.className = 'badge bg-success';
    } else {
        statusDiv.classList.remove('connected');
        badge.textContent = 'Disconnected';
        badge.className = 'badge bg-danger';
    }

    statusText.textContent = message;
}

function setupPollSelection() {
    const pollItems = document.querySelectorAll('.poll-item');

    pollItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            pollItems.forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            const pollId = this.dataset.pollId;
            selectPoll(pollId);
        });
    });
}

function selectPoll(pollId) {
    if (currentPollId) {
        socket.emit('leave-poll', currentPollId);
    }

    currentPollId = pollId;
    socket.emit('join-poll', pollId);

    fetchPollResults(pollId);

    document.getElementById('no-poll-selected').classList.add('d-none');
    document.getElementById('poll-results').classList.remove('d-none');
}

async function fetchPollResults(pollId) {
    try {
        const response = await fetch(`/api/votes/poll/${pollId}`);
        const data = await response.json();

        if (response.ok) {
            const pollResponse = await fetch(`/api/polls/${pollId}`);
            const pollData = await pollResponse.json();

            if (pollResponse.ok) {
                document.getElementById('poll-question').innerHTML =
                    `<h4>${pollData.question}</h4><small class="text-muted">by ${pollData.creator.name}</small>`;
                updatePollResults(data.results);
            }
        } else {
            console.error('Error fetching poll results:', data.error);
        }
    } catch (error) {
        console.error('Error fetching poll results:', error);
    }
}

function updatePollResults(results) {
    const container = document.getElementById('results-container');
    const totalVotes = results.reduce((sum, option) => sum + option.voteCount, 0);

    container.innerHTML = results.map(option => {
        const percentage = totalVotes > 0 ? (option.voteCount / totalVotes * 100).toFixed(1) : 0;

        return `
            <div class="result-option">
                <div class="d-flex justify-content-between">
                    <h6>${option.text}</h6>
                    <span class="vote-count">${option.voteCount} votes (${percentage}%)</span>
                </div>
                <div class="progress">
                    <div class="progress-bar bg-primary" role="progressbar"
                         style="width: ${percentage}%" aria-valuenow="${percentage}"
                         aria-valuemin="0" aria-valuemax="100">
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (totalVotes === 0) {
        container.innerHTML += '<div class="alert alert-info">No votes yet. Be the first to vote!</div>';
    } else {
        container.innerHTML += `<div class="mt-3"><strong>Total votes: ${totalVotes}</strong></div>`;
    }
}

function updateTotalVotes(pollId, results) {
    const pollItem = document.querySelector(`[data-poll-id="${pollId}"]`);
    if (pollItem) {
        const totalVotesSpan = pollItem.querySelector('.total-votes');
        const totalVotes = results.reduce((sum, option) => sum + option.voteCount, 0);
        if (totalVotesSpan) {
            totalVotesSpan.textContent = totalVotes;
        }
    }
}

async function submitVote() {
    const userId = document.getElementById('user-id').value.trim();
    const pollOptionId = document.getElementById('poll-option-id').value.trim();

    if (!userId || !pollOptionId) {
        alert('Please enter both User ID and Poll Option ID');
        return;
    }

    try {
        const response = await fetch('/api/votes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                pollOptionId: pollOptionId
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Vote submitted successfully!');
            document.getElementById('user-id').value = '';
            document.getElementById('poll-option-id').value = '';
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        console.error('Error submitting vote:', error);
        alert('Error submitting vote. Please try again.');
    }
}