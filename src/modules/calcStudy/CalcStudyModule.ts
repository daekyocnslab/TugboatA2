import * as tf from '@tensorflow/tfjs';
import { InferenceSession } from 'onnxruntime-react-native';

import * as jpeg from 'jpeg-js';
import { StudyType } from '../../types/StudyType';
import { CODE_GRP_CD, EMOTION_CODE } from '../../common/utils/codes/CommonCode';
import { Tensor3D } from '@tensorflow/tfjs';

/**
 * 학습 관련 데이터 처리 과정을 모듈로 처리합니다.
 */
class CalcStudyModule {
	/**
	 * HSEmotion에 대한 연산 처리로 결과값을 반환합니다.
	 * @param fetchs
	 * @returns
	 */
	calcHsemotionInfo = (fetches: InferenceSession.OnnxValueMapType): StudyType.ResultHsemotion => {
		// console.log("fetches :: ", fetches);
		const {
			expression: { data: _expressionArr },
			arousal: { data: _arousalArr },
			valence: { data: _valenceArr },
		} = fetches;

		let resultHsemotion: StudyType.ResultHsemotion = {
			arousalArr: [],
			valenceArr: [],
			emotionCode: '',
		};
		/**
		 * [STEP9] expression = 7가지의 벡터 값을 가장 높은 값을 가지는 인덱스를 찾습니다. : 각 감정이 나올확률이 가장 높은 인덱스 값을 뽑습니다.
		 */
		if (_expressionArr.length > 0) {
			let _maxVal = _expressionArr[0];
			let _maxIdx = 0;
			for (let i = 1; i < _expressionArr.length; i++) {
				if (_expressionArr[i] > _maxVal) {
					_maxIdx = i;
					_maxVal = _expressionArr[i];
					// 결과값을 세팅합니다.
					resultHsemotion = {
						arousalArr: _arousalArr as Float32Array,
						valenceArr: _valenceArr as Float32Array,
						emotionCode: EMOTION_CODE[_maxIdx],
					};
				}
			}
		}

		return resultHsemotion;
	};

	/**
	 * ONNX의 FSA-NET으로 추출된 yaw, pitch, roll 값을 반환해줍니다.
	 * @param fetches
	 * @returns {number[]} 추출된 yaw, pitch, roll에 대한 배열을 반환합니다.
	 */
	calcFsanetInfo = (fetches: InferenceSession.OnnxValueMapType): number[] => {
		const resultFaceDtct: number[] = [];
		const { average: output } = fetches;

		// const { "pred_pose/mul_24:0": output } = fetches;
		const [yaw, pitch, roll] = output.data;

		resultFaceDtct.push(yaw as number);
		resultFaceDtct.push(pitch as number);
		resultFaceDtct.push(roll as number);

		return resultFaceDtct;
	};

	/**
	 * 얼굴 인식 여부에 대한 평균을 구합니다.
	 * @param accArr
	 * @returns
	 */
	calcAverageIsFaceDtct = (accArr: number[]): number => {
		const sum = accArr.reduce((acc, curr) => acc + curr, 0);
		return sum > 0 ? 1 : 0;
	};

	/**
	 * 스트레스에 대한 평균을 구합니다.
	 * @param {number} accArr : 누적 배열
	 * @param loopLimitCnt  : 루프 횟수
	 * @returns {number} 평균 값
	 */
	calcAverageStress = (accArr: number[], loopLimitCnt: number): number => {
		let sumScore = 0;

		// [STEP1] 누적 배열의 값을 배열을 순회하면서 더합니다.
		for (let i = 0; i < accArr.length; i++) {
			sumScore += accArr[i];
		}
		// [STEP2] 누적 합계를 통해서 스트레스 평균인 경우와 일반 숫자 평균을 구하는 방식에 대해 각각 처리합니다.
		return Math.round((sumScore / loopLimitCnt) * 100);
	};

	/**
	 * _valence, _arousal 평균 연산을 수행합니다.
	 * @param accArr : 누적 배열
	 * @param loopLimitCnt  : 루프 횟수
	 * @returns
	 */
	calcAverageFloat = (accArr: number[], loopLimitCnt: number): number => {
		let sumScore = 0;

		// [STEP1] 누적 배열의 값을 배열을 순회하면서 더합니다.
		for (let i = 0; i < accArr.length; i++) {
			sumScore += accArr[i];
		}
		// 최종 소수점 숫자에 대한 평균을 구합니다.
		return parseFloat((sumScore / loopLimitCnt).toFixed(5));
	};

