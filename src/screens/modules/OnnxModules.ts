import modelManager from '@/interceptor/ModelManager';
import CalcStudyModule from '@/modules/calcStudy/CalcStudyModule';
import { StudyType } from '@/types/StudyType';
import { Rank, Tensor, Tensor3D, Tensor4D, TensorContainer } from '@tensorflow/tfjs-core';
import { InferenceSession, Tensor as OnnxTensor } from 'onnxruntime-react-native';
const tf = modelManager.tf;

/**
 * ONNX 모델들을 불러오고 연산처리를 수행합니다.
 */
const OnnxModules = {
	estimateVersionRfb320: async (_imageToTensor: Tensor3D): Promise<number[][]> => {
		const visionRfd320OnnxModel = modelManager.getVisionRfb320OnnxModel;
		let filteredBoxes: number[][] = [];
		let boxesArray: number[][];
		let confidences: number[][] | string[][];
		let boxScores: number[][];
		try {
			if (visionRfd320OnnxModel) {
				const _configTensor = tf.tidy(() => {
					const resizedTensor = tf.image.resizeBilinear(_imageToTensor, [240, 320]);
					const normalizedTensor = tf.div(resizedTensor, tf.scalar(255.0)); // tidy 내부라 OK
					return tf.transpose(normalizedTensor, [2, 0, 1]);
				});

				const tensorData = new Float32Array(_configTensor.dataSync());
				tf.dispose(_configTensor); // 명시적으로 해제
				let feed: { input: OnnxTensor | null } = { input: new OnnxTensor(tensorData.slice(), [1, 3, 240, 320]) };

				await visionRfd320OnnxModel
					// @ts-ignore
					.run(feed, visionRfd320OnnxModel.outputNames)
					.then((fetches: InferenceSession.OnnxValueMapType | null) => {
						if (fetches) {
							// 원본 이미지의 크기
							const origWidth = 320; // 이미지 너비
							const origHeight = 240; // 이미지 높이

							// 신뢰도 임계값과 IoU 임계값
							const probThreshold = 0.5; // 신뢰도 임계값
							const iouThreshold = 0.3; // IoU 임계값
							const topK = -1; // 상위 k개 결과만 유지 (-1이면 모든 결과 유지)

							let ouputBox: OnnxTensor | null = fetches.boxes;
							let ouputScores: OnnxTensor | null = fetches.scores;

							// 박스 개수 계산
							const numBoxes = Math.floor(ouputBox!.data.length / 4);
							confidences = Array.from({ length: numBoxes }, (_, i) => {
								const startIndex = i * (ouputScores!.data.length / numBoxes);
								const endIndex = startIndex + ouputScores!.data.length / numBoxes;
								// @ts-ignore
								return Array.from(ouputScores!.data.slice(startIndex, endIndex));
							});

							// @ts-ignore
							boxesArray = Array.from({ length: numBoxes }, (_, i) => Array.from(ouputBox.data.slice(i * 4, (i + 1) * 4)));

							// scores와 boxes를 결합하여 [x_min, y_min, x_max, y_max, score] 형태로 변환
							boxScores = boxesArray
								.map((box, idx) => {
									if (!confidences[idx] || !box) {
										console.error(`Invalid data at index ${idx}`, { confidences, boxesArray });
										return null;
									}
									return [...box, confidences[idx][1]]; // 클래스 1의 신뢰도 사용
								})
								//@ts-ignore
								.filter((box): box is number[] => box !== null);

							// NMS를 통해 겹치는 박스 제거
							filteredBoxes = calcHandler
								.hardNMS(
									boxScores.filter((box) => box[4] > probThreshold),
									iouThreshold,
									topK,
								)
								.map((box) => {
									return [
										Math.round(box[0] * origWidth), // x_min
										Math.round(box[1] * origHeight), // y_min
										Math.round(box[2] * origWidth), // x_max
										Math.round(box[3] * origHeight), // y_max
										box[4], // score
									];
								});

							for (const key in fetches) {
								(fetches as any)[key] = null;
							}
							// ✅ output도 직접 null 처리 (선택 사항이지만 권장)
							ouputBox = null;
							ouputScores = null;
							// (fetches.boxes as any) = null;
							// (fetches.scores as any) = null;
							// ONNX Tensor 초기화
						}
						feed.input = null;
						feed = null as any; // 👈 feed 자체도 명시적으로 정리 가능
						fetches = null;
					})
					.catch((err) => {
						console.error(`versionRfb320Model.run() 함수에서 에러가 발생하였습니다 : ${err}`);
					});
			}
		} catch (error) {
			console.log(`[-] estimateVersionRfb320 error :: ${error}`);
		} finally {
			// [STEP6] ONNX Tensor 참조 제거
			boxesArray = null as any; // 2차원 배열 초기화
			confidences = null as any; // 2차원 배열 초기화
			boxScores = null as any; // 2차원 배열 초기화
		}
		return filteredBoxes;
	},

	/**
	 * PDLF 모델을 통해서 얼굴 좌표값 추출
	 * @param imageToTensor
	 * @param result
	 * @returns Promise<number[][]>
	 */
	estimatePfldModel: async (imageToTensor: Tensor3D, versionRfd320Result: number[][]): Promise<number[][]> => {
		let resultPfld: number[][] = [];

		try {
			const pfldOnnxModel = modelManager.getPfldOnnxModel;
			if (pfldOnnxModel) {
				const [x, y, width, height] = versionRfd320Result[0];

				// 해당 영역안에서 처리한 메모리 사용후 제거
				const _configTensor = tf.tidy(() => {
					const box = [x, y, width, height];
					const _topLeft = [box[0], box[1]];
					const _bottomRight = [box[2], box[3]];

					const w = _bottomRight[0] - _topLeft[0];
					const h = _bottomRight[1] - _topLeft[1];

					const _xw1 = Math.trunc(Math.max(box[0] - 0.4 * w, 0));
					const _yw1 = Math.trunc(Math.max(box[1] - 0.4 * h, 0));
					const _xw2 = Math.trunc(Math.min(box[2] + 0.4 * w, imageToTensor.shape[1] - 1));
					const _yw2 = Math.trunc(Math.min(box[3] + 0.4 * h, imageToTensor.shape[0] - 1));

					const _indexingResult = tf.slice(imageToTensor, [_yw1, _xw1, 0], [_yw2 - _yw1, _xw2 - _xw1, 3]);
					const _resizeFace = tf.image.resizeBilinear(_indexingResult, [112, 112]);
					const normalizedTensor = tf.div(_resizeFace, tf.scalar(255.0));
					const _expandDims = tf.reshape(normalizedTensor, [1, 112, 112, 3]);

					// dataSync()는 마지막 결과를 추출하고, tidy는 모든 중간 텐서를 자동 정리
					return new Float32Array(_expandDims.dataSync());
				});
				let feed: { input: OnnxTensor | null } = { input: new OnnxTensor(_configTensor.slice(), [1, 3, 112, 112]) };

				await pfldOnnxModel
					//@ts-ignore
					.run(feed, pfldOnnxModel.outputNames)
					.then((fetches: InferenceSession.OnnxValueMapType | null) => {
						if (fetches) {
							const result = Array.from({ length: fetches.output.data.length / 2 }, (_, i) => [
								fetches!.output.data[i * 2],
								fetches!.output.data[i * 2 + 1],
							]);

							// @ts-ignore
							const restoredLandmarks = result.map(([nx, ny]: [number, number]) => {
								const originalX = nx * width + x; // x 복원
								const originalY = ny * height + y; // y 복원
								return [originalX, originalY];
							});
							resultPfld = restoredLandmarks;
						}
						for (const key in fetches) {
							(fetches as any)[key] = null;
						}
						// input/out ONNX Tensor 비우기
						feed.input = null; // 참조 제거 (input 값 제거)
						fetches = null;
					})
					.catch((err) => {
						console.error(`pfldModel.run() 함수에서 에러가 발생하였습니다 : ${err}`);
					});
			}
		} catch (error) {
			console.log(`[-] estimatePfld error :: ${error}`);
		}

		return resultPfld;
	},

	/**
	 *
	 * @param imageToTensor
	 * @param pfldArr
	 * @returns
	 */
	async estimateIrisLandmarkModel(
		imageToTensor: Tensor3D,
		pfldArr: number[][],
	): Promise<{ leftIrisArr: number[]; rightIrisArr: number[] }> {
		const resultObj: { leftIrisArr: number[]; rightIrisArr: number[] } = {
			leftIrisArr: [],
			rightIrisArr: [],
		};

		if (pfldArr.length > 0) {
			const irisLandmarkModel = modelManager.getIrisLandmarkOnnxModel;
			const { leftEye, rightEye } = calcHandler.extractEyeRegions(pfldArr, imageToTensor);

			const runInference = async (input: Float32Array): Promise<number[]> => {
				let feed: { input_1: OnnxTensor | null } = {
					input_1: new OnnxTensor(input.slice(), [1, 64, 64, 3]),
				};
				try {
					// @ts-ignore
					const fetches = await irisLandmarkModel.run(feed, irisLandmarkModel.outputNames);
					const result = Array.from(fetches.output_iris.data as Float32Array);

					// cleanup
					for (const key in fetches) {
						(fetches as any)[key] = null;
					}
					feed.input_1 = null;

					return result;
				} catch (err) {
					console.error('irisLandmarkModel.run() error:', err);
					return [];
				}
			};

			if (irisLandmarkModel) {
				try {
					resultObj.leftIrisArr = await runInference(leftEye);
					resultObj.rightIrisArr = await runInference(rightEye);
				} catch (e) {
					console.error(`[-] estimateIrisLandmark error :: ${e}`);
				}
			}
		}

		return resultObj;
	},

	/**
	 * FSA-NET 기반으로 데이터에 대한 측정을 수행합니다.
	 * @param tensorImage
	 * @param estimateArr
	 * @returns {Promise<number[]>}
	 */
	async fsanetEstimate(tensorImage: Tensor3D, versionRfd320Result): Promise<number[]> {
		const fsanetModel = modelManager.getFSANetSession;
		let resultFaceDtct: number[] = [];

		// 필수값 존재 체크
		if (versionRfd320Result.length > 0) {
			// [기능-1] FaceMesh를 통해 전달받은 데이터를 통해 값 세팅
			const [x1, y1, x2, y2, score] = versionRfd320Result[0];

			const box = new Array(x1, y1, x2, y2); // [x1, y1, x2, y2]

			const _topLeft: number[] = new Array(box[0], box[1]);
			const _bottomRight: number[] = new Array(box[2], box[3]);

			// 해당 영역안에서 처리한 메모리 사용후 제거
			const _configTensor: TensorContainer = tf.tidy(() => {
				const w: number = _bottomRight[0] - _topLeft[0];
				const h: number = _bottomRight[1] - _topLeft[1];
				const _xw1: number = Math.trunc(Math.max(box[0] - 0.4 * w, 0));
				const _yw1: number = Math.trunc(Math.max(box[1] - 0.4 * h, 0));
				const _xw2: number = Math.trunc(Math.min(box[2] + 0.4 * w, tensorImage.shape[1] - 1));
				const _yw2: number = Math.trunc(Math.min(box[3] + 0.4 * h, tensorImage.shape[0] - 1));

				// [기능-2] posbox 형태로 자른 형태 (TensorImage)
				const _indexingResult: Tensor<Rank.R3> = tf.slice(tensorImage, [_yw1, _xw1, 0], [_yw2 - _yw1, _xw2 - _xw1, 3]);

				// [기능-3] 인덱싱한 값을 리사이징 하는 작업
				const _resizeFace: Tensor3D | Tensor4D = tf.image.resizeBilinear(_indexingResult, [64, 64]);

				// [기능-4] 노멀라이즈 수행 작업
				const _min = tf.min(_resizeFace);
				const aa = tf.sub(_resizeFace, _min);
				const bb = tf.sub(tf.max(_resizeFace), _min);
				const cc = tf.div(aa, bb);
				const _normalize_imagetensor = tf.mul(cc, 255);

				// [기능-5] 3차원 데이터를 차원 분리하여 원하는 순서로 재조립
				const _temp = tf.unstack(_normalize_imagetensor, 2);
				const _finalFace = tf.stack([_temp[2], _temp[1], _temp[0]], 2);
				tf.dispose(_temp); // ✅ 추가 권장

				// [기능-6] 모델링을 위한 맨앞에 차원을 추가하는 작업(reshape로 차원추가)
				const _expandDims = tf.reshape(_finalFace, [1, 64, 64, 3]);

				// [STEP7] 텐서플로우 데이터를 자바스크립트 데이터 타입으로 컨버팅합니다.
				return new Float32Array(_expandDims.dataSync());
			});

			// [STEP8] 컨버팅한 데이터를 기반으로 모델을 수행합니다.'
			let feed: { input: OnnxTensor | null } = { input: new OnnxTensor(_configTensor.slice(), [1, 64, 64, 3]) };

			if (fsanetModel) {
				await fsanetModel
					// @ts-ignore
					.run(feed, fsanetModel.outputNames)
					.then((fetches: InferenceSession.OnnxValueMapType | null) => {
						//@ts-ignore
						resultFaceDtct = tf.tidy(() => CalcStudyModule.calcFsanetInfo(fetches));
						// 결과값(fetches) 내에 모든 값을 NULL로 참조해제
						for (const key in fetches) {
							(fetches as any)[key] = null;
						}
						// input/out ONNX Tensor 비우기
						feed.input = null; // 참조 제거 (input 값 제거)
						fetches = null; // 참조 제거 (result 값 제거)
					})
					.catch((err) => console.error(`modelCalcHandler.fsanetEstimate() 함수에서 에러가 발생하였습니다 : ${err}`));
			} else console.error('[+] FSA-NET 모델이 존재하지 않습니다 ');
		}

		return resultFaceDtct;
	},

	/**
	 * FaceMesh 측정한 사용자의 값에 대해 계산을 수행합니다.
	 *
	 * [STEP1] FaceMesh를 통해 전달받은 측정 데이터 통해 얼굴 측정값(boundingBox), 집중도(faceInViewConfidence)를 반환받습니다.
	 * [STEP2] 필요한 영역(posbox)에 대해서만 남기고 자릅니다.
	 * [STEP3] 자른 영역을 일정한 크기(224, 224)로 리사이즈 합니다.
	 * [STEP4] 리사이즈된 영역(얼굴)에 대해 정규화를 수행합니다.
	 * [STEP5] PyTorch 데이터 형태를 Tensor 데이터 형태로 컨버팅합니다.
	 *
	 * @param {tf.Tensor3D} tensorImage : 텐서 카메라에서 전달 받은 이미지
	 * @param {AnnotatedPrediction[]} estimateArr
	 */

	async hsemotionEstimate(tensorImage: Tensor3D, versionRfd320Result: number[][]): Promise<StudyType.ResultHsemotion> {
		const hsemotionModel = modelManager.getHSEmotionSession;

		// [STEP1] 연산 결과를 반환할 객체를 초기 선언합니다.
		let resultHsemotion: StudyType.ResultHsemotion = {
			arousalArr: [],
			valenceArr: [],
			emotionCode: '',
		};

		try {
			// [CASE1] 파라미터로 전달 받은 값이 존재하는지 여부를 확인합니다.
			if (versionRfd320Result.length > 0 && hsemotionModel != null) {
				const [x1, y1, x2, y2, score] = versionRfd320Result[0];

				const box = new Array(x1, y1, x2, y2); // [x1, y1, x2, y2]

				const _topLeft: number[] = new Array(box[0], box[1]);
				const _bottomRight: number[] = new Array(box[2], box[3]);

				const _configTensor = tf.tidy(() => {
					const w = _bottomRight[0] - _topLeft[0];
					const h = _bottomRight[1] - _topLeft[1];

					const xw1 = Math.trunc(Math.max(box[0] - 0.4 * w, 0));
					const yw1 = Math.trunc(Math.max(box[1] - 0.4 * h, 0));
					const xw2 = Math.trunc(Math.min(box[2] + 0.4 * w, tensorImage.shape[1] - 1));
					const yw2 = Math.trunc(Math.min(box[3] + 0.4 * h, tensorImage.shape[0] - 1));

					const sliced = tf.slice(tensorImage, [yw1, xw1, 0], [yw2 - yw1, xw2 - xw1, 3]);
					const resized = tf.image.resizeBilinear(sliced, [224, 224]);
					const resizedDiv = tf.div(resized, 255);

					const mean = [0.485, 0.456, 0.406];
					const std = [0.229, 0.224, 0.225];
					const [r, g, b] = tf.split(resizedDiv, 3, 2);

					const rNorm = tf.div(tf.sub(r, mean[0]), std[0]);
					const gNorm = tf.div(tf.sub(g, mean[1]), std[1]);
					const bNorm = tf.div(tf.sub(b, mean[2]), std[2]);

					const normalized = tf.concat([rNorm, gNorm, bNorm], 2);
					const transposed = tf.transpose(normalized, [2, 0, 1]);
					const expanded = tf.expandDims(transposed, 0); // 이건 밖에서 참조하므로 해제 안됨

					// 모든 중간 텐서 해제
					tf.dispose([sliced, resized, resizedDiv, r, g, b, rNorm, gNorm, bNorm, normalized, transposed]);
					return expanded;
				});
				const tensorData = new Float32Array(_configTensor.dataSync());
				tf.dispose(_configTensor); // 명시적으로 해제

				// ✅ configArray는 Float32Array → 해제 필요 없음
				const feed: { input: OnnxTensor | null } = { input: new OnnxTensor(tensorData.slice(), [1, 3, 224, 224]) };

				await hsemotionModel
					//@ts-ignore
					.run(feed, hsemotionModel.outputNames)
					.then((fetches: InferenceSession.OnnxValueMapType | null) => {
						resultHsemotion = tf.tidy(() => CalcStudyModule.calcHsemotionInfo(fetches!));
						// resultHsemotion = { "arousalArr": [0.08552277088165283], "emotionCode": "SUP", "valenceArr": [-0.027108697220683098] }

						// ✅ fetches 내부 해제
						for (const key in fetches) {
							(fetches as any)[key] = null;
						}
						// input/out ONNX Tensor 비우기
						feed.input = null; // 참조 제거 (input 값 제거)
						fetches = null;
					})
					.catch((err) => console.error(`modelCalcHandler.hsemotionEstimate() 함수에서 에러가 발생하였습니다 : ${err}`));
			}
		} catch (error) {
			console.log(`[-] hsemotionEstimate error :: ${error}`);
		}

		return resultHsemotion;
	},

	/**
	 * Hpose 측정
	 * @param inputData
	 * @returns
	 */
	async hPoseEstimate(data1: Float32Array): Promise<number> {
		const hposeModel = modelManager.getHposeSession;
		let resultScore = 0;

		let inputTensor1: OnnxTensor | null = null;
		let inputTensor2: OnnxTensor | null = null;
		let tfHelperTensor: Tensor | null = null;

		try {
			if (hposeModel) {
				// [STEP1] tf.ones를 활용하여 Int32Array 생성
				tfHelperTensor = tf.tidy(() => tf.ones([1, 1]));
				const data2 = new Int32Array(tfHelperTensor.dataSync());

				// [STEP2] ONNX Tensor 생성
				inputTensor1 = new OnnxTensor(data1.slice(), [1, 10, 8]);
				inputTensor2 = new OnnxTensor(data2.slice(), [1, 1]);

				const feed: { args_0: OnnxTensor | null; args_1: OnnxTensor | null } = {
					args_0: inputTensor1,
					args_1: inputTensor2,
				};

				// [STEP3] 모델 실행

				await hposeModel
					//@ts-ignore
					.run(feed, hposeModel.outputNames)
					.then((fetches: InferenceSession.OnnxValueMapType | null) => {
						if (fetches) {
							const result = tf.tidy(() => {
								const output = fetches!.output_1;
								const [, data2] = output.data;
								return Math.floor((data2 as number) * 100);
							});
							resultScore = result;


							// [STEP4] ONNX output 비우기
							for (const key in fetches) {
								(fetches as any)[key] = null;
							}
							// ✅ output도 직접 null 처리 (선택 사항이지만 권장)
							(fetches as any).output_1 = null;
							fetches = null;
						}

						feed.args_0 = null;
						feed.args_1 = null;
					})
					.catch((err) => {
						console.error(`_hposeModel.run() 함수에서 에러 발생: ${err}`);
					});
			}
		} catch (error) {
			console.log(`[-] hPoseEstimate error :: ${error}`);
		} finally {
			// [STEP5] TensorFlow Tensor 제거
			tfHelperTensor?.dispose();
			tfHelperTensor = null;

			// [STEP6] ONNX Tensor 참조 제거
			inputTensor1 = null;
			inputTensor2 = null;
		}

		return resultScore;
	},
};

