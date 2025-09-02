import '@tensorflow/tfjs-react-native';
import * as tf from '@tensorflow/tfjs';

import { InferenceSession } from 'onnxruntime-react-native';

import { Asset } from 'expo-asset';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';
import * as faceLandmark from '@tensorflow-models/face-landmarks-detection';
import { MediaPipeFaceMesh } from '@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh';

// If you are using the WebGL backend:
// const IRIS_LANDMARK_MODEL = require('../assets/models/iris_landmark.tflite');
// const FACE_DETCTION_MODEL = require('../assets/models/face_detection_short_range.tflite');
// const FACE_LANDMARK_MODEL = require('../assets/models/face_landmark.tflite');

const IRIS_LANDMARK_MODEL = require('../assets/models/iris_landmark.onnx');
const PFLD_MODEL = require('../assets/models/pfld.onnx');
const VERSION_RFB_320 = require('../assets/models/version-RFB-320.onnx');

const HS_EMOTION_MODEL = require('../assets/models/hsemotion_q.ort');
const FSA_NET_MODEL = require('../assets/models/fsanet_ens.onnx');
const HPOSE_MODEL = require('../assets/models/hpose_transformer_prep.ort');

/**
 * 모델을 관리합니다.
 */
class ModelManager {
	private initialized = false;

	private visionRfb320OnnxModel: InferenceSession | null = null;
	private irisLandmarkOnnxModel: InferenceSession | null = null;
	private pfldkOnnxModel: InferenceSession | null = null;

	private fsanetSession: InferenceSession | null = null;
	private hposeSession: InferenceSession | null = null;
	private hsemotionSession: InferenceSession | null = null;

	private poseDetectionModel: TensorflowModel | null = null;

	private mediaPipeFaceMesh: MediaPipeFaceMesh | null = null;
	private irisLandmarkModel: TensorflowModel | null = null;
	private faceDetectionModel: TensorflowModel | null = null;
	private faceLandmarkModel: TensorflowModel | null = null;

	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * 공통 함수   =====================================================================================
	 * =================================================================================================================================================================================
	 */

	clearAllModels() {
		this.clearVisionRfb320OnnxModel();
		this.clearIrisLandmarkOnnxModel();
		this.clearPfldOnnxModel();
		this.clearFSANetModel();
		this.clearHposeModel();
		this.clearHSEmotionModel();
		this.clearPoseDetectionModel();
	}

	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * Tensorflow.js  =====================================================================================
	 * =================================================================================================================================================================================
	 */

	async initLoadTensorflow() {
		if (this.initialized) return;

		const backend: 'cpu' | 'rn-webgl' = 'rn-webgl';

		// await tf.ready(); // 초기화
		await tf
			.setBackend(backend)
			.then(() => {
				console.log('[+] Load Tensorflow.js....');
				this.initialized = true;
			})
			.catch((error) => {
				console.error(`[-] Tensorflow Ready Error: ${error}`);
				this.initialized = false;
			});
	}

	// ModelManager.ts 내부에 추가
	get isTensorflowInitialized(): boolean {
		return this.initialized;
	}
	/**
	 * Tensorflow.js 반환
	 */
	get tf() {
		return tf;
	}

	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * [ONNX] RFB320 모델 로드 =====================================================================================
	 * =================================================================================================================================================================================
	 */

	async initVisionRfb320OnnxModel(): Promise<void> {
		// [STEP8] VERSION_RFB_320 Model Load : ONNX
		const _versionRfb320Assets = await Asset.loadAsync(VERSION_RFB_320);
		const _versionRfb320Uri: string | null = _versionRfb320Assets[0].localUri;
		if (_versionRfb320Uri !== null) {
			await InferenceSession.create(_versionRfb320Uri)
				.then((_loadSession: InferenceSession | null) => {
					console.log('[+] Load Vision RFB320 Model....');
					this.visionRfb320OnnxModel = _loadSession;
				})
				.catch((error) => {
					console.error(`[-] VERSION_RFB_320 Load Error: ${error}`);
				});
		}
	}