	/**
	 * 코드 타입에 따라 분기되며 표현코드, 정서코드에 대해서 최종적인 결과값을 추출합니다.
	 * @param {CODE_GRP_CD} codeType    : 코드 타입
	 * @param {string[]} accArr         : 누적 배열
	 * @returns
	 */
	calcBestCode = (codeType: CODE_GRP_CD, accArr: string[]): string => {
		let _resultStr = ''; // 최종 결과값

		// [CASE1] 표현코드인 경우 => 'Anger', 'Contempt', 'Disgust', 'Fear', 'Happiness', 'Neutral', 'Sadness', 'Surprise'
		if (CODE_GRP_CD.ExpressionCode === codeType) {
			// 표현 코드 배열
			const _expressionArr = [
				'AGR', // Anger: 화남
				'CTM', // Contempt: 경멸
				'DSG', // Disgust: 싫음
				'FEA', // Fear: 무서움
				'HAP', // Happiness: 행복
				'NEU', // Neutral: 무표정
				'SAD', // Sadness: 슬픔
				'SUP', // Surprise: 놀람
			];

			const _countingArr = new Array(8).fill(0); // 표현 코드 별 Counting 배열

			// [STEP1] 빈 값을 제외하고 누적된 배열을 추가합니다.
			for (let i = 0; i < accArr.length; i++) {
				if (accArr[i] !== '') {
					// [STEP2] 누적된 배열과 감정 배열을 비교하여 동일한 경우 해당 index에 카운팅 합니다.
					for (let j = 0; j < _expressionArr.length; j++) {
						if (accArr[i] === _expressionArr[j]) _countingArr[j] += 1;
					}
				}
			}
			// [STEP3] 최대값을 구합니다.
			const maxVal = Math.max(..._countingArr);

			const resultArr: string[] = [];

			for (let i = 0; i < _countingArr.length; i++) {
				if (_countingArr[i] === maxVal) resultArr.push(_expressionArr[i]);
			}

			if (resultArr.length === 1) _resultStr = resultArr[0];
			else {
				for (let i = accArr.length - 1; i >= 0; i--) {
					if (resultArr.includes(accArr[i])) {
						_resultStr = accArr[i];
						break;
					}
				}
			}
		}

		// [CASE2] 정서코드인 경우 =>> ENJ, AGR, BDM, RLX
		else if (CODE_GRP_CD.EmotionalCode === codeType) {
			const countingArr = new Array(5).fill(0);
			const emotionCodeList = ['ENJ', 'AGR', 'BDM', 'RLX'];

			// 정서에 대한 감정이
			for (let i = 0; i < accArr.length; i++) {
				if (accArr[i] !== '') {
					// [STEP2] 누적된 배열과 감정 배열을 비교하여 동일한 경우 해당 index에 카운팅 합니다.
					for (let j = 0; j < emotionCodeList.length; j++) {
						if (accArr[i] === emotionCodeList[j]) countingArr[j] += 1;
					}
				}
			}
			// [STEP3] 최대값을 구합니다.
			const maxVal = Math.max(...countingArr);

			const resultArr: string[] = [];

			for (let i = 0; i < countingArr.length; i++) {
				if (countingArr[i] === maxVal) resultArr.push(emotionCodeList[i]);
			}

			if (resultArr.length === 1) _resultStr = resultArr[0];
			else {
				for (let i = accArr.length - 1; i >= 0; i--) {
					if (resultArr.includes(accArr[i])) {
						_resultStr = accArr[i];
						break;
					}
				}
			}
		}

		return _resultStr;
	};

	/**
	 * 전달받은 밀리초 단위를 데이터 format을 맞춰서 반환합니다.
	 * @param {number} paramMillisecond
	 * @returns {string} 계산된 시간 값을 반환합니다.
	 */
	calcTimeNumberToStr = (paramMillisecond: number): string => {
		const totalSeconds = Math.floor(paramMillisecond / 1000);
		const hours = Math.floor(totalSeconds / 3600)
			.toString()
			.padStart(2, '0');
		const minutes = Math.floor((totalSeconds % 3600) / 60)
			.toString()
			.padStart(2, '0');
		const seconds = (totalSeconds % 60).toString().padStart(2, '0');
		return `${hours}:${minutes}:${seconds}`;
	};

