
from pathlib import Path
import json
import shutil
import sqlite3

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "backend" / "data"
DB_PATH = DATA_DIR / "feedback.db"

OUTPUT = PROJECT_ROOT / "backend" / "data" / "feedback_dataset"
IMAGE_OUT = OUTPUT / "images" / "train"
LABEL_OUT = OUTPUT / "labels" / "train"

IMAGE_OUT.mkdir(parents=True, exist_ok=True)
LABEL_OUT.mkdir(parents=True, exist_ok=True)

if not DB_PATH.exists():
    raise FileNotFoundError(f"Feedback database not found: {DB_PATH}")

with sqlite3.connect(DB_PATH) as connection:
    connection.row_factory = sqlite3.Row
    rows = connection.execute("""
        SELECT f.feedback_id, f.image_id, f.image_path,
               f.corrections_json
        FROM feedback f
        JOIN (
            SELECT image_id, MAX(created_at) AS latest
            FROM feedback
            WHERE reviewed = 1
            GROUP BY image_id
        ) latest
          ON f.image_id = latest.image_id
         AND f.created_at = latest.latest
        WHERE f.reviewed = 1
        ORDER BY f.image_id
    """).fetchall()

exported = 0

for row in rows:
    image_path = Path(row["image_path"])

    if not image_path.is_file():
        print(f"Skipping missing image: {row['image_id']}")
        continue

    image_id = row["image_id"]
    destination_image = IMAGE_OUT / f"{image_id}.jpg"
    destination_label = LABEL_OUT / f"{image_id}.txt"

    # Use a copy; do not move the original feedback image.
    shutil.copy2(image_path, destination_image)

    corrections = json.loads(row["corrections_json"])
    lines = []

    for item in corrections:
        class_id = int(item["class_id"])
        xc = float(item["x_center"])
        yc = float(item["y_center"])
        width = float(item["width"])
        height = float(item["height"])

        if class_id not in range(5):
            raise ValueError(f"Invalid class ID: {class_id}")

        if not (
            0 <= xc <= 1 and 0 <= yc <= 1
            and 0 < width <= 1 and 0 < height <= 1
            and xc - width / 2 >= 0
            and yc - height / 2 >= 0
            and xc + width / 2 <= 1
            and yc + height / 2 <= 1
        ):
            raise ValueError(f"Invalid box for image {image_id}")

        lines.append(
            f"{class_id} {xc:.6f} {yc:.6f} "
            f"{width:.6f} {height:.6f}"
        )

    # An empty file represents a reviewed image with no objects.
    destination_label.write_text(
        "\n".join(lines) + ("\n" if lines else ""),
        encoding="utf-8",
    )

    exported += 1

names = [
    "Plastic",
    "Paper_Cardboard",
    "Metal",
    "Glass",
    "Other_Waste",
]

yaml_text = (
    f"path: {OUTPUT.as_posix()}\n"
    "train: images/train\n"
    "val: images/train\n"
    "test: images/train\n"
    "nc: 5\n"
    "names:\n"
    + "".join(f"  {i}: {name}\n" for i, name in enumerate(names))
)

(OUTPUT / "data.yaml").write_text(yaml_text, encoding="utf-8")

print(f"Export complete: {OUTPUT}")
print(f"Images exported: {exported}")
print(f"Labels exported: {exported}")
print("This is a review dataset, not yet a validated training dataset.")
