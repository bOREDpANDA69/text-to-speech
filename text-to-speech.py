import pyttsx3
from gtts import gTTS
from pydub import AudioSegment
import os

def list_pyttsx3_voices():
    engine = pyttsx3.init()
    voices = engine.getProperty('voices')
    print("Available voices (pyttsx3):")
    for idx, voice in enumerate(voices):
        print(f"{idx}: {voice.name} ({voice.languages})")
    return voices

def tts_with_pyttsx3(text, voice_index=0, rate=150, volume=1.0, save_to=None):
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
        except Exception as e:
            print(f"Error saving audio: {e}")
            print("Falling back to just speaking the text...")
            engine.say(text)
            engine.runAndWait()
    else:
        engine.say(text)
        engine.runAndWait()

def tts_with_gtts(text, lang='en', save_to="output.mp3"):
    try:
        tts = gTTS(text=text, lang=lang)
        tts.save(save_to)
        print(f"Saved to {save_to}")
    except Exception as e:
        print(f"gTTS error: {e}")

def main():
    print("Text-to-Speech Program")
    choice = input("Choose engine (1: pyttsx3 [offline], 2: gTTS [online]): ").strip()

    text = input("Enter the text to speak: ")

    if choice == "1":
        voices = list_pyttsx3_voices()
        voice_idx = int(input("Choose voice index: "))
        rate = int(input("Enter speech rate (default 150): ") or "150")
        volume = float(input("Enter volume (0.0 to 1.0, default 1.0): ") or "1.0")
        save = input("Save to file? (y/n): ").strip().lower()
        save_path = "output.mp3" if save == 'y' else None
        tts_with_pyttsx3(text, voice_idx, rate, volume, save_to=save_path)

    elif choice == "2":
        lang = input("Enter language code (e.g., en, fr, de, hi): ").strip()
        save_path = "output.mp3"
        tts_with_gtts(text, lang, save_to=save_path)
    else:
        print("Invalid choice.")

if __name__ == "__main__":
    main()
