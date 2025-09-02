import { FaceDetetorType } from "../../types/FaceDetetorType";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import modelManager from "../../interceptor/ModelManager";

import { decodeJpeg } from '@tensorflow/tfjs-react-native'
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
} from 'react-native-vision-camera';
import * as tf from '@tensorflow/tfjs';
import RNFS from 'react-native-fs';

const LOOP_TIME = 100;

const VisionCameraTakePicktureScreen = () => {

    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('front');
    const cameraRef = useRef<Camera>(null);

    const [imageUri, setImageUri] = useState<string | null>(null);
    const [cameraOn, setCameraOn] = useState<boolean>(true); // 자동 캡처 여부

    const [initModel, setInitModel] = useState<FaceDetetorType.InitModelState>({
        isLoading: false,
        isTensorReady: false,
        faceMeshModel: null,
        hsemotionModel: null,
        fsanetModel: null,
        hPoseModel: null,
    });

    useEffect(() => {
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


    const handleCapture = async () => {
        if (!cameraRef.current) return;

        const startTime = performance.now(); // ⏱ 시작 시간

        try {
            const { getFSANetSession, getHposeSession, getHSEmotion, getFaceDetectionModel, getIrisModel } = modelManager
            const snapshot = await cameraRef.current.takeSnapshot({ quality: 85, });
            setImageUri(snapshot.path);

            const base64Data = await RNFS.readFile(snapshot.path, 'base64');
            const imageBuffer = tf.util.encodeString(base64Data, 'base64').buffer;
            const rawImageData = new Uint8Array(imageBuffer);
            const result = decodeJpeg(rawImageData);
            // const resizedTensor = tf.image.resizeBilinear(result, [292, 340]);

            // const normalized = resizedTensor.div(255.0).expandDims(0); // shape: [1, 128, 128, 3]

            const faceModel = getFaceDetectionModel;
            // console.log("getFaceDetectionModel :: ", getFaceDetectionModel)
            if (!faceModel) throw new Error("Face detection model not loaded.");

            // const inputTypedArray = normalized.dataSync(); // Float32Array


            await modelCalcHandler.estimateVersionRfb320(result)

            // const outputTypedArrays = await faceModel.run([inputTypedArray]); // ✅ 이 형태가 맞음
            // console.log("🔍 예측 결과:", outputTypedArrays);

            // // 🔁 메모리 정리
            // tf.dispose([resizedTensor, normalized]);

            // ✅ 파일 삭제
            await RNFS.unlink(snapshot.path);

            // console.log("📸 캡처 결과 Tensor:", resizedTensor.shape);
        } catch (err) {
            console.error("❌ 캡처 중 오류:", err);
        }
        const endTime = performance.now(); // ⏱ 종료 시간
        const duration = (endTime - startTime).toFixed(2);
        console.log(`⏱ handleCapture 실행 시간: ${duration}ms`);
    };

    const modelCalcHandler = (() => {
        return {
            /**
             * 얼굴 탐지 수행 
             * @param _imageToTensor 
             * @returns Promise<number[][]>
             */
            estimateVersionRfb320: async (_imageToTensor: tf.Tensor3D): Promise<any> => {


                if (modelManager.getFaceDetectionModel) {
                    try {
                        let _configTensor: Float32Array;
                        let filteredBoxes: number[][] = [];
                        let boxesArray: number[][]
                        let confidences: number[][] | string[][];
                        let boxScores: number[][];
                        // ✅ OK 
                        _configTensor = tf.tidy(() => {
                            const resizedTensor = tf.image.resizeBilinear(_imageToTensor, [240, 320]);
                            // 2. 정규화 및 RGB 배열 유지
                            const normalizedTensor = tf.div(resizedTensor, tf.scalar(255.0));
                            // 3. 차원 변환 [H, W, C] -> [1, C, H, W]
                            const transposedTensor = tf.transpose(normalizedTensor, [2, 0, 1]);
                            const dataSyncRst = transposedTensor.dataSync();
                            return new Float32Array(dataSyncRst)
                        });


                        console.log(">>>", _configTensor);
                        const faceModel = modelManager.getFaceDetectionModel;



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


                                    // let ouputBox = fetches[0]
                                    // let ouputScores = fetches[1];

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
                                    // filteredBoxes = hardNMS(boxScores.filter(box => box[4] > probThreshold), iouThreshold, topK)
                                    //     .map(box => {
                                    //         return [
                                    //             Math.round(box[0] * origWidth), // x_min
                                    //             Math.round(box[1] * origHeight), // y_min
                                    //             Math.round(box[2] * origWidth), // x_max
                                    //             Math.round(box[3] * origHeight), // y_max
                                    //             box[4] // score
                                    //         ];
                                    //     });

                                    // for (const key in fetches) {
                                    //     (fetches as any)[key] = null;
                                    // }
                                    // // ✅ output도 직접 null 처리 (선택 사항이지만 권장)
                                    // ouputBox = null;
                                    // ouputScores = null;
                                    // (fetches.boxes as any) = null;
                                    // (fetches.scores as any) = null;
                                    // // ONNX Tensor 초기화 
                                    // fetches = null;                                     // 사용한 결과값 제거 
                                }
                                // feed.input = null;
                                // feed = null as any; // 👈 feed 자체도 명시적으로 정리 가능
                            })
                            .catch((err) => {
                                console.error(`versionRfb320Model.run() 함수에서 에러가 발생하였습니다 : ${err}`);
                            });
                    } catch (error) {
                        console.log(`[-] estimateVersionRfb320 error :: ${error}`)
                    }
                }
                // return filteredBoxes;
            }
        }
    })();




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
        </View>
    );
};

export default VisionCameraTakePicktureScreen;

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
});