	/**
	 * TensorCamera에 출력된 TensorImage 값을 기반으로 이미지 출력을 위한 이미지 경로를 반환합니다.
	 * @param {tf.Tensor3D} tensorImage
	 * @return {string} 이미지 경로 반환
	 */
	cvtTensorImgToBase64 = (tensorImage: tf.Tensor3D): string => {
		// [STEP1] 전달 받은 TensorImage를 좌우 반전합니다.
		const flippedTensor = tf.tidy(() => tf.reverse(tensorImage, [1]));

		// [STEP2] TensorImage에서 높이와 너비 값을 반환 받습니다.
		const height: number = flippedTensor.shape[0];
		const width: number = flippedTensor.shape[1];

		// [STEP3] 하나의 차원을 만듭니다.
		const tensor3D = tf.tidy(() => tf.fill([height, width, 1], 255));
		const sliceTf = tf.tidy(() => tf.slice(tf.concat([flippedTensor, tensor3D], -1), [0], [height, width, 4]));

		// [STEP4] tensorImage는 3차원이며 이전에 만든 차원을 합쳐서 4차원으로 만듭니다.
		const data = new Buffer(sliceTf.dataSync());

		// [STEP5]
		const rawImageData = { data, width, height };

		// [기능-1] 정제된 Tensor 값을 통해 jpeg로 인코딩한다.
		const jpegImageData = jpeg.encode(rawImageData, 100);

		// [기능-2] jpeg 데이터를 'base64'로 전환한다.
		const imgBase64: string = tf.tidy(() => tf.util.decodeString(jpegImageData.data, 'base64'));

		tf.dispose(flippedTensor);
		tf.dispose(tensor3D);
		tf.dispose(sliceTf);

		return imgBase64;
	};
	/**
	 * arousal, valence 값을 추출합니다.
	 * @param paramArr
	 * @param digit
	 */
	calcArrItemDigit = (paramArr: number[] | Float32Array, digit: number): number => {
		return paramArr.length > 0 ? parseFloat(paramArr[0].toFixed(digit)) : 0;
	};
	/**
	 * 계산을 통해 정서코드를 반환합니다.
	 * @param arousal
	 * @param valence
	 * @returns {string} 정서코드를 반환합니다.
	 */
	calcEmtnCd = (arousal: number, valence: number): string => {
		let _result = '';

		// [CASE1] 정서코드 : Enjoyment(즐거움)
		if (valence >= 0 && arousal >= 0) _result = 'ENJ';

		// [CASE2] 정서코드 : Anger(화)
		if (valence < 0 && arousal >= 0) _result = 'AGR';

		// [CASE3] 정서코드 : Boredum(지루함)
		if (valence < 0 && arousal < 0) _result = 'BDM';

		// [CASE4] 정서코드 : Relax(이완)
		if (valence >= 0 && arousal < 0) _result = 'RLX';
		return _result;
	};

	/**
	 * 합계의 값을 기반으로 집중력을 측정합니다
	 * @param tensorResultArr
	 */
	concentrationEstimate = (tensorResultArr: number[]) => {
		return tf.tidy(() => {
			const tensorResult = tf.tensor(tensorResultArr);
			// const tensorStack = tf.stack(tensorResult);
			return tf.expandDims(tensorResult, 0);
		});
	};

	toISOStringWithOffset = (date: Date) => {
		const tzOffset = -date.getTimezoneOffset(); // in minutes
		const diff = tzOffset >= 0 ? '+' : '-';
		const pad = (n: number) => `${Math.floor(Math.abs(n))}`.padStart(2, '0');
		return `${date.toISOString().slice(0, 19)}${diff}${pad(tzOffset / 60)}:${pad(tzOffset % 60)}`;
	};

	/**
	 * 이미지를 정방향으로 회전함.
	 * @param tensor
	 * @returns
	 */
	rotate90Clockwise = (tensor: Tensor3D): Tensor3D => {
		return tf.tidy(() => {
			return tf.reverse(tf.transpose(tensor, [1, 0, 2]), [0]); // ↘️ 시계방향
		});
	};
	/**
	 * 시계 반대 방향으로 이미지를 돌림
	 * @param tensor
	 * @returns
	 */
	rotate90CounterClockwise = (tensor: tf.Tensor3D): tf.Tensor3D => {
		return tf.tidy(() => {
			// [H, W, C] → [W, H, C] transpose 후, 두 번째 축(y축)을 뒤집어서 반시계 회전
			const rotated = tf.reverse(tf.transpose(tensor, [1, 0, 2]), [1]);
			return rotated;

			// // 🔄 좌우 반전 추가 (axis=1)
			// const flipped = tf.reverse(rotated, [1]);

			// return flipped;
		});
	};

