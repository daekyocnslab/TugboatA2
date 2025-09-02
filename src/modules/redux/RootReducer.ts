import { combineReducers } from "@reduxjs/toolkit";
import StudyPlanSlice from "./slice/StudyPlanSlice";
import StudySlice from "./slice/StudySlice";
import UserSlice from "./slice/UserSlice";
import SettingSlice from "./slice/SettingSlice";
import AuthSlice from "./slice/AuthSlice";
import UserDeviceInfoSlice from "./slice/UserDeviceInfoSlice";

/**
 * 애플리케이션에서 목적에 따라 리듀서를 분리하여 관리 합니다.
 */
const RootReducer = combineReducers({
    userInfo: UserSlice,
    studyInfo: StudySlice,
    studyPlanInfo: StudyPlanSlice,
    settingInfo: SettingSlice,
    authInfo: AuthSlice,
    userDeviceInfo: UserDeviceInfoSlice
});

export type RootState = ReturnType<typeof RootReducer>;

export default RootReducer;
