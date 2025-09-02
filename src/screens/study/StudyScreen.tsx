import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Alert, AppState, AppStateStatus, Image, Linking, Modal, Platform, ScrollView, StatusBar, Switch, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

// vision-camera
import { Camera, runAtTargetFps, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useRunOnJS } from "react-native-worklets-core";
import { useResizePlugin } from "vision-camera-resize-plugin";

// 기타 라이브러리
import _ from 'lodash';
import { Tensor3D } from "@tensorflow/tfjs";
import * as jpeg from 'jpeg-js';
import { AxiosResponse } from "axios";
import DeviceInfo from "react-native-device-info";
import { fetch } from '@react-native-community/netinfo';
import { useSelector } from "react-redux";
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import { PERMISSIONS, requestMultiple } from "react-native-permissions";
import { NetInfoSubscription, useNetInfo, addEventListener } from "@react-native-community/netinfo";
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import RNFS from 'react-native-fs';
import { LoginType } from "@/types/LoginType";
import { CommonType } from "@/types/CommonType";
import { StudyType } from "@/types/StudyType";
import { StudyPlanType } from "@/types/StudyPlanType";
import { CODE_GRP_CD, SUCCESS_CODE } from "@/common/utils/codes/CommonCode";

import { RootState } from "@/store/RootReducer";
import { useNetwork } from "@/common/context/NetworkContext";
import modelManager from "@/interceptor/ModelManager";
import TbStdyDoDtlModules from "@/modules/sqlite/TbStdyDoDtlModules";
import PermissionUtil from "@/common/utils/PermissionUtil";
import DeviceInfoUtil from "@/common/utils/DeviceInfoUtil";
import StudyService from "@/services/study/StudyService";
import AttendanceService from "@/services/attendance/AttendanceService";

// ONNX 모델
import CustomModal from "@/components/modal/CustomModal";
import OnnxModules from "../modules/OnnxModules";
import { setLandmarkData } from "@/modules/fsanet/GazeModule";
import CalcStudyModule from "@/modules/calcStudy/CalcStudyModule";

import styles from './styles/StudyScreenStyle';
import { Paths } from "@/navigation/conf/Paths";
import ToastScreen from "../common/ToastScreen";
import PoseModules from "../modules/PoseModules";
import { PoseTypes } from "@/types/pose/PoseTypes";
import { fontRelateSize, heightRelateSize, widthRelateSize } from "../../../../tugboat-mobile/src/common/utils/DementionUtils";
import { SafeAreaView } from "react-native-safe-area-context";

// 상수 관리
const RESIZE_WIDTH = 292;
const RESIZE_HEIGHT = 320;
const TARGET_FPS = 1 / 3;			// 6초
const LOOP_LIMIT_CNT = 10; // 학습 수행중 루프당 합계를 내기 위한 횟수
const LOOP_INTERVAL = 1000; // 학습 루프 시간


const STUDY_MESSAGES = [
	'하루하루 성장 프로젝트',
	'나의 공부 온도 올리기',
	'꾸준히 하루 한 칸',
	'오늘의 공부 퀘스트',
	'내일이 더 똑똑해지는 계획',
];


/**
 * 실시간 학습 
 * @returns
 */
