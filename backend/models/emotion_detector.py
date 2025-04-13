import cv2
import numpy as np
import tensorflow as tf


# Load the model once
model = tf.keras.models.load_model(r'C:\Users\deepa\Downloads\xyz\models\fer2013_mini_XCEPTION.102-0.66.hdf5', compile=False)

# Emotion classes
emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']

# Load face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Preprocessing function
def preprocess_face(face_img):
    face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)
    face_img = cv2.resize(face_img, (64, 64))  # Adjust the size as per model requirement
    face_img = face_img.astype('float32') / 255.0
    face_img = np.expand_dims(face_img, axis=-1)
    face_img = np.expand_dims(face_img, axis=0)
    return face_img

# 🎯 Emotion detection function
def detect_emotion_from_image(image: np.ndarray) -> int:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

    if len(faces) == 0:
        return 0  # No face detected

    # Use the first detected face
    x, y, w, h = faces[0]
    face = image[y:y+h, x:x+w]
    processed_face = preprocess_face(face)

    prediction = model.predict(processed_face, verbose=0)
    emotion_idx = np.argmax(prediction)
    emotion_label = emotion_labels[emotion_idx]

    # Check if the emotion is Happy, Neutral, or Surprise
    if emotion_label in ['Happy', 'Neutral', 'Surprise']:
        return 1  # Return 1 for these emotions
    else:
        return 0  # Return 0 for other emotions

# Initialize FastAPI app
