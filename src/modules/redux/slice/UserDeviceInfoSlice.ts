import { createSlice } from "@reduxjs/toolkit";
import { UserDeviceType } from "types/UserDeviceType";


// '학습'에서 관리하는 학습 Redux
const initialState: UserDeviceType.ReduxUserDeviceInfo = {
    dvcUuid: "",             // 디바이스 UUID
    dvcTkn: "",              // 디바이스 FCM ID
    dvcNm: "",               // 디바이스 아이디
    dvcTypeNm: "",          // 디바이스 유형 이름
    osNm: "",               // 운영체제 이름
    osVer: "",              // 운영체제 버전
    clientVer: "",          // 앱 버전
};

/**
 * UserDeviceInfoSlice 관리할 상태를 지정합니다.
 */
export const UserDeviceInfoSlice = createSlice({
    name: 'userDeviceInfo',
    initialState,
    reducers: {

        // 모든 사용자 정보를 상태에 저장합니다.
        setUserDeviceInfo(state, action) {
            state.dvcUuid = action.payload.dvcUuid;
            state.dvcTkn = action.payload.dvcTkn;
            state.dvcNm = action.payload.dvcNm;
            state.dvcTypeNm = action.payload.dvcTypeNm;
            state.osNm = action.payload.osNm;
            state.osVer = action.payload.osVer;
            state.clientVer = action.payload.clientVer;
        },
        // 앱 버전을 갱신합니다.
        setClientVersion(state, action) {
            state.clientVer = action.payload.clientVer;
        }
    }
})

// Action creators are generated for each case reducer function
export const { setUserDeviceInfo, setClientVersion } = UserDeviceInfoSlice.actions

export default UserDeviceInfoSlice.reducer


