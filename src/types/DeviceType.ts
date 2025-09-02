import DeviceInfoUtil from "../utils/DeviceInfoUtil";
import { Platform } from "react-native";

/**
 * 디바이스와 관련된 타입을 관리합니다.
 */
export declare module DeviceType {

    /**
    * 'TensorCamera'의 사이즈를 구조화합니다.
    */
    export type CameraSize = {
        height: number;
        width: number;
    }
    /**
     * 'TensorCamera'의 높이/너비를 구조화합니다.
     */
    export type TextureDims = {
        height: number;
        width: number;
    }


}
