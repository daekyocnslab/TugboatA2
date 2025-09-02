import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Camera, Frame, runAtTargetFps, useCameraDevice, useCameraPermission, useFrameProcessor, VisionCameraProxy } from "react-native-vision-camera";
import modelManager from "../../interceptor/ModelManager";
import { useRunOnJS } from "react-native-worklets-core";

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-core'
import { decodeJpeg } from '@tensorflow/tfjs-react-native'

interface YUVPluginResult {
    y: number;
    u: number;
    v: number;
    r: number;
    g: number;
    b: number;
    floatData: any;
    width: number;
    height: number;
    base64: string;
}

const TARGET_FPS = 2

/**
 * Native에서 데이터 처리 이후 전달하는 경우 
 */
const VisionCameraNativeScreen = () => {

    const device = useCameraDevice('front')
    const { hasPermission, requestPermission } = useCameraPermission()

    useEffect(() => {
        requestPermission();
        loadModel();
    }, []);


    const loadModel = async () => {

        await tf.setBackend('cpu')
            .then(() => {
                console.log("[+] Load Tensorflow.js....");
                console.log("TensorFlow backend:", tf.getBackend());

                console.log("rn-webgl 활성화 체크 : ", tf.engine().registry); // 백엔드 등록된 목록 확인
            })
            .catch((error) => { console.error(`[-] Tensorflow Ready Error: ${error}`); });


        const fsanetModel = modelManager.getFSANetSession;
        console.log("✅ fsanetModel loaded: ", fsanetModel);

        const hposeModel = modelManager.getHposeSession;
        console.log("✅ hposeModel loaded: ", hposeModel);


        console.log("✅ FaceDetectionModel:: ", modelManager.getFaceDetectionModel);
        console.log("✅ IrisModel:: ", modelManager.getIrisModel);
        console.log("✅ FaceLandmarkModel:: ", modelManager.getFaceLandmarkModel);
    }
    const base64ToUint8Array = async (result: YUVPluginResult) => {
        try {

            const { width, height, floatData, base64 } = result;
            console.log(`width: ${width}  height : ${height}`)

            console.log("✅ TensorFlow ready:", tf.getBackend());

            if (!floatData || !width || !height) {
                console.warn("⚠️ floatData or dimensions missing:", result);
                return null;
            }

            // const imageBuffer = tf.util.encodeString(base64, 'base64').buffer;
            // const rawImageData = new Uint8Array(imageBuffer);
            // const result22 = await decodeJpeg(rawImageData);
            // console.log("result 22 ::", result22);

            // const zerosTensor = tf.zeros([2, 3]);
            // console.log(zerosTensor.shape);  // [height, width]
            // console.log(zerosTensor.dtype);  // 'float32'

            // const tensor = tf.tensor(floatData); // floatList는 number[]

            // const tensor = tf.tensor2d(floatData, [height, width]);
            // console.log(tensor.shape);  // [height, width]
            // console.log(tensor.dtype);  // 'float32'
            // const floatArray = new Float32Array(floatData);


            // console.log("floatArray.length:", floatArray.length);
            // console.log("expected:", height * width);

            // const inputTensor = tf.tensor(floatArray, [1, height, width, 1], 'float32');
            // console.log("✅ inputTensor shape:", inputTensor.shape);

            // const data = inputTensor.dataSync();  // 값 직접 확인
        } catch (error) {
            console.error("에러가 발생하였습니다 ::", error);

        }



        // try {
        //     const binary = decode(base64); // base64 문자열 → 바이너리 문자열
        //     const len = binary.length;
        //     const bytes = new Uint8Array(len);
        //     for (let i = 0; i < len; i++) {
        //         bytes[i] = binary.charCodeAt(i); // ✅ 핵심: 문자열을 바이트로 해석
        //     }

        //     // console.log("🧪 Uint8Array sample:", bytes.slice(0, 10)); // 앞 10개만 출력

        //     // 정규화
        //     const floatArray = Float32Array.from(bytes.map((v) => v / 255));

        //     // console.log("🧪 Uint8Array sample:", floatArray); // 앞 10개만 출력

        //     console.log("✅ TensorFlow ready:", tf.getBackend());

        //     // ✅ 텐서 생성 (Grayscale)
        //     const tensor = tf.tensor(floatArray, [floatArray.length, 1], 'float32');
        //     // console.log("📦 bytes:", bytes);
        //     // const tensor = tf.tensor(Float32Array.from(bytes.map(v => v / 255)), [height, width, 1], 'float32');


        //     console.log("tensor :: ", tensor)
        //     return bytes;
        // } catch (error) {
        //     console.log("❌ Base64 decoding error: ", error);
        //     return new Uint8Array(); // fallback
        // }

        // try {



        //     console.log(`2. 루프 종료 시점에 메모리에 있는 텐서 수  ${tf.tidy(() => tf.memory().numTensors)}`)

        //     const dummyData = new Float32Array([1, 2, 3, 4]);
        //     console.log("dummyData : ", dummyData)
        //     console.log("dummyData.slice() : ", dummyData.slice())


        //     // const zero = tf.zeros([1, 64, 64, 1]);
        //     // console.log(zero);


        //     const tensor1 = tf.tensor(dummyData, [2, 2]);
        //     console.log("✅ 테스트 텐서 생성 완료:", tensor1.dataSync);


        //     const floatArray = new Float32Array(floatData); // JS에서 타입 안정성 확보
        //     const tensor = tf.tensor(floatArray, [1, height, width, 1], 'float32'); // [batch, h, w, 1] 형태

        //     console.log("📦 Generated Tensor:", tensor);
        //     return tensor;
        // } catch (err) {
        //     console.error("❌ Tensor 생성 오류:", err);
        //     return null;
        // }


        // // console.log(`floatData : `, floatData)

    };

    // ✅ useRunOnJS로 래핑 (Worklet → JS 안전 호출용)
    const onRGBParsedJS = useRunOnJS(base64ToUint8Array, [base64ToUint8Array]);

    /**
     * 프레임 프로세서
     * width : 640,
     * height: 480
     */
    const frameProcessor = useFrameProcessor((frame: Frame) => {
        'worklet';
        const plugin = VisionCameraProxy.initFrameProcessorPlugin('my_yuv_plugin', { foo: 1234 });
        if (plugin) {
            const result = plugin.call(frame) as unknown as YUVPluginResult;
            // ✅ Worklet → JS 안전 호출
            onRGBParsedJS(result);
        }
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
                frameProcessor={frameProcessor}
                enableFpsGraph={true}
            />
        </View>
    );
}
export default VisionCameraNativeScreen


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
});