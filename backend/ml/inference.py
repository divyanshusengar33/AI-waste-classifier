
from pathlib import Path
from uuid import uuid4
import base64
import io

from PIL import Image
from ultralytics import YOLO


# Project root: EcoSort/
PROJECT_ROOT = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    PROJECT_ROOT
    / "models"
    / "EcoSort_YOLOv8n_finetuned.pt"
)

UPLOAD_DIR = PROJECT_ROOT / "backend" / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

if not MODEL_PATH.is_file():
    raise FileNotFoundError(
        f"Model not found: {MODEL_PATH}\n"
        "Check the filename inside the models folder."
    )

# Load once, not for every uploaded image.
model = YOLO(str(MODEL_PATH))

# Keep class names from the trained model.
CLASS_NAMES = {
    int(class_id): str(name)
    for class_id, name in model.names.items()
}


def predict_image(
    image_bytes: bytes,
    confidence: float = 0.25,
    image_id: str | None = None,
) -> dict:
    """
    Run object detection on an image.

    Returned bounding boxes use normalized YOLO format:
    x_center, y_center, width, height.
    All four values are between 0 and 1.
    """

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    if image.width < 1 or image.height < 1:
        raise ValueError("Image dimensions are invalid.")

    # Use a new ID for each inference unless the caller supplies one.
    image_id = image_id or str(uuid4())

    image_path = UPLOAD_DIR / f"{image_id}.jpg"
    image.save(image_path, format="JPEG", quality=95)

    results = model.predict(
        source=image,
        conf=confidence,
        verbose=False,
    )

    result = results[0]
    detections = []

    if result.boxes is not None:
        for box in result.boxes:
            class_id = int(box.cls.item())
            score = float(box.conf.item())

            x1, y1, x2, y2 = (
                float(value) for value in box.xyxy[0].tolist()
            )

            x_center = ((x1 + x2) / 2) / image.width
            y_center = ((y1 + y2) / 2) / image.height
            box_width = (x2 - x1) / image.width
            box_height = (y2 - y1) / image.height

            detections.append({
                "class_id": class_id,
                "label": CLASS_NAMES.get(
                    class_id, f"class_{class_id}"
                ),
                "confidence": round(score, 4),
                "bbox_xyxy": [
                    round(x1, 2),
                    round(y1, 2),
                    round(x2, 2),
                    round(y2, 2),
                ],
                "bbox_yolo": [
                    round(x_center, 6),
                    round(y_center, 6),
                    round(box_width, 6),
                    round(box_height, 6),
                ],
            })

    # Render the image with prediction boxes.
    annotated = result.plot()
    annotated_rgb = Image.fromarray(annotated[:, :, ::-1])

    buffer = io.BytesIO()
    annotated_rgb.save(buffer, format="JPEG", quality=90)

    encoded_image = base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")

    return {
        "image_id": image_id,
        "image_width": image.width,
        "image_height": image.height,
        "class_names": CLASS_NAMES,
        "detections": detections,
        "annotated_image": f"data:image/jpeg;base64,{encoded_image}",
    }