const StudyScreen = ({ route, navigation }) => {

	// 학습 계획 리스트에서 전달받은 파라미터
	const {
		doSq: DO_SQ,
		isContinue: IS_CONTINUE, // 이어하기 여부(true/false)
		stdySec: STDY_SEC, // 이어하기 시간
		planNm: PLAN_NM,
		sbjtCd: SBJT_CD,
	} = route.params!;

	const tf = modelManager.tf;

	const { resize } = useResizePlugin();
	const { isConnected } = useNetInfo();   // 네트워크 상태를 제외하기 위한 Context Hook 호출
	const { setNetworkCheckEnabled } = useNetwork(); // 네트워크 상태를 제외하기 위한 Context Hook 호출

	// =================================================================== Redux에서 사용자 정보와 학습정보를 조회합니다. ===================================================================
	const authState = useSelector((state: RootState) => state.authInfo);
	const reduxUserInfo = useSelector((state: RootState) => state.userInfo);

	// =================================================================== 얼굴 측정 관련 상태 관리 ===================================================================
	const cameraRef = useRef<Camera>(null);
	// const device = useCameraDevice('front');
	const device = useCameraDevice('front', { physicalDevices: ['ultra-wide-angle-camera'] });
	// 

	const devTapCountRef = useRef(0);
	const isProcessingRef = useRef(false);
	const loopMainCntRef = useRef<number>(0);
	const inConnectNetworkRef = useRef<boolean>(true);  // 네트워크의 연결 여부를 체크합니다.
	const accLoopCntRef = useRef(0); // 최상단에서 선언
	const { hasPermission, requestPermission } = useCameraPermission()

	const [imageUri, setImageUri] = useState<string | null>(null);
	const [isCameraActive, setIsCameraActive] = useState(true);

	const [doSq] = useState<number>(route.params.doSq); // 학습 실행 시퀀스

	let strtTsRef = useRef(Date.now()); // 학습 시작 시간
	let faceDetectCntRef = useRef(0);		/// 얼굴이 측정되었는지 여부 

	// 루프가 N회 수행되는 동안 누적되는 학습 정보
	let [accStudyDoDtlInfo, setAccStudyDoDtlInfo] = useState<StudyType.StudyDoDtlSum>({
		msrdTmArr: [], // 측정된 시간 - 60회 동안의 시간의 합계를 더합니다.
		isFaceDtctArr: [], // 얼굴탐지여부 - 60회 동안 한번이라도 캐치가 되면 해당 값은 1로 고정합니다.
		exprCdArr: [], // 표정코드
		valenceArr: [], // valence
		arousalArr: [], // arousal
		emtnCdArr: [], // 정서코드
		atntnArr: [], // 집중력 - 60회가 수행되는 동안 집중력 점수의 합계
		strssArr: [], // 스트레스
		doSq: doSq, // 실행시퀀스 - 최초 한번만 수행
		tensorResultArr: [], //
	});

	// ====================================== 권한 모달 팝업 관리 ==============================
	const [permisChecked, setPermisChecked] = useState(false); // 권한 허용여부
	const [isPermisModalOpen, setIsPermisModalOpen] = useState(false); // 권한 모달
	const [isShowToast, setIsShowToast] = useState<boolean>(false); // ToastMessage 출력 여부

	const [isShowStudySubject, setIsShowStudySubject] = useState(false);

	const [studySubjectList, setStudySubjectList] = useState<StudyType.UserSbjtInfo[]>([]);
	const [studySubjectInfo, setStudySubjectInfo] = useState<{ sbjtCd?: string; sbjtNm?: string }>({
		sbjtCd: '',
		sbjtNm: '',
	});

	let [accAtntn] = useState<number[]>([]);
	const [isFaceDtctYn, setIsFaceDtctYn] = useState<boolean>(false); // 얼굴 탐지여부에 따라 다른 불(파란색/노란색)을 켜줍니다.

	// =================================================================== 스탑 워치 관련 변수들 ===================================================================
	const [seconds, setSeconds] = useState<number>(0); // "스탑워치" 초 (이어서 하기를 하는 경우 불러와서 세팅합니다.)
	const [isActiveStopwatch, setIsActiveStopwatch] = useState<boolean>(false); // "스탑워치" 활성화 여부
	const loopStartSecRef = useRef<number>(); // 루프 시작의 시작시간
	const loopStartTimeRef = useRef<number>(0); // 루프 시작시간


	const [isDevInfo, setIsDevInfo] = useState({
		isDev: false,
		devOpenTab: 0,
		studyCnt: 0
	})
	// =================================================================== 종료하기 팝업 상태 관리 ===================================================================

	const [isShowStudyEnd, setIsShowStudyEnd] = useState(false); // 학습 팝업

	const [showCamera, setShowCamera] = useState(false);
	const [showModelImage, setShowModelImage] = useState(false);

	let preAppState = useRef<'active' | 'inactive'>('active');

	// 버튼 중복방지를 위해서 disabled 속성을 관리합니다.
	const [btnDisable, setBtnDisable] = useState({
		start: false, // 스탑워치 시작 버튼
		pause: false, // 스탑워치 일시 정지 버튼
		stop: false, // 스탑워치 중지 버튼
		end: false, // 학습 종료 버튼
	});

	// 뉴타이머
	const [isSecondRound, setIsSecondRound] = useState(false);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const [totalTime, setTotalTime] = useState(60 * 120); // 120분 (2시간) 기준
	const [endTime, setEndTime] = useState(0); // 종료 시간 (밀리초)
	const [startTime, setStartTime] = useState(0); // 타이머 시작 시간
	const [isRunning, setIsRunning] = useState(false); // 타이머 실행 여부
	const [todayStdySecs, setTodayStdySecs] = useState(0)
	const [isShowExit, setIsShowExit] = useState(false);
	const [isShowChange, setIsShowChange] = useState(false);

	//공통 모달관련
	const [isAlertVisible, setAlertVisible] = useState(false);
	const [alertTitle, setAlertTitle] = useState('');
	const [alertMessage, setAlertMessage] = useState('');

	/**
	 * 뽀모도르 타이머 동작 관리
	 */
	useEffect(() => {
		if (startTime === 0) setStartTime(Date.now());

		if (isRunning) {
			const interval = setInterval(() => {
				setSeconds((prevSeconds) => {
					const nextSeconds = prevSeconds + 1;
					if (nextSeconds === 3600) {
						setIsSecondRound(true);
					}
					if (nextSeconds >= totalTime) {
						clearInterval(interval);
						return totalTime;
					}
					return nextSeconds;
				});
			}, 1000);

			intervalRef.current = interval;
		} else {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		}

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [isRunning]);


	const fillBlue = Math.min((seconds / 3600) * 100, 100); // First hour (0-60min)
	const fillOrange = isSecondRound ? ((seconds - 3600) / 3600) * 100 : 0; // Second hour (60-120min)

	/**
	 * 권한체크, api 호출
	 */
	useEffect(() => {
		timerHandler.initStudyLoad();		// 최초 필요한 사항들 로드를 해옵니다.

		return () => {
			console.log('[+] StudyScreen clean UP');
			resetHandler.cleanUpStudyInfo();
			if (isShowStudyEnd) studyEndPopupHandler.close();
			setNetworkCheckEnabled(true);
			cameraRef.current?.stopRecording(); // 또는 stopRecording(), stopFrameProcessor()
		};
	}, []);


	// [ADD] VisionCamera 권한 보장 함수
	const ensureCameraPermission = useCallback(async (): Promise<boolean> => {
		try {
			// 1) hook이 알려주는 현재 권한 상태
			if (hasPermission) return true;

			// 2) 없으면 VisionCamera API로 즉시 요청
			const granted = await requestPermission(); // iOS: 시스템 팝업, Android: 시스템 팝업
			if (granted) return true;

			// 3) 아직도 미허용이면 커스텀 모달 열어 안내
			setIsPermisModalOpen(true);
			return false;
		} catch (e) {
			console.warn('ensureCameraPermission error:', e);
			setIsPermisModalOpen(true);
			return false;
		}
	}, [hasPermission, requestPermission]);

	/**
	 * ==============================================================================================================================
	 * 타이머 관련 Handler
	 * ==============================================================================================================================
	 */
	const timerHandler = (() => {
		return {
			/**
			 * 최초 필요한 항목들을 조회합니다.
			 * @returns
			 */
			initStudyLoad: async () => {
				// 카메라 권한 체크
				const permisOk = await ensureCameraPermission();   // [CHANGE] VisionCamera로 우선 확인/요청
				if (!permisOk) return;

				await activateKeepAwakeAsync();												// 화면 꺼짐 방지
				DeviceInfoUtil.hardwareBackRemove(navigation, true);						// 뒤로가기 버튼 방지
				AppState.addEventListener('change', commonHandler.appStateChangeListener);	// 앱 상태 리스너 등록
				setIsCameraActive(true);			// Camera On
				setNetworkCheckEnabled(false);		// 네트워크 체크 ON

				// 과목 정보를 조회하여 세팅합니다.
				apiHandler.loadUserSbjtInfo();

				// 오늘 총 공부시간 로드합니다.
				apiHandler.getUserTodayStdySecs()

				// 뉴 타이머 시작합니다.
				timerHandler.start();
				// setIsRunning(true);

				// [CASE1] 이어하기로 수행하는 경우 => 계획명을 입력후 모델 불러오기
				if (PLAN_NM) {
					setStudySubjectInfo({ sbjtCd: SBJT_CD, sbjtNm: PLAN_NM });
					setIsShowStudySubject(false);
					return;
				}
			},
			/**
			 * 학습 시작
			 * @return {void} 별도 반환 없음
			 */
			start: _.debounce(
				async () => {
					setIsRunning(true);
				},
				2000,
				{ leading: true, trailing: false },
			),

			/**
			 * 학습 리셋
			 * @return {void} 별도 반환 없음
			 */
			reset: _.debounce(
				async () => {
					setSeconds(0);
					setIsSecondRound(false);
					setStartTime(0);
					setIsRunning(true);
				},
				2000,
				{ leading: true, trailing: false },
			),

			/**
			 * 학습 일시정지
			 * @return {void} 별도 반환 없음
			 */
			pause: _.debounce(
				async () => {
					if (btnDisable.pause) return; // 버튼 중복 수행 방지
					setBtnDisable({ ...btnDisable, pause: true }); // 버튼 상태를 막음
					setIsCameraActive(false);
					setIsActiveStopwatch(false); // 스탑워치 활성화 여부 (비 활성화) : TensorCamera가 꺼짐
					// if (stopwatchRef.current) stopwatchRef.current.pause(); // 스탑워치 컴포넌트 함수 호출

					setBtnDisable({ ...btnDisable, pause: false }); // 버튼 상태를 열어줌
				},
				2000,
				{ leading: true, trailing: false },
			),
			/**
			 * 학습 종료이전 수행
			 * @returns {void} 별도 반환 없음
			 */
			checkStop: _.debounce(
				() => {
					// 네트워크 연결이 끊겼을때, 알람 메시지를 띄어주고 다음 동작을 수행하지 않음.
					if (isConnected === false) {
						commonHandler.disconnectNetworkAlert();
						return;
					}
					if (btnDisable.stop) return; // 버튼 중복 수행 방지
					setBtnDisable({ ...btnDisable, stop: true }); // 버튼 상태를 막음
					timerHandler.stop(); // 학습 종료
					setBtnDisable({ ...btnDisable, stop: false }); // 버튼 상태를 막음
				},
				500,
				{ leading: true, trailing: false },
			),

			/**
			 * 학습 종료
			 * @return {void} 별도 반환 없음
			 */
			stop: (): void => {
				// [STEP1] 시간 초기화 / 스탑워치 활성화 종료
				setIsActiveStopwatch(false);
				setIsRunning(false);
				studyEndPopupHandler.open(); // 학습 종료 팝업을 띄어줍니다.
			},
			/**
			 * 자리 이동 및 퇴실 모달 핸들러
			 * @param type : change - 자리이동, exit - 퇴실
			 */
			handleConfirmExit: (type: 'change' | 'exit') => {
				console.log('isRunning :: ', isRunning);
				timerHandler.pause();       // 스탑워치/카메라 멈춤

				setIsCameraActive(false);   // 카메라 off

				if (type === 'exit') {
					setIsShowExit(true);
				} else {
					setIsShowChange(true);
				}

			},
			/**
			 * 타이머 시작/일시정지
			 *
			 * @returns void
			 */
			toggleTimer: (): void => {
				try {
					setIsShowChange(false);
					setIsShowExit(false);
					setIsRunning(prev => !prev); // 이전 상태 기반으로 반전
				} catch (error) {
					console.error('[-] 타이머 오류 발생:', error);
					setAlertTitle('오류');
					setAlertMessage('타이머 실행 중 문제가 발생했습니다.');
					setAlertVisible(true);
				}
			},

			/**
			 * 타이머 종료
			 * @param {boolean} notiYn
			 * @returns
			 */
			resetTimer: (notiYn: boolean) => {
				setAlertVisible(false); // 모달 닫기
				timerHandler.pause();
				// 네트워크 연결 상태를 최종적으로 한 번 더 확인
				if (isConnected === false) {
					commonHandler.disconnectNetworkAlert(); // 네트워크 연결이 끊겼을 때 팝업 출력
					setIsRunning(true);
					return; // 화면 전환 중단
				}
				setIsRunning(false);
				setEndTime(Date.now());
				apiHandler.finishStudy(notiYn);
			}
		}
	})();





	/**
	 *  ==============================================================================================================================
	 * 학습 메인 로직 처리 Handler
	 * 1. loadInitModel()       : 학습과 관련된 인공지능 모델을 불러와서 State내에 세팅하는 이벤트
	 * 2. readyTensorCamera()   : TensorCamera를 실행하고 결과 Tensor 값을 반환 받는 이벤트
	 * @returns
	 *  ==============================================================================================================================
	 */


	// RGBA → RGB 변환 (알파 제거)
	function rgbaToRgb(data: Uint8Array): Uint8Array {
		const rgb = new Uint8Array((data.length / 4) * 3);
		for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
			rgb[j] = data[i];       // R
			rgb[j + 1] = data[i + 1]; // G
			rgb[j + 2] = data[i + 2]; // B
		}
		return rgb;
	}

	const cameraHandler = {
		pause: () => {
			console.log("[Camera] pause");
			setIsCameraActive(false);
			setIsRunning(false);
		},
		resume: () => {
			console.log("[Camera] resume");
			// 카메라 다시 활성화
			setIsCameraActive(true);
			setIsRunning(true);
			// 추가로 frameProcessor 다시 등록 (필요시)
			if (cameraRef.current) {
				cameraRef.current.resumeRecording?.();
			}
		},
	};

	/**
	 * 
	 * 1초당 2프레임으로 들어오는 학습 데이터를 처리하는 함수
	 * @param {number[]} resizedArr : Frame에서 전달받은 이미지를 배열로 만든 값
	 * @param {number[]} poseResizedArr : Frame에서 전달받은 이미지를 pose에 맞게 만든 배열 값
	 */
	const onFrameData = useCallback(async (resultObj) => {
		// const onFrameData = useCallback(async (resizedArr: any) => {
		const { resizedArr, width, height, bytesPerRow, channels } = resultObj
		let _frameToUint8Array = new Uint8Array(resizedArr)

		// 이미 프로세스가 진행중인지 여부를 체크함.
		if (isProcessingRef.current) {
			console.log('⏩ 프레임 drop!');
			return;
		}
		isProcessingRef.current = true;

		if (!cameraRef.current) return;

		let _orgImageTensor: Tensor3D | undefined;
		let _imageToTensor: Tensor3D | undefined;
		const convertStart = performance.now();
		tf.engine().startScope(); // ✅ 모든 Tensor 생성 이전에 시작


		try {
			// [STEP1] 네트워크 연결이 되지 않았을 경우 멈춥니다.
			if (!inConnectNetworkRef.current) return;

			loopStartTimeRef.current = Date.now();

			let elapsedTime = 0;

			// [STEP1] 전체에서 누적 및 갱신 할 변수값들을 관리합니다.
			loopMainCntRef.current++; // 학습을 수행시작 한 이후 전체 루프 누적 횟수
			accLoopCntRef.current++; // 누적 증가

			// 루프 시작시 DB 시간 저장
			if (accLoopCntRef.current === 1) {
				loopStartSecRef.current = Math.round((Date.now() - startTime) / 1000); // stopwatchRef.current?.getNowSec();           // 루프 시작 초
				strtTsRef.current = Date.now();
			}

			console.log(`1. 루프 시작 시점에 메모리에 있는 텐서 수 ::  ${tf.tidy(() => tf.memory().numTensors)}`);
			console.log("현재 루프 횟수 [", accLoopCntRef.current, "]")

			/**
			 * 루프가 10회 일때만 연산을 수행한다. => 연산을 수행해도 사용하지 않음.
			 */
			if (accLoopCntRef.current <= LOOP_LIMIT_CNT) {
				const expectedSize3 = RESIZE_HEIGHT * RESIZE_WIDTH * 3;
				const expectedSize4 = RESIZE_HEIGHT * RESIZE_WIDTH * 4;
				let channels = _frameToUint8Array.length / (RESIZE_HEIGHT * RESIZE_WIDTH);

				if (Platform.OS === "android") {
					// ✅ 안드로이드는 이미 RGB
					if (_frameToUint8Array.length !== expectedSize3) {
						console.warn(`⚠️ Android buffer size mismatch: got ${_frameToUint8Array.length}, expected ${expectedSize3}`);
						isProcessingRef.current = false;
						return;
					}
					channels = 3;
				} else if (Platform.OS === "ios") {
					// ✅ iOS는 RGBA → RGB 변환 필요
					if (_frameToUint8Array.length === expectedSize4) {
						console.log("⚠️ iOS RGBA → RGB 변환 실행");
						_frameToUint8Array = rgbaToRgb(_frameToUint8Array);
						channels = 3; // 변환 후 채널은 3
					} else if (_frameToUint8Array.length !== expectedSize3) {
						console.warn(`⚠️ iOS buffer size mismatch: got ${_frameToUint8Array.length}, expected ${expectedSize3} or ${expectedSize4}`);
						isProcessingRef.current = false;
						return;
					}
				}

				_orgImageTensor = tf.tensor3d(_frameToUint8Array, [RESIZE_HEIGHT, RESIZE_WIDTH, 3], 'int32');     // [Tensor] 추론용 Tensor 생성
				_imageToTensor = CalcStudyModule.rotate90CounterClockwise(_orgImageTensor);                               // [Tensor] 우측으로 회전된 이미지를 정상으로 되돌림
				tf.dispose(_orgImageTensor);
				// const base64 = commonHandler.cvtTensorImgToBase64(_imageToTensor)
				// setImageUri(base64); // Image에 표시
			}




			let configArr: number[] = Array(8).fill(NaN); // 기본값 미리 선언
			let _resultHsemotion: StudyType.ResultHsemotion = { arousalArr: [], valenceArr: [], emotionCode: "" };  // HSEmotion 코드

			if (_imageToTensor && _frameToUint8Array) {
				/**
				 * 루프가 10회 일때만 연산을 수행한다. => 연산을 수행해도 사용하지 않음.
				 */
				if (accLoopCntRef.current <= LOOP_LIMIT_CNT) {

					const { estimateVersionRfb320, estimatePfldModel, estimateIrisLandmarkModel, fsanetEstimate, hsemotionEstimate } = OnnxModules
					const { estimatePoseDetcetion } = PoseModules


					if (!_frameToUint8Array || _frameToUint8Array.length === 0) {
						console.warn("⚠️ crobResize에 유효하지 않은 입력");
						return;
					}

					const poseResizedArr = CalcStudyModule.crobResize(_frameToUint8Array);
					_frameToUint8Array = new Uint8Array(0);

					// 사용 예시
					// const base64Img = CalcStudyModule.floatToBase64(poseResizedArr, 224, 224);
					// setImageUri(base64Img); // Image에 표시



					const { maxScore }: PoseTypes.ProcessedOutput = await estimatePoseDetcetion(poseResizedArr);		// [Model-1] TFLITE POSE 모델 측정 수행
					// const maxScore = 0.6;


					const visionRfb320Result = await estimateVersionRfb320(_imageToTensor);								// [Model-2] ONNX 얼궅 탐지 모델 측정 수행
					// const visionRfb320Result = [[123, 61, 198, 164, 0.9862696528434753]]


					console.log("POSE >>>>>[", maxScore, "] <<<<<< ,, VISION RFB320 >>>>>>>", visionRfb320Result, " <<<<<<<<<<")

					//  [STEP1] Pose를 탐지하고 얼굴을 탐지하는 경우
					if (maxScore >= 0.6 && visionRfb320Result.length > 0) {
						faceDetectCntRef.current += 1;

						const pfldArr = await estimatePfldModel(_imageToTensor, visionRfb320Result);					// [Model-3] ONNX 얼굴 좌표값 모델 수행


						if (pfldArr.length === 0) {
							// [STEP5] NaN 형태로 구성된 배열로 구성하며 최종 Tensor로 구성합니다.
							configArr = Array(8).fill(NaN);
							setIsFaceDtctYn(false);
						}

						const irisJsonArr = await estimateIrisLandmarkModel(_imageToTensor, pfldArr);				// [Model-4] ONNX 얼굴 랜드마크 모델 측정 수행
						// const irisJsonArr = { "leftIrisArr": [34.81892013549805, 34.393226623535156, -4.061603546142578, 40.069766998291016, 33.682064056396484, -4.119124412536621, 33.99586868286133, 29.492755889892578, -4.129571437835693, 29.435707092285156, 35.164794921875, -4.007841110229492, 35.63016891479492, 39.16047286987305, -4.06866979598999], "rightIrisArr": [34.81892013549805, 34.393226623535156, -4.061603546142578, 40.069766998291016, 33.682064056396484, -4.119124412536621, 33.99586868286133, 29.492755889892578, -4.129571437835693, 29.435707092285156, 35.164794921875, -4.007841110229492, 35.63016891479492, 39.16047286987305, -4.06866979598999] }

						if (!irisJsonArr) {
							// [STEP5] NaN 형태로 구성된 배열로 구성하며 최종 Tensor로 구성합니다.
							configArr = Array(8).fill(NaN);
							setIsFaceDtctYn(false);
						}
						const resultFsanet = await fsanetEstimate(_imageToTensor, visionRfb320Result);			// [Model-5] ONNX FSA-NEY 모델 측정 수행
						// const resultFsanet = [26.119766235351562, -27.402212142944336, -2.7349319458007812]
						_resultHsemotion = await hsemotionEstimate(_imageToTensor, visionRfb320Result);			// [Model-6] ONNX 감정 추출 모델 측정 수행
						// _resultHsemotion = { "arousalArr": [0.15133555233478546], "emotionCode": "SUP", "valenceArr": [-0.04291853681206703] }
						tf.dispose(_imageToTensor);

						const { left_theta, left_phi, ear, iris_radius } = tf.tidy(() => setLandmarkData(pfldArr, irisJsonArr));
						// const _gazeEstimateResult = { "ear": 0.4030975866672722, "iris_radius": 3.075392723083496, "left_phi": -0.25268025514207865, "left_theta": -0.25268025514207865 }

						if (left_theta && left_phi && ear && iris_radius) {
							configArr = [visionRfb320Result[0][4], resultFsanet[0], resultFsanet[1], resultFsanet[2], left_theta, left_phi, ear, iris_radius];
							setIsFaceDtctYn(true);
							console.log("[+] 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨 모든 모델 수행 완료 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨")
						}

					} else {
						// [STEP5] NaN 형태로 구성된 배열로 구성하며 최종 Tensor로 구성합니다.
						configArr = Array(8).fill(NaN);
						setIsFaceDtctYn(false);
					}

					elapsedTime = Date.now() - loopStartTimeRef.current;    // 경과 시간
					console.log(`종료 시간 - 시작 시간: ${elapsedTime}`);

					// [STPE5] LOOP_INTERVAL 기준보다 덜 된 경우 Sleep으로 속도를 늦춥니다.
					if (elapsedTime <= LOOP_INTERVAL) {
						const remainTime = LOOP_INTERVAL - elapsedTime;         // 남은 시간
						await commonHandler.sleep(remainTime);               // 누락된 시간만큼 잠시 대기합니다.
						elapsedTime += remainTime;
					}
				}
			}
			// [STEP6] 값을 전달하여 루프당 각각의 값을 누적합니다.
			await calcHandler.calcLoopSum(strtTsRef.current, accLoopCntRef.current, elapsedTime, faceDetectCntRef.current, _resultHsemotion, configArr)
			console.log(`2. 루프 종료 시점에 메모리에 있는 텐서 수  ${tf.tidy(() => tf.memory().numTensors)}`)
		} catch (error) {
			console.log("error : ", error)
		} finally {
			// 사용한 함수 및 변수들을 최종적으로 Clean-up을 수행합니다.
			if (_orgImageTensor) tf.dispose(_orgImageTensor);

			tf.engine().endScope();
			const convertEnd = performance.now();
			console.log(`📸 최종 처리 시간: ${(convertEnd - convertStart).toFixed(2)}ms`);
			isProcessingRef.current = false;		//
		}
	}, []);

	/**
	 * VisionCamera + react-native-worklets-core와 JS 함수간의 연결을 해주는 함수 
	 */
	const runOnJSFrame = useRunOnJS(onFrameData, [onFrameData]);


	const visionCameraHandler = (() => {
		return {
			/**
			 * VisionCamera + react-native-worklets-core를 이용하여 프레임당 사진 데이터를 전달받음
			 */
			frameProcessor: useFrameProcessor((frame) => {
				'worklet';



				/**
				 * 1초당 1프레임(TARGET_FPS)을 받는 구조로 지정
				 */
				runAtTargetFps(TARGET_FPS, () => {
					'worklet';
					/**
					 * 일반 이미지 처리를 위한 리사이징 수행
					 */
					const resized = resize(frame, {
						scale: { width: RESIZE_WIDTH, height: RESIZE_HEIGHT },
						pixelFormat: Platform.OS === "ios" ? 'argb' : 'rgb',
						dataType: 'uint8',
					}) as Uint8Array;

					const resizedArr = Array.from(resized); // ✅ 일반 배열로 변환!!! 해당 경우 밖에 전달이 안됨


					// 채널 수 확인
					const channels = resizedArr.length / (RESIZE_WIDTH * RESIZE_HEIGHT);
					console.log("📷 Channels:", channels);


					// 결과 해석
					if (channels === 3) {
						console.log("✅ RGB 포맷 (R,G,B)");
					} else if (channels === 4) {
						console.log("✅ RGBA 포맷 (R,G,B,A)");
					} else {
						console.log("⚠️ 예상 밖의 채널 수:", channels);
					}
					runOnJSFrame({ resizedArr: resizedArr, width: frame.width, height: frame.height, bytesPerRow: frame.bytesPerRow, channels });
				});
			}, []),
		}
	})();





	const calcHandler = (() => {
		return {

			/**
			 * 루프를 수행하면서 합계 계산을 수행하는 함수
			 * @param {number} strtTs 						: 시작 시간
			 * @param {number} accLoopCnt 					: 루프의 수행 횟수를 계산하기 위해 사용합니다.
			 * @param {number} loopTime 					: 루프의 수행 시간을 계산하기 위해 사용합니다.
			 * @param {number} isFaceDectionCnt 			: 얼굴이 측정된 횟수
			 * @param {StudyType.ResultHsemotion} resultHsEmotion	: HSEmotion 처리 결과
			 * @param {number[]} configArr 					: FSA-NET, Gaze에서 처리된 Tensor 데이터
			 */
			calcLoopSum: async (strtTs: number, accLoopCnt: number, loopTime: number, isFaceDectionCnt: number, resultHsEmotion: StudyType.ResultHsemotion, configArr: number[]) => {
				/**
				 * [CASE1-1] 최종 카운트가 10보다 작은 경우
				 */
				if (accLoopCnt <= LOOP_LIMIT_CNT) {

					const msrdSecs = Math.floor((Date.now() - strtTs) / 1000);

					console.log(" =================================== 파라미터로 들어온 값 ======================================================");
					console.log("doSq :: ", doSq)
					console.log("시작시간 - 현재시간(초) :: ", msrdSecs)
					console.log("accLoopCnt :: ", accLoopCnt)
					console.log("per Loof Time :: ", loopTime)
					console.log("isFaceDectionCnt :: ", isFaceDectionCnt)
					console.log("resultHsEmotion :: ", resultHsEmotion)
					console.log(" ===========================================================================================================");

					// [STEP2] 연산된 Hsemotion 정보를 가져옵니다.
					const {
						arousalArr: _resultArousal,
						emotionCode: _resultEmotionCode,
						valenceArr: _resultValence,
					} = resultHsEmotion;

					const { calcArrItemDigit, calcEmtnCd } = CalcStudyModule;
					/**
					 * [STEP3] 각각의 연산방법에 따라 처리를 수행합니다.
					 */
					let _arousal = 0;
					let _valence = 0;

					// [STEP4] arousal, valence는 소수점 5자리까지만 추출합니다.
					_arousal = calcArrItemDigit(_resultArousal, 5);
					_valence = calcArrItemDigit(_resultValence, 5);

					const _emtnCd = _arousal === 0 && _valence === 0 ? '' : calcEmtnCd(_arousal, _valence); // 정서코드 연산 처리

					// [STEP4] [스트레스] 연산을 통해서 스트레스 값을 누적합니다.
					const _stress = _valence < 0 && _arousal > 0 ? 1 : 0;

					/**
					 * [STEP5] 연산된 값을 State내에 누적을 시켜 배열로 저장합니다.
					 */
					const {
						valenceArr,
						arousalArr,
						exprCdArr,
						emtnCdArr,
						atntnArr,
						isFaceDtctArr,
						strssArr,
						tensorResultArr,
						msrdTmArr,
					} = accStudyDoDtlInfo;
					valenceArr.push(_valence); // valence 값 누적
					arousalArr.push(_arousal); // arousal 값 누적
					exprCdArr.push(_resultEmotionCode); // 표정코드 값 누적
					emtnCdArr.push(_emtnCd); // 정서코드 값 누적
					atntnArr.push(0); // 집중력 점수 값 누적(* 10번 루프에서 최종 계산하여 출력이 됩니다.)
					strssArr.push(_stress); // 스트레스 값 누적
					msrdTmArr.push(loopTime); // 루프 측정 시간을 누적
					isFaceDtctArr.push(isFaceDectionCnt); // 얼굴 탐지여부 값 누적
					// @ts-ignore
					tensorResultArr.push(configArr); // FSA-NET, Gaze에서 측정되는 Tensor 값 누적

					// [STEP6] 최종 누적된 데이터를 State 내에 갱신합니다.
					setAccStudyDoDtlInfo({
						doSq: doSq, // [실행시퀀스]     최초 한번만 수행
						msrdTmArr: msrdTmArr, // [측정된 시간]    60회 동안의 시간의 합계를 더합니다.
						isFaceDtctArr: isFaceDtctArr, // [얼굴탐지여부]    60회 동안 한번이라도 캐치가 되면 해당 값은 1로 고정합니다.
						exprCdArr: exprCdArr, // [표정코드]
						valenceArr: valenceArr, // [valence]
						arousalArr: arousalArr, // [arousal]
						emtnCdArr: emtnCdArr, // [정서코드]
						atntnArr: atntnArr, // [집중력]        60회가 수행되는 동안 집중력 점수의 합계
						strssArr: strssArr,
						tensorResultArr: tensorResultArr, // FSANET Array
					});
				}
				/**
				 * [CASE1-2] 최종 카운트 값이 10인 경우 : 테이블 INSERT 수행
				 */
				else {
					// [STEP2] State내에 누적된 데이터를 가져옵니다.
					const {
						valenceArr,
						arousalArr,
						msrdTmArr,
						exprCdArr,
						atntnArr,
						emtnCdArr,
						isFaceDtctArr,
						strssArr,
						tensorResultArr,
					} = accStudyDoDtlInfo;

					const msrdSecs = Math.floor((Date.now() - strtTs) / 1000);
					console.log("*************************************** 최종 누적된 값 *************************************************************")
					console.log("doSq :", doSq);
					console.log("msrdTm :", msrdSecs);
					console.log("isFaceDtctArr :", isFaceDtctArr);
					console.log("exprCdArr :", exprCdArr);
					console.log("valenceArr :", valenceArr);
					console.log("arousalArr :", arousalArr);
					console.log("emtnCdArr :", emtnCdArr);
					console.log("atntnArr :", atntnArr);
					console.log("strssArr :", strssArr);
					console.log("msrdTmArr :", msrdTmArr);
					console.log("****************************************************************************************************************")

					/**
					 * [STEP3] State 내에 가져온 값을 각각에 맞는 평균치로 계산합니다.
					 */

					const { calcAverageStress, calcAverageFloat, calcAverageIsFaceDtct, calcBestCode, concentrationEstimate, toISOStringWithOffset } = CalcStudyModule

					// 평균 점수 계산함수 수행
					const _stress = calcAverageStress(strssArr, LOOP_LIMIT_CNT); // 스트레스 평균
					const _valence = calcAverageFloat(valenceArr, LOOP_LIMIT_CNT); // valence 평균
					const _arousal = calcAverageFloat(arousalArr, LOOP_LIMIT_CNT); // arousal 평균
					const _isFaceDtct = calcAverageIsFaceDtct(isFaceDtctArr); // faceDtct 평균

					console.log("얼굴 탐지 평균 >>> 1 이상이면 얼굴이 있는거 ", _isFaceDtct)

					// [API] 실시간 데이터 적재
					if (inConnectNetworkRef.current) await apiHandler.studyDoStatus(_isFaceDtct > 0 ? true : false);

					// [STEP4] Best Code 정보 출력 함수 수행
					const _exprCd = calcBestCode(CODE_GRP_CD.ExpressionCode, exprCdArr); // 제일 최고의 표현코드를 반환합니다.
					const _emtnCd = calcBestCode(CODE_GRP_CD.EmotionalCode, emtnCdArr); // 제일 최고의 감정코드를 반환합니다.

					// [STEP5] 집중력을 추정하여 텐서값으로 반환합니다.
					const resultConcent = concentrationEstimate(tensorResultArr.slice(-10));
					/**
					 * [STEP6] 집중력을 추정합니다 : 얼굴을 하나도 인식하지 못한경우에 hPose를 수행하지 않음
					 */
					let _atntn = 0;
					if (isFaceDtctArr.includes(1)) {
						let resultContentData = resultConcent.dataSync();
						const data1 = new Float32Array(resultContentData); // 복사

						const { hPoseEstimate } = OnnxModules;
						_atntn = await hPoseEstimate(data1);

						/**
						 * [STEP7] 집중력 점수에 대해 스무딩을 위해 로직 추가
						 */
						if (accAtntn.length === 3) {
							accAtntn.shift();
							accAtntn.push(_atntn);
						} else {
							// 배열로 구성
							accAtntn.push(_atntn);
						}
						resultContentData.fill(0); // (선택) 값도 초기화
						// @ts-ignore
						resultContentData = null;
						tf.dispose(resultContentData);
						// [STEP8] 사용한 Tensor 메모리를 초기화합니다.
						tf.dispose(resultConcent);
					}

					// [STEP9] 최종 측정한 결과값 세팅
					const result: StudyType.StudyDoDtlSQliteDto = {
						doSq: doSq, // [수행 시퀀스] 별도의 연산 처리가 없음
						msrdCnt: accLoopCnt - 1, // [측정 횟수] 별도의 연산 처리가 없음 (*61회 인경우 수행되기에 값을 1빼줍니다.)
						faceDtctYn: _isFaceDtct, // [얼굴탐지여부] 별도의 연산처리가 없음
						strss: _stress, // [스트레스] 별도의 계산법을 통해서 평균을 구합니다.
						valence: _valence, // [valence] 합계의 평균값을 넣습니다.
						arousal: _arousal, // [arousal] 합계의 평균값을 넣습니다.
						atntn: _atntn, // [집중력] 합계의 평균값을 넣습니다.
						exprCd: _exprCd, // [표현코드] 계산된 최종 값을 넣습니다.
						emtnCd: _emtnCd, // [정서코드] 계산된 최종 값을 넣습니다.
						strtTs: toISOStringWithOffset(new Date(strtTs)), // [시작 타임스탬프] 루프 시작시간
						endTs: toISOStringWithOffset(new Date()), // [종료 타임스탬프] 루프 종료시간
						msrdSecs: msrdSecs, // [루프수행시간] 시작 시간에서 종료 시점의 '초'를 넣습니다.
						regTs: toISOStringWithOffset(new Date()),  // [종료 타임스탬프] 루프 종료시간
					};

					console.log("10회 루프 최종 결과 :: ", result);

					// [STEP10] [SQlite] 구성한 데이터를 내부 데이터베이스(SQLite)내에 저장합니다.
					await TbStdyDoDtlModules.insertRowData(result);

					/**
					 * [STEP11] State의 누적된 학습 상세 정보를 초기화합니다.
					 */
					resetHandler.cleanUpAccStdInfo();
					console.log(`3. 루프 종료 시점에 메모리에 있는 텐서 수  ${tf.tidy(() => tf.memory().numTensors)}`)
					console.log("⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️ 최종 연산 수행시간 : ", msrdSecs, "초 ⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️")
				}
			},


		}

	})();
	/**
	* ==============================================================================================================================
	* 초기화를 관리하는 Handler
	* ==============================================================================================================================
	*/
	const resetHandler = (() => {
		return {
			/**
			 * State에 누적된 학습 상세 정보를 초기화 시킵니다.
			 */
			cleanUpAccStdInfo: () => {
				console.log('[+] 누적된 State 값을 초기화 합니다.');
				accLoopCntRef.current = 0;
				loopStartTimeRef.current = 0;
				strtTsRef.current = 0;						// 10회가 완료되면 시작시간 초기화 
				faceDetectCntRef.current = 0;				// 10회가 완료되면 얼굴 탐지 개수 초기화 
				accStudyDoDtlInfo.valenceArr = [];
				accStudyDoDtlInfo.arousalArr = [];
				accStudyDoDtlInfo.emtnCdArr = [];
				accStudyDoDtlInfo.atntnArr = [];
				accStudyDoDtlInfo.strssArr = [];
				accStudyDoDtlInfo.exprCdArr = [];
				accStudyDoDtlInfo.isFaceDtctArr = [];
				accStudyDoDtlInfo.tensorResultArr = [];
				accStudyDoDtlInfo.msrdTmArr = [];
				accStudyDoDtlInfo.msrdCnt = 0;
			},

			/**
			 * 사용 완료한 ONNX 모델, 카메라, 변수들을 초기화 시킵니다.
			 */
			cleanUpStudyInfo: () => {
				resetHandler.cleanUpAccStdInfo(); // 누적된 배열들을 초기화합니다.
				setIsActiveStopwatch(false);
			},
		};
	})();
	/**
	 * 학습 종료 팝업을 관리합니다.
	 */
	const studyEndPopupHandler = (() => {
		return {
			/**
			 * 학습 종료 팝업 열기
			 * @returns {void}
			 */
			open: (): void => {
				setIsShowStudyEnd(true);
			},
			/**
			 * 학습 종료 팝업 닫기
			 * @returns {void}
			 */
			close: (): void => {
				setIsShowStudyEnd(false);
			},
			/**
			 * 학습 종료 팝업 닫기
			 * @returns {void}
			 */
			restart: (): void => {
				setIsShowStudyEnd(false);
			},
			/**
			 * 학습 실제 종료
			 * @returns {Promise<void>}
			 */
			finish: _.debounce(
				async (): Promise<void> => {
					if (btnDisable.end) return; // 버튼 중복 동작 방지
					setBtnDisable({ ...btnDisable, end: true }); // 버튼 상태를 막아줌

					await apiHandler.finalStdyEnd();           // 학습 종료 비즈니스 로직 처리를 수행합니다.
					studyEndPopupHandler.close(); // 학습종료 팝업을 닫습니다.
					resetHandler.cleanUpStudyInfo(); // 상태 초기화를 수행합니다.
					tf.engine().endScope(); // Tensorflow 엔진을 종료합니다.

					setBtnDisable({ ...btnDisable, end: false }); // 버튼 상태를 열어줌
				},
				1000,
				{ leading: true, trailing: false },
			),
		};
	})();

	/**
	 * 디바이스 권한을 관리하는 Handler 입니다.
	 */
	const permissionChkHandler = (() => {
		const _cameraAndroidPermis = PERMISSIONS.ANDROID.CAMERA;
		const _cameraIOSPermis = PERMISSIONS.IOS.CAMERA;
		return {
			/**
			 * 최초 앱 접근 시 디바이스의 접근 권한을 체크합니다.
			 */
			checkPermission: async (): Promise<boolean> => {
				let hasPermission = true;
				if (Platform.OS === 'android') {
					// 디바이스의 권한이 체크되지 않았을 경우 배열을 갖습니다.
					const notGradtedArr = await PermissionUtil.cmmPermsArrCheck([_cameraAndroidPermis]);
					if (notGradtedArr.length > 0) {
						setIsPermisModalOpen(true);
						hasPermission = false;
					}
				} else if (Platform.OS === 'ios') {
					// 1. 카메라 권한을 확인합니다.
					const permisCameraArr = await PermissionUtil.cmmPermsArrCheck([_cameraIOSPermis]);
					if (permisCameraArr.length > 0) {
						setIsPermisModalOpen(false);
						hasPermission = false;
					}
				}
				return hasPermission;
			},

			/**
			 * 권한 팝업에서 '취소' 버튼을 눌렀을때 경고 Toast Message를 출력합니다.
			 */
			cancleBtn: () => {
				setIsShowToast(true);
			},

			/**
			 * 모달 팝업을 닫습니다
			 * @return {void}
			 */
			closeModal: async (): Promise<void> => {
				// const movePageName = await isCheckBlackList() ? "studyPure" : "studyBoost";
				//@ts-ignore
				navigation.replace('studyPure', {
					doSq: doSq,
					isContinue: IS_CONTINUE,
					stdySec: STDY_SEC,
				});
			},

			/**
			 * 권한 팝업에서 '확인' 버튼을 눌렀을때 처리를 수행합니다.
			 */
			confirmBtn: () => {
				// [CASE1] 권한 허용을 하지 않았을 경우 : Toast Message를 다시 띄어줍니다.
				if (!permisChecked) setIsShowToast(true);
				else {
					setIsPermisModalOpen(false);
					setIsCameraActive(true);
				}
			},
			/**
			 * 권한 허용에 대한 스위치를 관리합니다
			 * true로 바꿨을 경우 요청 팝업을 띄웁니다.
			 * false로 바꿨을때 처리 없음.
			 */
			toggleSwitch: async () => {
				// [CASE1] Switch를 true로 변경한 경우 : 실제 시스템 권한 팝업을 띄어줍니다.
				if (!permisChecked) {
					await requestMultiple([_cameraAndroidPermis])
						.then((resPremissInfo) => {
							const resultStatus = resPremissInfo['android.permission.CAMERA'];

							// [CASE2-1] 시스템의 권한에서 허용을 누른 경우 : 토글을 변경시켜줌.
							if (resultStatus === 'granted') setPermisChecked(true);
							else {
								Linking.openSettings(); // 핸드폰 상 설정 페이지
							}
						})
						.catch(() => {
							console.log('권한 요청에 실패하였습니다.');
						});
				}
				// [CASE2] Switch를 false로 변경한 경우 : 아무 행동도 하지 않음.
				else {
					setPermisChecked(!permisChecked);
				}
			},
		};
	})();
	/**
	 * ==============================================================================================================================
	 *  학습에서 수행되는 API 호출과 관련된 처리를 관리하는 Handler
	 *  ==============================================================================================================================
	 */
	const apiHandler = (() => {
		return {
			/**
			 * [API 호출] 학습 실행 종료 테이블에 데이터를 추가합니다.
			 * @param userInfo
			 * @param {StudyType.StudyDoEndDto} studyDoEnd 학습 실행 종료 정보
			 * @return {Promise<void>} 별도 반환값 없음
			 */
			insertStudyDoEnd: async (studyDoEnd: StudyType.StudyDoEndDto): Promise<void> => {
				await StudyService.insertStudyDoEnd(authState, studyDoEnd)
					.then((res) => {
						const { result, resultCode, resultMsg } = res.data;
						if (resultCode === 201) {
							console.log('등록성공');
						} else {
							console.error('등록실패.', resultCode, result, resultMsg);
							setAlertTitle('알림');
							setAlertMessage('학습 종료 데이터 전송 중 문제가 발생했습니다.');
							setAlertVisible(true);
						}
					})
					.catch((err) => {
						console.error('등록실패.', err);
						setAlertTitle('알림');
						setAlertMessage('학습 종료 데이터 전송 중 문제가 발생했습니다.');
						setAlertVisible(true);
					});
			},

			/**
			 * 학습에 대한 마무리를 위한 처리를 함수
			 * - TB_STDY_DO_END 테이블 등록
			 * -
			 */
			finalStdyEnd: async () => {
				// [STEP1] [SQlite]내에서 데이터 존재여부를 반환받습니다.
				const stdyDtlCnt = await TbStdyDoDtlModules.selectStdyDtlCnt(doSq);

				/*
				 * [CASE2-1] TB_STDY_DO_DTL 데이터가 존재하지 않는 경우 : doSq로만 학습 종료 테이블을 등록합니다.
				 */
				if (stdyDtlCnt === 0) {
					console.log('[+] 데이터가 존재하지 않는 경우에 대한 처리 ');
					const selectStdyDoDtlAvg: StudyType.StudyDoDtlSQliteDto = {
						doSq: doSq,
						regTs: '',
						msrdSecs: 0,
						msrdCnt: 0,
						faceDtctYn: 0,
						exprCd: '',
						valence: 0,
						arousal: 0,
						emtnCd: '',
						atntn: 0,
						strss: 0,
						strtTs: '',
						endTs: '',
						studyDoExprDtoList: [],
						studyDoEmtnDtoList: [],
					};
					await apiHandler.insertStudyDoEnd(selectStdyDoDtlAvg);
				} else {
					/*
					 * [CASE2-2] TB_STDY_DO_DTL 데이터가 존재하지 않는 경우
					 * - 1. SQLITE 내에 DTL 테이블로 평균값을 추출합니다
					 * - 2. SQLITE 내에 DTL 테이블로 감정(EMTN)을 추출합니다
					 * - 3. SQLITE 내에 DTL 테이블로 표현(EXPR)을 추출합니다
					 * - 4. API 서버로 모든 데이터를 전송합니다.
					 * - 5. SQLITE 내에 DTL 테이블 데이터 초기화
					 */
					const { selectStdyDoDtlAvg, selectStudyDoEmtn, selectStudyDoExpr, deleteStudyDoDtl } = TbStdyDoDtlModules;
					const selectStdyDoDtlAvgRlt = await selectStdyDoDtlAvg(doSq); // 1. [SQLite] TB_STDY_DO_DTL 평균 조회
					selectStdyDoDtlAvgRlt.doSq = doSq;
					const studyDoEmtnList = await selectStudyDoEmtn(doSq); // 2. [SQLite]TB_STDY_DO_DTL 기반 감정(EMTN) 조회
					const studyDoExprList = await selectStudyDoExpr(doSq); // 3. [SQLite]TB_STDY_DO_DTL 기반 표현(EXPR) 조회
					// 학습 종료를 위해 조회된 데이터를 재구성합니다.
					selectStdyDoDtlAvgRlt.studyDoEmtnDtoList = studyDoEmtnList; // 학습 종료 데이터 추가 -1: 감정
					selectStdyDoDtlAvgRlt.studyDoExprDtoList = studyDoExprList; // 학습 종료 데이터 추가 -2: 표현
					selectStdyDoDtlAvgRlt.stdySecs = Math.round((Date.now() - startTime) / 1000); // stopwatchRef.current!.getNowSec()  // 학습 종료 데이터 추가 -3: 종료시점 타이머 시간

					await apiHandler.insertStudyDoEnd(selectStdyDoDtlAvgRlt); // 4. [SQLite]API 서버로 모든 데이터를 전송합니다.
					const dtlList = await TbStdyDoDtlModules.selectStdyDoDtlListAll(doSq); // 완전 삭제가 되었는지 보자.
					await apiHandler.studyDoDtlList(dtlList)
				}

				await TbStdyDoDtlModules.deleteStudyDoDtl(doSq); // 5. [SQLite] SQLITE 내에 DTL 테이블 데이터 초기화

			},


			studyDoDtlList: async (dtlList: StudyType.StudyDoDtlSQliteDto[]) => {
				try {
					await StudyService.studyDoDtlList(authState, dtlList)
						.then((res) => {
							const { result, resultCode, resultMsg } = res.data;
							console.log("성공 :: ", result, resultCode, resultMsg)

						})
						.catch((err) => {
							console.log("error :: ", err)
						});

				}
				catch (err) {
					console.error(`[-] studyDoDtlList() 함수에서 에러가 발생하였습니다 : ${err}`);

				}
			},

			/**
			 * 학습 종료 이후 처리 수행
			 * @param notiYn
			 */
			finishStudy: async (notiYn: boolean) => {
				try {
					await apiHandler.finalStdyEnd(); // 학습 종료 비즈니스 로직 처리를 수행합니다.
					if (notiYn) {
						await apiHandler.requestAttendanceOut(); // 퇴실 메시지 발송
						navigation.reset({ routes: [{ name: Paths.REPORT }] });
					} else {
						navigation.reset({ routes: [{ name: Paths.LOGIN_SELECT }] });
					}
					// resetHandler.cleanUpStudyInfo();          // 상태 초기화를 수행합니다.
					// tf.engine().endScope();

					// 네트워크 연결이 되어 있을 때만 화면 전환
					// navigation.reset({ routes: [{ name: 'attendance' }] });
					// navigation.navigate('studyReport');
				} catch (error) {
					console.log('[-] 학습 종료 중 실패하였습니다. ', error);
					setAlertTitle('알림');
					setAlertMessage('학습 종료 중 오류가 발생했습니다.');
					setAlertVisible(true);
				}
			},

			/**
			 * 사용자 별 계획의 과목들을 조회해옵니다.
			 * @return {Promise<void>}
			 */
			loadUserSbjtInfo: async (): Promise<void> => {
				const requestData: StudyType.UserSbjtInfo = {
					// userSq: 182,
					userSq: reduxUserInfo.userSq,
				};
				await AttendanceService.selectUserSbjtInfo(authState, requestData)
					.then((res) => {
						let { result, resultCode, resultMsg } = res.data;
						// + 공부용 가짜 항목 추가
						const plusStudyItem = {
							sbjtCd: '', // 빈 코드
							sbjtNm: '+ 공부',
							isPlus: true, // 추가 플래그
						};
						console.log("loadUserSbjtInfo-->", result, resultCode)

						setStudySubjectList([...result, plusStudyItem,]);
					})
					.catch((err) => {
						console.error(`[-] loadUserSbjtInfo() 함수에서 에러가 발생하였습니다 : ${err}`);
					});
			},

			/**
			 * 사용자 별 계획의 과목들을 조회해옵니다.
			 * @return {Promise<void>}
			 */
			getUserTodayStdySecs: async (): Promise<void> => {
				const requestData: StudyType.UserSbjtInfo = {
					// userSq: 182,
					userSq: reduxUserInfo.userSq,
				};
				await StudyService.selectTodayStdySecs(authState, requestData)
					.then((res) => {
						let { result, resultCode, resultMsg } = res.data;

						console.log(result.stdySecs);
						setTodayStdySecs(result.stdySecs)
					})
					.catch((err) => {
						console.error(`[-] selectTodayStdySecs() 함수에서 에러가 발생하였습니다 : ${err}`);
					});
			},

			/**
			 * 학습 계획 선택시 새로운 학습으로 변경합니다
			 * 과목을 변경할때, 새로운 학습으로 시작합니다.
			 *
			 * @param sbjtCd
			 * @param sbjtNm
			 * @returns {Promise<void>}
			 */
			selectedStudySubject: async (sbjtCd: string = '', sbjtNm: string) => {
				console.log("sbjtCd :: ", sbjtCd, " sbjtNm:: ", sbjtNm)

				const requestData: StudyPlanType.StudyPlanDto = {
					userSq: reduxUserInfo.userSq,
					planNm: sbjtNm,
					sbjtCd: sbjtCd,
					planTm: "00:00:00",
					dayBit: "0000000",
					planType: "AC",				// Plany Type 변경
					actvYn: true,
					notiYn: false,
					delYn: false,
					modUser: reduxUserInfo.userSq
				}
				console.log("보내는 값 ::", requestData)
				try {
					await AttendanceService.readyStudyStrt(authState, requestData)
						.then((res) => {
							const { result, resultCode, resultMsg } = res.data;
							console.log("성공 :: ", result, resultCode, resultMsg)
							if (resultCode === SUCCESS_CODE.INSERT) {
								setStudySubjectInfo({ sbjtCd, sbjtNm });
								setIsShowStudySubject(false);
								timerHandler.reset();					// UI 상 시간은 조회

								navigation.replace(Paths.STUDY, { planNm: sbjtNm, doSq: result.doSq, isContinue: false, stdySec: 0 });
							}
						})
						.catch((error) => {
							console.error("에러 :: ", error)
						})
				} catch (err) {
					console.error(`[-] resetStudy() 함수에서 에러가 발생하였습니다 : ${err}`);
				}
			},
			/**
			 * 퇴실 메시지를 발송을 요청합니다.
			 * @return {Promise<void>}
			 */
			requestAttendanceOut: async (): Promise<void> => {
				const requestUserSq: LoginType.AttendanceDto = {
					userSq: reduxUserInfo['userSq'],
					userNm: reduxUserInfo['userNm'],
					loginId: reduxUserInfo['loginId'],
					userIp: await DeviceInfoUtil.getDeviceIpAddr(),
				};
				await AttendanceService.requestAttendanceOut(authState, requestUserSq)
					.then(async (res: AxiosResponse<LoginType.LoginHistDto & CommonType.apiResponseType, any>) => {
						let { result, resultCode, resultMsg } = res.data;
						if (resultCode == SUCCESS_CODE.SELECT) {
							if (result) {
								let { userSq, userNm, userUuid, continueDoSq } = result;
								console.log('[+] 퇴실 하였습니다.', userSq, resultCode, result, resultMsg);
							} else {
								// CustomModal을 활용하여 알림 표시
								setAlertTitle('알림');
								setAlertMessage('퇴실 중에 오류가 발생하였습니다.');
								setAlertVisible(true);

								console.log('[+] 퇴실 중에 오류가 발생하였습니다.', resultCode, result, resultMsg);
							}
						} else {
							setAlertTitle('알림');
							setAlertMessage(`${resultMsg}`);
							setAlertVisible(true);
						}
					})
					.catch((err) => {
						console.error(`[-] requestAttendanceOut() 함수에서 에러가 발생하였습니다 : ${err}`);
						setAlertTitle('알림');
						setAlertMessage(`퇴실 메세지 발송 중 오류가 발생하였습니다.`);
						setAlertVisible(true);
					});
			},

			/**
			 * 학습 상태 실시간 적재
			 * @param isFaceDttctYn
			 */
			studyDoStatus: async (isFaceDttctYn: boolean) => {
				console.log("[+] 학습 상태 10회당 1번 row insert")

				const requestData = {
					"doSq": DO_SQ,
					"faceDtctYn": isFaceDttctYn
				}
				// console.log("적재 데이터 :", requestData)
				await StudyService.studyDoStatus(authState, requestData)
					.then((res) => {
						let { result, resultCode, resultMsg } = res.data;
						if (resultCode == SUCCESS_CODE.INSERT) {
							console.log("[+] 실시간 적재중 ")
						}
					})
					.catch((err) => {
						console.error(`[-] studyDoStatus() 함수에서 에러가 발생하였습니다 : ${err}`);
					});
			}


		};
	})();

	/**
	* 일반적인 핸들러
	*/
	const commonHandler = (() => {
		return {
			/**
			 * 앱 상테 변화를 감지하는 리스너
			 * @param {AppStateStatus} nextAppState App에서 변경된 상태 값이 전달받음 (active, inactive, background)
			 * @returns {void}
			 */
			appStateChangeListener: (nextAppState: AppStateStatus): void => {
				fetch().then((state) => {
					const { type, isConnected } = state;
					console.log('Connection type', type);
					console.log('Is connected?', isConnected);
					console.log('앱 상태를 확인합니다 >>> [', nextAppState, '] 앱의 네트워크 연결 상태 [', isConnected, ']');

					switch (nextAppState) {
						// [CASE1-1] 앱 상태가 "background", "inactive" 상태인 경우: stopwatch를 멈춥니다.
						case 'background':
							if (isActiveStopwatch) timerHandler.pause(); // 스탑워치가 실행중인 경우만 이를 멈춥니다.
							break;

						case 'inactive':
							if (isActiveStopwatch) timerHandler.pause(); // 스탑워치를 멈춥니다.
							if (Platform.OS === 'ios') preAppState.current = 'inactive'; // iOS의 작업창을 내린 경우 이를 수행
							break;

						// [CASE1-2] 앱 상태가 "active" 상태인 경우: stopwatch를 재개 합니다.
						case 'active':
							switch (Platform.OS) {
								case 'android':
									timerHandler.start(); // 무조껀 실행이 된다.
									break;

								case 'ios':
									// 이전에 inactive가 실행되고 스탑워치가 수행된 경우 : 스탑워치를 실행합니다.
									if (preAppState.current === 'inactive' && isActiveStopwatch) {
										timerHandler.start();
										preAppState.current = 'active'; // 상태를 다시 활성화로 변경한다.
									}
									break;
								default:
									break;
							}
							break;
						default:
							break;
					}
				});
			},

			/**
			 * 메모리 사용량을 체크하는 함수
			 */
			checkMemoryUsage: async () => {
				const totalMemory = await DeviceInfo.getTotalMemory(); // 기기의 전체 메모리 (바이트 단위)
				const usedMemory = await DeviceInfo.getUsedMemory(); // 사용 가능한 메모리 (바이트 단위)

				const freeMemory = totalMemory - usedMemory; // 사용된 메모리
				const usedMemoryPercentage = (usedMemory / totalMemory) * 100; // 사용된 메모리 비율

				console.log('totalMemory-->', totalMemory / (1024 * 1024));
				console.log('usedMemory-->', usedMemory / (1024 * 1024));
				console.log('usedMemoryPercentage-->', usedMemoryPercentage);
			},

			/**
			 * 네트워크 변화에 대해 체크하는 리스너
			 * @returns
			 */
			networkChangeCheckListener: (): NetInfoSubscription => {
				console.log('[+] 연결 상태 확인');
				return addEventListener((state) => {
					inConnectNetworkRef.current = state.isConnected!; // 연결 상태를 변수로 저장합니다.
					// 네트워크 연결이 끊겼을때, 학습을 중단시키고 팝업을 출력합니다.
					if (!inConnectNetworkRef.current) {
						timerHandler.pause();
						console.log('네트워크 연결이 끊겼습니다.');
						commonHandler.disconnectNetworkAlert();
					}
				});
			},

			/**
			 * 네트워크 연결이 끊겼을때, 메시지를 출력합니다.
			 * @returns
			 */
			disconnectNetworkAlert: (): void => {
				console.log('네트워크 연결이 끊겼습니다.');
				setAlertTitle('알림');
				setAlertMessage('네트워크 연결을 확인해주세요.');
				setAlertVisible(true);

				return;
			},
			/**
			* 지정한 시간만큼 잠시 대기합니다.
			* @param ms
			* @returns
			*/
			sleep: (ms: number): Promise<void> => {
				console.log(` ===== > 해당 ${ms}초 만큼 잠시 쉽니다.. <===========`);
				return new Promise((resolve) => setTimeout(resolve, ms));
			},

			cvtTensorImgToBase64: (tensorImage: tf.Tensor3D): string => {
				const [height, width] = tensorImage.shape;

				// uint8 데이터 추출 (RGB 순서)
				const rgbData = tensorImage.dataSync(); // Flat Uint8Array [R, G, B, R, G, B, ...]

				// RGBA 버퍼 생성
				const rgbaData = new Uint8Array(width * height * 4);
				for (let i = 0, j = 0; i < rgbData.length; i += 3, j += 4) {
					rgbaData[j] = rgbData[i];       // R
					rgbaData[j + 1] = rgbData[i + 1]; // G
					rgbaData[j + 2] = rgbData[i + 2]; // B
					rgbaData[j + 3] = 255;          // A (불투명)
				}

				const rawImageData = { data: rgbaData, width, height };
				const jpegImageData = jpeg.encode(rawImageData, 100);

				const base64 = Buffer.from(jpegImageData.data).toString('base64');

				tf.dispose(rgbData);

				return `data:image/jpeg;base64,${base64}`;
			},
			saveBase64Image: async (base64Data: string) => {
				try {
					// data:image/jpeg;base64, 앞부분 제거
					const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');

					// 저장 경로 (앱 전용 Document 디렉토리)
					const filePath = `${RNFS.DocumentDirectoryPath}/captured_${Date.now()}.jpg`;

					// 파일 저장
					await RNFS.writeFile(filePath, base64Image, 'base64');

					console.log('이미지 저장 완료:', filePath);
					return filePath;
				} catch (error) {
					console.error('이미지 저장 실패:', error);
					return null;
				}
			},
			rgbToRgba(rgb: Uint8Array | number[], width: number, height: number): Uint8Array {
				const rgba = new Uint8Array(width * height * 4);

				for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
					rgba[j] = rgb[i];     // R
					rgba[j + 1] = rgb[i + 1]; // G
					rgba[j + 2] = rgb[i + 2]; // B
					rgba[j + 3] = 255;        // A (불투명)
				}

				return rgba;
			},

			swapRB(data: Uint8Array): Uint8Array {
				const swapped = new Uint8Array(data.length);
				for (let i = 0; i < data.length; i += 3) {
					swapped[i] = data[i + 2];     // R ← B
					swapped[i + 1] = data[i + 1]; // G 그대로
					swapped[i + 2] = data[i];     // B ← R
				}
				return swapped;
			},

			BGRtoRGB(data: Uint8Array): Uint8Array {
				const rgb = new Uint8Array(data.length);
				for (let i = 0; i < data.length; i += 3) {
					rgb[i] = data[i + 2];     // R ← B
					rgb[i + 1] = data[i + 1]; // G 그대로
					rgb[i + 2] = data[i];     // B ← R
				}
				return rgb;
			},
			RGBAtoRGB(
				data: Uint8Array,
				width: number,
				height: number
			): Uint8Array {
				const rgb = new Uint8Array(width * height * 3);

				for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
					rgb[j] = data[i];       // R
					rgb[j + 1] = data[i + 1]; // G
					rgb[j + 2] = data[i + 2]; // B
					// data[i+3] (Alpha) 버림
				}

				return rgb;
			},
			BGRAtoRGB(data: Uint8Array, width: number, height: number): Uint8Array {
				const rgb = new Uint8Array(width * height * 3);

				for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
					rgb[j] = data[i + 2];     // R ← B
					rgb[j + 1] = data[i + 1]; // G
					rgb[j + 2] = data[i];     // B ← R
					// data[i+3] = Alpha → 버림
				}
				return rgb;
			},
			autoSwapIfNeeded(
				data: Uint8Array,
				width: number,
				height: number
			): Uint8Array {
				const rgb = new Uint8Array(width * height * 3);
				const channels = data.length / (width * height);
				console.log("channels : ", channels)

				if (channels === 3) {
					// 첫 픽셀 값 확인
					const r0 = data[0];
					const g0 = data[1];
					const b0 = data[2];

					const looksLikeBGR = r0 < b0; // 대략 빨강/파랑 강도 비교

					if (looksLikeBGR) {
						// BGR → RGB 변환
						for (let i = 0; i < data.length; i += 3) {
							rgb[i] = data[i + 2]; // R
							rgb[i + 1] = data[i + 1]; // G
							rgb[i + 2] = data[i];     // B
						}
						return rgb;
					} else {
						// 이미 RGB → 그대로
						return data;
					}
				}

				if (channels === 4) {
					for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
						rgb[j] = data[i];     // R
						rgb[j + 1] = data[i + 1];   // G
						rgb[j + 2] = data[i + 2];   // B
					}
					return rgb;
				}

				throw new Error(`Unexpected channels: ${channels}`);
			},
			normalizeToRGB(
				data: Uint8Array,
				width: number,
				height: number
			): Uint8Array {
				const channels = data.length / (width * height);

				if (channels !== 3) {
					throw new Error(`Unexpected channel count: ${channels}`);
				}

				if (Platform.OS === "ios") {
					// iOS: BGR → RGB 변환
					const rgb = new Uint8Array(width * height * 3);
					for (let i = 0; i < data.length; i += 3) {
						rgb[i] = data[i + 2]; // B → R
						rgb[i + 1] = data[i + 1]; // G 그대로
						rgb[i + 2] = data[i];     // R → B
					}
					return rgb;
				}

				// Android는 그대로
				return data;
			}

		}
	})();

	const formatSecsToHourMin = (secs) => {
		const hours = Math.floor(secs / 3600);
		const minutes = Math.floor((secs % 3600) / 60);

		if (hours > 0) {
			return `${hours}시간 ${minutes}분`;
		} else {
			return `${minutes}분`;
		}
	};

	/**
	 * 계획을 변경하는 경우
	 * 학습을 종료 -> 새로운 계획 시작
	 * @param item 
	 */
	const changePlan = async (item: any) => {
		await apiHandler.finalStdyEnd(); // 학습 종료 비즈니스 로직 처리를 수행합니다.
		resetHandler.cleanUpAccStdInfo();
		if (item) {
			apiHandler.selectedStudySubject(item.sbjtCd, item.sbjtNm!)
		} else {
			apiHandler.selectedStudySubject('', STUDY_MESSAGES[Math.floor(Math.random() * STUDY_MESSAGES.length)])
		}
	}


	if (device == null || !hasPermission) {
		return <Text>카메라 로딩 중...</Text>;
	}
	return (
		<SafeAreaView style={styles.main} edges={['top']}>
			<StatusBar backgroundColor='#2e3138' />
			<ScrollView style={styles.container} scrollEnabled={false}>
				{/* ==================================================== 카메라 출력 영역 ==================================================== */}
				{
					isCameraActive && (
						<View style={styles.container}>
							<View >
								<Camera
									ref={cameraRef}
									device={device}
									style={!showCamera ? styles.camera : styles.camera2}
									isActive={isCameraActive}
									pixelFormat="rgb"
									zoom={0.5}
									frameProcessor={visionCameraHandler.frameProcessor}
								// fps={LOWEST_FORMAT?.maxFps ?? 15}  // format에 맞는 fps 지정
								// enableFpsGraph={true}
								/>
							</View>

							<View style={styles._container}>

								{
									showModelImage &&
									<View style={{ position: "absolute", alignItems: 'center', width: '100%', height: 600, marginTop: 100 }}>
										<Image
											source={{ uri: imageUri }}
											resizeMode="contain"
											style={{ width: 500, height: 500 }} // 👈 전면카메라 보정
										/>
										{/* ==================================================== 얼굴 탐지 여부 표시 ==================================================== */}
										<View style={{ alignItems: 'center', }}>
											<View
												style={{
													width: 20,
													height: 20,
													borderRadius: 10,
													backgroundColor: isFaceDtctYn ? '#2ecc71' : '#f1c40f', // ✅ 초록(탐지됨) / 노랑(탐지 안됨)
													marginBottom: 6,
												}}
											/>
											<Text style={{ color: '#fff', fontSize: 14 }}>
												{isFaceDtctYn ? '얼굴 탐지됨' : '얼굴 미탐지'}
											</Text>
										</View>
									</View>
								}

								<View style={styles._iconWrapper}>
									<TouchableWithoutFeedback
										onPress={() => {
											devTapCountRef.current += 1;

											if (devTapCountRef.current >= 12) {
												Alert.alert(
													"개발자 모드",
													"당신은 진짜 개발자 이십니까?",
													[
														{
															text: "아니오",
															style: "cancel",
															onPress: () => {
																setIsDevInfo((prev) => ({ ...prev, openTab: 0, isDev: false }));
															},
														},
														{
															text: "네",
															onPress: async () => {
																const studyCnt = await TbStdyDoDtlModules.selectStdyDtlCnt(DO_SQ);
																setIsDevInfo({ isDev: true, studyCnt: studyCnt, devOpenTab: 0 });
															},
														},
													],
													{ cancelable: false }
												);
												devTapCountRef.current = 0; // 다시 초기화
											}
										}}
									>
										<Image
											style={styles._iconImage}
											source={require('../../../assets/images/icons/ic_l_book_40-1.png')}
											resizeMode="contain"
										/>
									</TouchableWithoutFeedback>
								</View>

								<View style={styles._titleRow}>
									<Text style={styles._titleText}>
										{studySubjectInfo.sbjtNm}
									</Text>
									<TouchableOpacity
										style={{ justifyContent: 'center', }}
										onPress={() => {
											timerHandler.pause();
											setIsShowStudySubject(true);
										}}>
										<Image
											style={styles._replaceIcon}
											source={require('../../../assets/images/icons/ic_l_replace.png')}
											resizeMode='contain'
										/>
									</TouchableOpacity>
								</View>
							</View>
							<View style={styles.pomodoroSvgContainer}>
								{/* 원형 타이머 */}
								<View style={styles._circleBox}>
									{/* Base: First 60 mins (0-60) in blue */}
									<AnimatedCircularProgress
										size={420}
										width={widthRelateSize(10)}
										fill={fillBlue}
										tintColor="#A0E6F5"
										backgroundColor="#222"
										backgroundWidth={widthRelateSize(5)}
										duration={3600}
										lineCap="round"
										style={styles._progressOverlay}
									/>

									{/* Second Layer: 60-120 mins in orange */}
									<AnimatedCircularProgress
										size={420}
										width={widthRelateSize(10)}
										fill={fillOrange}
										tintColor="#6491FF"
										backgroundColor="transparent"
										backgroundWidth={0}
										duration={3600}
										lineCap="round"
										style={styles._progressOverlay}
									>
										{() => {
											const hours = Math.floor(seconds / 3600);
											const minutes = Math.floor((seconds % 3600) / 60);

											const hoursStr = hours.toString().padStart(2, '0');
											const minutesStr = minutes.toString().padStart(2, '0');

											return <Text style={styles._timerText}>{hoursStr}:{minutesStr}</Text>;
										}}
									</AnimatedCircularProgress>
								</View>

								{(todayStdySecs + seconds) > 0 && (
									<View style={{ flex: 1, alignItems: "center" }}>
										<Text style={styles._todayText}>
											오늘은 {formatSecsToHourMin(todayStdySecs + seconds)} 공부 중!
										</Text>
									</View>
								)}
							</View>

							<View style={styles._actionContainer}>
								<View style={styles._actionBox}>
									<TouchableOpacity
										onPress={() => timerHandler.handleConfirmExit('change')}
										style={styles._touchBox}>
										<View style={styles._iconWrap}>
											<Image
												style={styles._iconImg}
												source={require('../../../assets/images/icons/ic_l_change.png')}
												resizeMode='contain'
											/>
										</View>
										<Text style={styles._labelText}>자리 이동</Text>
									</TouchableOpacity>
								</View>

								<View style={[styles._actionBox, styles._actionBoxRight]}>
									<TouchableOpacity
										onPress={() => timerHandler.handleConfirmExit('exit')}
										style={styles._touchBox}>
										<View style={styles._iconWrap}>
											<Image
												style={styles._iconImg}
												source={require('../../../assets/images/icons/ic_l_out.png')}
												resizeMode='contain'
											/>
										</View>
										<Text style={styles._labelText}>퇴실</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					)}
			</ScrollView>
			{/* 공통 알림 모달 */}
			<CustomModal
				visible={isAlertVisible}
				onClose={() => setAlertVisible(false)}
				title={alertTitle}
				message={alertMessage}
				confirmText='확인'
				onConfirm={() => setAlertVisible(false)}
				cancelText={null}
				onCancel={null}
			/>

			{/* ============================================= 권한 팝업 영역 ================================================== */}
			<Modal animationType='fade' transparent={true} visible={isPermisModalOpen}>
				<View style={styles.modalContainer2}>
					<View style={styles.innerContainer}>
						<View style={styles.titleArea}>
							<Text style={styles.title1}>'터그보트' </Text>
							<Text style={styles.title2}>다음의 앱 권한을 허용해주세요.</Text>
						</View>
						<View style={styles.titleBottomLine}></View>
						<View style={styles.permissionArea}>
							<View style={styles.permissionSubArea}>
								<Text style={styles.permissionTitle}>카메라 (필수)</Text>
								<Switch
									style={styles.permissionSwitch}
									trackColor={{ false: '#E4E6EB', true: '#B8CEFB' }}
									thumbColor={permisChecked ? '#6E90F7' : '#C5C9D0'}
									ios_backgroundColor='#3e3e3e'
									onValueChange={() => permissionChkHandler.toggleSwitch()}
									value={permisChecked}
								/>
							</View>
							<View style={styles.permissionContent}>
								<Text style={styles.permissionContentTxt}>공부모드 실행 시 AI리포트를 제공을 위해 필요합니다.</Text>
							</View>
						</View>
						<View style={styles.titleBottomLastLine}></View>
						<View>
							<Text style={styles.permissionAlertTxt}>* 위 접근권한은 더 나은 서비스를 제공하기 위해 사용됩니다.</Text>
						</View>
						<View style={styles.permissionBottonArea}>
							<TouchableOpacity style={styles.permissionBottonFrame} onPress={permissionChkHandler.cancleBtn}>
								<Text style={styles.permissionBottonTxt}>취소</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.permissionBottonFrame} onPress={permissionChkHandler.confirmBtn}>
								<Text style={styles.permissionBottonTxt}>확인</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* ============================================= TOAST 메시지 팝업 ================================================== */}
			{
				isShowToast && (
					<Suspense fallback={<></>}>
						<ToastScreen
							height={50}
							marginTop={520}
							marginBottom={60}
							onClose={() => setIsShowToast(false)}
							message={`카메라 설정이 완료됐어요. \n 다음 단계로 넘어가요!`}
						/>
					</Suspense>
				)
			}

			{/* ============================================= 공부 종료 팝업 영역 ================================================== */}
			<Modal animationType='slide' transparent={true} visible={isShowChange}>
				<View style={styles.overlay}>
					<View style={styles.endModalContainer}>
						<Text style={styles.title}>{'자리를 이동 하시나요?'}</Text>


						<View style={styles.buttonContainer}>
							<TouchableOpacity
								style={styles.unActive}
								onPress={() => {
									setIsShowChange(true);
									navigation.reset({ routes: [{ name: Paths.LOGIN_SELECT }] });
								}}>
								<Text style={styles.buttonText}>네</Text>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.unActive}
								onPress={() => {
									setIsShowChange(false);
									cameraHandler.resume();   // ✅ 아니오 → 다시 켜기
									timerHandler.start();   // ✅ 퇴실 시 카메라 완전히 종료
								}}>
								<Text style={styles.buttonText}>아니오</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			<Modal animationType='slide' transparent={true} visible={isShowExit}>
				<View style={styles.overlay}>
					<View style={styles.endModalContainer}>
						<Text style={styles.title}>{'오늘 공부가 끝났나요?'}</Text>

						<View style={styles.buttonContainer}>
							<TouchableOpacity
								style={styles.unActive}
								activeOpacity={0.6} // 👈 눌렀을 때 투명도 줄어듦
								onPress={() => {
									timerHandler.resetTimer(true);
								}}>
								<Text style={styles.buttonText}>네</Text>
							</TouchableOpacity>
							<TouchableOpacity style={styles.unActive} onPress={() => {
								setIsShowExit(false);
								cameraHandler.resume();   // ✅ 아니오 → 다시 켜기
								timerHandler.start();   // ✅ 퇴실 시 카메라 완전히 종료
							}}>
								<Text style={styles.buttonText}>아니오</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* ============================================= 공부 계획 팝업 영역 ================================================== */}
			<Modal animationType='slide' transparent={true} visible={isShowStudySubject}>
				<View style={styles.modalOverlay2}>
					<View style={styles.modalContainer3}>
						{/* 상단 헤더 */}
						<View style={styles.header2}>
							<Text style={styles.headerTitle}>공부 계획</Text>
							<TouchableOpacity
								onPress={() => {
									timerHandler.start();
									setIsShowStudySubject(false);
									setIsCameraActive(true);
								}}
								activeOpacity={0.6} // 👈 눌렀을 때 투명도 줄어듦
								style={styles.closeButton2}>
								<Image
									source={require('../../../assets/images/icons/ic_l_close_gray_28.png')}
									resizeMode='cover'
									style={{ width: widthRelateSize(24), height: heightRelateSize(24) }}
								/>
							</TouchableOpacity>
						</View>

						{/* 리스트 */}
						<View style={styles.listContainer}>
							{_.chunk(studySubjectList, 2).map((row, rowIndex) => {
								const isSinglePlusRow = row.length === 1 && row[0].isPlus;
								const isOnlyOneItem = studySubjectList.length === 1;

								return (
									<View key={rowIndex} style={[styles.row2, (isOnlyOneItem || isSinglePlusRow) && styles.rowSingleCenter]}>
										{row.map((item, index) => {
											const isSelected = studySubjectInfo.sbjtNm?.trim() === item.sbjtNm?.trim();
											if (item.isPlus) {
												return (
													// 일반 리스트에서 조회한 학습
													<TouchableOpacity
														key={`plus-${index}`}
														onPress={() => changePlan('')}
														style={styles.plusButton}>
														<Text style={styles.plusText}>{item.sbjtNm}</Text>
													</TouchableOpacity>
												);
											}

											return (

												// 랜덤 학습
												<TouchableOpacity
													key={index}
													onPress={() => changePlan(item)}
													style={[styles.subjectButton2, isSelected && styles.subjectButtonSelected]}>
													<Text style={[styles.subjectText2, isSelected && styles.subjectTextSelected]}>{item.sbjtNm}</Text>
												</TouchableOpacity>
											);
										})}
										{/* ✅ 홀수일 때 빈칸 하나 추가해서 정렬 맞춤 */}
										{row.length === 1 && <View style={{ flex: 1 }} />}
									</View>
								);
							})}
						</View>
					</View>
				</View>
			</Modal>

			<Modal
				visible={isDevInfo.isDev}
				transparent
				animationType="fade"
				onRequestClose={() => setIsDevInfo({ ...isDevInfo, isDev: false })}
			>
				<View style={styles.overlay}>
					<View style={styles.devContainer}>
						<Text style={[styles.devTitle, { fontSize: fontRelateSize(20), marginBottom: heightRelateSize(15) }]}>
							⚙️ 개발자 모드
						</Text>

						{/* ✅ 디버깅 정보 영역 */}
						<View style={{
							width: '100%',
							padding: 14,
							borderWidth: 1,
							borderColor: '#666',
							borderRadius: 10,
							backgroundColor: '#2a2d34',
							marginBottom: heightRelateSize(20)
						}}>
							<Text style={{ color: '#bbb', fontSize: fontRelateSize(13), marginBottom: heightRelateSize(8), borderBottomWidth: 1, borderColor: '#444', paddingBottom: 6 }}>
								📌 Debug Info
							</Text>

							<Text style={{ color: '#fff', fontSize: fontRelateSize(13), marginBottom: 6 }}>
								<Text style={{ color: '#999' }}>1. 학습: </Text>
								<Text style={{ fontWeight: 'bold', color: '#4FC3F7' }}>{studySubjectInfo.sbjtNm}</Text>
								<Text style={{ color: '#ccc' }}> (doSq: {DO_SQ})</Text>
							</Text>

							<Text style={{ color: '#fff', fontSize: fontRelateSize(13), marginBottom: 6 }}>
								<Text style={{ color: '#999' }}>2. 사용자: </Text>
								<Text style={{ fontWeight: 'bold', color: '#81C784' }}>{reduxUserInfo?.userNm}</Text>
								<Text style={{ color: '#ccc' }}> (userSq: {reduxUserInfo?.userSq})</Text>
							</Text>

							<Text style={{ color: '#fff', fontSize: fontRelateSize(13), marginBottom: 6 }}>
								<Text style={{ color: '#999' }}>3. 그룹: </Text>
								<Text style={{ fontWeight: 'bold', color: '#FFB74D' }}>{reduxUserInfo?.groups.grpNm}</Text>
								<Text style={{ color: '#ccc' }}> (grpSq: {reduxUserInfo?.groups.grpSq})</Text>
							</Text>

							<Text style={{ color: '#fff', fontSize: fontRelateSize(13) }}>
								<Text style={{ color: '#999' }}>4. 학습 데이터 개수(DTL 1 Row): </Text>
								<Text style={{ fontWeight: 'bold', color: '#FFB74D' }}>{isDevInfo.studyCnt}</Text>
							</Text>
						</View>

						{/* ✅ 스위치 영역 */}
						<View style={{
							width: '100%',
							paddingHorizontal: 10,
							paddingVertical: 8,
							borderRadius: 8,
							backgroundColor: '#2f323b',
							marginBottom: heightRelateSize(30)
						}}>
							<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: heightRelateSize(16) }}>
								<Text style={{ flex: 1, fontSize: fontRelateSize(14), color: '#FFFFFF' }}>카메라 보이기</Text>
								<Switch
									value={showCamera}
									onValueChange={(val) => setShowCamera(val)}
								/>
							</View>

							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<Text style={{ flex: 1, fontSize: fontRelateSize(14), color: '#FFFFFF' }}>모델 이미지 보이기</Text>
								<Switch
									value={showModelImage}
									onValueChange={(val) => setShowModelImage(val)}
								/>
							</View>
						</View>

						{/* ✅ 닫기 버튼 */}
						<TouchableOpacity
							style={{
								width: '100%',
								paddingVertical: heightRelateSize(12),
								borderRadius: 8,
								borderWidth: 1,
								borderColor: "red",
								alignItems: "center",
								backgroundColor: '#3a1e1e'
							}}
							activeOpacity={0.8}
							onPress={() => setIsDevInfo({ ...isDevInfo, isDev: false })}
						>
							<Text style={[styles.buttonText, { color: "red", fontSize: fontRelateSize(15), fontWeight: 'bold' }]}>닫기</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</SafeAreaView >
	);
}
export default StudyScreen;
