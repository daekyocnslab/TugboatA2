import React, { useEffect, useRef, useState } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import DementionUtils from "../../common/utils/DementionUtils";

const ProgressBar = ({ text = "" }) => {
    const [progress, setProgress] = useState(0);


    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prevProgress) => {
                if (prevProgress === 100) {
                    return 0;
                }
                return prevProgress + 1;
            });
        }, 10);
        return () => clearInterval(interval);
    }, []);


    return (
        <View style={styles.container}>
            <Image
                source={require('../../../assets/gif/tugboat_splash_d_small.gif')}
            />
            <Text style={styles.loadingBarTxt}>{text}</Text>
        </View>
    );
};

export default ProgressBar;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: DementionUtils.heightRelateSize(100),
        zIndex: 999999,
    },
    loadingBarTxt: {
        marginTop: DementionUtils.heightRelateSize(20),
        fontWeight: 'normal',
        fontStyle: 'normal',
        fontSize: DementionUtils.fontRelateSize(16),
        lineHeight: DementionUtils.fontRelateSize(24),
        letterSpacing: 0,
        textAlign: 'center',
        color: '#ffffff',
    }
});