	get getVisionRfb320OnnxModel() {
		return this.visionRfb320OnnxModel;
	}

	clearVisionRfb320OnnxModel() {
		this.visionRfb320OnnxModel!.release();
		this.visionRfb320OnnxModel = null;
		console.log('[~] sion RFB320 모델 세션 해제');
	}

	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * [ONNX] IRIS LANDMARK 모델 로드 =====================================================================================
	 * =================================================================================================================================================================================
	 */

	async initIrisLandmarkOnnxModel(): Promise<void> {
		// [STEP8] VERSION_RFB_320 Model Load : ONNX
		const _irisLandmarkAssets = await Asset.loadAsync(IRIS_LANDMARK_MODEL);
		const _irisLandmarklUri: string | null = _irisLandmarkAssets[0].localUri;
		if (_irisLandmarklUri !== null) {
			await InferenceSession.create(_irisLandmarklUri)
				.then((_loadSession: InferenceSession | null) => {
					console.log('[+] Load IRISLandmark Model....');
					this.irisLandmarkOnnxModel = _loadSession;
				})
				.catch((error) => {
					console.error(`[-] IRISLandmark Load Error: ${error}`);
				});
		}
	}

	get getIrisLandmarkOnnxModel() {
		return this.irisLandmarkOnnxModel;
	}

	clearIrisLandmarkOnnxModel() {
		this.irisLandmarkOnnxModel!.release();
		this.irisLandmarkOnnxModel = null;
		console.log('[~] sion RFB320 모델 세션 해제');
	}

	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * [ONNX] PFLD LANDMARK 모델 로드 =====================================================================================
	 * =================================================================================================================================================================================
	 */

	async initPfldOnnxModel(): Promise<void> {
		// [STEP8] VERSION_RFB_320 Model Load : ONNX
		const _pfldAssets = await Asset.loadAsync(PFLD_MODEL);
		const _pfldUri: string | null = _pfldAssets[0].localUri;
		if (_pfldUri !== null) {
			await InferenceSession.create(_pfldUri)
				.then((_loadSession: InferenceSession | null) => {
					console.log('[+] Load PFLD Model....');
					this.pfldkOnnxModel = _loadSession;
				})
				.catch((error) => {
					console.error(`[-] PFLD_MODEL Load Error: ${error}`);
				});
		}
	}

	get getPfldOnnxModel() {
		return this.pfldkOnnxModel;
	}

	clearPfldOnnxModel() {
		this.pfldkOnnxModel!.release();
		this.pfldkOnnxModel = null;
		console.log('[~] sion RFB320 모델 세션 해제');
	}

	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * [tflite] Pose Detection 모델 로드 =====================================================================================
	 * =================================================================================================================================================================================
	 */
	async initLoadPoseDetectionModel(): Promise<void> {
		if (this.poseDetectionModel) return;

		try {
			this.poseDetectionModel = await loadTensorflowModel(require('../assets/models/pose_detection.tflite'));
			console.log('[+] Load Pose Detection Model...');
		} catch (error) {
			console.error(`[-] Pose Detection Model Load Error: ${error}`);
		}
	}

	get getPoseDetectionModel() {
		return this.poseDetectionModel;
	}

	clearPoseDetectionModel() {
		this.poseDetectionModel = null;
		console.log('[~] Pose Detection 모델 세션 해제');
	}

	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * [ONNX] FSA-NET 로드  =====================================================================================
	 * =================================================================================================================================================================================
	 */
	async initLoadFSANetModel(): Promise<void> {
		if (this.fsanetSession) return;
		// [STEP5] FSA-NET Model Load : ONNX
		const _fsaNetOnnxModeAssets = await Asset.loadAsync(FSA_NET_MODEL);
		const _fsaNetOnnxModelUri: string | null = _fsaNetOnnxModeAssets[0].localUri;
		if (_fsaNetOnnxModelUri !== null) {
			await InferenceSession.create(_fsaNetOnnxModelUri)
				.then((_loadSession: InferenceSession | null) => {
					console.log('[+] Load FSA-NET Model....');
					this.fsanetSession = _loadSession;
					_loadSession = null;
				})
				.catch((error) => {
					console.error(`[-] FSA-NET Load Error: ${error}`);
				});
		}
	}

