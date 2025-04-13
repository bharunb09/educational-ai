import os
import google.generativeai as genai
from fastapi import HTTPException

api_key = 'AIzaSyCeX_Kj_ztYr7xWmR1DwQp5MqLP3A2-J7U'
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = r'c:\Users\deepa\Downloads\orbital-stream-426213-r2-6040f858ab8b.json'
genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-1.5-flash-001")

def get_chapter_contents_prompt(grade, subject, chapter):
    return f"""
You are an expert teacher creating structured learning content.
List the key subtopics to be covered under the chapter "{chapter}" for class {grade} {subject}.

ONLY return a JSON array like this:
["Introduction", "Key Concept 1", "Key Concept 2", ..., "Real-life Applications"]

DO NOT include any explanation, markdown, or formatting—just the JSON array.
"""


def get_explanation_prompt(grade, subject, chapter, topic):
    return f"""
Explain the topic "{topic}" in a very simple and fun way for a class {grade} student studying {subject}, in the context of the chapter "{chapter}".
Use examples and analogies. Keep it clear and engaging.
"""

def generate_content(prompt: str):
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate content: {str(e)}")

def explain_chapter(grade: str, subject: str, chapter: str):
    # Step 1: Get list of contents
    chapter_prompt = get_chapter_contents_prompt(grade, subject, chapter)
    raw_contents = generate_content(chapter_prompt)

    try:
        contents = eval(raw_contents) if isinstance(raw_contents, str) else raw_contents
        if not isinstance(contents, list):
            raise ValueError("Contents must be a list")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid chapter content format: {str(e)}")

    # Step 2: For each content, generate explanation
    explanations = []
    for topic in contents:
        explanation_prompt = get_explanation_prompt(grade, subject, chapter, topic)
        explanation = generate_content(explanation_prompt)
        explanations.append({
            "topic": topic,
            "explanation": explanation
        })

    return {
        "chapter": chapter,
        "grade": grade,
        "subject": subject,
        "contents": contents,
        "explanations": explanations
    }
