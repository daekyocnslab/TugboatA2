import modelManager from '@/interceptor/ModelManager';
import { Rank, sigmoid, Tensor, Tensor2D, Tensor3D } from '@tensorflow/tfjs';
import { loadTensorflowModel } from 'react-native-fast-tflite';
import { nonMaximumSuppression } from './tfliteModules/nms';
import { imageToTensor, removeLetterbox } from './tfliteModules/transform';
import { Detection } from './tfliteModules/types';

const tf = modelManager.tf;

const RAW_SCORE_LIMIT = 80;
const MIN_SCORE = 0.5;
const MIN_SUPPRESSION_THRESHOLD = 0.3;

const RESIZE_HEIGHT = 320;
const RESIZE_WIDTH = 292;

/**
 * TODO : [PlanB]Tflite 모델 구성 내용 정리
 */
const TfliteModels = {
	/**
	 * 얼굴 탐지 수행
	 * @param _imageToTensor
	 * @returns Promise<number[][]>
	 */
	estimateFaceDetect: async (_imageToTensor: Tensor3D, decoded: Tensor3D): Promise<number[][]> => {
		const faceModel = await loadTensorflowModel(require('../assets/models/face_detection_short_range.tflite'));
		if (!faceModel) throw new Error('Face detection model not loaded.');

		let _configTensor: Float32Array;
		let filteredBoxes: number[][] = [];
		let boxesArray: number[][];
		let confidences: number[][] | string[][];
		let boxScores: number[][];

		if (faceModel) {
			try {
				_configTensor = tf.tidy(() => {
					const resizedTensor = tf.image.resizeBilinear(decoded, [128, 128]);
					// 2. 정규화 및 RGB 배열 유지
					const normalizedTensor = tf.div(resizedTensor, tf.scalar(255.0));
					// // 3. 차원 변환 [H, W, C] -> [1, C, H, W]
					// const transposedTensor = tf.transpose(normalizedTensor, [2, 0, 1]);

					const dataSyncRst = normalizedTensor.dataSync();
					return new Float32Array(dataSyncRst);
				});

				// modelCalcHandler.displayInputTensorAsImage(_configTensor)
				// inputOnnxTensor = new Tensor(_configTensor.slice(), [1, 3, 240, 320]);
				// let feed: { input: Tensor | null } = { "input": inputOnnxTensor };

				await faceModel
					.run([_configTensor]) // ✅ 이 형태가 맞음
					.then(async (fetches) => {
						console.log('======================');
						console.log(fetches.length);
						console.log('======================');

						if (fetches) {
							const rawBoxes = fetches[0];
							const rawScores = fetches[1];
							const boxes = calcHandler.decodeBoxes(rawBoxes);
							const scores = calcHandler.getSigmoidScores(rawScores);
							const detections = calcHandler.convertToDetections(boxes, scores);
							const pruned = nonMaximumSuppression(detections, MIN_SUPPRESSION_THRESHOLD, MIN_SCORE, true);
							const roi = {};

							if (pruned.length > 0) {
								const imageData = await imageToTensor(_imageToTensor, null, [RESIZE_WIDTH, RESIZE_HEIGHT], [-1, 1]);
								const cleaned = removeLetterbox(pruned, imageData.padding);
								console.log('cleaned :: ', cleaned[0].data);
							}
							// return cleaned;
						}
					})
					.catch((err) => {
						console.error(`versionRfb320Model.run() 함수에서 에러가 발생하였습니다 : ${err}`);
					});
			} catch (error) {
				console.log(`[-] estimateVersionRfb320 error :: ${error}`);
			}
		}
		return filteredBoxes;
	},
};

export default TfliteModels;

