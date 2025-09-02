// imageUtils.ts
import modelManager from '@/interceptor/ModelManager';
import { ImageTensor, Rect, BBox, Landmark, Detection } from './types';
import { Image } from 'react-native';

import * as tf from '@tensorflow/tfjs'

export interface Padding {
  top: number;
  left: number;
  right: number;
  bottom: number;
}
export function sigmoid(data: any): number[] {

  return data.map(v => 1 / (1 + Math.exp(-v)));
}

export function detectionLetterboxRemoval(
  detections: Detection[],
  padding: [number, number, number, number]
): Detection[] {
  const [left, top, right, bottom] = padding;
  const hScale = 1 - (left + right);
  const vScale = 1 - (top + bottom);

  return detections.map(det => {
    const adjusted = det.data.map(([x, y]) => [
      (x - left) / hScale,
      (y - top) / vScale,
    ]);
    return new Detection(adjusted, det.score);
  });
}

export enum SizeMode {
  DEFAULT,
  SQUARE_LONG,
  SQUARE_SHORT,
}

export function bboxToRoi(
  bbox: BBox,
  imageSize: [number, number],
  rotationKeypoints?: [number, number][],
  scale: [number, number] = [1.0, 1.0],
  sizeMode: SizeMode = SizeMode.DEFAULT
): Rect {
  if (!bbox.normalized) throw new Error('bbox must be normalized');

  let [width, height] = selectRoiSize(bbox, imageSize, sizeMode);
  const [scaleX, scaleY] = scale;
  width *= scaleX;
  height *= scaleY;
  const cx = bbox.xmin + bbox.width / 2;
  const cy = bbox.ymin + bbox.height / 2;

  let rotation = 0.0;
  if (rotationKeypoints && rotationKeypoints.length >= 2) {
    const [x0, y0] = rotationKeypoints[0];
    const [x1, y1] = rotationKeypoints[1];
    const angle = -Math.atan2(y0 - y1, x1 - x0);
    const TWO_PI = 2 * Math.PI;
    rotation = angle - TWO_PI * Math.floor((angle + Math.PI) / TWO_PI);
  }
  return new Rect(cx, cy, width, height, rotation, true);
}

export function bboxFromLandmarks(landmarks: Landmark[]): BBox {
  if (landmarks.length < 2) throw new Error('At least 2 landmarks required');

  let xmin = Infinity, ymin = Infinity;
  let xmax = -Infinity, ymax = -Infinity;

  for (const { x, y } of landmarks) {
    xmin = Math.min(xmin, x);
    ymin = Math.min(ymin, y);
    xmax = Math.max(xmax, x);
    ymax = Math.max(ymax, y);
  }

  return new BBox(xmin, ymin, xmax, ymax);
}

export function projectLandmarks(
  data: Landmark[] | number[][],
  tensorSize: [number, number],
  imageSize: [number, number],
  padding: [number, number, number, number],
  roi?: Rect,
  flipHorizontal: boolean = false
): Landmark[] {
  const points = Array.isArray(data[0])
    ? (data as number[][])
    : (data as Landmark[]).map(p => [p.x, p.y, p.z]);

  const [width, height] = tensorSize;
  const normalized = points.map(([x, y, z]) => [x / width, y / height, z / width]);

  for (const point of normalized) {
    if (flipHorizontal) {
      point[0] = 1 - point[0];
    }
  }

  const [left, top, right, bottom] = padding;
  const hScale = 1 - (left + right);
  const vScale = 1 - (top + bottom);

  const adjusted = normalized.map(([x, y, z]) => [
    (x - left) / hScale,
    (y - top) / vScale,
    z / hScale,
  ]);

  if (!roi) return adjusted.map(([x, y, z]) => new Landmark(x, y, z));

  const normRoi = roi.scaled(imageSize, true);
  const sin = Math.sin(roi.rotation);
  const cos = Math.cos(roi.rotation);
  const matrix = [
    [cos, sin],
    [-sin, cos]
  ];

  return adjusted.map(([x, y, z]) => {
    const dx = x - 0.5;
    const dy = y - 0.5;
    const [rx, ry] = [
      dx * matrix[0][0] + dy * matrix[0][1],
      dx * matrix[1][0] + dy * matrix[1][1],
    ];
    const nx = normRoi.x_center + rx * normRoi.width;
    const ny = normRoi.y_center + ry * normRoi.height;
    const nz = z;
    return new Landmark(nx, ny, nz);
  });
}