	/**
	 * FSA-NET 세션 반환
	 */
	get getFSANetSession() {
		return this.fsanetSession;
	}

	clearFSANetModel() {
		this.fsanetSession!.release();
		this.fsanetSession = null;
		console.log('[~] FSANet 모델 세션 해제');
	}

	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * [ONNX] HPose 모델 로드 =====================================================================================
	 * =================================================================================================================================================================================
	 */
	async initLoadHposeModel(): Promise<void> {
		if (this.hposeSession) return;

		const _hposeAssets = await Asset.loadAsync(HPOSE_MODEL);
		const _hposeOnnxModelUri: string | null = _hposeAssets[0].localUri;
		if (_hposeOnnxModelUri !== null) {
			await InferenceSession.create(_hposeOnnxModelUri)
				.then((_loadSession: InferenceSession | null) => {
					console.log('[+] Load HPose Model....');
					this.hposeSession = _loadSession;
					_loadSession = null;
				})
				.catch((error) => {
					console.error(`[-] HPose Load Error: ${error}`);
				});
		}
	}

	get getHposeSession() {
		return this.hposeSession;
	}

	clearHposeModel() {
		this.hposeSession!.release();
		this.hposeSession = null;
		console.log('[~] HPose 모델 세션 해제');
	}

	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * [ONNX] HSEmotion 로드  =====================================================================================
	 * =================================================================================================================================================================================
	 */
	async initLoadHSemotionModel(): Promise<void> {
		if (this.hsemotionSession) return;
		// [STEP4] hsemotion Model Load : ONNX
		const _hemotionAssets = await Asset.loadAsync(HS_EMOTION_MODEL);
		const _hemotionOnnxModelUri: string | null = _hemotionAssets[0].localUri;
		if (_hemotionOnnxModelUri !== null) {
			await InferenceSession.create(_hemotionOnnxModelUri)
				.then((_loadSession: InferenceSession | null) => {
					console.log('[+] Load Hsemotion Model....');
					this.hsemotionSession = _loadSession;
					_loadSession = null;
				})
				.catch((error) => {
					console.error(`[-] hsemotion Load Error: ${error}`);
				});
		}
	}

	get getHSEmotionSession() {
		return this.hsemotionSession;
	}

	clearHSEmotionModel() {
		this.hsemotionSession!.release();
		this.hsemotionSession = null;
		console.log('[~] HSEmotion 모델 세션 해제');
	}

	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * IRIS 모델 로드 =====================================================================================
	 * =================================================================================================================================================================================
	 */
	async initMediaPipeFaceMesh(): Promise<void> {
		if (this.mediaPipeFaceMesh) return;

		const _faceMeshConfig = {
			shouldLoadIrisModel: true, // MediaPipe 홍채 감지 모델을 로드할지 여부(default: true)
			maxContinuousChecks: 5, // 경계 상자 감지기를 실행하지 않고 이동할 프레임 수입니다.(default: 5)
			detectionConfidence: 0.5, // 예측을 폐기하기 위한 임계값입니다. (default: 0.9)
			maxFaces: 1, // 입력에서 감지된 최대 얼굴 수입니다.(default: 10)
			iouThreshold: 0.3, // 최대가 아닌 억제에서 상자가 너무 많이 겹치는지 여부를 결정하기 위한 임계값을 나타내는 부동 소수점입니다.(default 0.3)
			scoreThreshold: 0.75, // 최대가 아닌 억제에서 점수를 기반으로 상자를 제거할 시기를 결정하기 위한 임계값입니다. (default 0.75)
			modelUrl: undefined, // 사용자 정의 facemesh 모델 URL 또는 객체 를 지정하기 위한 선택적 매개변수입니다.
			irisModelUrl: undefined, // 사용자 정의 홍채 모델 URL 또는 객체 를 지정하기 위한 선택적 매개변수입니다.
		};

		// [STEP3] faceMesh Model Load
		await faceLandmark
			.load(faceLandmark.SupportedPackages.mediapipeFacemesh, _faceMeshConfig)
			.then((_loadModel: MediaPipeFaceMesh | null) => {
				console.log('[+] Load FaceMesh Model....');
				this.mediaPipeFaceMesh = _loadModel;
			})
			.catch((error) => {
				console.error(`[-] faceMesh Load Error: ${error}`);
			});
	}

