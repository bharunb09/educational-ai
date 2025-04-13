import json
import os
from fastapi import HTTPException
import google.generativeai as genai

# API Key and credentials setup
api_key = 'AIzaSyCeX_Kj_ztYr7xWmR1DwQp5MqLP3A2-J7U'
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = r'c:\Users\deepa\Downloads\orbital-stream-426213-r2-6040f858ab8b.json'

# Template Prompts
class PromptTemplate:
    @staticmethod
    def from_template(template: str):
        return template

# General Explanation Prompt
general_prompt = PromptTemplate.from_template(
    """You are a friendly teacher who explains concepts in a very simple and fun way. 
    Explain the topic "{topic}" from class {grade} {subject} using an example or analogy. 
    Keep the language very simple, and imagine you're explaining it to a young child.
    Example: If the topic is 'gravity', you might say 'Gravity is like an invisible force that pulls things down towards the ground, like when you drop a ball, it always falls.'"""
)

exam_prompt = PromptTemplate.from_template(
    """Now that we have the simple explanation, let's go a step further. 
    Provide a more detailed and formal explanation of the topic "{general_response}". 
    Explain the key formulas, laws, and definitions related to this topic. 
    Use a slightly advanced but still understandable language suitable for competitive exams like JEE, NEET, or Boards.
    For example, explain the laws with their mathematical representations and any important conditions that apply."""
)

practical_prompt = PromptTemplate.from_template(
    """Take the following technical explanation:

    "{exam_response}"

    Now, relate it to real-life applications. 
    Explain how this concept is used in daily life, technology, or industry. 
    For example, how would we use this concept in engineering, space exploration, or technology? Give concrete examples that people can relate to."""
)

# Function to generate response using Google Generative AI
def generate_response(prompt, formatted_prompt):
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash-001", generation_config={"response_mime_type": "application/json"})
    response = model.generate_content(formatted_prompt)
    return response.text

# Function to generate the entire response (General + Exam-Level + Practical)
def generate_answer(inp, conversation_history=None):
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash-001", generation_config={"response_mime_type": "application/json"})

    # Prepare conversation context
    if conversation_history:
        history_context = " ".join([f"Previous conversation: {item['general_explanation']} {item['exam_level_explanation']} {item['practical_applications']}" for item in conversation_history])
        formatted_prompt = f"{history_context} Now, answer the following question: {inp['topic']}"
    else:
        formatted_prompt = f"Explain the topic '{inp['topic']}' from class {inp['grade']} {inp['subject']} in a simple and fun way."

    # Generate the responses step by step
    general_response = generate_response(general_prompt, formatted_prompt)
    exam_response = generate_response(exam_prompt, exam_prompt.format(general_response=general_response))
    practical_response = generate_response(practical_prompt, practical_prompt.format(exam_response=exam_response))

    # Returning the final response
    try:
        final_response = {
            "general_explanation": general_response,
            "exam_level_explanation": exam_response,
            "practical_applications": practical_response
        }
        return final_response
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
    except AttributeError as e:
        raise HTTPException(status_code=500, detail=f"Error processing input: {str(e)}")