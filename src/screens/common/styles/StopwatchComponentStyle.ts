import DementionUtils from "../../../common/utils/DementionUtils"
import DeviceInfoUtil from "../../../common/utils/DeviceInfoUtil"
import { Platform, StyleSheet } from "react-native"

const { heightRelateSize, widthRelateSize, fontRelateSize, marginRelateSize } = DementionUtils

const customHeight = 704

const styles = StyleSheet.create({
    timerFrame: {
        flex: 1,
        flexDirection: "row",
        width: widthRelateSize(145),
        height: heightRelateSize(69, customHeight),
        left: widthRelateSize(Platform.OS === "ios" ? -10 : 0),
        marginTop: heightRelateSize(55, customHeight),
        marginLeft: widthRelateSize(101),
        marginBottom: heightRelateSize(12, customHeight),


    },
    stopwatchHourFrame: {
        width: widthRelateSize(145),
        height: heightRelateSize(DeviceInfoUtil.isIPad() ? 53 : 73, customHeight),
    },
    stopwatchHour: {
        width: widthRelateSize(178),
        height: heightRelateSize(73, customHeight),
        fontSize: fontRelateSize(DeviceInfoUtil.isTablet() ? 50 : Platform.OS === "ios" ? 55 : 60),       // TODO: 해당 부분 깨짐증상
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "left",
        color: "#f0f1f2",
    },

    stopwatchSecFrame: {
        width: widthRelateSize(28),
        height: heightRelateSize(28, customHeight),
        marginLeft: widthRelateSize(Platform.OS === "ios" ? 30 : 10),
        marginTop: heightRelateSize(19, customHeight),
    },

    stopwatchSec: {
        width: widthRelateSize(24),
        height: heightRelateSize(23, customHeight),
        fontSize: fontRelateSize(18),       // TODO: 해당 부분 깨짐증상
        fontFamily: "NanumBarunGothic",
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "left",
        color: "#747c8a",

    },

    stopwatchSecArea: {
        flexDirection: "column",
        height: heightRelateSize(69, customHeight),
        width: widthRelateSize(28),
        marginLeft: widthRelateSize(DeviceInfoUtil.isTablet() ? -27 : 7),
        marginTop: heightRelateSize(8, customHeight),
    },
    faceFrame: {
        marginTop: heightRelateSize(8, customHeight),
        marginLeft: widthRelateSize(Platform.OS === "ios" ? 32 : 12),
    },
    findFace: {
        width: DeviceInfoUtil.isTablet() ? 12 : 9,
        height: DeviceInfoUtil.isTablet() ? 12 : 9,
        backgroundColor: "#3dcc8e",
        borderRadius: 50
    },
    notFindFace: {
        width: DeviceInfoUtil.isTablet() ? 12 : 9,
        height: DeviceInfoUtil.isTablet() ? 12 : 9,
        backgroundColor: "#ffcb66",
        borderRadius: 50
    },

})
export default styles;