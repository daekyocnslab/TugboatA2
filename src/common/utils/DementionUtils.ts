import { Dimensions, PixelRatio, Platform, StatusBar } from "react-native";
import { Float } from "react-native/Libraries/Types/CodegenTypes";
import DeviceInfo from 'react-native-device-info';


// ZEPLIN의 기준점(가로, 세로)
const ZEPLIN_WIDTH = 360;
// const ZEPLIN_HEIGHT = 760;
const ZEPLIN_HEIGHT = 648;
const { width, height } = Dimensions.get("window");

const isTablet = DeviceInfo.isTablet();

class DementionUtils {
    /**
     * 절대값을 기반으로 상대적인 '너비'를 구합니다.
     * @param size  절대값 사이즈
     * @returns     상대값 사이즈
     */
    widthRelateSize = (size: Float, factor = 0): number => {
        const { width } = Dimensions.get("window");

        // [CASE1] 기존 방법
        return (size / ZEPLIN_WIDTH) * width;
    }

    /**
     * 절대값을 기반으로 상대적인 '높이'를 구합니다.
     * @param size  절대값 사이즈
     * @returns     상대값 사이즈
     */
    heightRelateSize = (size: Float, customDim = 0): number => {
        const { height } = Dimensions.get("window");
        let result = 0;

        if (customDim === 0) result = (size / ZEPLIN_HEIGHT) * height;
        else {
            result = (size / customDim) * height;
        }

        return result;
    }

    /**
     * iOS만 적용되는 사이즈
     * @param size
     * @param type
     * @returns
     */
    iOSOnlyRelateSize = (size: number, type?: "height" | "width" | "font"): number => {
        let resultSize = 0;
        if (Platform.OS === "ios") {
            switch (type) {
                case "width":
                    resultSize = this.widthRelateSize(size);
                    break;
                case "height":
                    resultSize = this.heightRelateSize(size);
                    break;
                case "font":
                    resultSize = this.fontRelateSize(size);
                    break;
                default:
                    break;
            }
        }
        return resultSize;
    }


    zeplinToReactNativePx = (zeplinValue: number): number => {
        const deviceWidth = Dimensions.get('window').width;
        return (zeplinValue / ZEPLIN_WIDTH) * deviceWidth;
    }


    /**
     * 절대값을 기반으로 상대적인 'Margin'을 구합니다
     * @param margin    절대값의 margin 사이즈
     * @returns         상대값의 margin 사이즈
     */
    marginRelateSize = (margin: number): Float => {
        return this.widthRelateSize(margin);
    }

    /**
     * 절대값을 기반으로 상대적인 '폰트 크기'(Scale)를 구합니다.
     * @param size   절대값 사이즈
     * @returns      상대값 사이즈
     */
    fontRelateSize = (size: Float): Float => {

        // [CASE1] 기존방법 1
        const { width } = Dimensions.get("window")
        const scale = width / ZEPLIN_WIDTH;
        const newSize = size * scale;

        let rtnValue = PixelRatio.roundToNearestPixel(newSize);

        // 태블릿일 경우 크기 고정
        if (isTablet) {
            if (rtnValue > 9) {
                rtnValue = rtnValue - 9;
            }
        }

        return rtnValue;

        // return responsiveFontSize(size * 0.135);
    }


    headerHeightRelateSize = (size: number) => {
        const { height } = Dimensions.get("window");
        const ZEPLIN_HEADER_HEIGHT = 66;

        let rtnValue = (size / ZEPLIN_HEADER_HEIGHT) * (ZEPLIN_HEADER_HEIGHT / 760 * height);

        // [CASE1] 기존 방법
        return rtnValue;
    }

    bottomHeightRelateSize = (size: number) => {

        const { height } = Dimensions.get("window");
        let ZEPLIN_HEADER_HEIGHT = 0;
        let result = 0;
        if (Platform.OS === "android") {
            ZEPLIN_HEADER_HEIGHT = 56;
            result = (size / ZEPLIN_HEADER_HEIGHT) * (ZEPLIN_HEADER_HEIGHT / 760 * height);

        } else if (Platform.OS === "ios") {
            ZEPLIN_HEADER_HEIGHT = 120;
            result = (size / ZEPLIN_HEADER_HEIGHT) * (ZEPLIN_HEADER_HEIGHT / 760 * height);
        }


        return result;

    }

    deviceSizeNumber = (number: number, addNumber: number) => {

        if (isTablet) {
            number = number + addNumber;
        }


        return number;
    }


    // 뷰포트기반
    scale = size => width / ZEPLIN_WIDTH * size;

    // 높이기반
    verticalScale = size => height / ZEPLIN_HEIGHT * size;

    // factor값 제어
    moderateScale = (size, factor = 0.5) => size + (this.scale(size) - size) * factor;

}

export default new DementionUtils();
