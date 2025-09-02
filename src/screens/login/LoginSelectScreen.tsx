// React
import React, { memo, useEffect, useRef, useState } from 'react'; // Import React
// import { useDispatch, useSelector } from 'react-redux';
import {
    Image,
    View,
    Text,
    StatusBar,
    Linking,
    TouchableOpacity,
    Modal,
    Platform,
    Button,
    Alert,
    StyleSheet,
    Pressable,
    TouchableWithoutFeedback, Dimensions,
} from 'react-native';
import { CommonType } from '@/types/CommonType.ts';
// import { RootState } from '../../modules/redux/RootReducer';
import DementionUtils from '../../common/utils/DementionUtils.ts';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from "react-redux";
import { RootState } from "@/modules/redux/RootReducer.ts";
import modelManager from '@/interceptor/ModelManager.ts';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBar from '@/modules/progressbar/ProgressBar.tsx';
const { heightRelateSize, widthRelateSize, marginRelateSize, fontRelateSize } = DementionUtils;

/**
 * 웰컴 페이지
 * @param route
 * @param navigation
 * @param appState
 * @constructor
 */
const LoginSelectScreen = ({ route, navigation }) => {
    const userState = useSelector((state: RootState) => state.userInfo); // Redux 저장소에서 데이터를 조회해옵니다.
    const authState = useSelector((state: RootState) => state.authInfo); // Redux 저장소에서 데이터를 조회해옵니다.
    const INTERVAL_TIME = 300000; // 5분
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // const dispatch = useDispatch(); // useDispatch 훅으로 디스패치 함수를 가져옵니다.

    useEffect(() => {
        // 사용자의 인증정보와 그룹 정보 확인
        const init = async () => {
            console.log('--------------- Login Select Screen ---------------');
        };
        init();
        return () => {
            if (intervalRef.current) clearTimeout(intervalRef.current); // 컴포넌트 언마운트 시 타이머 제거
        };
    }, []);


    useEffect(() => {
        initModelLoad();
    }, []);

    /**
     * 최초 화면에서 모든 모델을 로드해옵니다.
     */
    const initModelLoad = async () => {
        try {
            // console.log("modelManager.tf : ", modelManager.tf)
            // console.log("modelManager.getVisionRfb320OnnxModel : ", modelManager.getVisionRfb320OnnxModel)
            // console.log("modelManager.getPfldOnnxModel : ", modelManager.getPfldOnnxModel)
            // console.log("modelManager.getFSANetSession : ", modelManager.getFSANetSession)
            // console.log("modelManager.getHSEmotionSession : ", modelManager.getHSEmotionSession)
            // console.log("modelManager.getHSEmotionSession : ", modelManager.getHSEmotionSession)

            if (!modelManager.isTensorflowInitialized) {
                await modelManager.initLoadTensorflow();
            }
            if (!modelManager.getVisionRfb320OnnxModel) await modelManager.initVisionRfb320OnnxModel();
            if (!modelManager.getFaceLandmarkModel) await modelManager.initIrisLandmarkOnnxModel();
            if (!modelManager.getPfldOnnxModel) await modelManager.initPfldOnnxModel();


            if (!modelManager.getFSANetSession) await modelManager.initLoadFSANetModel();
            if (!modelManager.getHposeSession) await modelManager.initLoadHposeModel();
            if (!modelManager.getHSEmotionSession) await modelManager.initLoadHSemotionModel();

            if (!modelManager.getPoseDetectionModel) await modelManager.initLoadPoseDetectionModel();

            console.log('[+] All models loaded.');
        } catch (err) {
            console.error('[-] Model loading failed:', err);
        } finally {
            setIsLoading(false); // ✅ 로딩 종료
        }
    };

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            // 시작할 때 30초 후 이동 예약
            timeoutRef.current = setTimeout(() => {
                navigation.reset({ routes: [{ name: 'TOUCH' }] });
            }, 30000);

            return () => {
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }
            };
        }, [])
    );

    const resetInactivityTimer = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            navigation.reset({ routes: [{ name: 'TOUCH' }] });
        }, 30000);
    };

    return (
        <TouchableWithoutFeedback onPress={resetInactivityTimer}>
            {isLoading ? (
                <SafeAreaView style={localStyles.main}>
                    <View style={localStyles.modelLoadFrame}>
                        <ProgressBar text='인공지능 모델을 불러오는 중입니다...' />
                    </View>
                </SafeAreaView>
            ) : (
                <View style={localStyles.container}>
                    <StatusBar backgroundColor="#000000" barStyle="light-content" />

                    <View style={localStyles.centerLabel}>
                        <Image
                            source={require('../../../assets/images/icons/ic_l_school_24.png')}
                            style={localStyles.centerLabelImage}
                            resizeMode="contain"
                        />
                        {/*<Text style={localStyles.centerLabelText}>센터명을 입력해주세요.</Text>*/}
                        <Text style={localStyles.centerLabelText}>{userState.groups['grpNm']}센터</Text>
                    </View>

                    {/* 상단 중앙 이미지 */}
                    <Image
                        style={localStyles.logoImage}
                        source={require('../../../assets/images/icons/ic_l_tugbot_44.png')}
                        resizeMode="contain"
                    />

                    {/* 안내 문구 */}
                    <Text style={localStyles.loginPrompt}>
                        어떤 방법으로 로그인할까요?
                    </Text>

                    {/* 로그인 방식 버튼 */}
                    <View style={localStyles.loginButtonRow}>
                        <TouchableOpacity
                            style={localStyles.loginButton}
                            onPress={() => navigation.navigate('FACE_LOGIN')}
                        >
                            <Image
                                source={require('../../../assets/images/icons/faceLoginBtn.png')}
                                style={localStyles.loginButtonImage}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={localStyles.loginButton}
                            onPress={() => navigation.navigate('ATTENDANCE')}
                        >
                            <Image
                                source={require('../../../assets/images/icons/numLoginBtn.png')}
                                style={localStyles.loginButtonImage}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>

                        {/*<TouchableOpacity*/}
                        {/*    style={localStyles.loginButton}*/}
                        {/*    onPress={() => navigation.navigate('cameraLogin')}*/}
                        {/*>*/}
                        {/*    <Image*/}
                        {/*        source={require('../../../assets/images/icons/qrLoginBtn.png')}*/}
                        {/*        style={localStyles.loginButtonImage}*/}
                        {/*        resizeMode="contain"*/}
                        {/*    />*/}
                        {/*</TouchableOpacity>*/}
                    </View>
                    <View style={localStyles.bottomView}>

                    </View>
                </View>

            )}




        </TouchableWithoutFeedback>
    );
};

