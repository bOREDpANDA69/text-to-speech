from flask import Flask, render_template, request, send_file, jsonify
import os
import pyttsx3
from gtts import gTTS
import uuid
import time

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/audio'

# Ensure the upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def list_pyttsx3_voices():
    """Get a list of available voices from pyttsx3."""
    engine = pyttsx3.init()
    voices = engine.getProperty('voices')
    voice_list = []
    for idx, voice in enumerate(voices):
        voice_list.append({
            'id': idx,
            'name': voice.name,
            'languages': voice.languages
        })
    return voice_list

def tts_with_pyttsx3(text, voice_index=0, rate=150, volume=1.0, save_to=None):
    """Convert text to speech using pyttsx3."""
    engine = pyttsx3.init()
    voices = engine.getProperty('voices')

    if voice_index >= len(voices):
        print("Invalid voice index. Using default.")
        voice_index = 0

    engine.setProperty('voice', voices[voice_index].id)
    engine.setProperty('rate', rate)
    engine.setProperty('volume', volume)

    if save_to:
        try:
            # For macOS, we'll use a different approach
            # First speak the text (this will generate the audio)
            engine.say(text)
            engine.runAndWait()
            
            # Then use gTTS as a fallback to save to file
            print(f"Using gTTS as a fallback to save to file...")
            tts = gTTS(text=text, lang='en')
            tts.save(save_to)
            print(f"Saved to {save_to}")
            return True
        except Exception as e:
            print(f"Error saving audio: {e}")
            print("Falling back to just speaking the text...")
            engine.say(text)
            engine.runAndWait()
            return False
    else:
        engine.say(text)
        engine.runAndWait()
        return True

def tts_with_gtts(text, lang='en', save_to="output.mp3"):
    """Convert text to speech using Google TTS."""
    try:
        tts = gTTS(text=text, lang=lang)
        tts.save(save_to)
        print(f"Saved to {save_to}")
        return True
    except Exception as e:
        print(f"gTTS error: {e}")
        return False

@app.route('/')
def index():
    """Render the main page."""
    voices = list_pyttsx3_voices()
    return render_template('index.html', voices=voices)

@app.route('/convert', methods=['POST'])
def convert():
    """Convert text to speech and return the audio file path."""
    text = request.form.get('text', '')
    engine = request.form.get('engine', 'gtts')
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400
    
    # Generate a unique filename
    unique_id = str(uuid.uuid4())
    filename = f"{unique_id}.mp3"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    success = False
    
    if engine == 'pyttsx3':
        voice_index = int(request.form.get('voice', 0))
        rate = int(request.form.get('rate', 150))
        volume = float(request.form.get('volume', 1.0))
        success = tts_with_pyttsx3(text, voice_index, rate, volume, save_to=filepath)
    else:  # gtts
        lang = request.form.get('lang', 'en')
        success = tts_with_gtts(text, lang, save_to=filepath)
    
    if success:
        return jsonify({
            'success': True,
            'audio_path': f"/static/audio/{filename}",
            'timestamp': time.time()
        })
    else:
        return jsonify({'error': 'Failed to convert text to speech'}), 500

@app.route('/languages')
def languages():
    """Return a list of supported languages for gTTS."""
    # This is a simplified list of common languages
    languages = {
        'en': 'English',
        'fr': 'French',
        'es': 'Spanish',
        'de': 'German',
        'it': 'Italian',
        'ja': 'Japanese',
        'ko': 'Korean',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'zh-CN': 'Chinese (Simplified)',
        'hi': 'Hindi',
        'ar': 'Arabic'
    }
    return jsonify(languages)

if __name__ == '__main__':
    app.run(debug=True)
