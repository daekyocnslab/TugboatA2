import { createRef, RefObject, useEffect, useRef, useState } from "react";

import { Camera, CameraType, CameraView } from "expo-camera";
import { cameraWithTensors } from "@tensorflow/tfjs-react-native";
import { Platform, SafeAreaView, StyleSheet, Text } from "react-native";
import * as tf from '@tensorflow/tfjs';
import { FaceDetetorType } from "@/types/FaceDetectorType";

const TensorCamera = cameraWithTensors(CameraView);

const LOOP_INTERVAL = 1000; // 학습 루프 시간

const TensorCameraScreen = () => {


    const loopStartTimeRef = useRef<number>(0); // 루프 시작시간
    const tensorCameraRef: RefObject<any> = createRef<CameraView>(); // TensorCamera 속성 관리

    const [facing, setFacing] = useState<CameraType>('back');
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const TEXTURE_DIMS = Platform.OS === "ios" ? { height: 1920, width: 1080 } : { height: 1200, width: 1600 };
    const [initModel, setInitModel] = useState<FaceDetetorType.InitModelState>({
        isLoading: false,
        isTensorReady: false,
        faceMeshModel: null,
        hsemotionModel: null,
        fsanetModel: null,
        hPoseModel: null,
    });

    useEffect(() => {
        const init = async () => {
            // TensorFlow.js 초기화
            await studyMainHandler.loadInitModel();

            // 카메라 권한 요청
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };

        init();
    }, []);

    const studyMainHandler = (() => {
        return {
            /**
             * 학습과 관련된 인공지능 모델을 불러와서 State내에 세팅하는 이벤트
             *
             * [STEP1] Tensor Model Load
             * [STEP2] faceMesh Model Configuration
             * [STEP3] faceMesh Model Load
             * [STEP4] hsemotion Model Load
             * [STEP5] FSA-NET Model Load
             * [STEP6] HPose Model Load
             * [STEP7] Setting State
             * @return {Promise<void>}
             */
            loadInitModel: async (): Promise<void> => {
                // [STEP1] Tensor Model Load
                let _tensorReady: boolean = false;
                await tf.ready(); // ✅ 추가
                await tf.setBackend('rn-webgl')
                    .then(() => {
                        console.log('[+] Load Tensorflow.js....');
                        _tensorReady = true;
                        tf.engine().startScope();
                    })
                    .catch((error) => {
                        console.error(`[-] Tensorflow Ready Error: ${error}`);
                    });

                setInitModel({
                    isLoading: true,                // 로딩 바 수행여부
                    isTensorReady: _tensorReady,    // Tensorflow 모델
                    faceMeshModel: null,            // fashmesh 모델
                    hsemotionModel: null, // hsemotion 모델
                    fsanetModel: null, // FSA-NET 모델
                    hPoseModel: null, // HPose 모델
                })

            },
            readyTensorCamera: async (images: IterableIterator<tf.Tensor3D>): Promise<void> => {
                console.log("readyTensorCamera : ")
                const _loop = async () => {
                    const _imageToTensor = images.next().value;
                    console.log("_imageToTensor : ", _imageToTensor);

                    setTimeout(() => {
                        loopStartTimeRef.current = 0;
                        _loop(); // 재귀
                    }, LOOP_INTERVAL);
                };
                await _loop();
            }
        }
    })()



    return (
        <SafeAreaView style={styles.container} >
            {
                initModel.isLoading && initModel.isTensorReady &&
                <>
                    {hasPermission === null && <Text>카메라 권한 확인 중...</Text>}

                    {hasPermission === false && (
                        <Text style={styles.message}>카메라 권한이 없습니다.</Text>
                    )}


                    {console.log("일단 카메라 화면은 보임")}
                    <TensorCamera
                        ref={tensorCameraRef} // 속성 정보
                        style={styles.camera}
                        facing={facing}
                        ratio={'16:9'}
                        cameraTextureHeight={TEXTURE_DIMS.height} // 카메라 미리 보기 높이 값
                        cameraTextureWidth={TEXTURE_DIMS.width} // 카메라 미리 보기 너비 값
                        resizeHeight={320} // 출력 카메라 높이
                        resizeWidth={292}   // 출력 카메라 너비
                        resizeDepth={3}
                        autorender={true} // 뷰가 카메라 내용으로 자동업데이트 되는지 여부. (렌더링 발생시 직접적 제어를 원하면 false 값으로 설정할 것)
                        useCustomShadersToResize={false} // 커스텀 셰이더를 사용하여 출력 텐서에 맞는 더 작은 치수로 카메라 이미지의 크기를 조정할지 여부.
                        onReady={(images, updatePreview) =>
                            studyMainHandler.readyTensorCamera(images)
                        }
                    />
                </>
            }
        </SafeAreaView >
    )

}
export default TensorCameraScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000", // 카메라 배경과 자연스럽게 어울리도록 검정색
        justifyContent: "center",
        alignItems: "center",
    },
    camera: {
        position: "absolute",
        width: 360,
        height: 704,
        transform: [{ scaleX: -1 }],  // 카메라 출력을 수평으로 뒤집습니다
        // zIndex: 1000000,
        zIndex: 1,
        top: 1,
        opacity: 0.5
    },

    message: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
        marginTop: 20,
    },
});