import { Alert, Appearance, BackHandler, ColorSchemeName, Platform } from "react-native";
import NetInfo, { NetInfoBluetoothState, NetInfoState, NetInfoStateType, NetInfoSubscription } from "@react-native-community/netinfo";
import { CommonType } from "../../types/common/CommonType";
import { DeviceType } from "../../types/common/DeviceType";
import DementionUtils from "./DementionUtils";
import DeviceInfo from 'react-native-device-info';
// import { UserDeviceType } from "../../types/UserDeviceType";

const { heightRelateSize, widthRelateSize, fontRelateSize } = DementionUtils
const isTablet = DeviceInfo.isTablet();

/**
 * '디바이스 정보'와 관련된 유틸을 관리하는 페이지 입니다.
 */

class DeviceInfoUtil {

    getDeviceInfo = () => {
    };

    /**
     * TensorCamera의 미리보기 운영체제 별 너비/높이 지정
     * @return {DeviceType.TextureDims} Camera TextureDims를 반환합니다.
     */
    getTextureDims = (): DeviceType.TextureDims => Platform.OS === "ios" ? { height: 1920, width: 1080 } : { height: 1200, width: 1600 };

    /**
     * 플랫폼(Andriod, iOS) 에 따른 카메라 사이즈를 지정
     * @returns {DeviceType.CameraSize} 카메라 사이즈를 반환합니다.
     */
    getCameraSize = (): DeviceType.CameraSize => {
        let cameraSizeObj = { width: 0, height: 0 };
        switch (this.getPlatformType()) {
            case "ios":
                cameraSizeObj = isTablet ? { width: 180, height: 380 } : { width: 360, height: 560 }
                break;
            case "android":
                cameraSizeObj = isTablet ? { width: 180, height: 380 } : { width: 360, height: 560 }
                break;
            default:
                break;
        }
        return {
            width: Math.ceil(widthRelateSize(cameraSizeObj.width)),
            height: Math.ceil(heightRelateSize(cameraSizeObj.height)),
        }
    }


    /**
     * 플랫폼(Andriod, iOS) 에 따른 카메라 사이즈를 지정
     * @returns {DeviceType.CameraSize} 카메라 사이즈를 반환합니다.
     */
    getHideCameraSize = (): DeviceType.CameraSize => this.getPlatformType() === "ios" ? { height: 320, width: 292 } : { height: 50, width: 50 };



    /**
     * 현재 디바이스의 종류를 반환 받습니다.
     * macos, web, windows의 경우는 수행하지 않습니다.
     * @return {string} 플랫폼 종류
    */
    getPlatformType = (): string => {
        if (Platform.OS === "macos" || Platform.OS === "web" || Platform.OS == "windows") {
            Alert.alert("지원하지 않는 플랫폼입니다.");
        }
        return Platform.OS
    }


    /**
     * 현재 디바이스의 '네트워크 연결상태'를 리스너로 등록하여 '변경(네트워크 상태)'될때 수행이 됩니다.
     * 해당 이벤트는 디바이스 연결이 되거나 연결이 종료되었을때 한번 수행됩니다.
     *
     * @return {NetInfoSubscription} 네트워크 객체
     */
    checkDeviceNetConListener = (): NetInfoSubscription => {
        const unsubscribe: NetInfoSubscription = NetInfo.addEventListener(state => {
            if (!state.isConnected) {
                Alert.alert("네트워크 연결이 끊겼습니다.", " 디바이스 연결 상태를 확인해주세요.");
            } else {
                // console.log("최초 네트워크가 연결되었습니다.")
            }
        });
        return unsubscribe;
    }

    /**
     * 안드로이드 하드웨어 뒤로가기 제어
     * true :  off, false : on
     *
     */
    hardwareBackRemove = (navigation, action) => {

        const backAction = () => {
            if (action) {
                return action;
            } else {
                return navigation.goBack();
            }
        };

        BackHandler.addEventListener(
            'hardwareBackPress',
            backAction,
        );
        return () => {
            BackHandler.removeEventListener('hardwareBackPress', backAction);
        }
    }

    /**
     * 장치 모델 명 값을 반환받습니다.
     * @return {string}
     * 예시
     * iOS: "iPhone7,2"
     * Android: "goldfish"
    */
    getDeviceNm = (): Promise<string> => DeviceInfo.getDeviceName();


    /**
     * 디바이스의 Mac Address를 반환받습니다.
     * @return {Promise<string>}
     *
     * 예시
     * iOS: "FCDBD8EF-62FC-4ECB-B2F5-92C9E79AC7F9"
     * Android: "dd96dec43fb81c97"
    */
    getDeviceUuid = async (): Promise<string> => await DeviceInfo.getUniqueId();


    /**
     * 디바이스 타입 이름을 반환합니다.
     * @returns 디바이스
     */
    getDeviceTypeNm = (): string => DeviceInfo.getDeviceType();


    /**
     * 디바이스의 OS 이름을 반환받습니다.
     * @return {string}
     * 반환 값 예시
     * iOS: "iOS"
     * Android: "Android"
    */
    getDeviceOsNm = (): string => DeviceInfo.getSystemName();



    /**
     * 디바이스의 타입을 반환받습니다.
     * @return {string}
     *
     * 반환 값 예시
     * Handset, Tablet, Tv, Desktop, GamingConsole, unknown
    */
    getDeviceOsVer = (): string => DeviceInfo.getSystemVersion();


    getDeviceIpAddr = async (): Promise<string> => {
        let ipAddr = "";
        await DeviceInfo.getIpAddress()
            .then((res) => {
                ipAddr = res
            })
            .catch((error) => {
                console.log("[-] ip를 불러오는 중에 에러가 발생하였습니다.")
            })
        return ipAddr;
    };


    isIPad = (): boolean => {

        if (DeviceInfo.getModel().substring(0, 4) === 'iPad') {
            return true;
        } else {
            return false;
        }
    }


    isTablet = (): boolean => DeviceInfo.isTablet();










}
export default new DeviceInfoUtil();
