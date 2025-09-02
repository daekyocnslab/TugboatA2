import modelManager from '@/interceptor/ModelManager';
import { PoseTypes } from '@/types/pose/PoseTypes';
import { Tensor } from '@tensorflow/tfjs';

// 모델 관련 상수
const MODEL_INPUT_WIDTH = 224;
const MODEL_INPUT_HEIGHT = 224;

// 후처리 관련 상수 - 파이썬과 동일하게 설정
const CONFIDENCE_THRESHOLD = 0.6;

const PoseModules = {
	/**
	 * 얼굴 탐지 모델을 수행합니다.
	 * @param poseResize
	 * @returns
	 */
	estimatePoseDetcetion: async (poseResize: number[]): Promise<PoseTypes.ProcessedOutput> => {
		const frameData = new Float32Array(poseResize);

		const output = await modelManager.getPoseDetectionModel!.run([frameData]);
		const result = privateCalc.processOutput(output);

		return result;
	},
};

export default PoseModules;

const privateCalc = (() => {
	return {
		processOutput: (output: (Tensor | Float32Array)[]): PoseTypes.ProcessedOutput => {
			const { sigmoid, decodeBoxes, decodeKeypoints, ssdGenerateAnchors, computeRotatedBboxFromKeypoints } = privateCalc;
			const rawBoxes = output[0] as Float32Array;
			const rawScores = output[1] as Float32Array;

			if (!rawBoxes || !rawScores) {
				console.log('!rawBoxes || !rawScores');
				return { poses: [], bestIdx: -1, maxScore: -1 };
			}

			let bestIdx = -1;
			let maxScore = -1;
			for (let i = 0; i < rawScores.length; i++) {
				const score = sigmoid(rawScores[i]);
				if (score > maxScore) {
					maxScore = score;
					bestIdx = i;
				}
			}
			if (maxScore > CONFIDENCE_THRESHOLD) {
				const anchors = ssdGenerateAnchors();

				const anchor = anchors[bestIdx];
				const boxOffset = bestIdx * 12;

				if (anchor) {
					const bbox = decodeBoxes(rawBoxes, anchor, boxOffset);
					const keypoints = decodeKeypoints(rawBoxes, anchor, boxOffset);

					if (keypoints.length >= 2) {
						const rotatedBbox = computeRotatedBboxFromKeypoints(
							keypoints[0],
							keypoints[1],
							MODEL_INPUT_WIDTH,
							MODEL_INPUT_HEIGHT,
						);

						return {
							poses: [{ bbox, keypoints, score: maxScore, rotatedBbox }],
							bestIdx,
							maxScore,
						};
					}
				}
			}

			return { poses: [], bestIdx, maxScore };
		},

		/**
		 *
		 * @param x
		 * @returns
		 */
		sigmoid: (x: number): number => {
			const clippedX = Math.max(-50, Math.min(x, 50));
			return 1 / (1 + Math.exp(-clippedX));
		},
		/**
		 *
		 * @param rawBoxes
		 * @param anchor
		 * @param boxOffset
		 * @returns
		 */
		decodeBoxes: (rawBoxes: Float32Array, anchor: number[], boxOffset: number): PoseTypes.Pose['bbox'] => {
			let result = {
				xmin: 0,
				ymin: 0,
				xmax: 0,
				ymax: 0,
			};

			try {
				if (rawBoxes.length > 0 && anchor) {
					const scale = 224.0;
					const [anchorX, anchorY, anchorW, anchorH] = anchor;

					const x_center = (rawBoxes[boxOffset] / scale) * anchorW + anchorX;
					const y_center = (rawBoxes[boxOffset + 1] / scale) * anchorH + anchorY;
					const w = (rawBoxes[boxOffset + 2] / scale) * anchorW;
					const h = (rawBoxes[boxOffset + 3] / scale) * anchorH;

					result = {
						xmin: x_center - w / 2,
						ymin: y_center - h / 2,
						xmax: x_center + w / 2,
						ymax: y_center + h / 2,
					};
				}
			} catch (err) {
				console.error('[-] decodeBoxes Error:: ', err);
			}
			return result;
		},

		decodeKeypoints: (rawBoxes: Float32Array, anchor: number[], boxOffset: number): PoseTypes.Keypoint[] => {
			let result: PoseTypes.Keypoint[] = [];

			try {
				if (rawBoxes.length > 0 && anchor) {
					const scale = 224.0;
					const [anchorX, anchorY, anchorW, anchorH] = anchor;
					const keypoints: PoseTypes.Keypoint[] = [];

					for (let i = 0; i < 4; i++) {
						const offset = boxOffset + 4 + i * 2;
						let x = (rawBoxes[offset] / scale) * anchorW + anchorX;
						let y = (rawBoxes[offset + 1] / scale) * anchorH + anchorY;

						x = Math.max(0, Math.min(1, x));
						y = Math.max(0, Math.min(1, y));

						keypoints.push({ x, y });
					}
					result = keypoints;
				}
			} catch (err) {
				console.error('[-] decodeKeypoints Error', err);
			}
			return result;
		},

		ssdGenerateAnchors: (): number[][] => {
			const anchors: number[][] = [];

			const SSD_OPTIONS = {
				num_layers: 5,
				input_size_height: 224,
				input_size_width: 224,
				anchor_offset_x: 0.5,
				anchor_offset_y: 0.5,
				min_scale: 0.1484375,
				max_scale: 0.75,
				strides: [8, 16, 32, 32, 32],
				fixed_anchor_size: true,
			};
			const {
				num_layers,
				strides,
				input_size_height,
				input_size_width,
				anchor_offset_x,
				anchor_offset_y,
				min_scale,
				max_scale,
				fixed_anchor_size,
			} = SSD_OPTIONS;

			const scales = Array.from({ length: num_layers }, (_, i) =>
				privateCalc.calculateScale(min_scale, max_scale, i, num_layers),
			);

			for (let layer_id = 0; layer_id < num_layers; layer_id++) {
				const stride = strides[layer_id];
				const feature_map_height = Math.ceil(input_size_height / stride);
				const feature_map_width = Math.ceil(input_size_width / stride);

				for (let y = 0; y < feature_map_height; y++) {
					const y_center = (y + anchor_offset_y) / feature_map_height;
					for (let x = 0; x < feature_map_width; x++) {
						const x_center = (x + anchor_offset_x) / feature_map_width;
						if (fixed_anchor_size) {
							anchors.push([x_center, y_center, 1.0, 1.0]);
						}
					}
				}
			}
			return anchors;
		},

		/**
		 *
		 * @param minScale
		 * @param maxScale
		 * @param strideIndex
		 * @param numStrides
		 * @returns
		 */
		calculateScale: (minScale: number, maxScale: number, strideIndex: number, numStrides: number): number => {
			if (numStrides === 1) {
				return (minScale + maxScale) * 0.5;
			}
			return minScale + ((maxScale - minScale) * strideIndex) / (numStrides - 1);
		},

		/**
		 *
		 * @param kpt0
		 * @param kpt1
		 * @param imageW
		 * @param imageH
		 * @param scale
		 * @returns
		 */
		computeRotatedBboxFromKeypoints: (
			kpt0: PoseTypes.Keypoint,
			kpt1: PoseTypes.Keypoint,
			imageW: number = 224,
			imageH: number = 224,
			scale: number = 1.25,
		): PoseTypes.RotatedBbox => {
			const { x: x0, y: y0 } = kpt0;
			const { x: x1, y: y1 } = kpt1;

			const cx = x0 * imageW;
			const cy = y0 * imageH;
			const dx = x1 * imageW - cx;
			const dy = -(y1 * imageH - cy);

			const angle = Math.atan2(dy, dx) * (180 / Math.PI) - 90;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const boxSize = distance * 2.0 * scale;

			const angleRad = (angle * Math.PI) / 180;
			const cos = Math.cos(angleRad);
			const sin = Math.sin(angleRad);

			const halfSize = boxSize / 2;
			const corners = [
				{ x: -halfSize, y: -halfSize },
				{ x: halfSize, y: -halfSize },
				{ x: halfSize, y: halfSize },
				{ x: -halfSize, y: halfSize },
			].map((p) => ({
				x: (cx + p.x * cos - p.y * sin) / imageW,
				y: (cy + p.x * sin + p.y * cos) / imageH,
			}));

			return { corners };
		},
	};
})();
