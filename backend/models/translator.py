from deep_translator import GoogleTranslator
from models.language import language_codes

def translate(language: str, text) -> any:
    target_language = language

    def translate_text(text_piece: str) -> str:
        max_chars = 5000
        if not isinstance(text_piece, str) or not text_piece.strip():
            return text_piece
        if len(text_piece) > max_chars:
            chunks = [text_piece[i:i+max_chars] for i in range(0, len(text_piece), max_chars)]
            translated_chunks = [
                GoogleTranslator(source='auto', target=target_language).translate(chunk)
                for chunk in chunks
            ]
            return ' '.join(translated_chunks)
        return GoogleTranslator(source='auto', target=target_language).translate(text_piece)

    def recursive_translate(obj):
        if isinstance(obj, str):
            return translate_text(obj)
        elif isinstance(obj, list):
            return [recursive_translate(item) for item in obj]
        elif isinstance(obj, dict):
            return {key: recursive_translate(value) for key, value in obj.items()}
        else:
            return obj  # leave non-string data as-is

    return recursive_translate(text)
