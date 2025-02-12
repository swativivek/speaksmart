const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const output = document.getElementById('output');
const correctedOutput = document.getElementById('corrected-output');

let recognition;
const saplingkey = 'BR62GV96KCRHUQSQ3QHCYKF1ZZ8MJX2X';

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        output.textContent = 'Listening... Please speak now.';
        correctedOutput.textContent = ''; // Clear previous output
    };

    recognition.onresult = async (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + ' ';
        }

        output.textContent = transcript.trim(); // Show original transcription

        // Send the transcript to the grammar correction API
        const correctedText = await correctGrammar(transcript.trim());

        // Update the corrected output box
        correctedOutput.textContent = correctedText;
    };

    recognition.onerror = (event) => {
        output.textContent = 'Error: ' + event.error;
    };

    recognition.onend = () => {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        output.textContent += '\n[Listening Stopped]';
    };
} else {
    output.textContent = 'Speech recognition is not supported in this browser. Try Google Chrome.';
}

startBtn.addEventListener('click', () => {
    recognition.start();
});

stopBtn.addEventListener('click', () => {
    recognition.stop();
});

// Corrected function to fix grammar using Sapling API
async function correctGrammar(text) {
    try {
        const response = await fetch('https://api.sapling.ai/api/v1/edits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': 'session=eyJfcGVybWFuZW50Ijp0cnVlfQ.Z6xbZw.Th04vBhwBWYUKpETcFEj4E7ETis', // Your session cookie
            },
            body: JSON.stringify({
                key: saplingkey, // Your API Key
                text: text, // The text to be corrected
                session_id: 'test session', // Optional session ID
            }),
        });

        const data = await response.json();

        // Check if Sapling API returned any edits
        if (data.edits && data.edits.length > 0) {
            let correctedText = text;

            // Apply corrections in reverse order to prevent index shifts
            data.edits.reverse().forEach(edit => {
                const { start, end, replacement } = edit;
                if (replacement) {
                    let before = correctedText.slice(0, start);
                    let after = correctedText.slice(end);
                    correctedText = before + replacement + after;
                }
            });

            return correctedText;
        }

        return text; // Return original text if no corrections are needed
    } catch (error) {
        console.error('Error correcting grammar:', error);
        return text; // Return original text in case of error
    }
}
