// React
import React, { memo, useEffect, useState } from 'react'; // Import React
import { Paths } from "../../navigation/conf/Paths.ts";
// import { useDispatch, useSelector } from "react-redux";
import {Image, View, Text, StatusBar, Linking, TouchableOpacity, Modal, Platform, Button, StyleSheet} from "react-native";
import { CommonType } from '../../types/CommonType.ts';
// import { RootState } from "../../modules/redux/RootReducer";
import DementionUtils from "../../common/utils/DementionUtils.ts";
const { heightRelateSize, widthRelateSize, marginRelateSize, fontRelateSize } = DementionUtils
/**
 * 터치 페이지
 * @param route
 * @param navigation
 * @param appState
 * @constructor
 */
const TouchScreen = ({ route, navigation }) => {

    // const userState = useSelector((state: RootState) => state.userInfo);        // Redux 저장소에서 데이터를 조회해옵니다.
    // const authState = useSelector((state: RootState) => state.authInfo);        // Redux 저장소에서 데이터를 조회해옵니다.
    // const dispatch = useDispatch();                                             // useDispatch 훅으로 디스패치 함수를 가져옵니다.

    useEffect(() => {
        // 사용자의 인증정보와 그룹 정보 확인
        const init = async () => {
            console.log("----------Touch Screen------------")
        };
        init();
    }, []);



    return (
        <TouchableOpacity style={localStyles.container} activeOpacity={1} onPress={() => navigation.reset({ routes: [{ name: 'LOGIN_SELECT' }] })}>
            <StatusBar backgroundColor="#000000" barStyle="light-content" />

            {/* 중앙 이미지 */}
            <Image
                style={localStyles.image}
                source={require('../../../assets/images/logo/touchImg.png')}
                resizeMode="contain"
            />

            {/* 하단 안내 텍스트 */}
            <View style={localStyles.button}>
                <Text style={localStyles.buttonText}>
                    눌러서 시작해요!
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const localStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: widthRelateSize(80),
        height: heightRelateSize(80),
        marginBottom: marginRelateSize(1),
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 20,
        backgroundColor: '#000',
    },
    buttonText: {
        color: '#AAB0BE',
        fontSize: fontRelateSize(20),
        fontWeight: 'bold',
    },
});


export default TouchScreen;
