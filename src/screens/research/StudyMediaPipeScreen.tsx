import { FaceDetetorType } from "../../types/FaceDetetorType";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity, AppStateStatus } from "react-native";
import modelManager from "../../interceptor/ModelManager";

import { decodeJpeg } from '@tensorflow/tfjs-react-native'
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
} from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import { InferenceSession, Tensor as OnnxTensor } from "onnxruntime-react-native";
import { StudyType } from "@/types/StudyType";
import CalcStudyModule from "@/modules/calcStudy/CalcStudyModule";
import { NetInfoSubscription } from "@react-native-community/netinfo";
import { setLandmarkData } from "@/modules/fsanet/GazeModule";
import { AnnotatedPrediction, EstimateFacesConfig } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";



import * as jpeg from "jpeg-js";
import { Rank, Tensor, Tensor3D, Tensor4D, TensorContainer } from "@tensorflow/tfjs-core";
import { CODE_GRP_CD } from "@/common/utils/codes/CommonCode";


import '@tensorflow/tfjs-react-native';

const tf = modelManager.tf;


const LOOP_TIME = 100;
const LOOP_LIMIT_CNT = 10; // 학습 수행중 루프당 합계를 내기 위한 횟수
const LOOP_INTERVAL = 1; // 학습 루프 시간

