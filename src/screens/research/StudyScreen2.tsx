import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity, AppStateStatus } from "react-native";
import modelManager from "../../interceptor/ModelManager";

import { decodeJpeg } from '@tensorflow/tfjs-react-native'
import {
    Camera,
    PhotoFile,
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

// Tensorflow blazeface 모델을 가져온다.
const blazeface = require('@tensorflow-models/blazeface');

import * as jpeg from "jpeg-js";
import { Rank, Tensor, Tensor3D, Tensor4D, TensorContainer } from "@tensorflow/tfjs-core";
import { CODE_GRP_CD } from "@/common/utils/codes/CommonCode";


import '@tensorflow/tfjs-react-native';
import OnnxModules from "../modules/OnnxModules";

const tf = modelManager.tf;


const LOOP_TIME = 100;
const LOOP_LIMIT_CNT = 10; // 학습 수행중 루프당 합계를 내기 위한 횟수
const LOOP_INTERVAL = 1; // 학습 루프 시간


const RESIZE_HEIGHT = 320;
const RESIZE_WIDTH = 292;

const StudyScreen2 = () => {

    const [doSq, setDoSq] = useState<number>(0); // 학습 실행 시퀀스
    const device = useCameraDevice('front');
    const cameraRef = useRef<Camera>(null);
    const loopMainCntRef = useRef<number>(0);
    const { hasPermission, requestPermission } = useCameraPermission();
    const loopStartSecRef = useRef<number>();           // 루프 시작 시간(초)
    const loopStartTimeRef = useRef<number>(0);         // 루프 시작 시간
    const inConnectNetworkRef = useRef<boolean>(true);  // 네트워크의 연결 여부를 체크합니다.
    const [beforePreviewBase64Image, setBeforePreviewBase64Image] = useState<string | null>(null);
    const [afterPreviewBase64Image, setAfterPreviewBase64Image] = useState<string | null>(null);
    const [finallyBase64Image, setFinallyBase64Image] = useState<string | null>(null);

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
     * VisionCamera의 스냅샷을 기반으로 Tensor를 사용하는 경우 
     */
    const snapshotToTensor = async (snapshot: PhotoFile): Promise<Tensor3D | null> => {
        let _imageToTensor: Tensor3D | null = null;
        try {
            const base64Data = await RNFS.readFile(snapshot.path, 'base64');
            const imageBuffer = new Uint8Array(tf.util.encodeString(base64Data, 'base64').buffer);
            await RNFS.unlink(snapshot.path);           // 임시 저장 파일 파일 삭제
            const decoded = decodeJpeg(imageBuffer);
            _imageToTensor = tf.image.resizeBilinear(decoded, [RESIZE_HEIGHT, RESIZE_WIDTH]);
        } catch (error) {
            console.log(`[-] snapshotToTensor : `, error)
        }
        return _imageToTensor
    }

    /**
     * 일정 시간마다 Snapshot을 찍어서 반환해주는 함수 
     * @returns 
     */
    const handleCapture = async (): Promise<void> => {

        if (!cameraRef.current) return;
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
            loopMainCntRef.current++; // 학습을 수행시작 한 이후 전체 루프 누적 횟수
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

            const snapshot = await cameraRef.current.takeSnapshot({ quality: SNAPSHOT_QUALITY_MODE.VSMALL.value, });
            setImageUri(snapshot.path); // TODO: 삭제 예정
            const convertStart = performance.now();
            const _imageToTensor = await snapshotToTensor(snapshot)         // Snapshot To Tensor
            const convertEnd = performance.now();
            console.log(`📸 base64 to Tensor 변환 시간: ${(convertEnd - convertStart).toFixed(2)}ms`);
            // 텐서가 존재하는 경우 모든 수행
            _accLoopCnt++;                                                  // 학습의 LIMIT 값에 따른 루프 누적 횟수
            if (_imageToTensor !== null) {
                // 루프 시작시 DB 시간시간 저장
                if (_accLoopCnt === 1) {
                    _strtTs = Date.now();
                }

                if (!_imageToTensor) return;
                else {
                    // [STESP3] 얼굴이 측정되거나 안되거나 하는 경우에 대해 함께 사용하는 변수 선언
                    let _accFaceDetectCnt: number = 0;                                                                      // 얼굴이 측정된 누적 횟수
                    let _resultHsemotion: StudyType.ResultHsemotion = { arousalArr: [], valenceArr: [], emotionCode: "" };  // HSEmotion 코드
                    let configArr: number[] = [];                                                                           // 최종 연산 결과값을 구성한 배열

                    const { estimateVersionRfb320, estimatePfldModel, estimateIrisLandmarkModel } = OnnxModules
                    const { fsanetEstimate, hsemotionEstimate } = modelCalcHandler;

                    const visionRfb320Result = await estimateVersionRfb320(_imageToTensor);

                    if (visionRfb320Result.length > 0) {
                        const pfldArr = await estimatePfldModel(_imageToTensor, visionRfb320Result);
                        // const pfldArr = [[219.87143433094025, 124.16538900136948], [213.9596370458603, 134.74061065912247], [210.16076481342316, 145.29385885596275], [207.91317796707153, 156.43775495886803], [208.19643414020538, 167.74818700551987], [213.10527896881104, 178.31780016422272], [223.9328352212906, 187.88467752933502], [239.2291305065155, 195.48890852928162], [257.02195143699646, 200.3173063993454], [273.5507217645645, 202.1791274547577], [289.4326922893524, 200.53489792346954], [305.3161082267761, 196.30744844675064], [318.89204955101013, 189.40269303321838], [329.8438069820404, 180.58710831403732], [340.1512382030487, 170.82163536548615], [349.0013060569763, 160.27033418416977], [354.786860704422, 149.28040277957916], [256.0004470348358, 113.4042843580246], [272.26986265182495, 112.45204101502895], [288.01743960380554, 114.94263865053654], [300.9962019920349, 119.50891670584679], [309.98334562778473, 124.96102982759476], [327.9712972640991, 126.51233154535294], [337.9849818944931, 123.10183063149452], [348.044472694397, 121.04811911284924], [358.06571221351624, 120.64467880129814], [366.04695296287537, 123.1012515425682], [314.23951959609985, 133.42918854951859], [312.88633024692535, 141.0312992632389], [311.53150177001953, 148.52897334098816], [310.1744530200958, 156.16735690832138], [289.7999612092972, 160.99236232042313], [294.89745473861694, 163.1061463356018], [299.63417625427246, 165.03788667917252], [305.0948259830475, 165.69098043441772], [310.5486658811569, 165.7969856262207], [259.760427236557, 127.7814254462719], [271.30396938323975, 122.97273027896881], [284.3070504665375, 124.18803730607033], [293.3167097568512, 133.4372775554657], [282.28687024116516, 134.06236073374748], [269.735830783844, 133.01006495952606], [327.7824697494507, 137.4561319053173], [336.93103766441345, 130.05731788277626], [347.6162431240082, 129.7964451611042], [352.7049300670624, 136.69400984048843], [348.3410505056381, 139.86253821849823], [338.04297721385956, 139.7152991592884], [263.7366530895233, 171.6152698993683], [276.40012180805206, 168.72529697418213], [289.2413911819458, 167.70523411035538], [294.5124385356903, 170.3420494198799], [301.1139509677887, 170.48875498771667], [307.2676537036896, 175.34768497943878], [309.7126064300537, 181.3397232890129], [300.34187710285187, 183.8431839942932], [291.2339893579483, 184.29179096221924], [284.8437008857727, 183.27935200929642], [278.5584954023361, 181.47342443466187], [270.68491554260254, 177.64672273397446], [267.43452525138855, 171.97408616542816], [285.67847883701324, 173.08595514297485], [291.6082022190094, 174.7633249759674], [297.28900170326233, 176.07047003507614], [307.51601135730743, 180.38451838493347], [293.7081334590912, 177.66386741399765], [287.8274646997452, 176.34880661964417], [282.1051505804062, 174.49449092149734]]

                        if (pfldArr.length > 0) {

                            const irisJsonArr = await estimateIrisLandmarkModel(_imageToTensor, pfldArr);    // {"handler": {"inputNames": ["input_1"], "outputNames": ["output_eyes_contours_and_brows", "output_iris"]}}
                            // const irisJsonArr = { "leftIrisArr": [34.81892013549805, 34.393226623535156, -4.061603546142578, 40.069766998291016, 33.682064056396484, -4.119124412536621, 33.99586868286133, 29.492755889892578, -4.129571437835693, 29.435707092285156, 35.164794921875, -4.007841110229492, 35.63016891479492, 39.16047286987305, -4.06866979598999], "rightIrisArr": [34.81892013549805, 34.393226623535156, -4.061603546142578, 40.069766998291016, 33.682064056396484, -4.119124412536621, 33.99586868286133, 29.492755889892578, -4.129571437835693, 29.435707092285156, 35.164794921875, -4.007841110229492, 35.63016891479492, 39.16047286987305, -4.06866979598999] }

                            if (irisJsonArr) {
                                _accFaceDetectCnt += 1;                                                                             // 얼굴이 측정된 누적 횟수를 Counting

                                // [STEP5] 얼굴이 정확한 위치인지 체크합니다. : 0.5 이상 true 이하는 false
                                setIsFaceDtctYn(true);

                                // [STEP6] 측정된 값을 기반으로 'FSA-NET' 모델을 수행하여 값을 반환받습니다.
                                const resultFsanet = await fsanetEstimate(_imageToTensor, visionRfb320Result);
                                // const resultFsanet = [26.119766235351562, -27.402212142944336, -2.7349319458007812]

                                // [STEP7] 측정된 값을 기반으로 'HSEmotion' 모델을 수행하여 값을 반환받습니다.
                                _resultHsemotion = await hsemotionEstimate(_imageToTensor, visionRfb320Result);
                                // _resultHsemotion = { "arousalArr": [0.15133555233478546], "emotionCode": "SUP", "valenceArr": [-0.04291853681206703] }

                                // [STEP8] 시선 처리 데이터 추출
                                const _gazeEstimateResult = tf.tidy(() => setLandmarkData(pfldArr, irisJsonArr));
                                // const _gazeEstimateResult = { "ear": 0.4030975866672722, "iris_radius": 3.075392723083496, "left_phi": -0.25268025514207865, "left_theta": -0.25268025514207865 }

                                // [STEP12] 측정된 데이터를 배열로 구성하며 최종 Tensor로 구성합니다.
                                const { left_theta, left_phi, ear, iris_radius } = _gazeEstimateResult;

                                // 측정하지 못한 경우 빈 값으로 처리
                                if (left_theta === 0 || left_phi === 0 || ear === 0 || iris_radius === 0) {
                                    configArr = Array(8).fill(NaN);
                                } else {
                                    // [faceInViewConfidence, yaw, pitch, roll, theta, phi, EAR, iris_radius]
                                    configArr = [visionRfb320Result[0][4], resultFsanet[0], resultFsanet[1], resultFsanet[2], left_theta, left_phi, ear, iris_radius];
                                }
                            }

                            // [STEP7-2] 홍채 관련 추출 값이 존재하지 않는 경우 : 데이터 처리를 수행합니다.
                            else {
                                configArr = Array(8).fill(NaN);
                            }

                        }
                        // [STEP6-2] 얼굴의 좌표값 추출이 된 경우 : PDLF 모델을 통해서 얼굴 좌표값 추출
                        else {
                            configArr = Array(8).fill(NaN);
                        }
                    }
                    // [STEP4-2] 얼굴이 탐지되지 않은 경우 : 데이터 처리를 수행합니다.
                    else {
                        // [STEP5] NaN 형태로 구성된 배열로 구성하며 최종 Tensor로 구성합니다.
                        configArr = Array(8).fill(NaN);
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
                    calcHandler.calcLoopSum(_strtTs, _accLoopCnt, elapsedTime, _accFaceDetectCnt, _resultHsemotion, configArr)

                    tf.dispose(_imageToTensor);
                    console.log(`2. 루프 종료 시점에 메모리에 있는 텐서 수  ${tf.tidy(() => tf.memory().numTensors)}`)
                    // [STEP7] 누적된 루프와 제한된 갯수가 같은 경우 초기화를 수행합니다.
                    if (_accLoopCnt === LOOP_LIMIT_CNT + 1) _accLoopCnt = 0;
                    loopStartTimeRef.current = 0;

                }
                const endTime = performance.now(); // ⏱ 종료 시간
                const duration = (endTime - startTime).toFixed(2);
                console.log(`⏱ handleCapture 실행 시간: ${duration}ms`);
            }

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
            * FSA-NET 기반으로 데이터에 대한 측정을 수행합니다.
            * @param tensorImage
            * @param estimateArr
            * @returns {Promise<number[]>}
            */
            fsanetEstimate: async (tensorImage: Tensor3D, versionRfd320Result,): Promise<number[]> => {

                const fsanetModel = modelManager.getFSANetSession;
                let resultFaceDtct: number[] = [];

                // 필수값 존재 체크
                if (versionRfd320Result.length > 0) {

                    // [기능-1] FaceMesh를 통해 전달받은 데이터를 통해 값 세팅
                    const [x1, y1, x2, y2, score] = versionRfd320Result[0]


                    const box = new Array(x1, y1, x2, y2); // [x1, y1, x2, y2]

                    const _topLeft: number[] = new Array(box[0], box[1]);
                    const _bottomRight: number[] = new Array(box[2], box[3]);

                    const w: number = _bottomRight[0] - _topLeft[0];
                    const h: number = _bottomRight[1] - _topLeft[1];

                    const _xw1: number = Math.trunc(Math.max(box[0] - (0.4 * w), 0));
                    const _yw1: number = Math.trunc(Math.max(box[1] - (0.4 * h), 0));
                    const _xw2: number = Math.trunc(Math.min(box[2] + (0.4 * w), tensorImage.shape[1] - 1));
                    const _yw2: number = Math.trunc(Math.min(box[3] + (0.4 * h), tensorImage.shape[0] - 1));


                    // 해당 영역안에서 처리한 메모리 사용후 제거
                    const _expandDims: TensorContainer = tf.tidy(() => {

                        // [기능-2] posbox 형태로 자른 형태 (TensorImage)
                        const _indexingResult: Tensor<Rank.R3> = tf.slice(
                            tensorImage,
                            [_yw1, _xw1, 0],
                            [_yw2 - _yw1, _xw2 - _xw1, 3]
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

                        // [기능-6] 모델링을 위한 맨앞에 차원을 추가하는 작업(reshape로 차원추가)
                        return tf.reshape(_finalFace, [1, 64, 64, 3])
                    });

                    // [STEP7] 텐서플로우 데이터를 자바스크립트 데이터 타입으로 컨버팅합니다.
                    const _configTensor = new Float32Array(_expandDims.dataSync());

                    // [STEP8] 컨버팅한 데이터를 기반으로 모델을 수행합니다.'
                    const feed = { "input": new OnnxTensor(_configTensor, [1, 64, 64, 3]) }

                    if (fsanetModel) {
                        const fetches: any = await fsanetModel.run(feed, fsanetModel.outputNames)

                        resultFaceDtct = CalcStudyModule.calcFsanetInfo(fetches)
                        await fsanetModel.run(feed, fsanetModel.outputNames)
                            .then((fetches: any) => {
                                resultFaceDtct = CalcStudyModule.calcFsanetInfo(fetches)
                                // tf.dispose(_boundingBox)
                                // tf.dispose(_faceInViewConfidence)
                                tf.dispose(_topLeft)
                                tf.dispose(_bottomRight)
                                tf.dispose(_expandDims)
                            })
                            .catch((err) => console.error(`modelCalcHandler.fsanetEstimate() 함수에서 에러가 발생하였습니다 : ${err}`));
                    } else console.error("[+] FSA-NET 모델이 존재하지 않습니다 ")
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
            hsemotionEstimate: async (tensorImage: Tensor3D, versionRfd320Result): Promise<StudyType.ResultHsemotion> => {

                const hsemotionModel = modelManager.getHSEmotionSession;

                // [STEP1] 연산 결과를 반환할 객체를 초기 선언합니다.
                let resultHsemotion: StudyType.ResultHsemotion = {
                    arousalArr: [],
                    valenceArr: [],
                    emotionCode: ""
                }

                try {
                    // [CASE1] 파라미터로 전달 받은 값이 존재하는지 여부를 확인합니다.
                    if (versionRfd320Result.length > 0 && hsemotionModel != null) {

                        const [x1, y1, x2, y2, score] = versionRfd320Result[0]

                        const box = new Array(x1, y1, x2, y2); // [x1, y1, x2, y2]

                        const _topLeft: number[] = new Array(box[0], box[1]);
                        const _bottomRight: number[] = new Array(box[2], box[3]);

                        const w: number = _bottomRight[0] - _topLeft[0];
                        const h: number = _bottomRight[1] - _topLeft[1];

                        const _xw1: number = Math.trunc(Math.max(box[0] - (0.4 * w), 0));
                        const _yw1: number = Math.trunc(Math.max(box[1] - (0.4 * h), 0));
                        const _xw2: number = Math.trunc(Math.min(box[2] + (0.4 * w), tensorImage.shape[1] - 1));
                        const _yw2: number = Math.trunc(Math.min(box[3] + (0.4 * h), tensorImage.shape[0] - 1));


                        //@ts-ignore
                        const resultInput: tf.TensorContainer = tf.tidy(() => {

                            // [STEP2] 필요한 영역(posbox)에 대해서만 남기고 자릅니다.
                            const _indexingResult: Tensor<Rank.R3> = tf.slice(
                                tensorImage,
                                [_yw1, _xw1, 0],
                                [_yw2 - _yw1, _xw2 - _xw1, 3]
                            );
                            // [STEP3] 자른 영역을 일정한 크기(224,224)로 리사이즈 합니다.
                            const _resizeFace: Tensor3D | Tensor4D = tf.image.resizeBilinear(_indexingResult, [224, 224]);


                            // [STEP4] 리사이즈된 영역(얼굴)에 대해 정규화를 수행합니다.
                            const _resizeFaceDiv = tf.div(_resizeFace, 255)
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
                            const expandedTensor = tf.expandDims(transposedTensor, 0);

                            // [STEP7] 텐서플로우 데이터를 자바스크립트 데이터 타입으로 컨버팅합니다.
                            const data = new Float32Array(expandedTensor.dataSync());
                            return new OnnxTensor(data, [1, 3, 224, 224]);
                        });


                        // [STEP8] 컨버팅한 데이터를 기반으로 모델을 수행합니다.
                        const feed = { input: resultInput }
                        // @ts-ignore
                        await hsemotionModel.run(feed, hsemotionModel.outputNames)
                            .then((fetches: InferenceSession.OnnxValueMapType) => {
                                resultHsemotion = CalcStudyModule.calcHsemotionInfo(fetches);

                                console.log("resultHsemotion : ", resultHsemotion)

                            }).catch((err) => {
                                console.log(`[-] calcHsemotion Error ${err}`);
                            });

                        // tf.dispose(_boundingBox);
                        // tf.dispose(_topLeft)
                        // tf.dispose(_bottomRight);
                    }
                } catch (error) {
                    console.log(`[-] hsemotionEstimate error :: ${error}`)
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
            fn_estimateBlazeFace: async (tensorImage: any) => {

                // 텐서 이미지가 존재하는지 체크 
                if (tensorImage) {

                    // [기능-1] blazeface 모델을 불러와서 측정을 수행한다
                    const blaze = await blazeface.load();

                    // [기능-2] blazeface 모델을 통하여 사람 얼굴을 측정
                    const predictions: any = await blaze.estimateFaces(tensorImage, false);

                    console.log("predictions :: ", predictions);

                    // console.log(`[+] 측정 얼굴 수 [${predictions.length}]`);

                    // [CASE1-1] 얼굴을 예측 한 경우 true return
                    if (predictions.length > 0) {
                        return true;
                    }
                    // 텐서 이미지가 존재하지 않는 경우 
                    else {
                        return false;
                    }
                } else {
                    return false;
                }
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
        }

    })();

    /**
     * 일반적인 핸들러
     */
    const commonHandler = (() => {
        return {

            float32ArrayToBase64Image: (floatArray: Float32Array, width: number, height: number): string => {
                // STEP1. Float32Array → Uint8Array (0~255로 정규화)
                const uint8Data = new Uint8Array(floatArray.length);
                for (let i = 0; i < floatArray.length; i++) {
                    uint8Data[i] = Math.min(255, Math.max(0, Math.round(floatArray[i] * 255)));
                }

                // STEP2. Tensor3D 생성: [height, width, 3]
                const imageTensor = tf.tensor3d(uint8Data, [height, width, 3], 'int32');

                // STEP3. Alpha 채널 추가 (RGBA로 확장)
                const alphaChannel = tf.fill([height, width, 1], 255, 'int32');
                const rgbaTensor = tf.concat([imageTensor, alphaChannel], -1); // shape: [H, W, 4]

                // STEP4. jpeg-js 인코딩을 위한 버퍼 생성
                const buffer = Buffer.from(rgbaTensor.dataSync());
                const rawImageData = { data: buffer, width, height };
                const jpegImageData = jpeg.encode(rawImageData, 100);

                // STEP5. Base64 변환
                const base64String = tf.util.decodeString(jpegImageData.data, 'base64');

                return `data:image/jpeg;base64,${base64String}`;
            },
            cvtTensorImgToBase64: (tensorImage: Tensor3D): string => {

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

            {/* {imageUri && (
                <Image source={{ uri: `file://${imageUri}` }} style={styles.previewImage} />
            )} */}

            {beforePreviewBase64Image && (
                <>
                    <Text style={{ fontSize: 30 }}>BEFORE</Text>
                    <Image
                        source={{ uri: beforePreviewBase64Image }}
                        style={styles.previewImage}
                    />
                </>
            )}

            {afterPreviewBase64Image && (
                <>
                    <Text style={{ fontSize: 30 }}>AFTER</Text>
                    <Image
                        source={{ uri: afterPreviewBase64Image }}
                        style={styles.previewBase64Image}
                    />
                </>
            )}
        </View>
    );
};

export default StudyScreen2;

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