const localStyles = StyleSheet.create({
    container: {
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    centerLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2D384B',
        borderRadius: 10,
        paddingVertical: 6,
        paddingHorizontal: 14,
        marginBottom: marginRelateSize(80),
    },
    centerLabelImage: {
        width: widthRelateSize(18),
        height: heightRelateSize(18),
        marginRight: marginRelateSize(8),
    },
    centerLabelText: {
        color: '#AAB0BE',
        fontSize: fontRelateSize(14),
    },
    logoImage: {
        width: widthRelateSize(80),
        height: heightRelateSize(80),
        marginBottom: marginRelateSize(12),
    },
    loginPrompt: {
        color: '#fff',
        fontSize: fontRelateSize(16),
        marginBottom: marginRelateSize(20),
    },
    loginButtonRow: {
        marginTop: marginRelateSize(20),
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    loginButton: {
        marginHorizontal: marginRelateSize(10),
    },
    loginButtonImage: {
        width: widthRelateSize(70),
        height: heightRelateSize(90),
    },
    bottomView: {
        height: heightRelateSize(180),
    },
    main: {
        flex: 1,
        backgroundColor: '#17191c',
    },
    modelLoadFrame: {
        width: widthRelateSize(360),
        height: heightRelateSize(704, 704),
        justifyContent: 'center',
        zIndex: 9999,
    },
});

export default LoginSelectScreen;
