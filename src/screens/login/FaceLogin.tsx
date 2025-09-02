import React, {
    useEffect,
    useRef,
    useState
} from 'react'
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
    Image,
    TouchableWithoutFeedback,
    TouchableOpacity, Modal
} from "react-native";
import KeepAwake from 'react-native-keep-awake';
import {
    CameraPosition,
    DrawableFrame,
    Frame,
    Camera as VisionCamera,
    runAsync,
    useCameraDevice,
    useCameraFormat,
    useCameraPermission,
    useMicrophonePermission,
    useFrameProcessor,
} from 'react-native-vision-camera'
import ImageResizer from 'react-native-image-resizer';
import ImageEditor from '@react-native-community/image-editor';

import {
    Camera,
    Face,
    FaceDetectionOptions
} from 'react-native-vision-camera-face-detector'
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/modules/redux/RootReducer";
import DeviceInfoUtil from "../../common/utils/DeviceInfoUtil";
import DementionUtils from "../../common/utils/DementionUtils";
import NetInfo, {NetInfoSubscription} from "@react-native-community/netinfo";
import {AxiosResponse} from "axios";
import AttendanceService from "../../services/attendance/AttendanceService";
import {UserType} from "@/types/UserType";
import {LoginType} from "@/types/LoginType";
import {CommonType} from "@/types/common/CommonType";
import {StudyType} from "@/types/StudyType";
import { setUserData } from "../../modules/redux/slice/UserSlice";
import {SUCCESS_CODE} from "../../common/utils/codes/CommonCode";
import LoginService from "../../services/login/LoginService";
import TbStdyDoDtlModules from "../../modules/sqlite/TbStdyDoDtlModules";
import StudyService from "../../services/study/StudyService.ts";

const { heightRelateSize, widthRelateSize, fontRelateSize, marginRelateSize } = DementionUtils

