# MindCare — System Architecture

```mermaid
flowchart TB
  subgraph Client[Presentation layer — React + Vite]
    UI[Browser UI<br/>Landing · Login/Register · Home<br/>Voice Reflection · Insights · Support · Profile · Fun Zone]
    State[Client state<br/>React Router · local storage · hooks]
    Services[API services<br/>authService · moodService]
    UI <--> State
    UI --> Services
  end

  subgraph API[Application layer — Node.js + Express]
    Middleware[CORS · JSON parsing<br/>activityAuth signed-token middleware]
    Routes[REST API routes<br/>/auth · /users · /moods<br/>/reflections · /activities · /insights · /safety]
    Logic[Route handlers<br/>validation · orchestration · response shaping]
    Middleware --> Routes --> Logic
  end

  subgraph Persistence[Persistence layer — MongoDB + Mongoose]
    Collections[(Application data<br/>Users · MoodEntries · Reflections<br/>AnalysisResults · Activities/Sessions<br/>Insights · Preferences · Badges<br/>SafetyFlags · EmergencyContacts)]
  end

  subgraph ML[ML inference layer — Python + FastAPI]
    MLAPI[Internal ML endpoints<br/>/transcribe · /analyze-text<br/>/analyze-voice · /health]
    Audio[Audio preparation<br/>soundfile decode · mono conversion<br/>16 kHz resampling · acoustic features]
    Whisper[Whisper ASR<br/>English transcript]
    TextModels[Text analysis<br/>DistilRoBERTa emotion<br/>DistilBERT sentiment]
    Voice[Voice feature analysis<br/>pitch · energy · pauses<br/>voice model/status]
    MLAPI --> Audio --> Whisper
    MLAPI --> TextModels
    Audio --> Voice
    Whisper --> TextModels
  end

  Services -->|HTTPS/JSON or multipart audio| Middleware
  Logic -->|Read/write via Mongoose| Collections
  Logic <-->|HTTP JSON/multipart; optional X-API-Key| MLAPI

  subgraph VoiceFlow[Voice reflection sequence]
    Record[1. Record audio in browser]
    Transcribe[2. POST /api/reflections/transcribe]
    Review[3. Return transcript + acoustic features<br/>User reviews/edits; not persisted yet]
    Confirm[4. POST /api/reflections/confirm-voice<br/>signed user token + confirmed text]
    Analyze[5. FastAPI /analyze-text<br/>emotion + sentiment]
    Save[6. Persist Reflection + AnalysisResult]
    Result[7. Return analysis to UI<br/>and load history/insights through API]
    Record --> Transcribe --> Review --> Confirm --> Analyze --> Save --> Result
  end

  UI -. audio upload .-> Transcribe
  Transcribe -. Express forwards audio .-> MLAPI
  MLAPI -. transcript and features .-> Review
  Confirm -. Express submits confirmed text .-> MLAPI
  Save -.-> Collections
  Collections -. history reads .-> Logic
  Logic -. response .-> Result
```

## Main request flows

- **Authentication:** React login/register → Express `/api/auth` → password verification/hash and user record in MongoDB → signed token returned to the client. Protected reflection operations use `activityAuth` to identify the user.
- **Typed reflection:** React → Express `/api/reflections` → FastAPI `/analyze-text` → emotion/sentiment response → `Reflection` and `AnalysisResult` saved in MongoDB → result returned to React.
- **Voice reflection (review flow):** React records audio → Express temporarily receives and forwards it to FastAPI `/transcribe` → Whisper transcript and acoustic features returned for user review. On confirmation, Express sends the confirmed text to `/analyze-text`, saves the reflection and analysis, then returns the combined result. The uploaded temporary file is removed after forwarding.
- **Other wellbeing features:** React calls the relevant Express route for moods, activities, insights, users, or safety; Express reads/writes the corresponding MongoDB models and returns JSON.

## Deployment boundary

The frontend, Express backend, MongoDB database, and ML service are separate components. The backend connects to the ML service using `ML_SERVICE_URL`; when configured, `ML_SERVICE_API_KEY` is sent as `X-API-Key`. The ML service can run locally or on a separate host. MongoDB connects through `MONGO_URI`.