const StudyMediaPipeScreen = () => {

    const [doSq, setDoSq] = useState<number>(0); // 학습 실행 시퀀스
    const device = useCameraDevice('front');
    const cameraRef = useRef<Camera>(null);
    const { hasPermission, requestPermission } = useCameraPermission();
    const loopStartSecRef = useRef<number>();           // 루프 시작 시간(초)
    const loopStartTimeRef = useRef<number>(0);         // 루프 시작 시간
    const inConnectNetworkRef = useRef<boolean>(true);  // 네트워크의 연결 여부를 체크합니다.
    const [previewBase64Image, setPreviewBase64Image] = useState<string | null>(null);
    let [accAtntn] = useState<number[]>([]);


    const [imageUri, setImageUri] = useState<string | null>(null);
    const [cameraOn, setCameraOn] = useState<boolean>(true); // 자동 캡처 여부

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



    const [isFaceDtctYn, setIsFaceDtctYn] = useState<boolean>(false);               // 얼굴 탐지여부에 따라 다른 불(파란색/노란색)을 켜줍니다.

    useEffect(() => {
        console.log("너의 이름은 ", tf.getBackend())
        requestPermission();

    }, []);

    useEffect(() => {
        let stopped = false;

        const loop = async () => {
            if (stopped) return;
            await handleCapture();
            setTimeout(loop, LOOP_TIME);
        };

        if (cameraOn) loop();

        return () => {
            stopped = true;
        };
    }, [cameraOn]);


    /**
     * 일정 시간마다 Snapshot을 찍어서 반환해주는 함수 
     * @returns 
     */
    const handleCapture = async (): Promise<void> => {

        if (!cameraRef.current) return;
        let _accTotalLoopCnt = 0;               // 루프의 총 개수
        let _accLoopCnt = 0;                    // 60회에 따른 루프 개수
        let _timerId: NodeJS.Timeout; // setTimer 시간 관리
        let _strtTs: number; // 학습 시작 시간

        loopStartTimeRef.current = Date.now();

        const startTime = performance.now(); // ⏱ 시작 시간

        try {




            console.log(`1. 루프 시작 시점에 메모리에 있는 텐서 수  ${tf.tidy(() => tf.memory().numTensors)}`);
            loopStartTimeRef.current = Date.now();

            // [STEP1] 네트워크 연결이 되지 않았을 경우 멈춥니다.
            if (!inConnectNetworkRef.current) return;

            // [STEP1] 전체에서 누적 및 갱신 할 변수값들을 관리합니다.
            _accTotalLoopCnt++; // 학습을 수행시작 한 이후 전체 루프 누적 횟수
            _accLoopCnt++; // 학습의 LIMIT 값에 따른 루프 누적 횟수
            _strtTs = Date.now();
            // 루프 시작시 DB 시간시간 저장
            if (_accLoopCnt === 1) {
                loopStartSecRef.current = Math.round((Date.now() - startTime) / 1000); // stopwatchRef.current?.getNowSec();           // 루프 시작 초
            }


            const SNAPSHOT_QUALITY_MODE = {
                HIGH: {
                    label: "고화질",
                    value: 100,
                    estimatedSize: "300KB+",
                    description: "가장 선명한 화질, 파일 크기 큼. 정확도 우선일 때 사용",
                },
                NORMAL: {
                    label: "일반",
                    value: 85,
                    estimatedSize: "200KB",
                    description: "기본 권장 품질, 속도와 화질 균형",
                },
                SMALL: {
                    label: "저화질",
                    value: 50,
                    estimatedSize: "100KB",
                    description: "속도 개선에 유리, 약간의 화질 손실",
                },
                VSMALL: {
                    label: "매우 저화질",
                    value: 30,
                    estimatedSize: "50KB 이하",
                    description: "최대 속도, 정확도 손실 가능. 저사양 디바이스에 적합",
                },
            } as const;



            /**
             * quality : 30 -> 4.5, 3.4, 4.8, 4.6
             * quality : 85 -> 4.0
             */
            const snapshot = await cameraRef.current.takeSnapshot({ quality: SNAPSHOT_QUALITY_MODE.VSMALL.value, });
            setImageUri(snapshot.path); // TODO: 삭제 예정
            const resizeHeight = 320
            const resizeWidth = 292;

            const convertStart = performance.now();
            const base64Data = await RNFS.readFile(snapshot.path, 'base64');

            await RNFS.unlink(snapshot.path);           // 임시 저장 파일 파일 삭제
            const imageBuffer = new Uint8Array(tf.util.encodeString(base64Data, 'base64').buffer);

            const _imageToTensor = tf.tidy(() => {
                const decoded = decodeJpeg(imageBuffer);
                return tf.image.resizeBilinear(decoded, [resizeHeight, resizeWidth]);
            });

            const convertEnd = performance.now();
            console.log(`📸 base64 to Tensor 변환 시간: ${(convertEnd - convertStart).toFixed(2)}ms`);


            if (!_imageToTensor) return;
            else {
                // [STESP3] 얼굴이 측정되거나 안되거나 하는 경우에 대해 함께 사용하는 변수 선언
                let _accFaceDetectCnt: number = 0;                                                                      // 얼굴이 측정된 누적 횟수
                let _resultHsemotion: StudyType.ResultHsemotion = { arousalArr: [], valenceArr: [], emotionCode: "" };  // HSEmotion 코드
                let configArr: number[] = [];                                                                           // 최종 연산 결과값을 구성한 배열

                const { estimateMediaPipeFaceMesh, fsanetEstimate, hsemotionEstimate } = modelCalcHandler;

                let _estimateArr: AnnotatedPrediction[] = await estimateMediaPipeFaceMesh(_imageToTensor);
                // console.log(_estimateArr)

                // const _estimateArr = [{ "annotations": { "leftCheek": [Array], "leftEyeIris": [Array], "leftEyeLower0": [Array], "leftEyeLower1": [Array], "leftEyeLower2": [Array], "leftEyeLower3": [Array], "leftEyeUpper0": [Array], "leftEyeUpper1": [Array], "leftEyeUpper2": [Array], "leftEyebrowLower": [Array], "leftEyebrowUpper": [Array], "lipsLowerInner": [Array], "lipsLowerOuter": [Array], "lipsUpperInner": [Array], "lipsUpperOuter": [Array], "midwayBetweenEyes": [Array], "noseBottom": [Array], "noseLeftCorner": [Array], "noseRightCorner": [Array], "noseTip": [Array], "rightCheek": [Array], "rightEyeIris": [Array], "rightEyeLower0": [Array], "rightEyeLower1": [Array], "rightEyeLower2": [Array], "rightEyeLower3": [Array], "rightEyeUpper0": [Array], "rightEyeUpper1": [Array], "rightEyeUpper2": [Array], "rightEyebrowLower": [Array], "rightEyebrowUpper": [Array], "silhouette": [Array] }, "boundingBox": { "bottomRight": [Array], "topLeft": [Array] }, "faceInViewConfidence": 1, "kind": "MediaPipePredictionValues", "mesh": [[Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array]], "scaledMesh": [[Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array], [Array]] }]

                // [STEP4-1] 측정된 사람이 있는 경우 : 데이터 처리를 수행합니다.
                if (_estimateArr.length > 0 && parseFloat(_estimateArr[0].faceInViewConfidence.toFixed(1)) >= 0.5) {
                    _accFaceDetectCnt += 1; // 얼굴이 측정된 누적 횟수를 Counting

                    // [STEP5] 얼굴이 정확한 위치인지 체크합니다. : 0.5 이상 true 이하는 false
                    setIsFaceDtctYn(true);

                    // [STEP6] 측정된 값을 기반으로 'FSA-NET' 모델을 수행하여 값을 반환받습니다.
                    const resultFsanet = await fsanetEstimate(_imageToTensor, _estimateArr,);

                    // [STEP7] 측정된 값을 기반으로 'HSEmotion' 모델을 수행하여 값을 반환받습니다.
                    _resultHsemotion = await hsemotionEstimate(_imageToTensor, _estimateArr);

                    // [STEP8] 시선 처리 데이터 추출
                    const _gazeEstimateResult = tf.tidy(() => setLandmarkData(_estimateArr));

                    // [STEP9] 측정된 데이터를 배열로 구성하며 최종 Tensor로 구성합니다.
                    const { left_theta, left_phi, ear, iris_radius } = _gazeEstimateResult;

                    console.log('[+][+][+][+][+][+][+][+] 얼굴이 탐지되었습니다!!!![+][+][+][+][+][+][+][+][+][+]');
                    // [faceInViewConfidence, yaw, pitch, roll, theta, phi, EAR, iris_radius]
                    configArr = [
                        _estimateArr[0].faceInViewConfidence,
                        resultFsanet[0],
                        resultFsanet[1],
                        resultFsanet[2],
                        left_theta,
                        left_phi,
                        ear,
                        iris_radius,
                    ];



                    console.log("최종 결과 :: ", configArr)

                }
                // [STEP4-2] 측정된 사람이 없는 경우 : 데이터 처리를 수행합니다.
                else {
                    // [STEP5] NaN 형태로 구성된 배열로 구성하며 최종 Tensor로 구성합니다.
                    configArr = Array(8).fill(NaN);
                    setIsFaceDtctYn(false);
                }

                // cleanup - _estimateArr
                resetHandler.faceMeshCleanupPrediction(_estimateArr);

                let elapsedTime = Date.now() - loopStartTimeRef.current; // 경과 시간
                console.log(`종료 시간 - 시작 시간: ${elapsedTime}`);

                // [STPE5] LOOP_INTERVAL 기준보다 덜 된 경우 Sleep으로 속도를 늦춥니다.
                if (elapsedTime <= LOOP_INTERVAL) {
                    const remainTime = LOOP_INTERVAL - elapsedTime; // 남은 시간
                    await commonHandler.sleep(remainTime); // 누락된 시간만큼 잠시 대기합니다.
                    elapsedTime += remainTime;
                }

                // // [STEP6] 값을 전달하여 루프당 각각의 값을 누적합니다.
                calcHandler.calcLoopSum(
                    _strtTs,
                    _accLoopCnt,
                    elapsedTime,
                    _accFaceDetectCnt,
                    _resultHsemotion,
                    _imageToTensor,
                    configArr,
                );
                tf.dispose(_imageToTensor);

                // [STEP7] 누적된 루프와 제한된 갯수가 같은 경우 초기화를 수행합니다.
                if (_accLoopCnt === LOOP_LIMIT_CNT + 1) _accLoopCnt = 0;
                // console.log("===============================================================")
            }

            const endTime = performance.now(); // ⏱ 종료 시간
            const duration = (endTime - startTime).toFixed(2);
            console.log(`⏱ handleCapture 실행 시간: ${duration}ms`);


            // console.log("📸 캡처 결과 Tensor:", resizedTensor.shape);
        } catch (err) {
            console.error("❌ 캡처 중 오류:", err);

        }
    }


    /**
     * 모델 연산 관리 
     */
    const modelCalcHandler = (() => {
        return {

            /**
             * FaceMesh 모델을 기반으로 얼굴 측정값을 계산하여 반환합니다.
             *
             * [STEP1] TensorImage를 전달 받고 모델이 준비 된 경우 수행합니다.
             * [STEP2] Face Landmark(FaceMesh)에 대한 객체를 구성
             * [STEP3] 객체를 전달하여 모델로 Face Landmark(FaceMesh) 모델을 수행합니다.
             * @param {tf.Tensor3D} imageTensor 텐서 카메라에서 전달 받은 이미지
             * @returns {Promise<AnnotatedPrediction[]>}
             */
            estimateMediaPipeFaceMesh: async (imageTensor: Tensor3D): Promise<AnnotatedPrediction[]> => {
                console.log("[+] estimateMediaPipeFaceMesh");

                const mediaPipeFaceMeshModel = modelManager.getMediaPipeFaceMesh;
                let _resultList: AnnotatedPrediction[] = [];

                try {
                    if (imageTensor && mediaPipeFaceMeshModel !== null) {
                        const _estimateConfig: EstimateFacesConfig = {
                            input: imageTensor,
                            returnTensors: false,
                            flipHorizontal: false,
                            predictIrises: true,
                        };

                        // ✅ 시간 측정 시작
                        const startTime = performance.now();

                        await mediaPipeFaceMeshModel.estimateFaces(_estimateConfig)
                            .then((_resultPredctionArr: AnnotatedPrediction[]) => {
                                _resultList = _resultPredctionArr;
                                _resultPredctionArr = [];
                            })
                            .catch((err) => console.error(`[-] modelCalcHandler.estimateFaceMesh Error ${err}`));

                        const endTime = performance.now(); // ✅ 시간 측정 끝
                        console.log(`🕒 FaceMesh 추론 시간: ${(endTime - startTime).toFixed(2)}ms`);
                    }
                } catch (error) {
                    console.log('[-] estimateFaceMesh :: ', error);
                }

                return _resultList;
            },
            /**
             * 얼굴 탐지 수행 
             * @param _imageToTensor 
             * @returns Promise<number[][]>
             */
            estimateFaceDetect: async (_imageToTensor: Tensor3D): Promise<number[][]> => {
                const faceModel = modelManager.getFaceDetectionModel;
                if (!faceModel) throw new Error("Face detection model not loaded.");

                let _configTensor: Float32Array;
                let filteredBoxes: number[][] = [];
                let boxesArray: number[][]
                let confidences: number[][] | string[][];
                let boxScores: number[][];

                if (faceModel) {
                    try {

                        _configTensor = tf.tidy(() => {
                            const resizedTensor = tf.image.resizeBilinear(_imageToTensor, [240, 320]);
                            // 2. 정규화 및 RGB 배열 유지
                            const normalizedTensor = tf.div(resizedTensor, tf.scalar(255.0));
                            // 3. 차원 변환 [H, W, C] -> [1, C, H, W]
                            const transposedTensor = tf.transpose(normalizedTensor, [2, 0, 1]);
                            const dataSyncRst = transposedTensor.dataSync();
                            return new Float32Array(dataSyncRst)
                        });

                        // inputOnnxTensor = new Tensor(_configTensor.slice(), [1, 3, 240, 320]);
                        // let feed: { input: Tensor | null } = { "input": inputOnnxTensor };

                        console.log(">>>", _configTensor);

                        await faceModel.run([_configTensor]) // ✅ 이 형태가 맞음
                            .then((fetches) => {

                                if (fetches) {
                                    // 원본 이미지의 크기
                                    const origWidth = 320; // 이미지 너비
                                    const origHeight = 240; // 이미지 높이

                                    // 신뢰도 임계값과 IoU 임계값
                                    const probThreshold = 0.5; // 신뢰도 임계값
                                    const iouThreshold = 0.3; // IoU 임계값
                                    const topK = -1; // 상위 k개 결과만 유지 (-1이면 모든 결과 유지)


                                    // let ouputBox: Tensor | null = fetches.boxes;
                                    // let ouputScores: Tensor | null = fetches.scores;

                                    // // 박스 개수 계산
                                    // const numBoxes = Math.floor(ouputBox!.data.length / 4);
                                    // confidences = Array.from({ length: numBoxes }, (_, i) => {
                                    //     const startIndex = i * (ouputScores!.data.length / numBoxes);
                                    //     const endIndex = startIndex + ouputScores!.data.length / numBoxes;
                                    //     // @ts-ignore
                                    //     return Array.from(ouputScores!.data.slice(startIndex, endIndex));
                                    // });

                                    // // @ts-ignore
                                    // boxesArray = Array.from({ length: numBoxes }, (_, i) => Array.from(ouputBox.data.slice(i * 4, (i + 1) * 4)));

                                    // // scores와 boxes를 결합하여 [x_min, y_min, x_max, y_max, score] 형태로 변환
                                    // boxScores = boxesArray.map((box, idx) => {
                                    //     if (!confidences[idx] || !box) {
                                    //         console.error(`Invalid data at index ${idx}`, { confidences, boxesArray });
                                    //         return null;
                                    //     }
                                    //     return [...box, confidences[idx][1]]; // 클래스 1의 신뢰도 사용
                                    // })
                                    //     //@ts-ignore
                                    //     .filter((box): box is number[] => box !== null);

                                    // // NMS를 통해 겹치는 박스 제거
                                    // filteredBoxes = calcHandler.hardNMS(boxScores.filter(box => box[4] > probThreshold), iouThreshold, topK)
                                    //     .map(box => {
                                    //         return [
                                    //             Math.round(box[0] * origWidth), // x_min
                                    //             Math.round(box[1] * origHeight), // y_min
                                    //             Math.round(box[2] * origWidth), // x_max
                                    //             Math.round(box[3] * origHeight), // y_max
                                    //             box[4] // score
                                    //         ];
                                    //     });
                                }
                            })
                            .catch((err) => {
                                console.error(`versionRfb320Model.run() 함수에서 에러가 발생하였습니다 : ${err}`);
                            });
                    } catch (error) {
                        console.log(`[-] estimateVersionRfb320 error :: ${error}`)
                    }
                }
                return filteredBoxes;
            },
            /**
             * 홍채 정보를 추출합니다.
             * @param imageToTensor 
             * @param pfldArr 
             * @returns 
             */
            estimateIrisLandmark: async (imageToTensor: Tensor3D, pfldArr: number[][]): Promise<{ leftIrisArr: number[]; rightIrisArr: any[]; }> => {
                const resultObj = { leftIrisArr: [], rightIrisArr: [] }
                // const faceModel = modelManager.getFaceDetectionModel;

                // if (pfldArr.length > 0) {

                //     let outputIrisLeftArr = [];
                //     let outputIrisRightArr = [];

                //     // 1. 왼쪽 및 오른쪽 눈 영역 추출
                //     const { leftEye, rightEye } = calcHandler.extractEyeRegions(pfldArr, imageToTensor);

                //     let leftTensor = new Tensor(leftEye, [1, 64, 64, 3]);
                //     let rightTensor = new Tensor(rightEye, [1, 64, 64, 3])

                //     let feed1: { input_1: Tensor | null } = { "input_1": leftTensor };
                //     let feed2: { input_1: Tensor | null } = { "input_1": rightTensor };

                //     if (initModel.irisLandmarkModel) {
                //         try {
                //             //@ts-ignore
                //             await initModel.irisLandmarkModel.run(feed1, initModel.irisLandmarkModel.outputNames)
                //                 .then((fetches: InferenceSession.OnnxValueMapType | null) => {
                //                     feed1.input_1 = null;                                  // 참조 제거 (input 값 제거)
                //                     (feed1 as any) = null;
                //                     (leftTensor as any) = null;

                //                     if (fetches) {
                //                         let outputIris = fetches.output_iris.data;
                //                         (fetches.output_iris as any) = null;                        // 큰 데이터 초기화
                //                         (fetches.output_eyes_contours_and_brows as any) = null;     // 큰 데이터 초기화
                //                         // @ts-ignore
                //                         outputIrisLeftArr = outputIris.slice();

                //                         for (const key in fetches) {
                //                             (fetches as any)[key] = null;
                //                         }
                //                         outputIris = [];                                    // 사용된 배열 초기화
                //                     }
                //                     fetches = null;

                //                 })
                //                 .catch((err) => {
                //                     console.error(`initModel.irisLandmarkModel.run() Model1 함수에서 에러가 발생하였습니다 : ${err}`);
                //                 });

                //             //@ts-ignore
                //             await initModel.irisLandmarkModel.run(feed2, initModel.irisLandmarkModel.outputNames)
                //                 .then((fetches: InferenceSession.OnnxValueMapType | null) => {
                //                     feed2.input_1 = null;                                  // 참조 제거 (input 값 제거)
                //                     (feed2 as any) = null;
                //                     (rightTensor as any) = null;

                //                     if (fetches) {
                //                         let outputIris = fetches.output_iris.data;
                //                         (fetches.output_iris as any) = null;                        // 큰 데이터 초기화
                //                         (fetches.output_eyes_contours_and_brows as any) = null;     // 큰 데이터 초기화

                //                         // @ts-ignore
                //                         outputIrisRightArr = outputIris.slice();

                //                         outputIris = [];                                // 사용된 배열 초기화
                //                     }
                //                 })
                //                 .catch((err) => {
                //                     console.error(`initModel.irisLandmarkModel.run() Model2 함수에서 에러가 발생하였습니다 : ${err}`);
                //                 });
                //         } catch (error) {
                //             console.log(`[-] estimateIrisLandmark error :: ${error}`);
                //         } finally {
                //             resultObj.leftIrisArr = outputIrisLeftArr;
                //             resultObj.rightIrisArr = outputIrisRightArr;
                //             // 메모리 정리
                //             outputIrisLeftArr = [];
                //             outputIrisRightArr = [];
                //             outputIrisLeftArr.length = 0;
                //             outputIrisRightArr.length = 0;
                //         }
                //     }
                // }
                return resultObj;
            },
            /**
             * PDLF 모델을 통해서 얼굴 좌표값 추출
             * @param imageToTensor 
             * @param result 
             * @returns Promise<number[][]>
             */
            estimatePfld: async (imageToTensor: Tensor3D, versionRfd320Result: number[][]): Promise<number[][]> => {

                let resultPfld: number[][] = [];



                // try {

                //     if (initModel.pfldModel) {
                //         const [x, y, width, height] = versionRfd320Result[0]


                //         // 해당 영역안에서 처리한 메모리 사용후 제거
                //         const _configTensor = tf.tidy(() => {
                //             const box = new Array(x, y, width, height); // [x1, y1, x2, y2]

                //             const _topLeft: number[] = new Array(box[0], box[1]);
                //             const _bottomRight: number[] = new Array(box[2], box[3]);

                //             const w: number = _bottomRight[0] - _topLeft[0];
                //             const h: number = _bottomRight[1] - _topLeft[1];

                //             const _xw1: number = Math.trunc(Math.max(box[0] - (0.4 * w), 0));
                //             const _yw1: number = Math.trunc(Math.max(box[1] - (0.4 * h), 0));
                //             const _xw2: number = Math.trunc(Math.min(box[2] + (0.4 * w), imageToTensor.shape[1] - 1));
                //             const _yw2: number = Math.trunc(Math.min(box[3] + (0.4 * h), imageToTensor.shape[0] - 1));


                //             // [기능-2] posbox 형태로 자른 형태 (TensorImage)
                //             const _indexingResult: tf.Tensor<tf.Rank.R3> = tf.slice(
                //                 imageToTensor,
                //                 [_yw1, _xw1, 0],
                //                 [_yw2 - _yw1, _xw2 - _xw1, 3]
                //             );

                //             // 2. 크기 조정
                //             const _resizeFace = tf.image.resizeBilinear(_indexingResult, [112, 112]);

                //             // 3. 정규화: [0, 1] 범위로 변환
                //             const normalizedTensor = tf.div(_resizeFace, tf.scalar(255.0));

                //             // [기능-6] 모델링을 위한 맨앞에 차원을 추가하는 작업(reshape로 차원추가)
                //             const _expandDims = tf.reshape(normalizedTensor, [1, 112, 112, 3])

                //             // [STEP7] 텐서플로우 데이터를 자바스크립트 데이터 타입으로 컨버팅합니다.
                //             return new Float32Array(_expandDims.dataSync());

                //         });

                //         let feed: { input: Tensor | null } = { "input": new Tensor(_configTensor.slice(), [1, 3, 112, 112]) };

                //         //@ts-ignore
                //         await initModel.pfldModel.run(feed, initModel.pfldModel.outputNames)
                //             .then((fetches: InferenceSession.OnnxValueMapType | null) => {

                //                 if (fetches) {
                //                     const result = Array.from(
                //                         { length: fetches.output.data.length / 2 }, (_, i) => [fetches!.output.data[i * 2], fetches!.output.data[i * 2 + 1]]);

                //                     // @ts-ignore
                //                     const restoredLandmarks = result.map(([nx, ny]: [number, number]) => {
                //                         const originalX = nx * width + x; // x 복원
                //                         const originalY = ny * height + y; // y 복원
                //                         return [originalX, originalY];
                //                     });
                //                     resultPfld = restoredLandmarks
                //                 }
                //                 for (const key in fetches) {
                //                     (fetches as any)[key] = null;
                //                 }
                //                 // input/out ONNX Tensor 비우기
                //                 feed.input = null;                                  // 참조 제거 (input 값 제거)
                //                 fetches = null;

                //             })
                //             .catch((err) => {
                //                 console.error(`pfldModel.run() 함수에서 에러가 발생하였습니다 : ${err}`);
                //             });
                //     }
                // }
                // catch (error) {
                //     console.log(`[-] estimatePfld error :: ${error}`)
                // }

                return resultPfld
            },
            /**
                 * FSA-NET 기반으로 데이터에 대한 측정을 수행합니다.
                 * @param tensorImage
                 * @param estimateArr
                 * @param {NodeJS.Timeout} timer
                 * @returns {Promise<number[]>}
                 */
            fsanetEstimate: async (
                tensorImage: Tensor3D,
                estimateArr: AnnotatedPrediction[],
            ): Promise<number[]> => {
                console.log("[+] fsanetEstimate")
                let resultFaceDtct: number[] = [];

                const fsanetModel = modelManager.getFSANetSession;
                // 필수값 존재 체크
                if (estimateArr.length > 0) {
                    // [기능-1] FaceMesh를 통해 전달받은 데이터를 통해 값 세팅
                    // boundingBox : 얼굴 측정값 , faceInViewConfidence : 집중도
                    const { boundingBox: _boundingBox, faceInViewConfidence: _faceInViewConfidence } = estimateArr[0];
                    const { topLeft: _topLeft, bottomRight: _bottomRight } = _boundingBox;

                    const w: number = _bottomRight[0] - _topLeft[0];
                    const h: number = _bottomRight[1] - _topLeft[1];

                    const _xw1: number = Math.trunc(Math.max(parseInt(_topLeft[0]) - 0.4 * w, 0));
                    const _yw1: number = Math.trunc(Math.max(parseInt(_topLeft[1]) - 0.4 * h, 0));
                    const _xw2: number = Math.trunc(Math.min(parseInt(_bottomRight[0]) + 0.4 * w, tensorImage.shape[1] - 1));
                    const _yw2: number = Math.trunc(Math.min(parseInt(_bottomRight[1]) + 0.4 * h, tensorImage.shape[0] - 1));

                    tf.dispose([_topLeft, _bottomRight]);
                    // 해당 영역안에서 처리한 메모리 사용후 제거
                    const _expandDims: TensorContainer = tf.tidy(() => {
                        // [기능-2] posbox 형태로 자른 형태 (TensorImage)
                        const _indexingResult: Tensor<Rank.R3> = tf.slice(
                            tensorImage,
                            [_yw1, _xw1, 0],
                            [_yw2 - _yw1, _xw2 - _xw1, 3],
                        );
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

                        tf.dispose([_indexingResult, _resizeFace, _min, aa, bb, cc, _normalize_imagetensor, _temp]);

                        // [기능-6] 모델링을 위한 맨앞에 차원을 추가하는 작업(reshape로 차원추가)
                        return tf.reshape(_finalFace, [1, 64, 64, 3]);
                    });

                    // [STEP7] 텐서플로우 데이터를 자바스크립트 데이터 타입으로 컨버팅합니다.
                    const _configTensor = new Float32Array(_expandDims.dataSync());

                    tf.dispose(_expandDims);

                    // [STEP8] 컨버팅한 데이터를 기반으로 모델을 수행합니다.'
                    let feed: { input: OnnxTensor | null } = { input: new OnnxTensor(_configTensor.slice(), [1, 64, 64, 3]), };


                    if (fsanetModel) {
                        //@ts-ignore
                        await fsanetModel.run(feed, fsanetModel.outputNames)
                            .then((fetches: InferenceSession.OnnxValueMapType | null) => {
                                //@ts-ignore
                                resultFaceDtct = tf.tidy(() => CalcStudyModule.calcFsanetInfo(fetches));
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
                  * @param {NodeJS.Timeout} timer
                  */
            hsemotionEstimate: async (
                tensorImage: Tensor3D,
                estimateArr: AnnotatedPrediction[],
            ): Promise<StudyType.ResultHsemotion> => {

                console.log("[+] hsemotionEstimate")
                // [STEP1] 연산 결과를 반환할 객체를 초기 선언합니다.
                let resultHsemotion: StudyType.ResultHsemotion = {
                    arousalArr: [],
                    valenceArr: [],
                    emotionCode: '',
                };

                const hsemptionModel = modelManager.getHSEmotionSession;

                try {
                    // [CASE1] 파라미터로 전달 받은 값이 존재하는지 여부를 확인합니다.
                    if (estimateArr.length > 0 && hsemptionModel != null) {
                        // [STEP1] FaceMesh를 통해 전달받은 측정 데이터 통해 얼굴 측정값(boundingBox), 집중도(faceInViewConfidence)를 출력합니다.
                        const { boundingBox: _boundingBox, faceInViewConfidence: _faceInViewConfidence } = estimateArr[0];

                        const { topLeft: _topLeft, bottomRight: _bottomRight } = _boundingBox;

                        const _xw1: number = Math.trunc(Math.max(parseInt(_topLeft[0]), 0));
                        const _yw1: number = Math.trunc(Math.max(parseInt(_topLeft[1]), 0));
                        const _xw2: number = Math.trunc(Math.min(parseInt(_bottomRight[0]), tensorImage.shape[1]));
                        const _yw2: number = Math.trunc(Math.min(parseInt(_bottomRight[1]), tensorImage.shape[0]));

                        //@ts-ignore
                        const _configTensor: TensorContainer = tf.tidy(() => {
                            // [STEP2] 필요한 영역(posbox)에 대해서만 남기고 자릅니다.
                            const _indexingResult: Tensor<Rank.R3> = tf.slice(
                                tensorImage,
                                [_yw1, _xw1, 0],
                                [_yw2 - _yw1, _xw2 - _xw1, 3],
                            );
                            // [STEP3] 자른 영역을 일정한 크기(224,224)로 리사이즈 합니다.
                            const _resizeFace: Tensor3D | Tensor4D = tf.image.resizeBilinear(_indexingResult, [224, 224]);

                            // [STEP4] 리사이즈된 영역(얼굴)에 대해 정규화를 수행합니다.
                            const _resizeFaceDiv = tf.div(_resizeFace, 255);
                            const mean = [0.485, 0.456, 0.406];
                            const std = [0.229, 0.224, 0.225];
                            const [r, g, b] = tf.split(_resizeFaceDiv, 3, 2);
                            const rNormalized = tf.div(tf.sub(r, mean[0]), std[0]);
                            const gNormalized = tf.div(tf.sub(g, mean[1]), std[1]);
                            const bNormalized = tf.div(tf.sub(b, mean[2]), std[2]);
                            const normalizedTensor = tf.concat([rNormalized, gNormalized, bNormalized], 2);

                            // [STEP5] PyTorch 데이터 형태를 Tensor 데이터 형태로 컨버팅합니다.
                            const transposedTensor = tf.transpose(normalizedTensor, [2, 0, 1]);

                            // [STEP6] 배치 차원을 추가합니다.
                            const expanded = tf.expandDims(transposedTensor, 0); // 이건 밖에서 참조하므로 해제 안됨
                            // 모든 중간 텐서 해제
                            tf.dispose([
                                _indexingResult,
                                _resizeFace,
                                _resizeFaceDiv,
                                r,
                                g,
                                b,
                                rNormalized,
                                gNormalized,
                                bNormalized,
                                normalizedTensor,
                                transposedTensor,
                            ]);
                            return expanded;
                        });

                        const tensorData = new Float32Array(_configTensor.dataSync());
                        tf.dispose(_configTensor); // 명시적으로 해제

                        // [STEP8] 컨버팅한 데이터를 기반으로 모델을 수행합니다.
                        const feed: { input: OnnxTensor | null } = {
                            input: new OnnxTensor(tensorData.slice(), [1, 3, 224, 224]),
                        };

                        // @ts-ignore
                        await hsemptionModel.run(feed, hsemptionModel.outputNames)
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
                            .catch((err) => {
                                console.log(`[-] calcHsemotion Error ${err}`);
                            });

                        // tf.dispose(_boundingBox);
                        // tf.dispose(_topLeft)
                        // tf.dispose(_bottomRight);
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
            hPoseEstimate: async (data1: Float32Array): Promise<number> => {
                console.log("[+] hPoseEstimate")
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
                        // @ts-ignore
                        await hposeModel.run(feed, hposeModel.outputNames)
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
            calcLoopSum: async (
                strtTs: number,
                accLoopCnt: number,
                loopTime: number,
                isFaceDectionCnt: number,
                resultHsEmotion: StudyType.ResultHsemotion,
                tensorImage: Tensor3D,
                configArr: number[],
            ) => {
                /**
                 * [CASE1-1] 최종 카운트가 10보다 작은 경우
                 */
                if (accLoopCnt <= LOOP_LIMIT_CNT) {
                    // console.log(" =================================== 파라미터로 들어온 값 ===========================================================");
                    // // console.log("tensorResult :: ", tensorResult)
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

                    console.log(`2. 루프 종료 시점에 메모리에 있는 텐서 수  ${tf.tidy(() => tf.memory().numTensors)}`);
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

                    // console.log("*************************************** 최종 누적된 값 *************************************************************")
                    // console.log("doSq :", doSq);
                    // console.log("msrdTm :", msrdSecs);
                    // console.log("isFaceDtctArr :", isFaceDtctArr);
                    // console.log("exprCdArr :", exprCdArr);
                    // console.log("valenceArr :", valenceArr);
                    // console.log("arousalArr :", arousalArr);
                    // console.log("emtnCdArr :", emtnCdArr);
                    // console.log("atntnArr :", atntnArr);
                    // console.log("strssArr :", strssArr);
                    // console.log("****************************************************************************************************************")

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

                    const { hPoseEstimate } = modelCalcHandler;



                    // [STEP5] 집중력을 추정하여 텐서값으로 반환합니다.
                    const resultConcent = calcHandler.concentrationEstimate(tensorResultArr.slice(-10));

                    /**
                     * [STEP6] 집중력을 추정합니다 : 얼굴을 하나도 인식하지 못한경우에 hPose를 수행하지 않음
                     */
                    let _atntn = 0;
                    if (isFaceDtctArr.includes(1)) {
                        const data1 = new Float32Array(resultConcent.dataSync());
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
                    }

                    // [STEP8] 사용한 Tensor 메모리를 초기화합니다.
                    tf.dispose(resultConcent);
                    tf.dispose(tensorImage);

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

            /**
             * NMS(Non-Maximum Suppression) 구현
             * @param boxScores 박스 좌표 및 점수 배열 [[x_min, y_min, x_max, y_max, score], ...]
             * @param iouThreshold IoU 임계값
             * @param topK 상위 k개 결과만 유지 (-1이면 모든 결과 유지)
             * @param candidateSize 고려할 후보 개수
             * @returns 유지된 박스 리스트
             */
            hardNMS: (boxScores: number[][], iouThreshold: number, topK: number = -1, candidateSize: number = 200): number[][] => {
                // 점수를 기준으로 내림차순 정렬
                let sortedBoxes = [...boxScores].sort((a, b) => b[4] - a[4]);

                // 상위 후보만 고려
                let candidates = sortedBoxes.slice(0, candidateSize);
                const picked: number[][] = [];

                while (candidates.length > 0) {
                    const current = candidates.shift()!;
                    picked.push(current);
                    if (topK > 0 && picked.length >= topK) break;

                    const remainingBoxes = candidates.filter(box => {
                        const iou = calcHandler.iouOf([current], [box.slice(0, 4)]);
                        return iou[0] <= iouThreshold;
                    });

                    // candidates 갱신
                    candidates.splice(0, candidates.length, ...remainingBoxes);

                    // ✨ remainingBoxes 정리
                    for (let i = 0; i < remainingBoxes.length; i++) {
                        remainingBoxes[i] = [];
                    }
                }
                // ✨ 명시적으로 메모리 해제
                for (let i = 0; i < sortedBoxes.length; i++) {
                    sortedBoxes[i] = [];
                }
                for (let i = 0; i < candidates.length; i++) {
                    candidates[i] = [];
                }
                sortedBoxes = [];
                candidates = [];

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
                const baseBox = boxes0[0];
                const baseX1 = baseBox[0], baseY1 = baseBox[1], baseX2 = baseBox[2], baseY2 = baseBox[3];
                const area0 = (baseX2 - baseX1) * (baseY2 - baseY1);

                const results: number[] = [];

                for (let i = 0; i < boxes1.length; i++) {
                    const b = boxes1[i];
                    const x1 = Math.max(baseX1, b[0]);
                    const y1 = Math.max(baseY1, b[1]);
                    const x2 = Math.min(baseX2, b[2]);
                    const y2 = Math.min(baseY2, b[3]);

                    const overlapW = Math.max(x2 - x1, 0);
                    const overlapH = Math.max(y2 - y1, 0);
                    const overlapArea = overlapW * overlapH;

                    const area1 = (b[2] - b[0]) * (b[3] - b[1]);

                    const iou = overlapArea / (area0 + area1 - overlapArea + eps);
                    results.push(iou);
                }

                return results;
            },
            extractEyeRegions: (
                landmarks: number[][], // [x, y] 형식의 68개의 랜드마크 좌표
                origImage: Tensor3D, // 원본 이미지 (TensorFlow 텐서)
                padding: number = 50, // 눈 영역에 추가할 패딩 값
                targetSize: [number, number] = [64, 64] // 눈 영역을 고정 크기로 조정
            ): { leftEye: Float32Array; rightEye: Float32Array } => {

                // 1. 왼쪽 및 오른쪽 눈 랜드마크 좌표
                let leftEyeLandmarks = landmarks.slice(36, 42); // 왼쪽 눈 (36~41)
                let rightEyeLandmarks = landmarks.slice(42, 48); // 오른쪽 눈 (42~47)

                // 2. 왼쪽 눈 영역 계산
                const [leftEyeX1, leftEyeY1] = leftEyeLandmarks.reduce(
                    ([minX, minY], [x, y]) => [Math.min(minX, x - padding), Math.min(minY, y - padding)],
                    [Infinity, Infinity]
                );
                const [leftEyeX2, leftEyeY2] = leftEyeLandmarks.reduce(
                    ([maxX, maxY], [x, y]) => [Math.max(maxX, x + padding), Math.max(maxY, y + padding)],
                    [-Infinity, -Infinity]
                );

                // 3. 오른쪽 눈 영역 계산
                const [rightEyeX1, rightEyeY1] = rightEyeLandmarks.reduce(
                    ([minX, minY], [x, y]) => [Math.min(minX, x - padding), Math.min(minY, y - padding)],
                    [Infinity, Infinity]
                );
                const [rightEyeX2, rightEyeY2] = rightEyeLandmarks.reduce(
                    ([maxX, maxY], [x, y]) => [Math.max(maxX, x + padding), Math.max(maxY, y + padding)],
                    [-Infinity, -Infinity]
                );

                leftEyeLandmarks = [];
                rightEyeLandmarks = [];

                // 4. 원본 이미지에서 왼쪽 눈 영역 추출
                const region1 = tf.slice(origImage,
                    [
                        Math.floor(Math.max(leftEyeY1, 0)), // 시작 y 좌표
                        Math.floor(Math.max(leftEyeX1, 0)), // 시작 x 좌표
                        0, // 채널
                    ],
                    [
                        Math.floor(Math.min(leftEyeY2 - leftEyeY1, origImage.shape[0] - leftEyeY1)), // 높이
                        Math.floor(Math.min(leftEyeX2 - leftEyeX1, origImage.shape[1] - leftEyeX1)), // 너비
                        3, // 채널 (RGB)
                    ]
                );
                const leftEyeRegion = tf.image.resizeBilinear(region1, targetSize);

                // 2. 왼쪽 눈 데이터 정규화 및 형태 변환
                const leftEyeTensorData = tf.tidy(() => {
                    const _scalar = tf.scalar(255);
                    const _normalized = tf.div(leftEyeRegion, tf.scalar(255)); // 0~255 -> 0~1로 정규화
                    const _reshapeInput = tf.reshape(_normalized, [1, 64, 64, 3]); // [H, W, C] -> [1, H, W, C]
                    const _resultData = _reshapeInput.dataSync();
                    tf.dispose([leftEyeRegion, _scalar, _normalized, _reshapeInput])
                    return new Float32Array(_resultData);
                });

                tf.dispose([region1, leftEyeRegion]);

                // 5. 원본 이미지에서 오른쪽 눈 영역 추출
                const region2 = tf.slice(origImage,
                    [
                        Math.floor(Math.max(rightEyeY1, 0)), // 시작 y 좌표
                        Math.floor(Math.max(rightEyeX1, 0)), // 시작 x 좌표
                        0, // 채널
                    ],
                    [
                        Math.floor(Math.min(rightEyeY2 - rightEyeY1, origImage.shape[0] - rightEyeY1)), // 높이
                        Math.floor(Math.min(rightEyeX2 - rightEyeX1, origImage.shape[1] - rightEyeX1)), // 너비
                        3, // 채널 (RGB)
                    ]
                )
                const rightEyeRegion = tf.image.resizeBilinear(region2, targetSize);


                // 3. 오른쪽 눈 데이터 정규화 및 형태 변환
                const rightEyeTensorData = tf.tidy(() => {
                    const _scalar = tf.scalar(255);
                    const _normalized = tf.div(rightEyeRegion, _scalar); // 0~255 -> 0~1로 정규화
                    const _reshapeInput = tf.reshape(_normalized, [1, 64, 64, 3]); // [H, W, C] -> [1, H, W, C]
                    const _resultData = _reshapeInput.dataSync();
                    tf.dispose([_scalar, rightEyeRegion, _normalized, _reshapeInput])
                    return new Float32Array(_resultData);
                });
                tf.dispose([region2, rightEyeRegion]);

                // 6. 결과 반환
                return { leftEye: leftEyeTensorData, rightEye: rightEyeTensorData };
            },
        }

    })();

    /**
     * 일반적인 핸들러
     */
    const commonHandler = (() => {
        return {

            /**
             * 지정한 시간만큼 잠시 대기합니다.
             * @param ms
             * @returns
             */
            sleep: (ms: number): Promise<void> => {
                console.log(` ===== > 해당 ${ms}초 만큼 잠시 쉽니다.. <===========`);
                return new Promise((resolve) => setTimeout(resolve, ms));
            },

            /**
             * 앱 상테 변화를 감지하는 리스너 
             * @param {AppStateStatus} nextAppState App에서 변경된 상태 값이 전달받음 (active, inactive, background)
             * @returns {void}
             */
            appStateChangeListener: (nextAppState: AppStateStatus): void => {
                // fetch()
                //     .then(state => {
                //         const { type, isConnected } = state;
                //         console.log("Connection type", type);
                //         console.log("Is connected?", isConnected);
                //         console.log("앱 상태를 확인합니다 >>> [", nextAppState, "] 앱의 네트워크 연결 상태 [", isConnected, "]");

                //         switch (nextAppState) {
                //             // [CASE1-1] 앱 상태가 "background", "inactive" 상태인 경우: stopwatch를 멈춥니다.
                //             case "background":
                //                 if (isActiveStopwatch) stopwatchHandler.pause();                // 스탑워치가 실행중인 경우만 이를 멈춥니다.
                //                 break;

                //             case "inactive":
                //                 if (isActiveStopwatch) stopwatchHandler.pause();                // 스탑워치를 멈춥니다.
                //                 if (Platform.OS === "ios") preAppState.current = "inactive";    // iOS의 작업창을 내린 경우 이를 수행
                //                 break;

                //             // [CASE1-2] 앱 상태가 "active" 상태인 경우: stopwatch를 재개 합니다.
                //             case "active":
                //                 switch (Platform.OS) {
                //                     case "android":
                //                         stopwatchHandler.start();       // 무조껀 실행이 된다.
                //                         break;

                //                     case "ios":
                //                         // 이전에 inactive가 실행되고 스탑워치가 수행된 경우 : 스탑워치를 실행합니다.
                //                         if (preAppState.current === "inactive" && isActiveStopwatch) {
                //                             stopwatchHandler.start();
                //                             preAppState.current = "active";         // 상태를 다시 활성화로 변경한다.
                //                         }
                //                         break;
                //                     default:
                //                         break;
                //                 }
                //                 break;
                //             default:
                //                 break;
                //         }
                //     });
            },

            /**
             * 메모리 사용량을 체크하는 함수
             */
            checkMemoryUsage: async () => {
                // const totalMemory = await DeviceInfo.getTotalMemory(); // 기기의 전체 메모리 (바이트 단위)
                // const usedMemory = await DeviceInfo.getUsedMemory();   // 사용 가능한 메모리 (바이트 단위)

                // const freeMemory = totalMemory - usedMemory; // 사용된 메모리
                // const usedMemoryPercentage = (usedMemory / totalMemory) * 100; // 사용된 메모리 비율

                // console.log("totalMemory-->", totalMemory / (1024 * 1024));
                // console.log("usedMemory-->", usedMemory / (1024 * 1024));
                // console.log("usedMemoryPercentage-->", usedMemoryPercentage);
            },

            /**
             * 네트워크 변화에 대해 체크하는 리스너
             * @returns
             */
            networkChangeCheckListener: (): NetInfoSubscription | any => {
                // console.log("[+] 연결 상태 확인");
                // return NetInfo.addEventListener(state => {
                //     inConnectNetworkRef.current = state.isConnected!;   // 연결 상태를 변수로 저장합니다.
                //     // 네트워크 연결이 끊겼을때, 학습을 중단시키고 팝업을 출력합니다.
                //     if (!inConnectNetworkRef.current) {
                //         stopwatchHandler.pause();
                //         console.log("네트워크 연결이 끊겼습니다.");
                //         Alert.alert("네트워크 연결이 끊겼습니다.", " 디바이스 연결 상태를 확인해주세요.");
                //     };
                // });
            },

            /**
             * 네트워크 연결이 끊겼을때, 메시지를 출력합니다.
             * @returns
             */
            disconnectNetworkAlert: (): void => {
                // console.log("네트워크 연결이 끊겼습니다.");
                // Alert.alert("네트워크 연결이 끊겼습니다.", " 디바이스 연결 상태를 확인해주세요.");
                // return
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
                const { getFSANetSession, clearFSANetModel, getHposeSession, clearHposeModel, getHSEmotionSession, clearHSEmotionModel } = modelManager

                if (getFSANetSession) clearFSANetModel()
                if (getHposeSession) clearHposeModel()
                if (getHSEmotionSession) clearHSEmotionModel();
                resetHandler.cleanUpAccStdInfo(); // 누적된 배열들을 초기화합니다.
                setIsFaceDtctYn(false);
            },

            faceMeshCleanupPrediction: (paramArr: AnnotatedPrediction[]) => {
                for (const item of paramArr) {
                    if (item.kind === 'MediaPipePredictionTensors') {
                        item.mesh.dispose();
                        item.scaledMesh.dispose();
                        item.boundingBox.topLeft.dispose();
                        item.boundingBox.bottomRight.dispose();
                        // (item.mesh as any) = null;
                        // (item.scaledMesh as any) = null;
                        // (item.boundingBox.topLeft as any) = null;
                        // (item.boundingBox.bottomRight as any) = null
                    } else if (item.kind === 'MediaPipePredictionValues') {
                        if ('dispose' in item.boundingBox.topLeft && typeof item.boundingBox.topLeft.dispose === 'function') {
                            item.boundingBox.topLeft.dispose();
                        }
                        if ('dispose' in item.boundingBox.bottomRight && typeof item.boundingBox.bottomRight.dispose === 'function') {
                            item.boundingBox.bottomRight.dispose();
                        }
                        // item.mesh = [];
                        // item.scaledMesh = [];
                        // 빈 배열 초기화
                        // for (const key in item.annotations) {
                        //     if (Array.isArray(item.annotations[key])) {
                        //         item.annotations[key] = [];
                        //     }
                        // }
                    }
                }

                // console.log('[+] faceMeshCleanupPrediction 수행완료');
            },
        };
    })();


    /**
    * TensorCamera에 출력된 TensorImage 값을 기반으로 이미지 출력을 위한 이미지 경로를 반환합니다.
    * @param {tf.Tensor3D} tensorImage 
    * @return {string} 이미지 경로 반환
    */
    const cvtTensorImgToBase64 = (tensorImage: Tensor3D): string => {

        // [STEP1] 전달 받은 TensorImage를 좌우 반전합니다.
        const flippedTensor = tf.reverse(tensorImage, [1]);

        // [STEP2] TensorImage에서 높이와 너비 값을 반환 받습니다.
        const height: number = flippedTensor.shape[0];
        const width: number = flippedTensor.shape[1];

        // [STEP3] 하나의 차원을 만듭니다.
        const tensor3D = tf.fill([height, width, 1], 255);

        // [STEP4] tensorImage는 3차원이며 이전에 만든 차원을 합쳐서 4차원으로 만듭니다.
        const data = new Buffer(
            tf.slice(
                tf.concat([flippedTensor, tensor3D], -1), [0], [height, width, 4]).dataSync()
        )

        // [STEP5] 구성한 버퍼에서 정보를 추출합니다.
        const rawImageData = { data, width, height };

        // [기능-1] 정제된 Tensor 값을 통해 jpeg로 인코딩한다.
        const jpegImageData = jpeg.encode(rawImageData, 100);

        // [기능-2] jpeg 데이터를 'base64'로 전환한다.
        const imgBase64 = tf.util.decodeString(jpegImageData.data, "base64");

        return `data:image/jpeg;base64,${imgBase64}`
    }




    if (device == null || !hasPermission) {
        return <Text>카메라 로딩 중...</Text>;
    }

    return (
        <View style={styles.container}>
            <Camera
                ref={cameraRef}
                device={device}
                style={StyleSheet.absoluteFill}
                isActive={true}
                enableFpsGraph={true}
                photo={true}
            />

            <TouchableOpacity style={styles.captureButton} onPress={() => setCameraOn(!cameraOn)}>
                <Text style={styles.captureText}>{cameraOn ? '⏸ 자동 중지' : '▶️ 자동 시작'}</Text>
            </TouchableOpacity>

            {imageUri && (
                <Image source={{ uri: `file://${imageUri}?t=${Date.now()}` }} style={styles.previewImage} />
            )}

            {previewBase64Image && (
                <Image
                    source={{ uri: previewBase64Image }}
                    style={styles.previewBase64Image}
                />
            )}
        </View>
    );
};

export default StudyMediaPipeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    captureButton: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 50,
        marginBottom: 40,
    },
    captureText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    previewImage: {
        position: 'absolute',
        top: 60,
        right: 20,
        width: 100,
        height: 160,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'white',
    },
    previewBase64Image: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 91.25,     // 100 * (292 / 320)
        height: 100,      // 기준 높이
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'white',
    },
});