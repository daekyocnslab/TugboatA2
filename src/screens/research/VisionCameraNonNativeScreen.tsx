import { RootState } from "../../store/RootReducer";
import { FaceDetetorType } from "../../types/FaceDetetorType";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import modelManager from "../../interceptor/ModelManager";
import { useNavigation } from "@react-navigation/native";

import { Camera, Frame, PixelFormat, runAsync, runAtTargetFps, useCameraDevice, useCameraPermission, useFrameProcessor, VisionCameraProxy } from 'react-native-vision-camera';
import * as tf from '@tensorflow/tfjs';
import { useResizePlugin } from "vision-camera-resize-plugin";
import { useRunOnJS } from "react-native-worklets-core";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";

const TARGET_FPS = 2
/**
 * 병합 대기중
 * @returns 
 */
const VisionCameraNonNativeScreen = () => {

    const plugin = useResizePlugin();

    const dispatch = useDispatch();
    const navigation = useNavigation();

    const { hasPermission, requestPermission } = useCameraPermission()
    const device = useCameraDevice('front')

    // const [hasPermission, setHasPermission] = useState(false);

    const reduxUserInfo = useSelector((state: RootState) => state.studyModel);

    // 초기 모델 관리
    const [initModel, setInitModel] = useState<FaceDetetorType.InitModelState>({
        isLoading: false, // 로딩 바 수행여부
        isTensorReady: false, // Tensorflow 모델
        faceMeshModel: null, // fashmesh 모델
        hsemotionModel: null, // hsemotion 모델
        fsanetModel: null, // FSA-NET 모델
        hPoseModel: null, // HPose 모델
    });


    useEffect(() => {
        requestPermission();
        loadModel();
    }, []);


    const loadModel = async () => {

        await tf.ready();
        console.log('[+] TensorFlow.js 초기화 완료');

        await tf.ready();
        console.log("TensorFlow backend:", tf.getBackend());

        const fsanetModel = modelManager.getFSANetSession;
        console.log("✅ fsanetModel loaded: ", fsanetModel);

        const hposeModel = modelManager.getHposeSession;
        console.log("✅ hposeModel loaded: ", hposeModel);

        const emotionModel = modelManager.getHSEmotion;
        console.log("✅ emotionModel loaded: ", emotionModel);


        console.log("✅ FaceDetectionModel:: ", modelManager.getFaceDetectionModel);
        console.log("✅ IrisModel:: ", modelManager.getIrisModel);
        console.log("✅ FaceLandmarkModel:: ", modelManager.getFaceLandmarkModel);
    }


    const onFrameData = useCallback(async (data: Uint8Array, width: number, height: number) => {
        try {
            // JS 영역: 여기서 처리 로직 작성
            console.log("📦 JS 수신:", width, height);

            // const imageTensor = tf.tensor3d(data, [height, width, 3], 'int32'); // 또는 'float32'

            // console.log("✅ Tensor 생성 완료:", imageTensor);

            const imageTensor2 = tf.tensor(data, [height, width, 3], 'float32').div(255);
            console.log("✅ Tensor 생성 완료:", imageTensor2);


            // const result = await decodeJpeg(data);
            // const imageTensor = tf.tensor3d(data, [height, width, 3], 'int32');
            // console.log("✅ Tensor 생성 완료:", result);
        } catch (error) {
            console.log("error : ", error)
        }

    }, []);

    const runOnJSFrame = useRunOnJS(onFrameData, [onFrameData]); // 두 번째 인자는 `sync` (동기 보장 옵션)

    const frameProcessor = useFrameProcessor((frame) => {
        'worklet';

        runAtTargetFps(TARGET_FPS, () => {
            'worklet';

            if (frame.pixelFormat === 'rgb') {
                const width = frame.width;
                const height = frame.height;
                const buffer = frame.toArrayBuffer();
                const data = new Uint8Array(buffer);
                console.log(width, height)

                runOnJSFrame(data, width, height); // ✅ 안전하게 값만 넘김
            }
        });
    }, []);



    if (device == null || !hasPermission) {
        return <Text>카메라 로딩 중...</Text>;
    }


    return (
        <View style={styles.container}>
            <Camera
                device={device}
                style={StyleSheet.absoluteFill}
                isActive={true}
                pixelFormat="rgb"
                frameProcessor={frameProcessor}
                enableFpsGraph={true}
            />
        </View>
    );


}
export default VisionCameraNonNativeScreen;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
});