const calcHandler = (() => {
	return {
		decodeBoxes: (rawBoxes: number[]): Tensor<Rank> => {
			try {
				let anchors: Tensor2D = calcHandler.generateAnchors();
				const scale = 128;
				const reshaped = tf.reshape(rawBoxes, [-1, 16 / 2, 2]);
				const scaled = tf.div(reshaped, scale);

				const anchorOffsets = anchors.expandDims(1);
				const adjusted = tf.add(scaled, anchorOffsets);

				const center = tf.slice(adjusted, [0, 0, 0], [-1, 1, -1]);
				const size = tf.slice(adjusted, [0, 1, 0], [-1, 1, -1]);
				const halfSize = tf.div(size, 2);
				const xmin = tf.sub(center, halfSize);
				const xmax = tf.add(center, halfSize);
				return tf.concat([xmin, xmax], 1);
			} catch (error) {
				console.error('decodeBoxes :: ', error);
			}
		},

		getSigmoidScores: (rawScores: Tensor) => {
			try {
				const param = tf.clipByValue(rawScores, -RAW_SCORE_LIMIT, RAW_SCORE_LIMIT);
				return sigmoid(param.dataSync());
			} catch (error) {
				console.log('getSigmoidScores :', error);
			}
		},

		generateAnchors: (): Tensor2D => {
			const anchors: [number, number][] = [];
			try {
				const SSD_OPTIONS_SHORT = {
					num_layers: 4,
					input_size_height: 128,
					input_size_width: 128,
					anchor_offset_x: 0.5,
					anchor_offset_y: 0.5,
					strides: [8, 16, 16, 16],
					interpolated_scale_aspect_ratio: 1.0,
				};

				const {
					num_layers,
					strides,
					input_size_height,
					input_size_width,
					anchor_offset_x,
					anchor_offset_y,
					interpolated_scale_aspect_ratio,
				} = SSD_OPTIONS_SHORT;

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
			} catch (err) {
				console.error('generateAnchors : ', err);
			}

			return tf.tensor2d(anchors);
		},
		convertToDetections: (boxes: Tensor, scores: number[]): Detection[] => {
			try {
				console.log('tf.greater(scores, MIN_SCORE) :: ', tf.greater(scores, MIN_SCORE));

				console.log('tf.greater result ::', tf.greater(scores, MIN_SCORE));

				const filteredIndices = tf.where(tf.greater(scores, MIN_SCORE), 1, 0).arraySync() as number[];
				console.log('filteredIndices : ', filteredIndices);
				const detectionList: Detection[] = [];

				filteredIndices.forEach((i, j) => {
					const score = i;

					if (score === 1) {
						const box = boxes.arraySync()[i];
						// console.log(score, box);
						if (box[1][0] > box[0][0] && box[1][1] > box[0][1]) {
							detectionList.push(new Detection(box, score));
						}
					}
				});

				return detectionList;
			} catch (error) {
				console.error('error :: ', error);
			}
		},
		/**
		 * TensorCamera에 출력된 TensorImage 값을 기반으로 이미지 출력을 위한 이미지 경로를 반환합니다.
		 * @param {tf.Tensor3D} tensorImage
		 * @return {string} 이미지 경로 반환
		 */
		cvtTensorImgToBase64: (tensorImage: Tensor3D): string => {
			// [STEP1] 전달 받은 TensorImage를 좌우 반전합니다.
			const flippedTensor = tf.reverse(tensorImage, [1]);

			// [STEP2] TensorImage에서 높이와 너비 값을 반환 받습니다.
			const height: number = flippedTensor.shape[0];
			const width: number = flippedTensor.shape[1];

			// [STEP3] 하나의 차원을 만듭니다.
			const tensor3D = tf.fill([height, width, 1], 255);

			// [STEP4] tensorImage는 3차원이며 이전에 만든 차원을 합쳐서 4차원으로 만듭니다.
			const data = new Buffer(tf.slice(tf.concat([flippedTensor, tensor3D], -1), [0], [height, width, 4]).dataSync());

			// [STEP5] 구성한 버퍼에서 정보를 추출합니다.
			const rawImageData = { data, width, height };

			// [기능-1] 정제된 Tensor 값을 통해 jpeg로 인코딩한다.
			const jpegImageData = jpeg.encode(rawImageData, 100);

			// [기능-2] jpeg 데이터를 'base64'로 전환한다.
			const imgBase64 = tf.util.decodeString(jpegImageData.data, 'base64');

			return `data:image/jpeg;base64,${imgBase64}`;
		},

		generateAnchors: (): Tensor2D => {
			const anchors: [number, number][] = [];
			try {
				const SSD_OPTIONS_SHORT = {
					num_layers: 4,
					input_size_height: 128,
					input_size_width: 128,
					anchor_offset_x: 0.5,
					anchor_offset_y: 0.5,
					strides: [8, 16, 16, 16],
					interpolated_scale_aspect_ratio: 1.0,
				};

				const {
					num_layers,
					strides,
					input_size_height,
					input_size_width,
					anchor_offset_x,
					anchor_offset_y,
					interpolated_scale_aspect_ratio,
				} = SSD_OPTIONS_SHORT;

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
			} catch (err) {
				console.error('generateAnchors : ', err);
			}

			return tf.tensor2d(anchors);
		},
	};
})();