function selectRoiSize(
  bbox: BBox,
  imageSize: [number, number],
  sizeMode: SizeMode
): [number, number] {
  const absBox = bbox.absolute(imageSize);
  let { width, height } = absBox;
  const [imgW, imgH] = imageSize;

  switch (sizeMode) {
    case SizeMode.SQUARE_LONG:
      const longSide = Math.max(width, height);
      return [longSide / imgW, longSide / imgH];
    case SizeMode.SQUARE_SHORT:
      const shortSide = Math.min(width, height);
      return [shortSide / imgW, shortSide / imgH];
    case SizeMode.DEFAULT:
      return [bbox.width, bbox.height];
    default:
      throw new Error(`Unsupported SizeMode: ${sizeMode}`);
  }
}

export function removeLetterbox(
  detections: Detection[],
  padding: Padding
): Detection[] {

  console.log(padding);

  const top = padding[0]
  const left = padding[1]
  const right = padding[2]
  const bottom = padding[3]

  const x0 = left;
  const y0 = top;
  const scaleX = 1.0 - left - right;
  const scaleY = 1.0 - top - bottom;



  return detections.map((det) => {

    console.log("detections item", det);

    const [xmin, ymin, xmax, ymax] = det.bbox.asTuple;
    // 박스 좌표 보정
    const newBox: [number, number, number, number] = [
      (xmin - x0) / scaleX,
      (ymin - y0) / scaleY,
      (xmax - x0) / scaleX,
      (ymax - y0) / scaleY,
    ];
    const newData: [number, number][] = [
      [newBox[0], newBox[1]],
      [newBox[2], newBox[3]],
    ];
    return new Detection(newData, det.score);
  });
}



// image_to_tensor equivalent for tfjs
export async function imageToTensor(
  image: tf.Tensor3D,  // or tf.Tensor4D with shape [1, H, W, 3]
  roi: Rect | null,
  outputSize: [number, number],
  outputRange: [number, number] = [-1, 1],
  flipHorizontal: boolean = false,
  keepAspectRatio: boolean = true
): Promise<{ tensor: tf.Tensor4D; padding: [number, number, number, number] }> {

  try {
    const [targetWidth, targetHeight] = outputSize;
    let img = image;

    if (flipHorizontal) {
      img = tf.image.flipLeftRight(img);
    }

    console.log("img ::", img)

    // Normalize ROI or use full image
    const [imgHeight, imgWidth] = img.shape.slice(0, 2);
    const normRoi = roi
      ? roi.scaled([imgWidth, imgHeight])
      : new Rect(0.5, 0.5, 1.0, 1.0, 0.0, true).scaled([imgWidth, imgHeight]);

    const cropCoords = tf.tensor2d([
      [
        normRoi.y_center - normRoi.height / 2,
        normRoi.x_center - normRoi.width / 2,
        normRoi.y_center + normRoi.height / 2,
        normRoi.x_center + normRoi.width / 2,
      ],
    ]);

    img = tf.image.cropAndResize(
      img.expandDims(0),
      cropCoords,
      [0],
      [targetHeight, targetWidth]
    ).squeeze();

    // Letterbox padding
    let padLeft = 0, padTop = 0, padRight = 0, padBottom = 0;
    if (keepAspectRatio) {
      const inputAspect = normRoi.width / normRoi.height;
      const outputAspect = targetWidth / targetHeight;

      let newWidth = targetWidth;
      let newHeight = targetHeight;



      if (inputAspect > outputAspect) {
        newHeight = Math.round(targetWidth / inputAspect);
        padTop = Math.floor((targetHeight - newHeight) / 2);
        padBottom = targetHeight - newHeight - padTop;
      } else {
        newWidth = Math.round(targetHeight * inputAspect);
        padLeft = Math.floor((targetWidth - newWidth) / 2);
        padRight = targetWidth - newWidth - padLeft;
      }


      console.log("targetWidth ::", targetWidth)
      console.log("newHeight ::", newHeight)

      img = tf.image.resizeBilinear(img, [newHeight, newWidth]);
      img = tf.pad(img, [[padTop, padBottom], [padLeft, padRight], [0, 0]]);
    }

    // Normalize to output range
    const [minVal, maxVal] = outputRange;
    img = img.toFloat().div(255.0).mul(maxVal - minVal).add(minVal);
    const tensor = img.expandDims(0);
    return {
      tensor,
      padding: [
        padLeft / targetWidth,
        padTop / targetHeight,
        padRight / targetWidth,
        padBottom / targetHeight,
      ],
    };

  } catch (err) {
    console.error("error : ", err);

  }
}






