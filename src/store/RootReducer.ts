import { combineReducers } from '@reduxjs/toolkit';
import UserSlice from './slice/UserSlice';
import UserDeviceInfoSlice from './slice/UserDeviceInfoSlice';
import StudySlice from './slice/StudySlice';
import StudyPlanSlice from './slice/StudyPlanSlice';
import SettingSlice from './slice/SettingSlice';
import AuthSlice from './slice/AuthSlice';

/**
 * 애플리케이션에서 목적에 따라 리듀서를 분리하여 관리 합니다.
 */
const RootReducer = combineReducers({
	userInfo: UserSlice,
	studyInfo: StudySlice,
	studyPlanInfo: StudyPlanSlice,
	settingInfo: SettingSlice,
	authInfo: AuthSlice,
	userDeviceInfo: UserDeviceInfoSlice,
});

export type RootState = ReturnType<typeof RootReducer>;

export default RootReducer;