const FaceLogin = ({ route, navigation }) => {

    const dispatch = useDispatch();
    const userState = useSelector((state: RootState) => state.userInfo); // Redux 저장소에서 데이터를 조회해옵니다.
    const authState = useSelector((state: RootState) => state.authInfo); // Redux 저장소에서 데이터를 조회해옵니다.

    const [
        cameraFacing,
        setCameraFacing
    ] = useState<CameraPosition>( 'front' )

    const faceDetectionOptions = useRef<FaceDetectionOptions>( {
        minFaceSize: 0.5,
        performanceMode: 'accurate',
        classificationMode: 'all',
        contourMode: 'all',
        landmarkMode: 'all',
        windowWidth: 480,
        windowHeight: 640
    } ).current
    const camera = useRef<VisionCamera>( null )
    const hasCaptured = useRef(false);
    const isRecognizingRef = useRef(false);
    const isRegisteringRef = useRef(false);
    // 중단 플래그 추가
    const flowAbortedRef = useRef(false);
    const [isFaceRegisterModalVisible, setIsFaceRegisterModalVisible] = useState(false);
    // 얼굴 등록 확인 및 동의 모달 관련 상태
    const [registerConfirmVisible, setRegisterConfirmVisible] = useState(false);
    const [consentChecked, setConsentChecked] = useState(false);
    const [pendingRegisterUserName, setPendingRegisterUserName] = useState('');
    const faceDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [registerUserName, setRegisterUserName] = useState("");
    const [pressedKey, setPressedKey] = useState<string | null>(null);
    const isAttendId = useRef<string>('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    // State to control Camera activation
    const [isCameraActive, setIsCameraActive] = useState(false);

    const device = useCameraDevice('front')
    const format = useCameraFormat(device, [
        { fps: 15 },
        { videoResolution: { width: 480, height: 640 } },
    ]);
    // ONNX 모델의 입력 사이즈
    const STDY_SEC = '00:00:00';

    const { hasPermission, requestPermission } = useCameraPermission()
    const inConnectNetworkRef = useRef<boolean>(true); // 네트워크의 연결 여부를 체크합니다.
    const [userInfo, setUserInfo] = useState<UserType.UserSimple>({
        userSq: 0,
        userUuid: "",
        loginUserId: "",
        userNm: "",
    });
    // Success modal state
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successUserName, setSuccessUserName] = useState('');

    /**
     * 화면이 렌더링 된 이후에 수행이 됩니다.
     */
    const initialize = async () => {
        // [STEP1] 앱 꺼짐 방지
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
            KeepAwake.activate();
        }

        isRecognizingRef.current = false;
        flowAbortedRef.current = false;
        // [STEP2] 해당 페이지에 최초 들어왔을 경우 '권한체크'를 수행합니다.


        const hasPermission = await requestPermission()
        console.log('hasPermission',hasPermission)
        if ( !hasPermission ) {
            Alert.alert(
                "카메라 권한 확인",
                "카메라 권한을 확인 하여 주세요.",
                [
                    {
                        text: "확인",
                        onPress: () => {
                            navigation.reset({ routes: [{ name: 'LOGIN_SELECT' }] });
                        }
                    }
                ]
            );
        }

        // [STEP3] 안드로이드 뒤로가기 버튼에 대해 방지합니다.
        DeviceInfoUtil.hardwareBackRemove(navigation, true);

        // [STEP4] 네트워크 연결에 상태를 감지하는 리스너를 등록합니다
        networkChangeCheckListener();

        startInactivityTimer(); // 최초 진입 시 비활성 타이머 시작

        setTimeout(() => {
            setIsCameraActive(true);
        }, 1000);

    };

    useEffect(() => {
        initialize();

        return () => {
            // KeepAwake.deactivate();
            flowAbortedRef.current = true; // 이후 모든 비동기 결과 무시
            isRecognizingRef.current = false;
            setIsCameraActive(false); // Stop camera when component unmounts or page changes
            if (faceDetectionTimeoutRef.current) {
                clearTimeout(faceDetectionTimeoutRef.current);
            }
        };
    }, []);

    // Inactivity timer function
    const startInactivityTimer = () => {
        if (faceDetectionTimeoutRef.current) {
            clearTimeout(faceDetectionTimeoutRef.current);
        }
        console.log("startInactivityTimer!!")
        if (!isRecognizingRef.current || !isRegisteringRef.current){
            faceDetectionTimeoutRef.current = setTimeout(() => {
                flowAbortedRef.current = true;
                setIsCameraActive(false);
                navigation.reset({ routes: [{ name: 'LOGIN_SELECT' }] });
            }, 60000);
        }
    };

    // Reset inactivity timer on touch
    const handleTouch = () => {
        startInactivityTimer();
    };


    function handleFacesDetected(
        faces: Face[],
        frame: Frame
    ): void {

        // 화면 해상도 기준값 (카메라 프레임의 크기)
        const frameWidth = frame.width;
        const frameHeight = frame.height;

        // 중앙 영역 범위 설정 (가로/세로 각각 중앙 30% 범위)
        const centerXMin = frameWidth * 0.3;
        const centerXMax = frameWidth * 0.7;
        const centerYMin = frameHeight * 0.2;
        const centerYMax = frameHeight * 0.8;

        // if no faces are detected we do nothing
        if ( faces.length <= 0 || isRecognizingRef.current) {
            return
        }

        // 크기 + 위치 조건으로 얼굴 필터링
        const validFaces = faces.filter(face => {
            const { x, y, width, height } = face.bounds;

            // 크기 조건
            const sizeOk = width >= 180 && height >= 180;

            console.log("sizeOk-->", sizeOk);

            // 중심 좌표 계산
            const centerX = x + width / 2;
            const centerY = y + height / 2;

            // 중앙 위치 조건
            const centerOk =
                centerX >= centerXMin &&
                centerX <= centerXMax &&
                centerY >= centerYMin &&
                centerY <= centerYMax;

            console.log("centerOk-->", centerOk);

            return sizeOk && centerOk;
        });

        if (validFaces.length === 0) {
            return;
        }
        console.log(
            "✅ 얼굴 감지됨 (TFJS)",
            'faces', validFaces.length,
            'frame', frame.toString(),
            'faceSize', validFaces.map(f => f.bounds),
            'faceCenter', validFaces.map(f => ({
                x: f.bounds.x + f.bounds.width / 2,
                y: f.bounds.y + f.bounds.height / 2
            })),
            'faceLandmark', validFaces.map(f => f.landmarks)
        )

        isRecognizingRef.current = true;

        const { x, y, width, height } = validFaces[0].bounds;

        // only call camera methods if ref is defined
        if ( camera.current && validFaces.length > 0 && !hasCaptured.current) {
            // take photo, capture video, etc...
            console.log("takePictureAndConvert >>", x,y,width,height)
            if (flowAbortedRef.current) return;
            takePictureAndConvert(x,y,width,height);

        }
    }

    const takePictureAndConvert = async (x:number, y:number,w:number,h:number) => {
        try {
            if (!camera.current) return;
            if (flowAbortedRef.current) return;

            const photo = await camera.current.takeSnapshot();
            hasCaptured.current = true;
            console.log(photo.path)

            const resized = await ImageResizer.createResizedImage(
                photo.path,
                480,
                640,
                'JPEG',
                80
            );

            // const cropData = {
            //     offset: { x: x, y: y },
            //     size: { width: w, height: h },
            // };
            //
            // const croppedUri = await ImageEditor.cropImage(resized.uri, cropData);
            // console.log(croppedUri)
            // setPhotoUri(croppedUri.uri);

            if (flowAbortedRef.current) return;

            if (!isRegisteringRef.current) {
                console.log("✅ 얼굴 인식 시작 (TFJS)");
                await handleFaceRecognition(resized.uri);
            } else {
                console.log("✅ 얼굴 등록 시작 (TFJS)");
                await handleFaceRegister(resized.uri);
            }


        } catch (error) {
            console.error('Error capturing photo and converting to tensor:', error);
        }
    };


    /**
     * 네트워크 변화에 대해 체크하는 리스너
     * @returns
     */
    const networkChangeCheckListener= (): NetInfoSubscription => {
        console.log('[+] 연결 상태 확인');
        return NetInfo.addEventListener((state) => {
            inConnectNetworkRef.current = state.isConnected!; // 연결 상태를 변수로 저장합니다.
            // 네트워크 연결이 끊겼을때, 학습을 중단시키고 팝업을 출력합니다.
            if (!inConnectNetworkRef.current) {
                disconnectNetworkAlert();
            }
        });
    }

    /**
     * 네트워크 연결이 끊겼을때, 메시지를 출력합니다.
     * @returns
     */
    const disconnectNetworkAlert= (): void => {
        console.log('네트워크 연결이 끊겼습니다.');
        Alert.alert("인터넷 연결을 확인해주세요.");
        return;
    }

    const handleFaceRecognition= async (uri: string) => {

        if (flowAbortedRef.current) return;
        const formData = new FormData();
        formData.append('collectionId', userState.groups.grpId);
        formData.append('file', {
            uri: uri,
            name: 'face.jpg',
            type: 'image/jpeg',
        } as any);

        try {
            const response = await LoginService.verifyFace(authState, formData);
            const { result, resultCode } = response.data;

            if (resultCode == 200) {
                console.log("✅ 얼굴 인식 성공:", response.data.result);

                if (flowAbortedRef.current) return;

                // 얼굴인식 성공, 출결코드 받아옴
                if (result !== null) {
                    await getUserLogin(result);
                } else {
                    // 얼굴 인식은 성공했으나 등록된 얼굴이 없거나 누군지 판별이 안되서 얼굴 등록으로 실행
                    setIsFaceRegisterModalVisible(true);
                }
                // 서버에 이미지를 전송했으나 얼굴이 검출되지 않음(3초후 이미지를 찍기 때문에 그사아 얼굴이 없거나 변형될 수 있음
            } else if (resultCode === "9999") {
                console.log("❌ 얼굴 인식 실패:", response.data.resultCode, response.data.reason);
                hasCaptured.current = false;
                isRecognizingRef.current = false;
                // 등록된 CollectionId가 없어 등록을 못하는 경우 이경우는 CollectionId를 생성하면서 얼굴등록을 해야함
            } else if (resultCode === "8888") {
                console.log("❌ 얼굴 인식 실패:", response.data.resultCode, response.data.reason);
                Alert.alert(
                    "얼굴인식 실패",
                    "얼굴인식에 오류가 발생하였습니다(기관등록 오류).",
                    [
                        {
                            text: "확인",
                            onPress: () => {
                                hasCaptured.current = false;
                                isRecognizingRef.current = false;
                                setIsCameraActive(false); // Stop camera when component unmounts or page changes
                                if (faceDetectionTimeoutRef.current) {
                                    clearTimeout(faceDetectionTimeoutRef.current);
                                }
                                navigation.reset({ routes: [{ name: 'ATTENDANCE' }] });
                            }
                        }
                    ]
                );
            }

        } catch (err) {
            console.log("❌ 얼굴 인식 실패:", err);
            hasCaptured.current = false;
            isRecognizingRef.current = false;
        }
    }

    /**
     * 사용자 정보 조회합니다.
     */
    const getUserLogin = async (userId: string) => {
        let userLoginId = userState.groups.grpId + userId;
        let requestAuthId: { loginId: string } = {
            loginId: userLoginId,
        };
        await AttendanceService.getUserLoginInfo(authState, requestAuthId)
            .then(
                (
                    res: AxiosResponse<UserType.UserInfo & CommonType.apiResponseType, any>,
                ) => {
                    let { result, resultCode, resultMsg } = res.data;
                    if (resultCode == SUCCESS_CODE.SELECT) {
                        if (result) {

                            if (flowAbortedRef.current) return;

                            console.log("✅ userInfo:", result);
                            // setSuccessUserName(result['userNm']);
                            // setShowSuccessModal(true);
                            setUserInfo({
                                ...userInfo,
                                userSq: result['userSq'],
                                userUuid: result['userUuid'],
                                userNm: result['userNm'],
                                loginUserId: userLoginId,
                            });

                            if (userLoginId) {

                                if (flowAbortedRef.current) return;
                                requestAttendance(userLoginId)
                            }else{
                                console.log("✅ userInfologinUserId is null:", userLoginId);
                            }

                        } else {
                            Alert.alert(
                                "회원조회 실패",
                                `출결번호가 ${userId}인 회원정보가 없습니다.`,
                                [
                                    {
                                        text: "확인",
                                        onPress: () => {
                                            setIsCameraActive(false); // Stop camera when component unmounts or page changes
                                            if (faceDetectionTimeoutRef.current) {
                                                clearTimeout(faceDetectionTimeoutRef.current);
                                            }
                                            navigation.reset({ routes: [{ name: 'ATTENDANCE' }] });
                                        }
                                    }
                                ]
                            );
                        }
                    }
                },
            )
            .catch((err) => {
                console.error(
                    `[-] getUserLoginInfo() 함수에서 에러가 발생하였습니다 : ${err}`,
                );
            });
    }

    const handleFaceRegister = async (uri: string) => {

        const formData = new FormData();
        formData.append('file', {
            uri: uri,
            name: 'face.jpg',
            type: 'image/jpeg',
        } as any);
        formData.append('collectionId', userState.groups.grpId);
        formData.append('userId', isAttendId.current);

        console.log('collectionId::' + userState.groups.grpId)
        console.log('registerUserName::' + isAttendId.current)

        try {
            const response = await LoginService.registerFace(authState, formData);
            if (response.data.resultCode === 200) {
                console.log("✅ 얼굴 등록 성공");
                Alert.alert(
                    "얼굴등록 성공",
                    "얼굴 등록에 성공했습니다. 다시 로그인 해 주시기 바랍니다.",
                    [
                        {
                            text: "확인",
                            onPress: () => {
                                isRegisteringRef.current = false;
                                isRecognizingRef.current = false;
                                hasCaptured.current = false;
                            }
                        }
                    ]
                );
            } else {
                console.log("❌ 얼굴 등록 실패:", response.data.reason);
                isRegisteringRef.current = true;
                Alert.alert(
                    "얼굴등록 실패",
                    "얼굴 등록중 실패했습니다. 다시 등록해 주시기 바랍니다.",
                    [
                        {
                            text: "확인",
                            onPress: () => {
                                setIsCameraActive(false); // Stop camera when component unmounts or page changes
                                if (faceDetectionTimeoutRef.current) {
                                    clearTimeout(faceDetectionTimeoutRef.current);
                                }
                                navigation.reset({ routes: [{ name: 'ATTENDANCE' }] });
                            }
                        }
                    ]
                );
            }
        } catch (e) {
            console.log("❌ 얼굴 등록 중 오류:", e);
            isRegisteringRef.current = true;
            Alert.alert(
                "얼굴등록 오류",
                "얼굴 등록중 오류가 발생했습니다.",
                [
                    {
                        text: "확인",
                        onPress: () => {
                            setIsCameraActive(false); // Stop camera when component unmounts or page changes
                            if (faceDetectionTimeoutRef.current) {
                                clearTimeout(faceDetectionTimeoutRef.current);
                            }
                            navigation.reset({ routes: [{ name: 'ATTENDANCE' }] });
                        }
                    }
                ]
            );
        }
        setRegisterUserName("");

    }

    /**
     * 출석 및 로그인을 요청합니다.
     * @return {Promise<void>}
     */
    const requestAttendance = async (
        loginId: string,
    ): Promise<void> => {
        const requestLoginHis: LoginType.AttendanceDto = {
            userSq: userInfo['userSq'],
            userNm: userInfo['userNm'],
            loginId: loginId,
            userIp: await DeviceInfoUtil.getDeviceIpAddr(),
        };
        await AttendanceService.requestAttendanceIn(authState, requestLoginHis)
            .then(
                async (
                    res: AxiosResponse<
                        LoginType.LoginHistDto & CommonType.apiResponseType,
                        any
                    >,
                ) => {
                    let { result, resultCode, resultMsg } = res.data;

                    if (resultCode == SUCCESS_CODE.SELECT) {
                        if (flowAbortedRef.current) return;
                        if (result) {
                            let { userSq, userNm, userUuid, continueDoSq } = result;

                            //회원 정보 저장
                            dispatch(setUserData({
                                userSq: userSq,
                                userUuid: userUuid,
                                userNm: userNm,
                                loginId: loginId
                            }));

                            // 이어하기 정보가 있는 경우
                            if (continueDoSq > 0) {

                                console.log('[+] 이어하기 정보가 있음 ');
                                if (flowAbortedRef.current) return;
                                if (continueDoSq) {
                                    // [STEP1] [SQlite]내에서 데이터 존재여부를 반환받습니다.
                                    const stdyDtlCnt = await TbStdyDoDtlModules.selectStdyDtlCnt(continueDoSq!);
                                    // [CASE2-1] TB_STDY_DO_DTL 데이터가 존재하지 않는 경우 : doSq로만 학습 종료 테이블을 등록합니다.
                                    if (stdyDtlCnt === 0) {
                                        console.log('[+] 로컬 데이터가 존재하지 않는 경우에 대한 처리 ');
                                        const selectStdyDoDtlAvg: StudyType.StudyDoDtlSQliteDto = {
                                            doSq: continueDoSq!,
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
                                        await insertStudyDoEnd(selectStdyDoDtlAvg);
                                    } else {
                                        console.log('[+] 로컬 데이터가 존재하지 않는 경우에 대한 처리 ');
                                        /*
                                         * [CASE2-2] TB_STDY_DO_DTL 데이터가 존재하지 않는 경우
                                         * - 1. SQLITE 내에 DTL 테이블로 평균값을 추출합니다
                                         * - 2. SQLITE 내에 DTL 테이블로 감정(EMTN)을 추출합니다
                                         * - 3. SQLITE 내에 DTL 테이블로 표현(EXPR)을 추출합니다
                                         * - 4. API 서버로 모든 데이터를 전송합니다.
                                         * - 5. SQLITE 내에 DTL 테이블 데이터 초기화
                                         */
                                        const { selectStdyDoDtlAvg, selectStudyDoEmtn, selectStudyDoExpr, deleteStudyDoDtl, selectStdyDoDtlList } =
                                            TbStdyDoDtlModules;
                                        const selectStdyDoDtlAvgRlt = await selectStdyDoDtlAvg(continueDoSq); // 1. [SQLite] TB_STDY_DO_DTL 평균 조회
                                        selectStdyDoDtlAvgRlt.doSq = continueDoSq;
                                        const studyDoEmtnList = await selectStudyDoEmtn(continueDoSq); // 2. [SQLite]TB_STDY_DO_DTL 기반 감정(EMTN) 조회
                                        const studyDoExprList = await selectStudyDoExpr(continueDoSq); // 3. [SQLite]TB_STDY_DO_DTL 기반 표현(EXPR) 조회
                                        selectStdyDoDtlAvgRlt.studyDoEmtnDtoList = studyDoEmtnList;
                                        selectStdyDoDtlAvgRlt.studyDoExprDtoList = studyDoExprList;
                                        await insertStudyDoEnd(selectStdyDoDtlAvgRlt); // 4. [SQLite]API 서버로 모든 데이터를 전송합니다.

																																							 const dtlList = await TbStdyDoDtlModules.selectStdyDoDtlListAll(continueDoSq); // 완전 삭제가 되었는지 보자.
																																							 await apiHandler.studyDoDtlList(dtlList);

                                        await deleteStudyDoDtl(continueDoSq); // 5. [SQLite] SQLITE 내에 DTL 테이블 데이터 초기화
                                    }
                                    await TbStdyDoDtlModules.selectStdyDoDtlList(continueDoSq); // TODO : 완전 삭제되었는지 한번 체크
                                }
                            }

                            console.log("학습계획으로 이동!!")
                            setIsCameraActive(false); // Stop camera when component unmounts or page changes
                            if (faceDetectionTimeoutRef.current) {
                                clearTimeout(faceDetectionTimeoutRef.current);
                            }

                            navigation.replace('STUDY_PLAN', {
                                doSq: 0,
                                isContinue: false,
                                stdySec: STDY_SEC,
                            });

                        } else {

                            console.log(
                                '[+] 로그인 중에 오류가 발생하였습니다.',
                                resultCode,
                                result,
                                resultMsg,
                            );
                            Alert.alert(
                                "로그인 실패",
                                "로그인 처리 중 오류가 발생하였습니다.",
                                [
                                    {
                                        text: "확인",
                                        onPress: () => {
                                            setIsCameraActive(false); // Stop camera when component unmounts or page changes
                                            if (faceDetectionTimeoutRef.current) {
                                                clearTimeout(faceDetectionTimeoutRef.current);
                                            }
                                            navigation.reset({ routes: [{ name: 'ATTENDANCE' }] });
                                        }
                                    }
                                ]
                            );
                        }
                    } else {

                        console.log(
                            '[+] 로그인 중에 오류가 발생하였습니다.',
                            resultCode,
                            result,
                            resultMsg,
                        );

                        Alert.alert(
                            "로그인 실패",
                            "로그인 중에 오류가 발생하였습니다.",
                            [
                                {
                                    text: "확인",
                                    onPress: () => {
                                        setIsCameraActive(false); // Stop camera when component unmounts or page changes
                                        if (faceDetectionTimeoutRef.current) {
                                            clearTimeout(faceDetectionTimeoutRef.current);
                                        }
                                        navigation.reset({ routes: [{ name: 'ATTENDANCE' }] });
                                    }
                                }
                            ]
                        );
                    }
                },
            )
            .catch((err) => {
                console.error(
                    `[-] requestAttendance() 함수에서 에러가 발생하였습니다 : ${err}`,
                );
            });
    }

    const onClose = () => {
        flowAbortedRef.current = true;
        setIsFaceRegisterModalVisible(false);
        setRegisterUserName('');
        setIsCameraActive(false);
        if (faceDetectionTimeoutRef.current) {
           clearTimeout(faceDetectionTimeoutRef.current);
        }
        Alert.alert(
            "얼굴등록 취소",
            "얼굴등록을 취소하여 로그인선택화면으로 이동합니다.",
            [
               {
                    text: "확인",
                    onPress: () => {
                        navigation.reset({ routes: [{ name: 'LOGIN_SELECT' }] });
                }
            }
           ]
      );
    };


    /**
     * 학습 실행(TB_STUDY_DO_END) 테이블 INSERT
     * @param {StudyType.StudyDoEndDto} studyDoEnd 학습 실행 종료 정보
     * @return {Promise<void>} 별도 처리 없음
     */
    const insertStudyDoEnd = async (studyDoEnd: StudyType.StudyDoEndDto): Promise<void> => {
        await StudyService.insertStudyDoEnd(authState, studyDoEnd)
            .then((res: AxiosResponse<StudyType.StudyDoEndDto & CommonType.apiResponseType, any>) => {
                let { result, resultCode } = res.data;
                // 등록에 성공하였을 경우
                if (resultCode === SUCCESS_CODE.INSERT && result === 1) {
                    console.log('[+] 등록에 성공하였습니다.');
                } else console.log('[-] 등록에 실패하였습니다. 관리자에게 문의해주세요');
            })
            .catch((err) => {
                console.error(`[-] insertStudyDoEnd() 함수에서 에러가 발생하였습니다`, err);
            });
    }
				const apiHandler = (() => {
					return {
						// 학습상세 저장
						studyDoDtlList: async (dtlList: StudyType.StudyDoDtlSQliteDto[]) => {
							try {
								await StudyService.studyDoDtlList(authState, dtlList)
									.then((res) => {
										const { result, resultCode, resultMsg } = res.data;
										console.log('성공 :: ', result, resultCode, resultMsg);
									})
									.catch((err) => {
										console.log('error :: ', err);
									});
							} catch (err) {
								console.error(`[-] studyDoDtlList() 함수에서 에러가 발생하였습니다 : ${err}`);
							}
						},
					};
				})();

				return (
					<TouchableWithoutFeedback onPress={handleTouch}>
						<>
							<SafeAreaView style={styles.container}>
								<StatusBar backgroundColor='white' />

								{/*{photoUri && (*/}
								{/*	<Image*/}
								{/*		source={{ uri: photoUri }}*/}
								{/*		style={{*/}
								{/*			position: 'absolute',*/}
								{/*			top: 200,*/}
								{/*			right: 10,*/}
								{/*			width: 100,*/}
								{/*			height: 100,*/}
								{/*			borderRadius: 8,*/}
								{/*			borderWidth: 1,*/}
								{/*			borderColor: 'white',*/}
								{/*			zIndex: 999,*/}
								{/*		}}*/}
								{/*		resizeMode='contain'*/}
								{/*	/>*/}
								{/*)}*/}

								<View style={{ flex: 1 }}>
									{/* 상단 안내 문구 */}
									<View style={styles.header}>
										<Text style={styles.guideText}>안내선 안으로 얼굴을 쏙!{'\n'} 맞춰 주세요!</Text>
									</View>

									{/* 카메라 영역 */}
									<View style={styles.cameraContainer}>
										{hasPermission && device != null ? (
											<Camera
												ref={camera}
												device={device}
												format={format}
												style={StyleSheet.absoluteFill}
												isActive={isCameraActive}
												pixelFormat={'rgb'}
												fps={15}
												faceDetectionCallback={handleFacesDetected}
												faceDetectionOptions={{
													...faceDetectionOptions,
													cameraFacing,
												}}
											/>
										) : (
											<Text>준비중입니다.</Text>
										)}

										<View pointerEvents='none' style={styles.faceGuideContainer}>
											<Image
												source={require('../../../assets/images/logo/faceGuide.png')}
												style={styles.faceGuideImage}
												resizeMode='contain'
											/>
										</View>
									</View>

									{/* 하단 이동 버튼 */}
									<View style={styles.footer}>
										<TouchableOpacity
											onPress={() => {
                                                flowAbortedRef.current = true;
												setIsCameraActive(false); // Stop camera when component unmounts or page changes
												if (faceDetectionTimeoutRef.current) {
													clearTimeout(faceDetectionTimeoutRef.current);
												}
                                                hasCaptured.current = false;
												navigation.navigate('LOGIN_SELECT');
											}}>
											<View style={styles.footerButtonBox}>
												<Text style={styles.footerText}> 로그인 방법 변경 </Text>
											</View>
										</TouchableOpacity>
									</View>
								</View>
							</SafeAreaView>

							{/* ============================================= 성공 모달 영역 ================================================== */}
							<Modal visible={showSuccessModal} transparent animationType='fade'>
								<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
									<View
										style={{
											backgroundColor: '#2E3138',
											padding: 30,
											borderRadius: 20,
											alignItems: 'center',
											width: '40%',
										}}>
										<Image
											source={require('../../../assets/images/icons/ic_l_alert_48.png')}
											style={{
												width: 48,
												height: 48,
												opacity: 1,
												marginBottom: 20,
											}}
											resizeMode='contain'
										/>
										<Text style={{ color: '#AAB0BE', width: 200, fontSize: 20, marginBottom: 20 }}>
											{successUserName}님 학습페이지로 이동하겠습니다.
										</Text>
										<TouchableOpacity
											style={{
												backgroundColor: '#2E3138',
												paddingHorizontal: 20,
												paddingVertical: 10,
												borderRadius: 10,
											}}
											onPress={() => {
												setShowSuccessModal(false);
												if (userInfo.loginUserId) {
													requestAttendance(userInfo.loginUserId);
												}
											}}>
											<Text style={{ color: '#6491FF', fontSize: 16 }}>확인</Text>
										</TouchableOpacity>
									</View>
								</View>
							</Modal>

							{/* 얼굴 등록 모달 */}
							<Modal visible={isFaceRegisterModalVisible} transparent animationType='fade'>
								<View style={styles.modalContainer2}>
									<TouchableOpacity
										onPress={onClose} // 닫기 함수
										style={{ alignItems: 'flex-end', marginTop: 25, marginRight: 25 }}>
										<Image
											source={require('../../../assets/images/icons/ic_l_close_gray_28.png')}
											style={{
												width: 40,
												height: 40,
												opacity: 1,
											}}
											resizeMode='contain'
										/>
									</TouchableOpacity>
									<View style={styles.innerContainer}>
                                        <Text style={styles.title2}>얼굴 등록 (1/2)</Text>
										<Text style={styles.title1}>등록되지 않은 얼굴입니다</Text>
										<Text style={styles.title2}>출결번호를 입력하고 등록하시겠습니까?</Text>
										<View style={{ marginTop: 10, alignItems: 'center' }}>
											<Text style={{ color: '#fff', fontSize: 24, marginBottom: 10 }}>
												{/*{registerUserName.padEnd(5, '•')}*/}
												{registerUserName}
											</Text>
											<View style={{ height: 1, width: 200, backgroundColor: '#666', marginBottom: 20 }} />
										</View>
										<View style={{ width: 300 }}>
											{[
												['1', '2', '3'],
												['4', '5', '6'],
												['7', '8', '9'],
												['back', '0', 'ok'],
											].map((row, rowIndex) => (
												<View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
													{row.map((item) => (
														<TouchableOpacity
															key={item}
															onPressIn={() => setPressedKey(item)}
															onPressOut={() => setPressedKey(null)}
															onPress={async () => {
																if (item === 'back') {
																	setRegisterUserName((prev) => prev.slice(0, -1));
																} else if (item === 'ok') {
																	if (registerUserName.length < 4 || registerUserName.length > 5) {
																		Alert.alert('입력 오류', '출결번호는 4자리 또는 5자리 숫자로 입력해주세요.');
																		return;
																	}

																	let userLoginId = userState.groups.grpId + registerUserName;
																	let requestAuthId: { loginId: string } = {
																		loginId: userLoginId,
																	};
																	const res = await AttendanceService.getUserLoginInfo(authState, requestAuthId);
																	let { result, resultCode, resultMsg } = res.data;
                                                                    if (resultCode == SUCCESS_CODE.SELECT) {
                                                                        if (result) {
                                                                            console.log("result['userNm']-->",result['userNm'])
                                                                            setIsFaceRegisterModalVisible(false);
                                                                            setPendingRegisterUserName(result['userNm'] || '');
                                                                            setRegisterConfirmVisible(true);
                                                                        } else {
                                                                            Alert.alert('출결번호 오류', '출결번호를 다시한번 확인하여 주시기 바랍니다.');
                                                                        // if (resultCode == SUCCESS_CODE.SELECT) {
                                                                        // 	if (result) {
																		// 	Alert.alert('등록확인', `${result['userNm']}님으로 얼굴등록을 하시겠습니까?`, [
																		// 		{
																		// 			text: '취소',
																		// 			onPress: () => {
																		// 				hasCaptured.current = false;
																		// 				isRecognizingRef.current = false;
																		// 			},
																		// 			style: 'cancel',
																		// 		},
																		// 		{
																		// 			text: '확인',
																		// 			onPress: () => {
																		// 				// 출결번호 존재여부 확인, 있을때 이름 확인하여 진행
																		// 				isAttendId.current = registerUserName;
                                                                        //
																		// 				setIsFaceRegisterModalVisible(false);
                                                                        //
																		// 				setTimeout(() => {
																		// 					hasCaptured.current = false;
																		// 					isRegisteringRef.current = true;
																		// 					isRecognizingRef.current = false;
																		// 				}, 100);
																		// 			},
																		// 		},
																		// 	]);
																		// } else {
																		// 	Alert.alert('출결번호 오류', '출결번호를 다시한번 확인하여 주시기 바랍니다.');
																		}
																	}
																} else if (registerUserName.length < 5) {
																	setRegisterUserName((prev) => prev + item);
																}
															}}
															style={{
																width: 80,
																height: 80,
																backgroundColor: pressedKey === item ? '#555' : '#2c2c2c',
																justifyContent: 'center',
																alignItems: 'center',
																borderRadius: 10,
															}}>
															<Text style={{ color: '#ccc', fontSize: 35 }}>
																{item === 'back' ? '⌫' : item === 'ok' ? 'OK' : item}
															</Text>
														</TouchableOpacity>
													))}
												</View>
											))}
										</View>
									</View>
								</View>
							</Modal>

                            {/* 얼굴 등록 확인 + 동의 모달 */}
                            <Modal visible={registerConfirmVisible} transparent animationType='fade'>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
                                    <View style={{ backgroundColor: '#2E3138', padding: 24, borderRadius: 16, width: '80%', maxWidth: 520, alignItems: 'center' }}>
                                        <Text style={{ color: '#F0F1F2', fontSize: 20, fontWeight: 'bold', marginBottom: 18 }}>얼굴 등록 (2/2)</Text>
                                        <Text style={{ color: '#AAB0BE', fontSize: 16, marginBottom: 12 }}>
                                            출결번호 <Text style={{ color: '#F0F1F2', fontSize: 20, marginBottom: 12 }}>{registerUserName}  {pendingRegisterUserName} </Text>님!
                                        </Text>
                                        <Text style={{ color: '#F0F1F2', fontSize: 20, marginBottom: 26 }}>
                                            얼굴인식 기능을 사용하시겠어요?
                                        </Text>

                                        <View style={{ width: '80%', maxWidth: 520,borderWidth: 1, borderColor: '#666', marginBottom: 6 }}>
                                            <View style={{ flexDirection: 'row', backgroundColor: '#3a3d45' }}>
                                                <Text style={{ flex: 1, color: '#F0F1F2', fontSize: 14, textAlign: 'center', padding: 6 }}>항목</Text>
                                                <Text style={{ flex: 2, color: '#F0F1F2', fontSize: 14, textAlign: 'center', padding: 6 }}>목적</Text>
                                                <Text style={{ flex: 2, color: '#F0F1F2', fontSize: 14, textAlign: 'center', padding: 6 }}>보유·이용기간</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text style={{ flex: 1, color: '#AAB0BE', fontSize: 14, textAlign: 'center', padding: 6 }}>얼굴</Text>
                                                <Text style={{ flex: 2, color: '#AAB0BE', fontSize: 14, textAlign: 'center', padding: 6 }}>TUGBOAT-A{'\n'}스마트 학습 서비스 제공</Text>
                                                <Text style={{ flex: 2, color: '#AAB0BE', fontSize: 14, textAlign: 'center', padding: 6 }}>서비스 탈퇴 시</Text>
                                            </View>
                                        </View>
                                        <Text style={{ color: '#AAB0BE', fontSize: 13, lineHeight: 18, marginBottom: 16 ,marginTop: 8 }}>
                                            ※ 위의 민감정보 처리에 대한 동의를 거부할 권리가 있습니다.{"\n"}
                                            단, 동의를 거부할 경우 얼굴인식 기능 사용이 제한 될 수 있습니다.
                                        </Text>
                                        {/*<Text style={{ color: '#AAB0BE', fontSize: 16 }}>*/}
                                        {/*    ■ 목적 : TUGBOATA 스마트 학습 서비스 제공 {'\n'}*/}
                                        {/*    ■ 항목 : 얼굴 {'\n'}*/}
                                        {/*    ■ 보유·이용 기간: 서비스 탈퇴 시 {'\n'}{'\n'}*/}
                                        {/*    위의 민감정보 처리에 대한 동의를 거부할 권리가 있습니다.{'\n'}{'\n'}*/}
                                        {/*    단, 동의를 거부할 경우 얼굴인식 기능 사용이 제한 될 수 있습니다. {'\n'}*/}
                                        {/*</Text>*/}

                                        {/* 동의 영역 */}
                                        <TouchableOpacity
                                            onPress={() => setConsentChecked(!consentChecked)}
                                            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 26 , justifyContent:'center'}}
                                            activeOpacity={0.8}
                                        >
                                            <View
                                                style={{
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: 4,
                                                    borderWidth: 1,
                                                    borderColor: consentChecked ? '#6491FF' : '#666',
                                                    backgroundColor: consentChecked ? '#6491FF' : 'transparent',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    marginRight: 10,
                                                }}
                                            >
                                                {consentChecked && <Text style={{ color: '#fff', fontSize: 16 }}>✓</Text>}
                                            </View>
                                            <Text style={{ color: '#AAB0BE', fontSize: 16, justifyContent:'center', alignItems:'center' }}>
                                                (필수) 민감정보 수집·이용 동의
                                            </Text>
                                        </TouchableOpacity>


                                        {/*<Text style={{ color: '#AAB0BE', fontSize: 16, marginBottom: 16 }}>*/}
                                        {/*    동의하시면 사용하기를 누르세요.*/}
                                        {/*</Text>*/}

                                        {/* 버튼 영역 */}
                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    flowAbortedRef.current = true;
                                                    setIsFaceRegisterModalVisible(false);
                                                    setRegisterConfirmVisible(false);
                                                    setConsentChecked(false);
                                                    // 이전 Alert 취소 시 하던 동작 유지
                                                    hasCaptured.current = false;
                                                    isRecognizingRef.current = false;
                                                    isRegisteringRef.current = false;
                                                    navigation.reset({ routes: [{ name: 'LOGIN_SELECT' }] });
                                                }}
                                                style={{ paddingHorizontal: 16, paddingVertical: 10, marginRight: 8 }}
                                            >
                                                <Text style={{ color: '#AAB0BE', fontSize: 16 }}>사용하지 않음</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                disabled={!consentChecked}
                                                onPress={() => {
                                                    // 출결번호 존재여부 확인, 있을때 이름 확인하여 진행
                                                    isAttendId.current = registerUserName; // 기존 입력한 출결번호 사용

                                                    setRegisterConfirmVisible(false);
                                                    setIsFaceRegisterModalVisible(false);

                                                    setTimeout(() => {
                                                        hasCaptured.current = false;
                                                        isRegisteringRef.current = true;
                                                        isRecognizingRef.current = false;
                                                        setConsentChecked(false);
                                                    }, 100);
                                                }}
                                                style={{
                                                    paddingHorizontal: 16,
                                                    paddingVertical: 10,
                                                    backgroundColor: consentChecked ? '#6491FF' : '#4a4d55',
                                                    borderRadius: 8,
                                                }}
                                            >
                                                <Text style={{ color: '#fff', fontSize: 16 }}>사용하기</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </Modal>


						</>
					</TouchableWithoutFeedback>
				);
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    header: {
        position: 'absolute',
        // top: 0,
        // right: 0,
        // bottom: 0,
        // left: 0,
        zIndex: 1,
        width: '100%',
        height: 180,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        // marginTop: 10,
    },
    cameraContainer: {
        flex: 1
    },
    cameraFrame: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    faceGuideContainer: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        // backgroundColor: "red"
    },
    faceGuideImage: {
        position: 'absolute',
        top: '35%',
        alignSelf: 'center',
        width: 400,
        height: 400,
        opacity: 1,
    },
    footer: {
        height: 180,
        justifyContent: 'center',
        alignItems: 'center',
    },
    guideText: {
        color: 'white',
        fontSize: fontRelateSize(14),
        fontWeight: '600',
    },
    footerButtonBox: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        borderColor: '#6491FF',
        borderWidth: 1,
    },
    footerText: {
        color: '#6491FF',
        fontSize: fontRelateSize(14),
        textAlign: 'center',
    },

    /**
     * 권한 팝업 모달
     */
    modalContainer2: {
        width: widthRelateSize(250),
        height: heightRelateSize(355),
        borderRadius: 20,
        backgroundColor: "#2e3138",
        marginTop: heightRelateSize(162),
        marginLeft: widthRelateSize(54)
    },
    innerContainer: {
        marginTop: heightRelateSize(12),
        // marginLeft: widthRelateSize(10),
        alignItems: "center"
    },
    titleArea: {
        height: heightRelateSize(42),
        marginBottom: heightRelateSize(24)
    },
    title1: {
        width: widthRelateSize(244),
        height: heightRelateSize(17),
        fontFamily: "NanumBarunGothic",
        fontSize: fontRelateSize(12),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#aab0be",
        marginBottom: heightRelateSize(8)
    },
    title2: {
        width: widthRelateSize(244),
        height: heightRelateSize(19),
        fontFamily: "NanumBarunGothic",
        fontSize: fontRelateSize(14),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#f0f1f2"
    },
    titleBottomLine: {
        width: widthRelateSize(244),
        height: heightRelateSize(1),
        backgroundColor: "#383d45",
        marginBottom: heightRelateSize(23)

    },
    permissionBottonArea: {
        // flex: 1,
        textAlign: "center",
        width: widthRelateSize(276),
        height: heightRelateSize(64),
        flexDirection: "row",
    },
    permissionBottonFrame: {
        zIndex: 1,
        width: widthRelateSize(152),
        height: heightRelateSize(64),
    },
    permissionBottonTxt: {
        zIndex: 1,
        width: widthRelateSize(28),
        height: heightRelateSize(16),
        fontFamily: "NanumBarunGothic",
        fontSize: fontRelateSize(14),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "left",
        color: "#6491ff",
        marginLeft: widthRelateSize(44),
        marginTop: heightRelateSize(24)
    }

});
export default FaceLogin;


