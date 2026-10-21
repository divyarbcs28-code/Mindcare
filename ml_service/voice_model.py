import os

def analyze_voice_features(features):
    """
    Evaluates acoustic features against the XGBoost voice deviation model.
    If the trained model artifact does not exist, cleanly reports 'not_trained'.
    """
    model_path = os.path.join(os.path.dirname(__file__), 'xgboost_voice_model.joblib')
    
    if os.path.exists(model_path) and features and features.get("success"):
        try:
            import joblib
            model = joblib.load(model_path)
            mfcc = features.get('mfcc_mean', [])
            if len(mfcc) > 0:
                prediction = model.predict([mfcc])
                score = float(prediction[0]) if hasattr(prediction, '__iter__') else float(prediction)
                return {
                    "model_status": "trained",
                    "deviation_score": round(score, 4),
                    "message": "Voice model analyzed successfully."
                }
        except Exception as e:
            return {
                "model_status": "error",
                "deviation_score": None,
                "message": f"Error evaluating trained model: {str(e)}"
            }

    return {
        "model_status": "not_trained",
        "deviation_score": None,
        "message": "XGBoost voice model training is planned for the next implementation phase."
    }
