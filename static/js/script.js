// Modern Text-to-Speech Converter JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const ttsForm = document.getElementById('ttsForm');
    const engineSelect = document.getElementById('engine');
    const gttsOptions = document.getElementById('gttsOptions');
    const pyttsx3Options = document.getElementById('pyttsx3Options');
    const rateSlider = document.getElementById('rate');
    const rateValue = document.getElementById('rateValue');
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volumeValue');
    const convertBtn = document.getElementById('convertBtn');
    const convertBtnText = document.getElementById('convertBtnText');
    const convertBtnSpinner = document.getElementById('convertBtnSpinner');
    const audioContainer = document.getElementById('audioContainer');
    const audioPlayer = document.getElementById('audioPlayer');
    const downloadLink = document.getElementById('downloadLink');
    const errorContainer = document.getElementById('errorContainer');
    const historyContainer = document.getElementById('historyContainer');
    const toggleHistoryBtn = document.getElementById('toggleHistory');
    const historyWrapper = document.getElementById('historyWrapper');

    // History storage
    let conversionHistory = JSON.parse(localStorage.getItem('ttsHistory')) || [];
    let historyVisible = false;

    // Initialize the page
    initPage();

    // Event listeners
    engineSelect.addEventListener('change', toggleEngineOptions);
    rateSlider.addEventListener('input', updateRateValue);
    volumeSlider.addEventListener('input', updateVolumeValue);
    ttsForm.addEventListener('submit', handleFormSubmit);
    toggleHistoryBtn.addEventListener('click', toggleHistory);

    // Functions
    function initPage() {
        // Set initial values
        updateRateValue();
        updateVolumeValue();
        
        // Display conversion history
        renderHistory();
        
        // Add animation classes
        document.querySelectorAll('.main-card, .history-section').forEach(el => {
            el.classList.add('fade-in');
        });
    }

    function toggleEngineOptions() {
        if (engineSelect.value === 'gtts') {
            gttsOptions.style.display = 'block';
            pyttsx3Options.style.display = 'none';
        } else {
            gttsOptions.style.display = 'none';
            pyttsx3Options.style.display = 'block';
        }
    }

    function toggleHistory() {
        historyVisible = !historyVisible;
        
        if (historyVisible) {
            historyWrapper.style.display = 'block';
            toggleHistoryBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
            // Add a small delay before adding the class to trigger the animation
            setTimeout(() => {
                historyWrapper.classList.add('fade-in');
            }, 10);
        } else {
            historyWrapper.classList.remove('fade-in');
            toggleHistoryBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
            // Add a small delay to allow the animation to complete
            setTimeout(() => {
                historyWrapper.style.display = 'none';
            }, 300);
        }
    }

    function updateRateValue() {
        rateValue.textContent = rateSlider.value;
    }

    function updateVolumeValue() {
        volumeValue.textContent = volumeSlider.value;
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Show loading state
        setLoading(true);
        
        // Hide previous results and errors
        audioContainer.style.display = 'none';
        errorContainer.style.display = 'none';
        
        // Get form data
        const formData = new FormData(ttsForm);
        
        // Send request to server
        fetch('/convert', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showError(data.error);
            } else {
                // Show audio player with the generated audio
                showAudio(data.audio_path);
                
                // Add to history
                addToHistory({
                    text: formData.get('text'),
                    engine: formData.get('engine'),
                    audioPath: data.audio_path,
                    timestamp: data.timestamp
                });
                
                // Show history if it's not already visible
                if (!historyVisible) {
                    toggleHistory();
                }
            }
        })
        .catch(error => {
            showError('Failed to convert text to speech. Please try again.');
            console.error('Error:', error);
        })
        .finally(() => {
            setLoading(false);
        });
    }

    function setLoading(isLoading) {
        if (isLoading) {
            convertBtnText.textContent = 'Converting...';
            convertBtnSpinner.style.display = 'inline-block';
            convertBtn.disabled = true;
        } else {
            convertBtnText.textContent = 'Generate Speech';
            convertBtnSpinner.style.display = 'none';
            convertBtn.disabled = false;
        }
    }

    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        
        // Smooth scroll to error
        errorContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function showAudio(audioPath) {
        audioPlayer.src = audioPath;
        downloadLink.href = audioPath;
        audioContainer.style.display = 'block';
        
        // Add fade-in animation
        audioContainer.classList.add('fade-in');
        
        // Auto-play the audio
        audioPlayer.play().catch(e => console.log('Auto-play prevented:', e));
        
        // Smooth scroll to audio player
        audioContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function addToHistory(item) {
        // Add to the beginning of the array
        conversionHistory.unshift(item);
        
        // Limit history to 10 items
        if (conversionHistory.length > 10) {
            conversionHistory.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('ttsHistory', JSON.stringify(conversionHistory));
        
        // Update the UI
        renderHistory();
    }

    function renderHistory() {
        if (conversionHistory.length === 0) {
            historyContainer.innerHTML = '<p class="text-muted">Your recent conversions will appear here.</p>';
            return;
        }
        
        let html = '';
        
        conversionHistory.forEach((item, index) => {
            const date = new Date(item.timestamp * 1000).toLocaleString();
            const engineName = item.engine === 'gtts' ? 'Google TTS' : 'System Voice';
            
            html += `
                <div class="history-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="history-text">${item.text.substring(0, 40)}${item.text.length > 40 ? '...' : ''}</div>
                        <button class="btn btn-sm btn-outline-primary" 
                                onclick="playHistoryAudio('${item.audioPath}')">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                    <div class="text-muted small mt-1">
                        <i class="fas ${item.engine === 'gtts' ? 'fa-cloud' : 'fa-microphone'}"></i> ${engineName} • ${date}
                    </div>
                </div>
            `;
        });
        
        historyContainer.innerHTML = html;
    }

    // Add fade-in animation class to CSS
    const style = document.createElement('style');
    style.textContent = `
        .fade-in {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);

    // Make playHistoryAudio global so it can be called from inline event handlers
    window.playHistoryAudio = function(audioPath) {
        audioPlayer.src = audioPath;
        downloadLink.href = audioPath;
        audioContainer.style.display = 'block';
        audioContainer.classList.add('fade-in');
        audioPlayer.play().catch(e => console.log('Auto-play prevented:', e));
        
        // Smooth scroll to audio player
        audioContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
});
