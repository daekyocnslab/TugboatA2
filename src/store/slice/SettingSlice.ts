import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Setting에서 관리해야하는 Slice
const initialState = {
    incognito: false,
    tutorial: true,
    useYn: false,
    timerTime: 45,

    // 터그보트 서비스 이용약관
    tos: {
        tosCd: "",
        okYn: false
    },

    // 개인정보 이용 수집 동의
    cncntpi: {
        tosCd: "",
        okYn: false
    },

    // 개인정보 제 3자 제공 및 위탁 동의서
    thcsnt: {
        tosCd: "",
        okYn: false
    },

    // 만 14세 이상 확인
    unppr14Yn: {
        tosCd: "",
        okYn: false
    }
};

/**
 * TemplateSlice에서 관리할 상태를 지정합니다.
 */
export const SettingSlice = createSlice({
    name: 'settingInfo',
    initialState: initialState,
    reducers: {
        //로그아웃 상태를 저장합니다.
        setLogout(state, action) {
            state.incognito = action.payload; //로그아웃시 true 세팅, 쿠키세션 저장안함
        },
        setTutorial(state, action) {
            state.tutorial = action.payload;
        },
        setUseDefaultStudyTime(state, action) {
            state.useYn = action.payload;
        },
        setDefaultStudyTime(state, action) {
            state.timerTime = action.payload;
        },
        setTosOk(state, action) {
            state.tos = action.payload.tos;
            state.cncntpi = action.payload.cncntpi;
            state.thcsnt = action.payload.thcsnt;
            state.unppr14Yn = action.payload.unppr14Yn;
        }

    },
});

// Action creators are generated for each case reducer function
export const {
    setLogout,
    setTutorial,
    setUseDefaultStudyTime,
    setDefaultStudyTime,
    setTosOk
} = SettingSlice.actions

export default SettingSlice.reducer
