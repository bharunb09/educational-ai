from fastapi.responses import JSONResponse
from services.answer_generator import *
import numpy as np
from fastapi import FastAPI, File, HTTPException, Form, UploadFile
import google.generativeai as genai
from typing import Dict
from services.chapter_full_generate import explain_chapter
from models.translator import *
from models.emotion_detector import *
from io import BytesIO
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)
conversation_state: Dict[str, Dict] = {}
@app.post("/tutor")
async def tutor_endpoint(
    user_id: str = Form(...),  # Unique identifier for the user
    grade: str = Form(...),
    subject: str = Form(...),
    topic: str = Form(...),
    chapter_explain: str = Form(...) , # Accept as string
    language: str = Form(...), 
):
    # Store the user's input and previous conversation if it exists
    if user_id not in conversation_state:
        conversation_state[user_id] = {
            "grade": grade,
            "subject": subject,
            "topic": topic,
            "conversation": []
        }
    else:
        # Update existing conversation state
        conversation_state[user_id]["grade"] = grade
        conversation_state[user_id]["subject"] = subject
        conversation_state[user_id]["topic"] = topic

    # Generate the response
    flag =1
    chapter_explain = chapter_explain.lower() == "true"
    if chapter_explain:
        flag=0
        answer = explain_chapter(grade, subject, topic)
    else:
        answer = generate_answer(conversation_state[user_id], conversation_history=conversation_state[user_id]["conversation"])
    if flag:
        conversation_state[user_id]["conversation"].append(answer)

    language=language.lower()
    if language != "en":
        answer = translate(language, answer)
    print(answer)
    return {
        "answer": answer,
        # "conversation_history": conversation_state[user_id]["conversation"]
    }

@app.post("/detect-emotion/")
async def detect_emotion(image: UploadFile = File(...),
                             user_id: str = Form(...),  # Unique identifier for the user
                             grade: str = Form(...),
                             subject: str = Form(...),
                             topic: str = Form(...),
                             language: str = Form(...), ):
    try:
        # Read the image file
        image_data = await image.read()
        
        # Convert the image data to a numpy array
        image_pil = Image.open(BytesIO(image_data))
        image_np = np.array(image_pil)
        
        # Call the emotion detection function
        result = detect_emotion_from_image(image_np)
        
        # If the result is 0 (indicating confusion or lack of understanding)
        if True:
            # Store the current input (prompt) as part of the conversation history
            conversation_state[user_id]["conversation"].append({
                "user_input": "I didn't understand clearly, my age is 5",  # Adding a prompt for younger understanding
                "emotion": "confusion"
            })
            
            # Generate a response as if the user didn't understand (could use a simpler explanation)
            answer = generate_answer({
                "grade": "1",  # Assuming a 5-year-old might be in grade 1
                "subject": subject,
                "topic": topic,
                "conversation": conversation_state[user_id]["conversation"]
            })

            # Translate if needed
            language = language.lower()
            if language != "english":
                answer = translate(language, answer)

            # Store the generated answer as the new response
            conversation_state[user_id]["conversation"].append({"answer": answer})
            
            return {
                "answer": answer,
                # "conversation_history": conversation_state[user_id]["conversation"]
            }
        
        # If emotion was detected, return it
        

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