/**
 * 지역 변수들 관리
 */
const calcHandler = (() => {
	return {
		/**
		 * NMS(Non-Maximum Suppression) 구현
		 * @param boxScores 박스 좌표 및 점수 배열 [[x_min, y_min, x_max, y_max, score], ...]
		 * @param iouThreshold IoU 임계값
		 * @param topK 상위 k개 결과만 유지 (-1이면 모든 결과 유지)
		 * @param candidateSize 고려할 후보 개수
		 * @returns 유지된 박스 리스트
		 */
		hardNMS: (
			boxScores: number[][],
			iouThreshold: number,
			topK: number = -1,
			candidateSize: number = 200,
		): number[][] => {
			let candidates = boxScores
				.slice()
				.sort((a, b) => b[4] - a[4])
				.slice(0, candidateSize);

			const picked: number[][] = [];

			while (candidates.length > 0) {
				const current = candidates.shift()!;
				picked.push(current);
				if (topK > 0 && picked.length >= topK) break;

				candidates = candidates.filter((box) => {
					const iou = calcHandler.iouOf([current], [box.slice(0, 4)]);
					return iou[0] <= iouThreshold;
				});
			}

			return picked;
		},

		/**
		 * IoU(Intersection over Union) 계산 함수
		 * @param boxes0 기준 박스 리스트 [[x_min, y_min, x_max, y_max], ...]
		 * @param boxes1 비교 대상 박스 리스트 [[x_min, y_min, x_max, y_max], ...]
		 * @param eps 0으로 나누는 것을 방지하기 위한 작은 값
		 * @returns IoU 값 리스트
		 */
		iouOf: (boxes0: number[][], boxes1: number[][], eps: number = 1e-5): number[] => {
			const [x1_0, y1_0, x2_0, y2_0] = boxes0[0];
			const area0 = (x2_0 - x1_0) * (y2_0 - y1_0);

			const results: number[] = [];

			for (let i = 0; i < boxes1.length; i++) {
				const [x1_1, y1_1, x2_1, y2_1] = boxes1[i];

				const x1 = Math.max(x1_0, x1_1);
				const y1 = Math.max(y1_0, y1_1);
				const x2 = Math.min(x2_0, x2_1);
				const y2 = Math.min(y2_0, y2_1);

				const overlapArea = Math.max(x2 - x1, 0) * Math.max(y2 - y1, 0);
				const area1 = (x2_1 - x1_1) * (y2_1 - y1_1);

				results.push(overlapArea / (area0 + area1 - overlapArea + eps));
			}

			return results;
		},
		extractEyeRegions: (
			landmarks: number[][],
			origImage: Tensor3D,
			padding: number = 50,
			targetSize: [number, number] = [64, 64],
		): { leftEye: Float32Array; rightEye: Float32Array } => {
			const leftEyeLandmarks = landmarks.slice(36, 42);
			const rightEyeLandmarks = landmarks.slice(42, 48);

			const [leftX1, leftY1] = leftEyeLandmarks.reduce(
				([minX, minY], [x, y]) => [Math.min(minX, x - padding), Math.min(minY, y - padding)],
				[Infinity, Infinity],
			);
			const [leftX2, leftY2] = leftEyeLandmarks.reduce(
				([maxX, maxY], [x, y]) => [Math.max(maxX, x + padding), Math.max(maxY, y + padding)],
				[-Infinity, -Infinity],
			);

			const [rightX1, rightY1] = rightEyeLandmarks.reduce(
				([minX, minY], [x, y]) => [Math.min(minX, x - padding), Math.min(minY, y - padding)],
				[Infinity, Infinity],
			);
			const [rightX2, rightY2] = rightEyeLandmarks.reduce(
				([maxX, maxY], [x, y]) => [Math.max(maxX, x + padding), Math.max(maxY, y + padding)],
				[-Infinity, -Infinity],
			);

			// 공통 함수로 추출
			const extractAndNormalizeEye = (x1: number, y1: number, x2: number, y2: number): Float32Array => {
				return tf.tidy(() => {
					const region = tf.slice(
						origImage,
						[Math.floor(Math.max(y1, 0)), Math.floor(Math.max(x1, 0)), 0],
						[
							Math.floor(Math.min(y2 - y1, origImage.shape[0] - y1)),
							Math.floor(Math.min(x2 - x1, origImage.shape[1] - x1)),
							3,
						],
					);
					const resized = tf.image.resizeBilinear(region, targetSize);
					const normalized = tf.div(resized, 255);
					const reshaped = tf.reshape(normalized, [1, ...targetSize, 3]);
					const result = reshaped.dataSync();
					return new Float32Array(result);
				});
			};

			return {
				leftEye: extractAndNormalizeEye(leftX1, leftY1, leftX2, leftY2),
				rightEye: extractAndNormalizeEye(rightX1, rightY1, rightX2, rightY2),
			};
		},
	};
})();
export default OnnxModules;