	get getMediaPipeFaceMesh() {
		return this.mediaPipeFaceMesh;
	}

	clearFaceMeshModel() {
		this.mediaPipeFaceMesh = null;
		console.log('[~] Media PipeFaceMesh 모델 세션 해제');
	}
	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * Face Detection 모델 로드 =====================================================================================
	 * =================================================================================================================================================================================
	 */
	async initLoadFaceDetectionModel(): Promise<void> {
		if (this.faceDetectionModel) return;

		await this.initLoadTensorflow();

		try {
			this.faceDetectionModel = await loadTensorflowModel(require('../assets/models/iris_landmark.tflite'));

			// const asset = await Asset.loadAsync(require('../assets/models/face_detection_short_range.tflite'));
			// const uri = asset[0].localUri;
			// if (!uri) throw new Error('Model URI not found');
			// this.faceDetectionModel = await loadTensorflowModel({ url: uri });
			console.log('[+] Load Face Detection Model...');
		} catch (error) {
			console.error(`[-] Face Detection Model Load Error: ${error}`);
		}
	}

	get getFaceDetectionModel() {
		return this.faceDetectionModel;
	}

	clearFaceDetectionModel() {
		this.faceDetectionModel = null;
		console.log('[~] Face Detection 모델 세션 해제');
	}

	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * IRIS 모델 로드 =====================================================================================
	 * =================================================================================================================================================================================
	 */
	async initLoadIrisModel(): Promise<void> {
		if (this.irisLandmarkModel) return;

		await this.initLoadTensorflow(); // TensorFlow.js 준비

		try {
			this.irisLandmarkModel = await loadTensorflowModel(require('../assets/models/iris_landmark.tflite'));
			console.log('[+] Load Iris Landmark Model...');
		} catch (error) {
			console.error(`[-] Iris Model Load Error: ${error}`);
		}
	}

	get getIrisModel() {
		return this.irisLandmarkModel;
	}

	clearIrisModel() {
		this.irisLandmarkModel = null;
		console.log('[~] Iris 모델 세션 해제');
	}

	/**
	 * =================================================================================================================================================================================
	 * ======================================================================== * Face Landmark 모델 로드 =====================================================================================
	 * =================================================================================================================================================================================
	 */
	async initLoadFaceLandmarkModel(): Promise<void> {
		if (this.faceLandmarkModel) return;

		try {
			const asset = await Asset.loadAsync(require('../assets/models/face_landmark.tflite'));
			const uri = asset[0].localUri;
			if (!uri) throw new Error('Model URI not found');
			this.faceDetectionModel = await loadTensorflowModel({ url: uri });
			console.log('[+] Load Face Detection Model...');
		} catch (error) {
			console.error(`[-] Face Detection Model Load Error: ${error}`);
		}
	}

	get getFaceLandmarkModel() {
		return this.faceLandmarkModel;
	}

	clearFaceLandmarkModel() {
		this.faceLandmarkModel = null;
		console.log('[~] Face Landmark 모델 세션 해제');
	}
}

const modelManager = new ModelManager();
export default modelManager;
