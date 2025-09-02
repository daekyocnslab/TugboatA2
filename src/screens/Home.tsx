import modelManager from "../interceptor/ModelManager";
import { Paths } from "../navigation/conf/Paths";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View, StyleSheet } from "react-native";

const Home = () => {
    const navigation = useNavigation();
    const [isLoading, setIsLoading] = useState(true); // ✅ 로딩 상태 추가

    useEffect(() => {
        initModelLoad();
    }, []);

    /**
     * 최초 화면에서 모든 모델을 로드해옵니다.
     */
    const initModelLoad = async () => {
        try {

            console.log("modelManager.tf : ", modelManager.tf)
            console.log("modelManager.getVisionRfb320OnnxModel : ", modelManager.getVisionRfb320OnnxModel)
            console.log("modelManager.getPfldOnnxModel : ", modelManager.getPfldOnnxModel)
            console.log("modelManager.getFSANetSession : ", modelManager.getFSANetSession)
            console.log("modelManager.getHSEmotionSession : ", modelManager.getHSEmotionSession)
            console.log("modelManager.getHSEmotionSession : ", modelManager.getHSEmotionSession)

            if (!modelManager.isTensorflowInitialized) {
                await modelManager.initLoadTensorflow();
            }
            // await modelManager.initMediaPipeFaceMesh();
            // await modelManager.initLoadFaceDetectionModel();
            // await modelManager.initLoadFaceLandmarkModel();
            // await modelManager.initLoadIrisModel();


            if (!modelManager.getVisionRfb320OnnxModel) await modelManager.initVisionRfb320OnnxModel();
            if (!modelManager.getFaceLandmarkModel) await modelManager.initIrisLandmarkOnnxModel();
            if (!modelManager.getPfldOnnxModel) await modelManager.initPfldOnnxModel();


            if (!modelManager.getFSANetSession) await modelManager.initLoadFSANetModel();
            if (!modelManager.getHposeSession) await modelManager.initLoadHposeModel();
            if (!modelManager.getHSEmotionSession) await modelManager.initLoadHSemotionModel();

            // console.log('[+] All models loaded.');
        } catch (err) {
            console.error('[-] Model loading failed:', err);
        } finally {
            setIsLoading(false); // ✅ 로딩 종료
        }
    };

    const testPage = () => {
        //@ts-ignore
        navigation.navigate(Paths.STUDY);
    };

    /**
     * 페이지 이동 핸들러 
     */
    const moveToPageHandler = (() => {
        return {
            study: () => {
                //@ts-ignore
                navigation.navigate(Paths.STUDY)
            }
        }
    })()


    return (
        <View style={styles.container}>
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>모델을 불러오는 중입니다...</Text>
                </View>
            ) : (
                <TouchableOpacity onPress={() => moveToPageHandler.study()} style={styles.button}>
                    <Text style={styles.buttonText}>학습 시작</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});