import * as tf from '@tensorflow/tfjs';
import { GazeResultType, GazeType } from '../../types/fsanet/GazeType';
import { DIRECTION_TYPE } from '../../types/fsanet/CommonType';

/**
 * FaceMesh로 측정된 데이터를 연산후에 반환값으로 구성합니다.
 * @param {number[][]} pfldArr - 68개의 얼굴 랜드마크 배열
 * @param {object} irisArr - {leftIrisArr: number[][], rightIrisArr: number[][]} 형태의 홍채 정보
 * @returns {GazeType} 측정된 값 연산 결과
 */
export function setLandmarkData(
	pfldArr: number[][],
	irisArr: { leftIrisArr: number[]; rightIrisArr: number[] },
): GazeType {
	try {
		// 눈 랜드마크 추출
		const { leftEye, rightEye } = extractEyeLandmarks(pfldArr);

		// 홍채 데이터를 [x, y] 형태로 변환
		const leftIrisLandmarks = reshapeIrisData(irisArr.leftIrisArr);
		// const rightIrisLandmarks = reshapeIrisData(irisArr.rightIrisArr);

		if (leftIrisLandmarks.length > 0) {
			// 좌측 눈 시선 데이터 계산
			const leftEyeGaze: GazeResultType = getGazeData(leftEye, leftIrisLandmarks, DIRECTION_TYPE.left)!;
			return {
				left_theta: leftEyeGaze.theta, // 왼쪽 눈 시선 수직축 회전각
				left_phi: leftEyeGaze.phi, // 왼쪽 눈 시선 횡축 회전각
				iris_radius: leftEyeGaze.iris_radius, // 평균 홍채 반지름
				ear: leftEyeGaze.ear, // 평균 눈 종횡비
			};
		} else {
			return {
				left_theta: 0,
				left_phi: 0,
				iris_radius: 0,
				ear: 0,
			};
		}
	} catch (errorMsg) {
		throw Error(`[-] setLandmarkData Fail :: ${errorMsg}`);
	}
}

/**
 * 홍채 데이터를 [x, y] 형태로 변환
 * @param {number[]} irisArr - [x1, y1, z1, x2, y2, z2, ...] 형태의 홍채 데이터
 * @returns {number[][]} [[x1, y1], [x2, y2], ...] 형태로 변환된 데이터
 */
const reshapeIrisData = (irisArr: number[]): number[][] => {
	const reshapedData: number[][] = [];
	for (let i = 0; i < irisArr.length; i += 3) {
		reshapedData.push([irisArr[i], irisArr[i + 1]]); // z축 데이터는 무시
	}
	return reshapedData;
};

/**
 * 시선 데이터를 계산
 * @param {number[][]} eyeLandmarks - 눈 주위의 [x, y] 좌표 배열
 * @param {number[][]} irisLandmarks - 홍채의 [x, y] 좌표 배열
 * @param {DIRECTION_TYPE} direction - 좌/우 눈 구분
 * @returns {GazeResultType | undefined} 시선 계산 결과
 */
const getGazeData = (
	eyeLandmarks: number[][],
	irisLandmarks: number[][],
	direction: DIRECTION_TYPE,
): GazeResultType | undefined => {
	try {
		if (!irisLandmarks || irisLandmarks.length === 0) {
			throw new Error('Invalid iris landmarks data');
		}

		// 1. 홍채 중심과 반지름 계산
		const irisCentre = irisLandmarks[0]; // 홍채 중심

		const irisRight = irisLandmarks.reduce(
			(prev, curr) => (curr[0] > prev[0] ? curr : prev),
			irisLandmarks[0], // 초기값 제공
		);

		const irisLeft = irisLandmarks.reduce(
			(prev, curr) => (curr[0] < prev[0] ? curr : prev),
			irisLandmarks[0], // 초기값 제공
		);

		const irisRadius = Math.abs(irisRight[0] - irisLeft[0]) / 2; // 홍채 반지름

		// 2. 안구 중심 계산
		const eyeballCentre = [
			eyeLandmarks.reduce((sum, point) => sum + point[0], 0) / eyeLandmarks.length,
			eyeLandmarks.reduce((sum, point) => sum + point[1], 0) / eyeLandmarks.length,
		];

		// 3. 안구의 반지름 계산
		const eyeRadius =
			Math.sqrt((eyeLandmarks[3][0] - eyeLandmarks[0][0]) ** 2 + (eyeLandmarks[3][1] - eyeLandmarks[0][1]) ** 2) / 2;

		// 4. 시선의 상하 각도 (theta)
		const theta = Math.asin(Math.min(Math.max((irisCentre[1] - eyeballCentre[1]) / (eyeRadius * 0.5), -0.25), 0.25));

		// 5. 시선의 좌우 각도 (phi)
		const phi = Math.asin(
			Math.min(Math.max((irisCentre[0] - eyeballCentre[0]) / (eyeRadius * 0.5 * Math.cos(theta)), -0.25), 0.25),
		);

		// 6. EAR (눈 종횡비) 계산
		const ear = getEar(eyeLandmarks);

		return {
			theta: direction === DIRECTION_TYPE.left ? theta : -theta,
			phi,
			iris_radius: irisRadius,
			ear,
		};
	} catch (error) {
		throw new Error(`getGazeData ::: ${error}`);
	}
};

// const extractEyeLandmarks = (pfldArr: number[][]) => {
//     // 배열 유효성 검사
//     if (!Array.isArray(pfldArr) || pfldArr.length < 48) {
//         return null;
//     }

//     // 각 요소가 [x, y] 형태의 배열인지 확인
//     if (!pfldArr.every(point => Array.isArray(point) && point.length === 2)) {
//         return null;
//     }

//     // 기존 로직
//     const rightEyeLandmarks = pfldArr.slice(36, 42);
//     const leftEyeLandmarks = pfldArr.slice(42, 48);

//     return {
//         rightEye: rightEyeLandmarks,
//         leftEye: leftEyeLandmarks,
//     };
// };

/**
 * 눈 랜드마크 좌표를 추출하는 함수
 * @param {number[][]} pfldArr - 68개의 랜드마크 배열 [[x, y], [x, y], ...]
 * @returns {object} 오른쪽 눈과 왼쪽 눈 랜드마크 좌표
 */
const extractEyeLandmarks = (pfldArr: number[][]) => {
	// 오른쪽 눈 (36~41번 랜드마크)
	const rightEyeLandmarks = pfldArr.slice(36, 42);

	// 왼쪽 눈 (42~47번 랜드마크)
	const leftEyeLandmarks = pfldArr.slice(42, 48);

	return {
		rightEye: rightEyeLandmarks,
		leftEye: leftEyeLandmarks,
	};
};

/**
 * EAR 계산 함수
 * @param {number[][]} points - 눈 주위 랜드마크 좌표
 * @returns {number} EAR 값
 */
const getEar = (points: number[][]): number => {
	if (points.length === 0) {
		return NaN;
	}

	const numerator = getDistance(points[1], points[5]) + getDistance(points[2], points[4]);
	const denominator = 2 * getDistance(points[0], points[3]);

	return numerator / denominator;
};

/**
 * 두 포인트 간 거리 계산
 * @param {number[]} point1 - 첫 번째 포인트 [x, y]
 * @param {number[]} point2 - 두 번째 포인트 [x, y]
 * @returns {number} 거리 값
 */
const getDistance = (point1: number[], point2: number[]): number => {
	return Math.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2);
};
