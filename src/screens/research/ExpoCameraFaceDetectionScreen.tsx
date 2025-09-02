import { CameraView } from "expo-camera";
import * as FaceDetector from 'expo-face-detector';
import { useRef, useState } from "react";
import { Button, Image, StyleSheet, View } from "react-native";

/**
 * EXPO 52에서는 deprecated됨
 */
const ExpoCameraFaceDetectionScreen = () => {
    const cameraRef = useRef(null);
    const [detectedImageUri, setDetectedImageUri] = useState<string | null>(null);

    const handleCaptureAndDetect = async () => {
        if (!cameraRef.current) return;

        const handleFacesDetected = ({ faces }) => {
            console.log(faces);
        };


        return (
            <>
                <View style={styles.container}>
                    <CameraView
                        style={styles.camera}
                        ref={cameraRef}
                        faceDetectorSettings={{
                            mode: FaceDetector.FaceDetectorMode.fast,
                            detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
                            runClassifications: FaceDetector.FaceDetectorClassifications.none,
                            minDetectionInterval: 100,
                            tracking: true,
                        }}
                    />

                    <Button title="얼굴 인식 및 이미지 표시" onPress={handleCaptureAndDetect} />

                    {detectedImageUri && (
                        <Image
                            source={{ uri: detectedImageUri }}
                            style={styles.preview}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </>
        )

    }
    export default ExpoCameraFaceDetectionScreen;

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'flex-start',
            paddingTop: 40,
        },
        camera: {
            width: '100%',
            height: 400,
        },
        preview: {
            width: '100%',
            height: 300,
            marginTop: 20,
        },
    });