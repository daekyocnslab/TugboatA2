import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import { InferenceSession } from 'onnxruntime-react-native';
import * as blazeface from '@tensorflow-models/blazeface';

/**
 * 학습 관련 모델의 타입을 정형화 합니다.
 */
export declare module FaceDetetorType {
	/**
	 * '학습 준비중'에 사용하는 모델들을 관리합니다.
	 */
	export type InitStudyReadyModel = {
		isLoading: boolean;
		isTensorReady: boolean;
		faceMeshModel: faceLandmarksDetection.FaceLandmarksDetector | null;
	};

	/**
	 * '학습' 중에 사용하는 모델들을 관리합니다.
	 */
	export type InitModelState = {
		isLoading: boolean;
		isTensorReady: boolean;
		faceMeshModel?: faceLandmarksDetection.FaceLandmarksDetector | null;
		hsemotionModel?: InferenceSession | null;
		fsanetModel?: InferenceSession | null;
		hPoseModel?: InferenceSession | null;
	};

	/**
	 * '학습' 중에 사용하는 모델들을 관리합니다.
	 */
	export type InitPureModelState = {
		isLoading: boolean;
		isTensorReady: boolean;
		blazefaceModel: blazeface.BlazeFaceModel | null;
	};
}