	crobResize = (resizedArr: Uint8Array) => {
		const MODEL_INPUT_WIDTH = 224;
		const MODEL_INPUT_HEIGHT = 224;

		const modelW = MODEL_INPUT_WIDTH;
		const modelH = MODEL_INPUT_HEIGHT;
		const RESIZE_WIDTH = 292;
		const RESIZE_HEIGHT = 320;

		const resizedWidth = RESIZE_WIDTH;
		const resizedHeight = RESIZE_HEIGHT;

		const uint8 = new Uint8Array(resizedArr);

		// 회전 포함된 crop 결과 버퍼
		const cropped = new Uint8Array(modelW * modelH * 3);

		// Center crop offset
		const offsetX = Math.floor((resizedWidth - modelW) / 2);
		const offsetY = Math.floor((resizedHeight - modelH) / 2);

		for (let y = 0; y < modelH; y++) {
			for (let x = 0; x < modelW; x++) {
				const srcIdx = ((y + offsetY) * resizedWidth + (x + offsetX)) * 3;
				const dstIdx = (y * modelW + x) * 3;
				cropped[dstIdx] = uint8[srcIdx];
				cropped[dstIdx + 1] = uint8[srcIdx + 1];
				cropped[dstIdx + 2] = uint8[srcIdx + 2];
			}
		}

		// // ⬇️ 시계 방향 90° 회전 적용
		// for (let y = 0; y < modelH; y++) {
		// 	for (let x = 0; x < modelW; x++) {
		// 		// crop 원본 인덱스
		// 		const srcIdx = ((y + offsetY) * resizedWidth + (x + offsetX)) * 3;

		// 		// (x,y) → (modelH - 1 - y, x)
		// 		const newX = modelH - 1 - y;
		// 		const newY = x;
		// 		const dstIdx = (newY * modelW + newX) * 3;

		// 		cropped[dstIdx] = uint8[srcIdx];
		// 		cropped[dstIdx + 1] = uint8[srcIdx + 1];
		// 		cropped[dstIdx + 2] = uint8[srcIdx + 2];
		// 	}
		// }

		/**
		 * 반 시계 방향
		 */

		// for (let y = 0; y < modelH; y++) {
		// 	for (let x = 0; x < modelW; x++) {
		// 		// 원본 인덱스 (crop만 적용)
		// 		const srcIdx = ((y + offsetY) * resizedWidth + (x + offsetX)) * 3;

		// 		// ⬇️ 반시계 방향 회전 좌표 변환
		// 		// (x, y) → (y, modelW - 1 - x)
		// 		const newX = y;
		// 		const newY = modelW - 1 - x;
		// 		const dstIdx = (newY * modelH + newX) * 3;

		// 		cropped[dstIdx] = uint8[srcIdx];
		// 		cropped[dstIdx + 1] = uint8[srcIdx + 1];
		// 		cropped[dstIdx + 2] = uint8[srcIdx + 2];
		// 	}
		// }

		// 3. Normalize
		const float32 = new Float32Array(modelW * modelH * 3);
		for (let i = 0; i < cropped.length; i++) {
			float32[i] = cropped[i] / 127.5 - 1.0;
		}
		return Array.from(float32);
	};

	floatToBase64 = (floatArr: number[], w: number, h: number) => {
		const buffer = new Uint8Array(w * h * 4); // RGBA
		for (let i = 0; i < w * h; i++) {
			const r = Math.max(0, Math.min(255, (floatArr[i * 3] + 1) * 127.5));
			const g = Math.max(0, Math.min(255, (floatArr[i * 3 + 1] + 1) * 127.5));
			const b = Math.max(0, Math.min(255, (floatArr[i * 3 + 2] + 1) * 127.5));

			buffer[i * 4] = r;
			buffer[i * 4 + 1] = g;
			buffer[i * 4 + 2] = b;
			buffer[i * 4 + 3] = 255; // alpha
		}

		const rawImageData = { data: buffer, width: w, height: h };
		const jpegImageData = jpeg.encode(rawImageData, 90); // 압축률 90
		return `data:image/jpeg;base64,${Buffer.from(jpegImageData.data).toString('base64')}`;
	};
}
export default new CalcStudyModule();
