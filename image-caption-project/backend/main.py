import numpy as np
import pickle
import time
import os
import io

from fastapi import FastAPI, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from tensorflow.keras.models import load_model, Model
from tensorflow.keras.applications.vgg16 import VGG16, preprocess_input
from tensorflow.keras.preprocessing.image import img_to_array
from tensorflow.keras.preprocessing.sequence import pad_sequences

from PIL import Image
from gtts import gTTS

# ======================
# INIT APP
# ======================

app = FastAPI()

# CORS (React connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve audio files
app.mount("/audio", StaticFiles(directory="."), name="audio")

# ======================
# LOAD MODEL
# ======================

print("Loading caption model...")
model = load_model("model_30k.h5")

print("Loading tokenizer...")
with open("tokenizer.pkl", "rb") as f:
    tokenizer = pickle.load(f)

max_length = 74

print("Loading VGG16...")
vgg = VGG16(weights="imagenet")
vgg_model = Model(inputs=vgg.inputs, outputs=vgg.layers[-2].output)

print("✅ Backend ready!")

# ======================
# HELPER FUNCTIONS
# ======================

def get_word(index):
    for word, i in tokenizer.word_index.items():
        if i == index:
            return word
    return None


def predict_caption(image_features):
    caption = "startseq"

    for _ in range(max_length):
        seq = tokenizer.texts_to_sequences([caption])[0]
        seq = pad_sequences([seq], maxlen=max_length)

        yhat = model.predict([image_features, seq], verbose=0)
        yhat = np.argmax(yhat)

        word = get_word(yhat)

        if word is None:
            break

        caption += " " + word

        if word == "endseq":
            break

    return caption.replace("startseq", "").replace("endseq", "").strip()


# ======================
# API ENDPOINT
# ======================

@app.post("/predict")
async def predict(request: Request, file: UploadFile = File(...)):

    # Read image
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).resize((224, 224))

    image = img_to_array(image)
    image = image.reshape((1, 224, 224, 3))
    image = preprocess_input(image)

    # Extract features
    features = vgg_model.predict(image, verbose=0)

    # Generate caption
    caption = predict_caption(features)

    print("Caption:", caption)

    # ======================
    # TEXT TO SPEECH (FIXED)
    # ======================

    # delete old audio files (optional cleanup)
    for f in os.listdir():
        if f.startswith("audio_"):
            try:
                os.remove(f)
            except:
                pass

    # unique filename (no caching issue)
    audio_path = f"audio_{int(time.time())}.mp3"

    tts = gTTS(caption)
    tts.save(audio_path)

    # ======================
    # RESPONSE
    # ======================

    base_url = str(request.base_url).rstrip("/")

    return {
        "caption": caption,
        "audio": f"{base_url}/audio/{audio_path}"
    }