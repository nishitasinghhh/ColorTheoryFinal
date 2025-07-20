import cv2
import numpy as np
import mediapipe as mp
from sklearn.cluster import KMeans
import json
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description="Analyze face features from an image.")
    parser.add_argument('--image', type=str, required=True, help='Path to the image file')
    parser.add_argument('--undertone', type=str, default='Warm', choices=['Warm', 'Cool', 'Neutral'], help='User undertone')
    args = parser.parse_args()

    image_path = args.image
    user_undertone = args.undertone

    image = cv2.imread(image_path)
    if image is None:
        print(json.dumps({"error": f"Could not read image at {image_path}"}))
        sys.exit(1)
    image = cv2.resize(image, (512, 512))
    h, w = image.shape[:2]

    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)
    results = face_mesh.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

    output = {
        "undertone": user_undertone
    }

    if not results.multi_face_landmarks:
        print(json.dumps({"error": "No face detected"}, indent=2))
        sys.exit(1)
    else:
        face_landmarks = results.multi_face_landmarks[0].landmark

        # 1. LIPS
        LIPS = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291]
        points = np.array([(int(face_landmarks[i].x * w), int(face_landmarks[i].y * h)) for i in LIPS])
        lip_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillConvexPoly(lip_mask, points, 255)
        lip_pixels = image[lip_mask == 255]
        lip_rgb = np.mean(lip_pixels, axis=0).astype(int)
        output["lip_rgb"] = lip_rgb.tolist()

        # 2. HAIR
        face_mask = np.zeros((h, w), dtype=np.uint8)
        all_points = np.array([[int(lm.x * w), int(lm.y * h)] for lm in face_landmarks], dtype=np.int32)
        cv2.fillConvexPoly(face_mask, cv2.convexHull(all_points), 255)
        hair_mask = cv2.bitwise_not(face_mask)
        top_half_mask = np.zeros_like(hair_mask)
        top_half_mask[0:h//2, :] = 255
        hair_mask = cv2.bitwise_and(hair_mask, top_half_mask)
        hair_pixels = image[hair_mask == 255]
        hair_pixels = np.array([pix for pix in hair_pixels if np.mean(pix) < 180])
        if len(hair_pixels) == 0:
            output["hair_rgb"] = [0, 0, 0]
        else:
            kmeans = KMeans(n_clusters=2, random_state=42).fit(hair_pixels)
            centers = kmeans.cluster_centers_
            dominant_rgb = centers[np.argmin(np.sum(centers, axis=1))].astype(int)
            output["hair_rgb"] = dominant_rgb.tolist()

        # 3. SKIN
        SKIN_INDICES = list(set(range(0, 468)) - set([
            *range(33, 133), *range(61, 88), *range(95, 107),
            *range(130, 151), *range(468, 478)
        ]))
        skin_points = np.array([[int(face_landmarks[i].x * w), int(face_landmarks[i].y * h)] for i in SKIN_INDICES])
        skin_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillConvexPoly(skin_mask, cv2.convexHull(skin_points), 255)
        skin_region = image[skin_mask == 255]
        avg_skin_rgb = np.mean(skin_region, axis=0).astype(int)
        output["skin_rgb"] = avg_skin_rgb.tolist()

        # 4. EYES
        LEFT_IRIS = [468, 469, 470, 471]
        RIGHT_IRIS = [473, 474, 475, 476]

        def extract_iris_mask(indices):
            points = np.array([(int(face_landmarks[i].x * w), int(face_landmarks[i].y * h)) for i in indices])
            mask = np.zeros((h, w), dtype=np.uint8)
            cv2.fillConvexPoly(mask, points, 255)
            return mask

        def classify_eye_color(h, s, v, rgb):
            r, g, b = rgb
            brightness = (r + g + b) / 3
            if brightness < 70 and max(r, g, b) - min(r, g, b) < 20: return "Black"
            if (h <= 10 or h >= 160) and brightness < 90: return "Dark Brown"
            if v < 30: return "Black"
            if v > 200 and s < 30: return "Gray"
            if 10 < h <= 25 and s > 50: return "Amber"
            if 25 < h <= 45: return "Hazel"
            if 45 < h <= 85: return "Green"
            if 85 < h <= 130: return "Blue"
            if h <= 10 or h >= 160: return "Brown"
            if 140 <= h <= 160 and s < 50: return "Violet"
            return "Unknown"

        def get_iris_color(mask):
            iris_pixels = image[mask == 255]
            if len(iris_pixels) == 0: return "Unknown", (0, 0, 0)
            hsv = cv2.cvtColor(iris_pixels.reshape(-1, 1, 3), cv2.COLOR_BGR2HSV).reshape(-1, 3)
            kmeans = KMeans(n_clusters=1, random_state=42).fit(hsv)
            h, s, v = kmeans.cluster_centers_[0].astype(int)
            rgb = cv2.cvtColor(np.uint8([[[h, s, v]]]), cv2.COLOR_HSV2BGR)[0][0]
            return classify_eye_color(h, s, v, rgb), tuple(int(c) for c in rgb)

        left_mask = extract_iris_mask(LEFT_IRIS)
        right_mask = extract_iris_mask(RIGHT_IRIS)
        left_color, left_rgb = get_iris_color(left_mask)
        right_color, right_rgb = get_iris_color(right_mask)

        # Pick dominant
        if left_color in ["Black", "Dark Brown", "Brown"]:
            dominant = left_color
        elif right_color in ["Black", "Dark Brown", "Brown"]:
            dominant = right_color
        else:
            dominant = left_color

        output["left_eye_color"] = left_color
        output["right_eye_color"] = right_color
        output["dominant_eye_color"] = dominant

        print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main() 