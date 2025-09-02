import { StyleSheet } from "react-native";
import { DeviceType } from "../../../types/common/DeviceType";
import DeviceInfoUtil from "../../../common/utils/DeviceInfoUtil";
import DementionUtils from "../../../common/utils/DementionUtils";

// 플랫폼에 따른 카메라 사이즈를 지정
const CAMERA_SIZE: DeviceType.CameraSize = DeviceInfoUtil.getCameraSize()
const CAMERA_SIZE_HIDE: DeviceType.CameraSize = DeviceInfoUtil.getHideCameraSize()

const { heightRelateSize, widthRelateSize, fontRelateSize, marginRelateSize } = DementionUtils


const styles = StyleSheet.create({
    /**
     * 영역 0 : 전체 영역
     */
    container: {
        flex: 1,
        backgroundColor: "#000"
    },
    containerDark: {
        flex: 1,
        position: "absolute",
        backgroundColor: "#17191c",
        // zIndex: 99999

    },

    /**
     * 영역1 : 카메라 및 하단 버튼 영역
     */
    content: {
        flex: 1,
    },

    camera: {
        position: "absolute",
        // width: widthRelateSize(CAMERA_SIZE.width),
        // height: heightRelateSize(CAMERA_SIZE.height),
        width: widthRelateSize(360),
        height: heightRelateSize(520),
        zIndex: 0
    },

    faceGuideContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        // backgroundColor: "red"
    },

    faceOvalGuide: {
        position: 'absolute',
        width: widthRelateSize(250),
        height: heightRelateSize(320),
        borderRadius: widthRelateSize(125),
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },

    faceCountDownText: {
        position: 'absolute',
        fontSize: fontRelateSize(60),
        color: 'white',
        fontWeight: 'bold',
        zIndex: 11,
    },

    btnNextFrame: {
        width: widthRelateSize(360),
        height: heightRelateSize(56),
        backgroundColor: "#9fa2a7",
        justifyContent: "center",
        alignItems: "center",
        // position: "absolute",
        // bottom: 0
    },
    btnNext: {
        width: "100%",
        fontSize: fontRelateSize(17),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#d2d8e0",
    },

    btnNextFrameActive: {
        width: widthRelateSize(360),
        height: heightRelateSize(56),
        justifyContent: "center",
        backgroundColor: "#6491ff",
        alignItems: "center",
    },
    btnNextAtive: {
        width: "100%",
        fontSize: fontRelateSize(17),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#ffffff"
    },

    cameraFrame: {
        flex: 1,
        // width: widthRelateSize(CAMERA_SIZE.width),
        // height: heightRelateSize(CAMERA_SIZE.height)
    },
    modelLoadFrame: {
        width: CAMERA_SIZE.width,
        height: heightRelateSize(210),
        marginTop: heightRelateSize(210),
        justifyContent: "center",
    },
    modelLoadTxt: {
        textAlign: "center",
        justifyContent: "center",
        fontSize: fontRelateSize(24)
    },

    /**
     * 영역2: 모달 팝업 영역
     */
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: "center",
        textAlignVertical: 'center',
        backgroundColor: "rgba(0, 0, 0, 0.6)"
    },
    modalContainer: {
        width: widthRelateSize(304),
        // height: heightRelateSize(228),
        height: heightRelateSize(200),
        marginLeft: widthRelateSize(28),
        marginRight: widthRelateSize(28),
        marginTop: heightRelateSize(210),
        marginBottom: heightRelateSize(266),
        borderRadius: 20,
        backgroundColor: "#2e3138"
    },
    modalContent: {
        width: widthRelateSize(256),
        height: heightRelateSize(80),
        marginLeft: widthRelateSize(24),
        marginTop: heightRelateSize(44),
        marginRight: widthRelateSize(24),
    },
    modalImg: {
        width: widthRelateSize(48),
        height: heightRelateSize(48),
        marginLeft: widthRelateSize(104),
        marginRight: widthRelateSize(104),
        marginBottom: heightRelateSize(16),
    },
    modalTitle: {
        width: widthRelateSize(256),
        height: heightRelateSize(20),
        fontSize: fontRelateSize(16),
        marginBottom: heightRelateSize(16),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#f0f1f2"
    },
    modalTextView: {
        width: widthRelateSize(256),
        height: heightRelateSize(44),
        marginBottom: heightRelateSize(24)
    },
    modalTxt: {
        fontSize: fontRelateSize(14),
        fontWeight: "normal",
        fontStyle: "normal",
        lineHeight: 22,
        letterSpacing: 0,
        textAlign: "center",
        color: "#616d82"
    },
    modalBtnContent: {
        width: widthRelateSize(304),
        height: heightRelateSize(54),
        marginTop: heightRelateSize(10),
    },
    modalBtn: {
        width: widthRelateSize(256),
        margin: marginRelateSize(24),
        height: heightRelateSize(20),
        fontSize: fontRelateSize(14),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#6491ff"
    },


    /**
     * 권한 팝업 모달
     */
    modalContainer2: {
        width: widthRelateSize(280),
        height: heightRelateSize(335),
        borderRadius: 20,
        backgroundColor: "#2e3138",
        marginTop: heightRelateSize(162),
        marginLeft: widthRelateSize(28)
    },
    innerContainer: {
        marginTop: heightRelateSize(32),
        marginLeft: widthRelateSize(20),
        alignItems: "center"
    },
    titleArea: {
        height: heightRelateSize(42),
        marginBottom: heightRelateSize(24)
    },
    title1: {
        width: widthRelateSize(244),
        height: heightRelateSize(17),
        fontFamily: "NanumBarunGothic",
        fontSize: fontRelateSize(12),
        fontWeight: "normal",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#aab0be",
        marginBottom: heightRelateSize(8)
    },
    title2: {
        width: widthRelateSize(244),
        height: heightRelateSize(19),
        fontFamily: "NanumBarunGothic",
        fontSize: fontRelateSize(14),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "center",
        color: "#f0f1f2"
    },
    titleBottomLine: {
        width: widthRelateSize(244),
        height: heightRelateSize(1),
        backgroundColor: "#383d45",
        marginBottom: heightRelateSize(23)

    },
    permissionArea: {
        height: heightRelateSize(66)
    },
    permissionSubArea: {
        flexDirection: "row",
        marginBottom: heightRelateSize(3)
    },

    permissionTitle: {
        width: widthRelateSize(83),
        height: heightRelateSize(16),
        fontFamily: "NanumBarunGothic",
        fontSize: fontRelateSize(14),
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "left",
        color: "#6491ff"
    },
    permissionSwitch: {
        marginLeft: widthRelateSize(121),
    },
    permissionContent: {
        marginBottom: heightRelateSize(32),
    },
    permissionContentTxt: {
        width: widthRelateSize(192),
        height: heightRelateSize(40),
        fontFamily: "NanumBarunGothic",
        fontSize: 13,
        fontWeight: "normal",
        fontStyle: "normal",
        lineHeight: 20,
        letterSpacing: 0,
        textAlign: "left",
        color: "#8b919e",
    },
    titleBottomLastLine: {
        width: widthRelateSize(264),
        height: heightRelateSize(1),
        backgroundColor: "#383d45",
        marginTop: heightRelateSize(24),
        marginBottom: heightRelateSize(16)
    },
    permissionAlertTxt: {
        width: widthRelateSize(264),
        height: heightRelateSize(40),
        fontFamily: "NanumBarunGothic",
        fontSize: 13,
        fontWeight: "normal",
        fontStyle: "normal",
        lineHeight: 20,
        letterSpacing: 0,
        textAlign: "left",
        color: "#8b919e"
    },
    permissionBottonArea: {
        // flex: 1,
        textAlign: "center",
        width: widthRelateSize(276),
        height: heightRelateSize(64),
        flexDirection: "row",
    },
    permissionBottonFrame: {
        zIndex: 1,
        width: widthRelateSize(152),
        height: heightRelateSize(64),
    },
    permissionBottonTxt: {
        zIndex: 1,
        width: widthRelateSize(28),
        height: heightRelateSize(16),
        fontFamily: "NanumBarunGothic",
        fontSize: 14,
        fontWeight: "bold",
        fontStyle: "normal",
        letterSpacing: 0,
        textAlign: "left",
        color: "#6491ff",
        marginLeft: widthRelateSize(44),
        marginTop: heightRelateSize(24)
    }
});
export default styles;
