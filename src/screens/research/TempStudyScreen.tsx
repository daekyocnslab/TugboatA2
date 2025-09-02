import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import modelManager from "../../interceptor/ModelManager";

import {
    Camera,
    useCameraDevice,
    useCameraPermission,
} from 'react-native-vision-camera';
import * as tf from '@tensorflow/tfjs';
import * as jpeg from 'jpeg-js';
import RNFS from 'react-native-fs';


const TempStudyScreen = () => {
    const { hasPermission, requestPermission } = useCameraPermission();
    const device = useCameraDevice('front');
    const cameraRef = useRef<Camera>(null);
    const [imageUri, setImageUri] = useState<string | null>(null);


    useEffect(() => {
        requestPermission();            // 카메라 권한 요청
    }, []);

    const handleCapture = async () => {
        if (!cameraRef.current) return;

        try {
            // 건드리지 말자!!
            const snapshot = await cameraRef.current.takeSnapshot({ quality: 85 });
            // const { width, height, path } = snapshot
            setImageUri(snapshot.path);

            const base64Data = await RNFS.readFile(snapshot.path, 'base64');
            const buffer = base64ToUint8Array(base64Data);

            console.log("[+] 수행이전")
            const rawImageData = jpeg.decode(buffer, { useTArray: true });
            console.log("[+] 수행이후")

            console.log("rawImageData :: ", rawImageData)

            const { width, height, data } = rawImageData;



            // 해당 경우의 원시의 값이 나와야 함.


            // const tensor = decodeJpegToTensor(buffer);
            // console.log("✅ Tensor shape:", tensor.shape);


        } catch (err) {
            console.error("❌ Error during blob conversion:", err);
        }
    };

    const base64ToUint8Array = (base64: string) => Buffer.from(base64, 'base64');

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

            <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
                <Text style={styles.captureText}>📸 캡처</Text>
            </TouchableOpacity>

            {imageUri && (
                <Image source={{ uri: 'file://' + imageUri }} style={styles.previewImage} />
            )}
        </View>
    );
};

export default TempStudyScreen;

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