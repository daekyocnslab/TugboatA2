import { FaceDetetorType } from "../../types/FaceDetetorType";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Image, Linking, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

// vision-camera
import { Camera, runAtTargetFps, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { useRunOnJS } from "react-native-worklets-core";
import { useResizePlugin } from "vision-camera-resize-plugin";

// 기타 라이브러리 
import _ from 'lodash';
import { Tensor3D } from "@tensorflow/tfjs";
import * as jpeg from 'jpeg-js';
import { AxiosResponse } from "axios";
import Svg, { Circle } from "react-native-svg";
import DeviceInfo from "react-native-device-info";
import { fetch } from '@react-native-community/netinfo';
import { useDispatch, useSelector } from "react-redux";
import { activateKeepAwakeAsync } from 'expo-keep-awake';
import { PERMISSIONS, requestMultiple } from "react-native-permissions";
import { NetInfoSubscription, useNetInfo, addEventListener } from "@react-native-community/netinfo";

import { LoginType } from "@/types/LoginType";
import { CommonType } from "@/types/CommonType";
import { StudyType } from "@/types/StudyType";
import { StudyPlanType } from "@/types/StudyPlanType";
import { CODE_GRP_CD, SUCCESS_CODE } from "@/common/utils/codes/CommonCode";

import { RootState } from "@/store/RootReducer";
import { useNetwork } from "@/common/context/NetworkContext";
import modelManager from "@/interceptor/ModelManager";
import ProgressBar from "../common/ProgressBar";
import AuthenticationManager from "@/modules/auth/AuthenticationManager";
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

import styles from '../study/styles/StudyScreenStyle';


// 상수 관리 
const RESIZE_WIDTH = 292;
const RESIZE_HEIGHT = 320;
const TARGET_FPS = 1
const LOOP_TIME = 100;
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
 * 병합 대기중
 * @returns 
 */
const VisionCameraResizeScreen = ({ route, navigation }) => {

    // 학습 계획 리스트에서 전달받은 파라미터
    const {
        doSq: DO_SQ,
        isContinue: IS_CONTINUE, // 이어하기 여부(true/false)
        stdySec: STDY_SEC, // 이어하기 시간
        planNm: PLAN_NM,
        sbjtCd: SBJT_CD,
    } = route.params!;

    const tf = modelManager.tf;
    const initModel = {
        isTensorReady: modelManager.isTensorflowInitialized,            // Tensorflow 모델
        visionRfb320OnnxModel: modelManager.getVisionRfb320OnnxModel,   // visionRfb320 모델
        pfldOnnxModel: modelManager.getPfldOnnxModel,                   // pfld 모델
        irisLandmarkOnnxModel: modelManager.getIrisLandmarkOnnxModel,   // irisLandmark 모델
        hsemotionModel: modelManager.getHSEmotionSession,               // hsemotion 모델
        fsanetModel: modelManager.getFSANetSession,                     // FSA-NET 모델
        hPoseModel: modelManager.getHSEmotionSession,                   // HPose 모델
    }

    const { resize } = useResizePlugin();
    const { isConnected } = useNetInfo();   // 네트워크 상태를 제외하기 위한 Context Hook 호출
    const { setNetworkCheckEnabled } = useNetwork(); // 네트워크 상태를 제외하기 위한 Context Hook 호출

    // =================================================================== Redux에서 사용자 정보와 학습정보를 조회합니다. ===================================================================
    const dispatch = useDispatch();
    const authManager = AuthenticationManager.getInstance(navigation, dispatch); //인증 관련 기능 제공하는 매니저 클래스
    const authState = useSelector((state: RootState) => state.authInfo);
    const reduxUserInfo = useSelector((state: RootState) => state.userInfo);
    const reduxStudyPlan = useSelector((state: RootState) => state.studyInfo);
    const settingState = useSelector((state: RootState) => state.settingInfo);

    // =================================================================== 얼굴 측정 관련 상태 관리 ===================================================================
    const cameraRef = useRef<Camera>(null);
    const device = useCameraDevice('front')
    const isProcessingRef = useRef(false);
    const loopMainCntRef = useRef<number>(0);
    const inConnectNetworkRef = useRef<boolean>(true);  // 네트워크의 연결 여부를 체크합니다.
    const accLoopCntRef = useRef(0); // 최상단에서 선언
    const { hasPermission, requestPermission } = useCameraPermission()

    const [imageUri, setImageUri] = useState<string | null>(null);
    const [isFaceDtctYn, setIsFaceDtctYn] = useState<boolean>(false);               // 얼굴 탐지여부에 따라 다른 불(파란색/노란색)을 켜줍니다.
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [isCameraViewOn, setIsCameraViewOn] = useState(false); // 카메라 보이게, 안보이게하기

    const [doSq, setDoSq] = useState<number>(0); // 학습 실행 시퀀스

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
    const [isUsingStudent, setIsUsingStudent] = useState<boolean>(false); // 현재공부중인 친구만 보기

    // =================================================================== 스탑 워치 관련 변수들 ===================================================================
    const [seconds, setSeconds] = useState<number>(0); // "스탑워치" 초 (이어서 하기를 하는 경우 불러와서 세팅합니다.)
    const [isActiveStopwatch, setIsActiveStopwatch] = useState<boolean>(false); // "스탑워치" 활성화 여부
    const loopStartSecRef = useRef<number>(); // 루프 시작의 시작시간
    const loopStartTimeRef = useRef<number>(0); // 루프 시작시간
    const stopwatchRef = useRef<StudyType.StopwatchFucHandler>(null); // 하위 StopwatchComponent의 속성들을 관리합니다.

    const [isRestart, setIsRestart] = useState<boolean>(false); // 앱을 재시작했는지 여부

    // =================================================================== 종료하기 팝업 상태 관리 ===================================================================
    const [isShowStudyEnd, setIsShowStudyEnd] = useState(false); // 학습 팝업

    let preAppState = useRef<'active' | 'inactive'>('active');

    // 버튼 중복방지를 위해서 disabled 속성을 관리합니다.
    const [btnDisable, setBtnDisable] = useState({
        start: false, // 스탑워치 시작 버튼
        pause: false, // 스탑워치 일시 정지 버튼
        stop: false, // 스탑워치 중지 버튼
        end: false, // 학습 종료 버튼
    });

    // 뽀모도르 타이머
    const defaultTime = settingState.timerTime * 60 + 5; //기본 시간 (분)
    const [totalTime, setTotalTime] = useState(defaultTime); // 기본 작업 시간 (초)
    const [endTime, setEndTime] = useState(0); // 종료 시간 (밀리초)
    const [timeLeft, setTimeLeft] = useState(IS_CONTINUE ? defaultTime - STDY_SEC : defaultTime); // 남은 시간 (초)
    const [startTime, setStartTime] = useState(0); // 타이머 시작 시간
    const [totalUsedTime, setTotalUsedTime] = useState(0); // 총 사용 시간 (초)
    const [isRunning, setIsRunning] = useState(false); // 타이머 실행 여부
    const [maxNegativeTime, setMaxNegativeTime] = useState(defaultTime); // 최대 음수 시간
    const [showTimeButtons, setShowTimeButtons] = useState(false); // 타이머 변경 버튼 표시 여부
    const [modalType, setModalType] = useState<'exit' | 'change' | null>(null);
    const [isCameraOn, setIsCameraOn] = useState(true); // 카메라의 온오프 여부

    //공통 모달관련
    const [isAlertVisible, setAlertVisible] = useState(false);
    const [alertTitle, setAlertTitle] = useState('');
    const [alertMessage, setAlertMessage] = useState('');


    useEffect(() => {
        requestPermission();
    }, []);

    // 뽀모도르 타이머 동작
    useEffect(() => {
        let timer;

        if (startTime === 0) setStartTime(Date.now());
        if (isRunning) {
            timer = setInterval(() => {
                const now = Date.now();
                const secondsLeft = Math.round((endTime - now) / 1000);
                if (secondsLeft <= -maxNegativeTime) {
                    clearInterval(timer);
                    setIsRunning(false);
                    setTimeLeft(-maxNegativeTime);
                } else {
                    setTimeLeft(secondsLeft);
                }
            }, 1000);
        } else {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [isRunning, endTime, maxNegativeTime]);

    // 시간 포맷: mm:ss
    const formatTime = (seconds) => {
        const absMinutes = Math.floor(Math.abs(seconds) / 60);
        const sign = seconds < 0 ? '+' : '';
        return `${sign}${String(absMinutes).padStart(2, '0')}분`;
    };

    /**
     * 자리 이동 및 퇴실 모달 핸들러
     */
    const handleConfirmExit = (type: 'exit' | 'change') => {
        console.log('isRunning :: ', isRunning);
        stopwatchHandler.pause();

        if (isRunning) {
            stopwatchHandler.pause();
            toggleTimer(); // 타이머 정지
        }
        setModalType(type);
    };

    // 타이머 시작/일시정지
    const toggleTimer = () => {
        try {
            console.log('isRunning 222222:: ', isRunning);
            if (!isRunning) {
                const now = Date.now();
                if (!endTime) {
                    // timeLeft를 기준으로 endTime 설정
                    setEndTime(now + timeLeft * 1000);
                }
            }

            stopwatchHandler.start();
            setIsRunning(!isRunning);

            setModalType(null);
        } catch (error) {
            console.error('[-] 타이머 오류 발생:', error);
            setAlertTitle('오류');
            setAlertMessage('타이머 실행 중 문제가 발생했습니다.');
            setAlertVisible(true);
        }
    };

    // 타이머 종료
    const resetTimer = (notiYn) => {
        setAlertVisible(false); // 모달 닫기
        setModalType(null);

        // 네트워크 연결 상태를 최종적으로 한 번 더 확인
        if (isConnected === false) {
            commonHandler.disconnectNetworkAlert(); // 네트워크 연결이 끊겼을 때 팝업 출력
            setIsRunning(true);
            return; // 화면 전환 중단
        }

        setIsRunning(false);
        setTimeLeft(totalTime);
        setEndTime(0);

        handleDelete(notiYn);
    };

    const handleDelete = (notiYn) => {
        try {
            studyDtlHandler.finalStdyEnd(); // 학습 종료 비즈니스 로직 처리를 수행합니다.
            if (notiYn) {
                apiHandler.requestAttendanceOut(); // 퇴실 메시지 발송
                navigation.reset({ routes: [{ name: 'studyReport' }] });
            } else {
                navigation.reset({ routes: [{ name: 'loginSelect' }] });
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
    };

    // 작업 시간 및 음수 시간 설정
    const setTimerTime = (minutes) => {
        // dispatch(setUseDefaultStudyTime(true));
        // dispatch(setDefaultStudyTime(minutes));

        const newTime = minutes * 60;
        setTotalTime(newTime);
        setTimeLeft(newTime);
        setMaxNegativeTime(newTime); // 최대 음수 시간도 설정
        setIsRunning(false); // 새로운 시간 설정 시 타이머 멈춤
        setEndTime(0);
        setShowTimeButtons(false); // 시간 선택 후 버튼 숨김
    };

    /**
     * 렌더링 이후 수행 -2 : '시작 정서' 코드 리스트 조회 및 모든 모델을 조회합니다.
     */
    useEffect(() => {
        const init = async () => {
            setNetworkCheckEnabled(false);
            await activateKeepAwakeAsync();
            DeviceInfoUtil.hardwareBackRemove(navigation, true);

            // 과목 정보를 조회하여 세팅합니다.
            handleStudySubject.loadUserSbjtInfo();

            // 권한 먼저 체크
            const permisOk = await permissionChkHandler.checkPermission();
            if (!permisOk) return;

            setIsCameraOn(true);
            AppState.addEventListener('change', commonHandler.appStateChangeListener);

            // [CASE1] 이어하기로 수행하는 경우 => 계획명을 입력후 모델 불러오기
            if (PLAN_NM) {
                setStudySubjectInfo({ sbjtCd: SBJT_CD, sbjtNm: PLAN_NM });
                setIsShowStudySubject(false);
                return;
            } else {
            }
        };

        init();

        return () => {
            console.log('[+] StudyScreen clean UP');
            resetHandler.cleanUpStudyInfo();
            if (isShowStudyEnd) studyEndPopupHandler.close();
            setNetworkCheckEnabled(true);
        };
    }, []);

    /**
     *  ==============================================================================================================================
     * 과목 정보 처리 로직 
     * 1. loadInitModel()       : 학습과 관련된 인공지능 모델을 불러와서 State내에 세팅하는 이벤트
     * 2. readyTensorCamera()   : TensorCamera를 실행하고 결과 Tensor 값을 반환 받는 이벤트
     * @returns
     *  ==============================================================================================================================
    /**
     * 사용자 과목정보 리스트 조회 
     */

    const handleStudySubject = (() => {
        return {
            /**
             * 사용자 기반 계획을 가져옵니다.
             */
            loadUserSbjtInfo: async () => {
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

                        setStudySubjectList([...result, plusStudyItem]);
                    })
                    .catch((err) => {
                        console.error(`[-] loadUserSbjtInfo() 함수에서 에러가 발생하였습니다 : ${err}`);
                    });
            },

            /**
             * 학습 계획을 선택합니다.
             * @param sbjtCd
             * @param sbjtNm
             */
            selectedStudySubject: async (sbjtCd: string = '', sbjtNm: string) => {
                console.log('[+] 선택한 학습 계획 ::: ', sbjtNm);

                const updateInfo: StudyPlanType.UpdateStudyInfoParam = {
                    doSq: DO_SQ,
                    doNm: sbjtNm,
                    modUser: reduxUserInfo.userSq,
                };

                await AttendanceService.updateStudyInfo(authState, updateInfo)
                    .then((res) => {
                        const { result, resultCode, resultMsg } = res.data;
                        console.log(result, resultCode);
                        if (resultCode === SUCCESS_CODE.UPDATE) {
                            console.log('결과값 :: ', result);
                            console.log('업데이트 완료!!', sbjtNm);
                            stopwatchHandler.start();
                            setStudySubjectInfo({ sbjtCd, sbjtNm });
                            setIsShowStudySubject(false);
                        }
                    })
                    .catch((err) => {
                        console.error('[-] 학습계획 수정하는 도중에 오류가 발생하였습니다.', err);
                    });
            },
        };
    })();


    /**
     *  ==============================================================================================================================
     * 학습 메인 로직 처리 Handler
     * 1. loadInitModel()       : 학습과 관련된 인공지능 모델을 불러와서 State내에 세팅하는 이벤트
     * 2. readyTensorCamera()   : TensorCamera를 실행하고 결과 Tensor 값을 반환 받는 이벤트
     * @returns
     *  ==============================================================================================================================
     */
    /**
     * 1초당 2프레임으로 들어오는 데이터를 처리하는 함수 
     */
    const onFrameData = useCallback(async (resized: number[]) => {
        if (isProcessingRef.current) return; // 이미 처리 중이면 무시
        isProcessingRef.current = true;


        let _orgImageTensor: Tensor3D | undefined;
        let _imageToTensor: Tensor3D | undefined;


        const convertStart = performance.now();

        if (!cameraRef.current) return;
        let _strtTs: number; // 학습 시작 시간

        tf.engine().startScope(); // ✅ 모든 Tensor 생성 이전에 시작
        try {
            // [STEP1] 네트워크 연결이 되지 않았을 경우 멈춥니다.
            if (!inConnectNetworkRef.current) return;

            const startTime = performance.now();
            loopStartTimeRef.current = Date.now();
            let _accFaceDetectCnt: number = 0;

            console.log(`1. 루프 시작 시점에 메모리에 있는 텐서 수 ::  ${tf.tidy(() => tf.memory().numTensors)}`);
            const _frameToUint8Array = new Uint8Array(resized);
            _orgImageTensor = tf.tensor3d(_frameToUint8Array, [RESIZE_HEIGHT, RESIZE_WIDTH, 3], 'int32');     // [Tensor] 추론용 Tensor 생성
            _imageToTensor = visionCameraHandler.rotate90Clockwise(_orgImageTensor);                               // [Tensor] 우측으로 회전된 이미지를 정상으로 되돌림
            tf.dispose(_orgImageTensor)

            // TODO: 삭제 예정
            // const _tensorToImageUri = commonHandler.cvtTensorImgToBase64(_imageToTensor)
            // setImageUri(_tensorToImageUri); // Image에 표시
            // TODO: 삭제 예정

            // [STEP1] 전체에서 누적 및 갱신 할 변수값들을 관리합니다.
            loopMainCntRef.current++; // 학습을 수행시작 한 이후 전체 루프 누적 횟수
            accLoopCntRef.current++; // 누적 증가
            _strtTs = Date.now();

            // 루프 시작시 DB 시간 저장
            if (accLoopCntRef.current === 1) {
                loopStartSecRef.current = Math.round((Date.now() - startTime) / 1000); // stopwatchRef.current?.getNowSec();           // 루프 시작 초
            }


            if (!_imageToTensor) return;
            else {

                let configArr: number[] = Array(8).fill(NaN); // 기본값 미리 선언
                let _resultHsemotion: StudyType.ResultHsemotion = { arousalArr: [], valenceArr: [], emotionCode: "" };  // HSEmotion 코드

                const { estimateVersionRfb320, estimatePfldModel, estimateIrisLandmarkModel, fsanetEstimate, hsemotionEstimate } = OnnxModules

                const visionRfb320Result = await estimateVersionRfb320(_imageToTensor);                 // [Model] 얼궅 탐지 모델 수행
                // const visionRfb320Result = [[123, 61, 198, 164, 0.9862696528434753]]


                //  [STEP1] 얼굴을 탐지하는 경우 
                if (visionRfb320Result.length > 0) {
                    const pfldArr = await estimatePfldModel(_imageToTensor, visionRfb320Result);        // [Model] 얼굴 좌표값 모델 수행
                    // 
                    if (pfldArr.length > 0) {
                        const irisJsonArr = await estimateIrisLandmarkModel(_imageToTensor, pfldArr);   // [Model] 얼굴 랜드마크 모델 수행
                        // const irisJsonArr = { "leftIrisArr": [34.81892013549805, 34.393226623535156, -4.061603546142578, 40.069766998291016, 33.682064056396484, -4.119124412536621, 33.99586868286133, 29.492755889892578, -4.129571437835693, 29.435707092285156, 35.164794921875, -4.007841110229492, 35.63016891479492, 39.16047286987305, -4.06866979598999], "rightIrisArr": [34.81892013549805, 34.393226623535156, -4.061603546142578, 40.069766998291016, 33.682064056396484, -4.119124412536621, 33.99586868286133, 29.492755889892578, -4.129571437835693, 29.435707092285156, 35.164794921875, -4.007841110229492, 35.63016891479492, 39.16047286987305, -4.06866979598999] }

                        // [STEP3] 홍채를 감지하는 경우 
                        if (irisJsonArr) {
                            setIsFaceDtctYn(true);
                            const resultFsanet = await fsanetEstimate(_imageToTensor, visionRfb320Result);  // [Model] 얼굴 랜드마크 모델 수행
                            // const resultFsanet = [26.119766235351562, -27.402212142944336, -2.7349319458007812]

                            _resultHsemotion = await hsemotionEstimate(_imageToTensor, visionRfb320Result); // [Model] 얼굴 랜드마크 모델 수행
                            // _resultHsemotion = { "arousalArr": [0.15133555233478546], "emotionCode": "SUP", "valenceArr": [-0.04291853681206703] }

                            const gazeResult = tf.tidy(() => setLandmarkData(pfldArr, irisJsonArr));
                            // const _gazeEstimateResult = { "ear": 0.4030975866672722, "iris_radius": 3.075392723083496, "left_phi": -0.25268025514207865, "left_theta": -0.25268025514207865 }

                            const { left_theta, left_phi, ear, iris_radius } = gazeResult;
                            if (left_theta && left_phi && ear && iris_radius) {
                                configArr = [visionRfb320Result[0][4], resultFsanet[0], resultFsanet[1], resultFsanet[2], left_theta, left_phi, ear, iris_radius];
                            }
                        }
                    }
                } else {
                    setIsFaceDtctYn(false);
                }

                let elapsedTime = Date.now() - loopStartTimeRef.current;    // 경과 시간
                console.log(`종료 시간 - 시작 시간: ${elapsedTime}`);

                // [STPE5] LOOP_INTERVAL 기준보다 덜 된 경우 Sleep으로 속도를 늦춥니다.
                if (elapsedTime <= LOOP_INTERVAL) {
                    const remainTime = LOOP_INTERVAL - elapsedTime;         // 남은 시간
                    await commonHandler.sleep(remainTime);               // 누락된 시간만큼 잠시 대기합니다.
                    elapsedTime += remainTime;
                }

                // [STEP6] 값을 전달하여 루프당 각각의 값을 누적합니다.
                await calcHandler.calcLoopSum(_strtTs, accLoopCntRef.current, elapsedTime, _accFaceDetectCnt, _resultHsemotion, configArr)


                console.log(`2. 루프 종료 시점에 메모리에 있는 텐서 수  ${tf.tidy(() => tf.memory().numTensors)}`)
                // [STEP7] 누적된 루프와 제한된 갯수가 같은 경우 초기화를 수행합니다.
                if (accLoopCntRef.current === LOOP_LIMIT_CNT + 1) accLoopCntRef.current = 0;
                loopStartTimeRef.current = 0;


            }
        } catch (error) {
            console.log("error : ", error)
        } finally {
            if (_orgImageTensor) tf.dispose(_orgImageTensor);
            if (_imageToTensor) tf.dispose(_imageToTensor);
            tf.engine().endScope();
            const convertEnd = performance.now();
            console.log(`📸 최종 처리 시간: ${(convertEnd - convertStart).toFixed(2)}ms`);
            isProcessingRef.current = false;
        }

    }, []);

    const visionCameraHandler = (() => {
        return {
            /**
             * react-native-worklets-core와 JS를 연결하는 함수 
             */
            runOnJSFrame: useRunOnJS(onFrameData, [onFrameData]),

            /**
             * frame 단위로 전달받아서 resize를 수행하는 함수
             */

            frameProcessor: useFrameProcessor((frame) => {
                'worklet';
                runAtTargetFps(TARGET_FPS, () => {
                    'worklet';

                    const resized = resize(frame, {
                        scale: { width: RESIZE_WIDTH, height: RESIZE_HEIGHT },
                        pixelFormat: 'rgb',
                        dataType: 'uint8',
                    }) as Uint8Array;

                    const resizedArray = Array.from(resized); // ✅ 일반 배열로 변환
                    // JS로 전달
                    visionCameraHandler.runOnJSFrame(resizedArray);
                });
            }, []),

            /**
             * 이미지를 정방향으로 회전함.
             * @param tensor 
             * @returns 
             */
            rotate90Clockwise: (tensor: Tensor3D): Tensor3D => {

                const result = tf.tidy(() => {
                    return tf.reverse(tf.transpose(tensor, [1, 0, 2]), [0]); // ↘️ 시계방향
                })
                return result;
            }
        }
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
                            if (isActiveStopwatch) stopwatchHandler.pause(); // 스탑워치가 실행중인 경우만 이를 멈춥니다.
                            break;

                        case 'inactive':
                            if (isActiveStopwatch) stopwatchHandler.pause(); // 스탑워치를 멈춥니다.
                            if (Platform.OS === 'ios') preAppState.current = 'inactive'; // iOS의 작업창을 내린 경우 이를 수행
                            break;

                        // [CASE1-2] 앱 상태가 "active" 상태인 경우: stopwatch를 재개 합니다.
                        case 'active':
                            switch (Platform.OS) {
                                case 'android':
                                    stopwatchHandler.start(); // 무조껀 실행이 된다.
                                    break;

                                case 'ios':
                                    // 이전에 inactive가 실행되고 스탑워치가 수행된 경우 : 스탑워치를 실행합니다.
                                    if (preAppState.current === 'inactive' && isActiveStopwatch) {
                                        stopwatchHandler.start();
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
                        stopwatchHandler.pause();
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

            cvtTensorImgToBase64: (tensorImage: Tensor3D): string => {
                const flippedTensor = tf.tidy(() => tf.reverse(tensorImage, [1])); // 좌우 반전
                const [height, width] = flippedTensor.shape;

                // uint8 데이터 추출 (RGB 순서)
                const rgbData = flippedTensor.dataSync(); // Flat Uint8Array [R, G, B, R, G, B, ...]


                // RGBA 버퍼 생성
                const rgbaData = new Uint8Array(width * height * 4);
                for (let i = 0, j = 0; i < rgbData.length; i += 3, j += 4) {
                    rgbaData[j] = rgbData[i];     // R
                    rgbaData[j + 1] = rgbData[i + 1]; // G
                    rgbaData[j + 2] = rgbData[i + 2]; // B
                    rgbaData[j + 3] = 255;        // A (불투명)
                }

                const rawImageData = { data: rgbaData, width, height };
                const jpegImageData = jpeg.encode(rawImageData, 100);

                tf.dispose([flippedTensor, rgbData])
                const base64 = Buffer.from(jpegImageData.data).toString('base64');
                return `data:image/jpeg;base64,${base64}`;
            },
        }
    })();


    const calcHandler = (() => {
        return {

            /**
             * 루프를 수행하면서 합계 계산을 수행하는 함수
             *
             * @param {date} strtTs                                     : 시작시간
             * @param {number} accLoopCnt                               : 루프의 수행 횟수를 계산하기 위해 사용합니다.
             * @param {number} loopTime                                 : 루프의 수행 시간을 계산하기 위해 사용합니다.
             * @param {number} isFaceDectionCnt                         : 얼굴이 측정된 횟수
             * @param {StudyType.ResultHsemotion} resultHsEmotion       : HSEmotion 처리 결과
             * @param {tf.Tensor3D} tensorImage                         : TensorCamera로 부터 처리된 데이터
             * @param {number[]} configArr                              : FSA-NET, Gaze에서 처리된 Tensor 데이터
             */
            calcLoopSum: async (strtTs: number, accLoopCnt: number, loopTime: number, isFaceDectionCnt: number, resultHsEmotion: StudyType.ResultHsemotion, configArr: number[]) => {
                /**
                 * [CASE1-1] 최종 카운트가 10보다 작은 경우
                 */
                if (accLoopCnt <= LOOP_LIMIT_CNT) {
                    console.log(" =================================== 파라미터로 들어온 값 =====================/*  */======================================");
                    console.log("doSq :: ", doSq)
                    console.log("strtTs :: ", new Date(Number(strtTs)))
                    console.log("accLoopCnt :: ", accLoopCnt)
                    console.log("per Loof Time :: ", loopTime)
                    console.log("isFaceDetctionCnt :: ", isFaceDectionCnt)
                    console.log("resultHsEmotion :: ", resultHsEmotion)
                    console.log(" ===========================================================================================================");

                    // [STEP2] 연산된 Hsemotion 정보를 가져옵니다.
                    const {
                        arousalArr: _resultArousal,
                        emotionCode: _resultEmotionCode,
                        valenceArr: _resultValence,
                    } = resultHsEmotion;

                    const { calcArrItemDigit, calcEmtnCd } = calcHandler;
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
                } else {
                    /**
                     * [CASE1-2] 최종 카운트 값이 10인 경우 : 테이블 INSERT 수행
                     */
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
                    // console.log("얼굴이 없을때는??? : ", msrdSecs)
                    // console.log("루프의 시작 시간 :: ", calcHandler.convertDateNowToHMS(strtTs))
                    // console.log("루프의 종료 시간 :: ", calcHandler.convertDateNowToHMS(Date.now()))
                    // console.log("루프의 종료 - 시작 수행된 시간 :: ", msrdSecs);

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
                    console.log("****************************************************************************************************************")

                    /**
                     * [STEP3] State 내에 가져온 값을 각각에 맞는 평균치로 계산합니다.
                     */
                    // 평균 점수 계산함수 수행
                    const _stress = CalcStudyModule.calcAverageStress(strssArr, LOOP_LIMIT_CNT); // 스트레스 평균
                    const _valence = CalcStudyModule.calcAverageFloat(valenceArr, LOOP_LIMIT_CNT); // valence 평균
                    const _arousal = CalcStudyModule.calcAverageFloat(arousalArr, LOOP_LIMIT_CNT); // arousal 평균
                    const _isFaceDtct = CalcStudyModule.calcAverageIsFaceDtct(isFaceDtctArr); // faceDtct 평균

                    // [STEP4] Best Code 정보 출력 함수 수행
                    const _exprCd = CalcStudyModule.calcBestCode(CODE_GRP_CD.ExpressionCode, exprCdArr); // 제일 최고의 표현코드를 반환합니다.
                    const _emtnCd = CalcStudyModule.calcBestCode(CODE_GRP_CD.EmotionalCode, emtnCdArr); // 제일 최고의 감정코드를 반환합니다.

                    const { hPoseEstimate } = OnnxModules;

                    // [STEP5] 집중력을 추정하여 텐서값으로 반환합니다.
                    const resultConcent = calcHandler.concentrationEstimate(tensorResultArr.slice(-10));
                    /**
                     * [STEP6] 집중력을 추정합니다 : 얼굴을 하나도 인식하지 못한경우에 hPose를 수행하지 않음
                     */
                    let _atntn = 0;
                    if (isFaceDtctArr.includes(1)) {
                        const resultContentData = resultConcent.dataSync();
                        const data1 = new Float32Array(resultContentData); // 복사
                        const _atntn = await hPoseEstimate(data1);
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




                    // [STEP9] 최종 측정한 초

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
                        strtTs: new Date(Number(strtTs)).toString(), // [시작 타임스탬프] 루프 시작시간
                        endTs: new Date(Number(Date.now())).toString(), // [종료 타임스탬프] 루프 종료시간
                        msrdSecs: msrdSecs, // [루프수행시간] 시작 시간에서 종료 시점의 '초'를 넣습니다.
                        regTs: new Date(Number(Date.now())).toString(), // [등록 타임스탬프] INSERT 시점 시간
                    };

                    console.log("최종 결과 :: ", result);

                    // TODO: 해당 부분 구현되어어야 함
                    // [STEP10] [SQlite] 구성한 데이터를 내부 데이터베이스(SQLite)내에 저장합니다.
                    // await TbStdyDoDtlModules.insertRowData(result);

                    /**
                     * [STEP11] State의 누적된 학습 상세 정보를 초기화합니다.
                     */
                    resetHandler.cleanUpAccStdInfo();
                    // console.log(`3. 루프 종료 시점에 메모리에 있는 텐서 수  ${tf.tidy(() => tf.memory().numTensors)}`)
                    // console.log("⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️ 최종 연산 수행시간 : ", msrdSecs, "초 ⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️⭐️")
                }
            },

            /**
             * arousal, valence 값을 추출합니다.
             * @param paramArr
             * @param digit
             */
            calcArrItemDigit: (paramArr: number[] | Float32Array, digit: number): number => {
                return paramArr.length > 0 ? parseFloat(paramArr[0].toFixed(digit)) : 0;
            },


            /**
             * 계산을 통해 정서코드를 반환합니다.
             * @param arousal
             * @param valence
             * @returns {string} 정서코드를 반환합니다.
             */
            calcEmtnCd: (arousal: number, valence: number): string => {
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
            },

            /**
             * 합계의 값을 기반으로 집중력을 측정합니다
             * @param tensorResultArr
             */
            concentrationEstimate: (tensorResultArr: number[]) => {
                const result = tf.tidy(() => {
                    const tensorResult = tf.tensor(tensorResultArr);
                    // const tensorStack = tf.stack(tensorResult);
                    return tf.expandDims(tensorResult, 0);
                });
                return result;
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
                // if (initModel.fsanetModel) initModel.fsanetModel.release();
                // if (initModel.hPoseModel) initModel.hPoseModel.release();
                // if (initModel.hsemotionModel) initModel.hsemotionModel.release();
                resetHandler.cleanUpAccStdInfo(); // 누적된 배열들을 초기화합니다.

                // setInitModel({
                //     isLoading: false,
                //     isTensorReady: false,
                //     faceMeshModel: null,
                //     fsanetModel: null,
                //     hPoseModel: null,
                //     hsemotionModel: null,
                // });
                setIsActiveStopwatch(false);
                setIsFaceDtctYn(false);
            },

        };
    })();
    /**
     * ==============================================================================================================================
     * 공부 상세보기 Handler
     * ==============================================================================================================================
     */
    const studyDtlHandler = (() => {
        return {
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
                    await deleteStudyDoDtl(doSq); // 5. [SQLite] SQLITE 내에 DTL 테이블 데이터 초기화
                }
                await TbStdyDoDtlModules.selectStdyDoDtlList(doSq); // 완전 삭제가 되었는지 보자.
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

                    // await studyDtlHandler.finalStdyEnd();           // 학습 종료 비즈니스 로직 처리를 수행합니다.
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
                    setIsCameraOn(true);
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
        };
    })();
    /**
     *  ==============================================================================================================================
     * [Stopwatch] 스탑워치의 기능들을 관리합니다.(startStop, reset, formatTime)
     *  ==============================================================================================================================
     * @returns {}
     */
    const stopwatchHandler = (() => {
        return {
            /**
             * 학습 시작
             * @return {void} 별도 반환 없음
             */
            start: _.debounce(
                async () => {
                    if (btnDisable.start) return; // 버튼 중복 수행 방지
                    setBtnDisable({ ...btnDisable, start: true }); // 버튼 상태를 막음
                    setIsActiveStopwatch(true);

                    // [CASE1] 일반 시작.
                    if (stopwatchRef.current) stopwatchRef.current.start();

                    // Pomodoro Timer 시작
                    toggleTimer();

                    // 아이폰에서 재시작을 하는 경우
                    // if(stopwatchRef.current && isRestart && Platform.OS === "ios"){
                    //     stopwatchRef.current.pause();
                    // }

                    // if (stopwatchRef.current && !isRestart) stopwatchRef.current.start();   // 스탑워치 컴포넌트 함수 호출
                    // // [CASE2] 재시작을 하는 경우
                    // else if (stopwatchRef.current && isRestart) {
                    //     console.log("[+] 리스타트 경우 :: ")
                    //     // stopwatchRef.current.restart();
                    // }

                    setBtnDisable({ ...btnDisable, start: false }); // 버튼 상태를 열어줌
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
                    setIsFaceDtctYn(false); // 얼굴 탐지여부를 원복
                    setIsCameraViewOn(false); // 일시 정지했을때, 카메라 모드를 종료
                    setIsActiveStopwatch(false); // 스탑워치 활성화 여부 (비 활성화) : TensorCamera가 꺼짐
                    setIsRestart(true); // 재시작 여부를 true로 변경
                    if (stopwatchRef.current) stopwatchRef.current.pause(); // 스탑워치 컴포넌트 함수 호출

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
                    stopwatchHandler.stop(); // 학습 종료
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

                studyEndPopupHandler.open(); // 학습 종료 팝업을 띄어줍니다.
            },
        };
    })();


    if (device == null || !hasPermission) {
        return <Text>카메라 로딩 중...</Text>;
    }


    return (
        <SafeAreaView style={styles.main}>
            <StatusBar backgroundColor='#17191c' />
            <ScrollView scrollEnabled={false}>
                <View style={styles.container}>
                    {/* ==================================================== 카메라 출력 영역 ==================================================== */}
                    {
                        initModel.visionRfb320OnnxModel &&
                            initModel.pfldOnnxModel &&
                            initModel.irisLandmarkOnnxModel &&
                            initModel.isTensorReady &&
                            initModel.hsemotionModel &&
                            initModel.fsanetModel &&
                            initModel.hPoseModel ? (
                            isActiveStopwatch && (
                                <View style={Platform.OS === 'ios' && isCameraViewOn && [{ transform: [{ scaleX: -1 }] }]}>

                                    <Camera
                                        ref={cameraRef}
                                        device={device}
                                        style={[isCameraViewOn ? styles.cameraOnView : styles.camera]}
                                        isActive={isCameraActive}
                                        frameProcessor={visionCameraHandler.frameProcessor}
                                        enableFpsGraph={true}
                                    />
                                </View>
                            )
                        ) : (
                            <View style={styles.modelLoadFrame}>
                                <ProgressBar text='인공지능 모델을 불러오는 중입니다...완료되면 자동으로 타이머가 진행됩니다.' />
                            </View>
                        )}

                    {initModel.visionRfb320OnnxModel &&
                        initModel.pfldOnnxModel &&
                        initModel.irisLandmarkOnnxModel &&
                        initModel.isTensorReady &&
                        initModel.hsemotionModel &&
                        initModel.fsanetModel &&
                        initModel.hPoseModel &&
                        isActiveStopwatch && (
                            <>
                                <View
                                    style={{
                                        marginTop: 48,
                                        alignItems: 'center',
                                        flexDirection: 'column',
                                        marginBottom: 72,
                                    }}>
                                    <View
                                        style={{
                                            width: 93,
                                            height: 93,
                                            borderStyle: 'solid',
                                            borderWidth: 1,
                                            borderRadius: 51,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 16,
                                            backgroundColor: '#212429',
                                            borderColor: '#2E3138',
                                        }}>
                                        <Image
                                            style={{
                                                width: 60,
                                                height: 60,
                                            }}
                                            source={require('../../../assets/images/icons/ic_l_book_40-1.png')}
                                            resizeMode='contain'
                                        />
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text
                                            style={{
                                                fontSize: 32,
                                                fontWeight: '700',
                                                fontFamily: 'NanumBarunGothic',
                                                color: '#f0f1f2',
                                            }}>
                                            {studySubjectInfo.sbjtNm}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => {
                                                stopwatchHandler.pause();
                                                setIsShowStudySubject(true);
                                            }}>
                                            <Image
                                                style={{
                                                    marginLeft: 12,
                                                    width: 40,
                                                    height: 40,
                                                }}
                                                source={require('../../../assets/images/icons/ic_l_replace.png')}
                                                resizeMode='contain'
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={[styles.pomodoroContainer]}>
                                    <View style={styles.pomodoroSvgContainer}>
                                        <Svg height='300' width='300' viewBox='0 0 100 100'>
                                            <Circle cx='50' cy='50' r='45' stroke='#2C2B2B' strokeWidth='10' fill='none' />
                                            {timeLeft > 0 && (
                                                <Circle
                                                    cx='50'
                                                    cy='50'
                                                    r='45'
                                                    stroke='#8390A3'
                                                    strokeWidth='10'
                                                    fill='none'
                                                    strokeDasharray={Math.PI * 2 * 45} // 원주 길이
                                                    strokeDashoffset={Math.PI * 2 * 45 * (1 - timeLeft / totalTime)} // 진행률 반영
                                                />
                                            )}
                                            {timeLeft <= 0 && (
                                                <Circle
                                                    cx='50'
                                                    cy='50'
                                                    r='45'
                                                    stroke='tomato'
                                                    strokeWidth='10'
                                                    fill='none'
                                                    strokeDasharray={Math.PI * 2 * 45} // 원주 길이
                                                    strokeDashoffset={Math.PI * 2 * 45 * (1 - timeLeft / totalTime)} // 반시계 방향 진행
                                                    transform='rotate(360, 50, 50)' // 반시계 방향으로 회전
                                                />
                                            )}
                                        </Svg>
                                        <View style={styles.centralContent}>
                                            <Text style={styles.pomodoroTimer}>{formatTime(timeLeft)}</Text>
                                        </View>
                                    </View>
                                    {showTimeButtons && (
                                        <View style={styles.pomodoroTimeSelectionContainer}>
                                            {[1, 5, 10, 30].map((time) => (
                                                <TouchableOpacity key={time} style={styles.pomodoroTimeButton} onPress={() => setTimerTime(time)}>
                                                    <Text style={styles.pomodoroTimeButtonText}>{time}분</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                <View
                                    style={{
                                        marginTop: 152,
                                        marginHorizontal: 56,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        flexDirection: 'row',
                                    }}>
                                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                                        <TouchableOpacity onPress={() => handleConfirmExit('change')} style={{ alignItems: 'center' }}>
                                            <View
                                                style={{
                                                    width: 93,
                                                    height: 93,
                                                    borderStyle: 'solid',
                                                    borderWidth: 1,
                                                    borderRadius: 51,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginBottom: 8,
                                                }}>
                                                <Image
                                                    style={{
                                                        width: 80,
                                                        height: 80,
                                                    }}
                                                    source={require('../../../assets/images/icons/ic_l_change.png')}
                                                    resizeMode='contain'
                                                />
                                            </View>
                                            <Text
                                                style={{
                                                    fontSize: 24,
                                                    fontWeight: '700',
                                                    color: '#fff',
                                                    textAlign: 'center',
                                                }}>
                                                자리 이동
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={{ flexDirection: 'column', alignItems: 'center', marginLeft: '45%' }}>
                                        <TouchableOpacity onPress={() => handleConfirmExit('exit')} style={{ alignItems: 'center' }}>
                                            <View
                                                style={{
                                                    width: 93,
                                                    height: 93,
                                                    borderStyle: 'solid',
                                                    borderWidth: 1,
                                                    borderRadius: 51,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    marginBottom: 8,
                                                }}>
                                                <Image
                                                    style={{
                                                        width: 80,
                                                        height: 80,
                                                    }}
                                                    source={require('../../../assets/images/icons/ic_l_out.png')}
                                                    resizeMode='contain'
                                                />
                                            </View>
                                            <Text
                                                style={{
                                                    fontSize: 24,
                                                    fontWeight: '700',
                                                    color: '#fff',
                                                    textAlign: 'center',
                                                }}>
                                                퇴실
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        )}
                </View>
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
                            <Text style={styles.title1}>‘터그보트’ 이용을 위해</Text>
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
            {/* ============================================= 공부 종료 팝업 영역 ================================================== */}
            <Modal animationType='fade' transparent={true} visible={modalType !== null}>
                <View style={styles.overlay}>
                    <View style={styles.endModalContainer}>
                        <Text style={styles.title}>{modalType === 'exit' ? '오늘 공부가 끝났나요?' : '자리 이동 하시나요?'}</Text>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => {
                                    resetTimer(modalType === 'exit');
                                }}>
                                <Text style={styles.buttonText}>네</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button} onPress={toggleTimer}>
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
                                    stopwatchHandler.start();
                                    setIsShowStudySubject(false);
                                }}
                                style={styles.closeButton2}>
                                <Image
                                    source={require('../../../assets/images/icons/ic_l_close_gray_28.png')}
                                    resizeMode='cover'
                                    style={{ width: 32, height: 32 }}
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
                                                    <TouchableOpacity
                                                        key={`plus-${index}`}
                                                        onPress={() => {
                                                            const msg = STUDY_MESSAGES[Math.floor(Math.random() * STUDY_MESSAGES.length)];

                                                            handleStudySubject.selectedStudySubject('', msg);
                                                        }}
                                                        style={styles.plusButton}>
                                                        <Text style={styles.plusText}>{item.sbjtNm}</Text>
                                                    </TouchableOpacity>
                                                );
                                            }

                                            return (
                                                <TouchableOpacity
                                                    key={index}
                                                    onPress={() => {
                                                        handleStudySubject.selectedStudySubject(item.sbjtCd, item.sbjtNm!);
                                                    }}
                                                    style={[styles.subjectButton2, isSelected && styles.subjectButtonSelected]}>
                                                    <Text style={[styles.subjectText2, isSelected && styles.subjectTextSelected]}>{item.sbjtNm}</Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
export default VisionCameraResizeScreen;