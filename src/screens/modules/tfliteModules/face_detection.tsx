// Converted TypeScript module of BlazeFace face detection logic for React Native

// Dependencies assumed: TensorFlow Lite model runner for React Native, and custom utility functions in separate modules

import * as tf from '@tensorflow/tfjs';
import { FaceDetectionModelType, Detection, Rect } from './types';
import { imageToTensor, sigmoid, removeLetterbox } from './transform';
import { nonMaximumSuppression } from './nms';

const MODEL_NAME_SHORT = 'face_detection_short_range.tflite';
const RAW_SCORE_LIMIT = 80;
const MIN_SCORE = 0.5;
const MIN_SUPPRESSION_THRESHOLD = 0.3;

const SSD_OPTIONS_SHORT = {
  num_layers: 4,
  input_size_height: 128,
  input_size_width: 128,
  anchor_offset_x: 0.5,
  anchor_offset_y: 0.5,
  strides: [8, 16, 16, 16],
  interpolated_scale_aspect_ratio: 1.0
};

export class FaceDetection {
  private model: tf.GraphModel;
  private inputShape: [number, number];
  private anchors: tf.Tensor2D;

  constructor(model: tf.GraphModel) {
    this.model = model;
    this.inputShape = [128, 128]; // from SSD_OPTIONS_SHORT
    this.anchors = this.generateAnchors(SSD_OPTIONS_SHORT);
  }

  async detect(image: tf.Tensor4D, roi?: Rect): Promise<Detection[]> {
    const [width, height] = this.inputShape;
    const imageData = await imageToTensor(image, roi, [width, height], [-1, 1]);

    const results = this.model.execute(imageData.tensor) as tf.Tensor[];
    const rawBoxes = results[0];
    const rawScores = results[1];

    const boxes = this.decodeBoxes(rawBoxes);
    const scores = this.getSigmoidScores(rawScores);
    const detections = this.convertToDetections(boxes, scores);

    const pruned = nonMaximumSuppression(detections, MIN_SUPPRESSION_THRESHOLD, MIN_SCORE, true);
    const cleaned = removeLetterbox(pruned, imageData.padding);
    return cleaned;
  }

  private decodeBoxes(rawBoxes: tf.Tensor): tf.Tensor3D {
    const scale = this.inputShape[0];
    const reshaped = tf.reshape(rawBoxes, [-1, rawBoxes.shape[2] / 2, 2]);
    const scaled = tf.div(reshaped, scale);

    const anchorOffsets = this.anchors.expandDims(1);
    const adjusted = tf.add(scaled, anchorOffsets);

    const center = tf.slice(adjusted, [0, 0, 0], [-1, 1, -1]);
    const size = tf.slice(adjusted, [0, 1, 0], [-1, 1, -1]);
    const halfSize = tf.div(size, 2);
    const xmin = tf.sub(center, halfSize);
    const xmax = tf.add(center, halfSize);

    return tf.concat([xmin, xmax], 1);
  }

  private getSigmoidScores(rawScores: tf.Tensor): tf.Tensor {
    return sigmoid(tf.clipByValue(rawScores, -RAW_SCORE_LIMIT, RAW_SCORE_LIMIT));
  }

  private convertToDetections(boxes: tf.Tensor, scores: tf.Tensor): Detection[] {
    const filteredIndices = tf.where(tf.greater(scores, MIN_SCORE)).arraySync();
    const detectionList: Detection[] = [];

    filteredIndices.forEach(([i, j]) => {
      const score = scores.arraySync()[i][j];
      const box = boxes.arraySync()[i];
      if (box[1][0] > box[0][0] && box[1][1] > box[0][1]) {
        detectionList.push(new Detection(box, score));
      }
    });

    return detectionList;
  }

  private generateAnchors(opts: typeof SSD_OPTIONS_SHORT): tf.Tensor2D {
    const anchors: [number, number][] = [];
    const { num_layers, strides, input_size_height, input_size_width, anchor_offset_x, anchor_offset_y, interpolated_scale_aspect_ratio } = opts;

    let layer_id = 0;
    while (layer_id < num_layers) {
      let lastSameStride = layer_id;
      let repeats = 0;
      while (lastSameStride < num_layers && strides[lastSameStride] === strides[layer_id]) {
        lastSameStride++;
        repeats += interpolated_scale_aspect_ratio === 1.0 ? 2 : 1;
      }

      const stride = strides[layer_id];
      const featH = Math.floor(input_size_height / stride);
      const featW = Math.floor(input_size_width / stride);

      for (let y = 0; y < featH; y++) {
        for (let x = 0; x < featW; x++) {
          const yCenter = (y + anchor_offset_y) / featH;
          const xCenter = (x + anchor_offset_x) / featW;
          for (let r = 0; r < repeats; r++) {
            anchors.push([xCenter, yCenter]);
          }
        }
      }
      layer_id = lastSameStride;
    }

    return tf.tensor2d(anchors);
  }
}