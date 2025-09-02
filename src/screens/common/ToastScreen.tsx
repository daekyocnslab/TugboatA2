import DementionUtils from '../../common/utils/DementionUtils';
import React, { useState, useEffect, useRef, memo } from 'react';
import { Text, View, Animated, StyleSheet } from 'react-native';
import DeviceInfoUtil from "../../common/utils/DeviceInfoUtil";


/**
 *  공통 : Toast Message
 *
 * @param {number} message: Toast 메시지에서 출력할 텍스트
 * @param {number} height : Toast 메시지의 높이
 * @param {number} marginBottom : Toast 메시지의 하단 기준 Margin
 * @param {() => void} onClose: Toast 메시지의 처리 이후 부모창의 State 값을 초기화 해줍니다.
 * @returns
 */
const ToastScreen = ({ message, height, marginBottom, marginTop = 600, onClose, styleType = "black" || "white" },) => {
    const [isToastVisible, setIsToastVisible] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const { widthRelateSize, heightRelateSize, fontRelateSize } = DementionUtils;

    useEffect(() => {
        console.log("[+] toast message 출력")

        const timer = setTimeout(() => {
            setIsToastVisible(false);
            onClose();
            console.log("[-] Toast가 시간이 되어 닫혔습니다.")
        }, 1500);

        Animated
            .timing(fadeAnim, {
                toValue: isToastVisible ? 1 : 0,
                duration: 500,
                useNativeDriver: true
            })
            .start(() => {
                setIsToastVisible(true);
            });
        return () => clearTimeout(timer);
    }, []);




    const styles = StyleSheet.create({
        containerBlack: {
            position: "absolute",
            zIndex: 10000000000,
            flex: 1,
            alignItems: 'center',
            marginTop: heightRelateSize(marginTop),
            width: widthRelateSize(328),
            height: heightRelateSize(height),
            borderRadius: 14,
            marginLeft: widthRelateSize(16),
            marginRight: widthRelateSize(16),
            bottom: DementionUtils.heightRelateSize(marginBottom),
            backgroundColor: '#4e545e',
        },
        containerWhite: {
            position: "absolute",
            zIndex: 10000000000,
            flex: 1,
            alignItems: 'center',
            marginTop: heightRelateSize(marginTop),
            width: widthRelateSize(328),
            height: heightRelateSize(height),
            borderRadius: 14,
            marginLeft: widthRelateSize(16),
            marginRight: widthRelateSize(16),
            bottom: DementionUtils.heightRelateSize(marginBottom),
            // marginBottom: DementionUtils.heightRelateSize(marginBottom),
            // backgroundColor: '#ffffff',
            backgroundColor: "rgba(0, 0, 0, 0.7)"
        },

        buttonText: {
            fontSize: fontRelateSize(20),
            textAlign: 'center',
            margin: 10,
        },
        toast: {
            position: 'absolute',
            backgroundColor: '#333',
            borderRadius: 25,
            paddingVertical: 10,
            paddingHorizontal: 20,
        },
        toastTextBlack: {
            width: DementionUtils.widthRelateSize(296),
            height: DementionUtils.heightRelateSize(height),
            fontFamily: 'NanumBarunGothic',
            fontSize: DementionUtils.fontRelateSize(13),
            marginTop: DementionUtils.heightRelateSize(10),
            marginLeft: DementionUtils.widthRelateSize(10),
            fontWeight: 'normal',
            fontStyle: 'normal',
            lineHeight: 20,
            letterSpacing: 0,
            textAlign: 'center',
            color: '#ffffff',
        },
        toastTextWhite: {
            width: DementionUtils.widthRelateSize(296),
            height: DementionUtils.heightRelateSize(height),
            fontFamily: 'NanumBarunGothic',
            fontSize: DementionUtils.fontRelateSize(13),
            marginTop: DementionUtils.heightRelateSize(5),
            marginLeft: DementionUtils.widthRelateSize(10),
            fontWeight: 'normal',
            fontStyle: 'normal',
            lineHeight: 20,
            letterSpacing: 0,
            textAlign: 'center',
            color: '#ffffff',
        }
    });

    return (
        <>
            {console.log("message :: " + message + "  styleType :: ", styleType)}
            {isToastVisible && (
                <Animated.View
                    style={styleType === "black" ? styles.containerBlack : styles.containerWhite}>
                    <Text
                        style={styleType === "black" ? styles.toastTextBlack : styles.toastTextWhite}>
                        {message}
                    </Text>
                </Animated.View>
            )}
        </>
    );

};


export default memo(ToastScreen);
