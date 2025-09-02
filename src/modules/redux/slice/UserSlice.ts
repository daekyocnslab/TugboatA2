import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// User에서 관리해야하는 Slice
const initialState = {
    userSq: 0, //사용자 시퀀스
    userUuid: '',//사용자 userUuid
    userNm: '',//사용자 userNm
    loginId:'', //사용자 loginId
    groups: {
        "grpSq":0,
        "grpNm":"",
        "grpId":"",
        "grpVrfcCd":"",
        "orgSq":0,
        "pinYn":false,
        "delYn":false,
        "regTs":"",
        "regUser":"",
        "modTs":"",
        "modUser":""
    }, //사용자 그룹
};

/**
 * TemplateSlice에서 관리할 상태를 지정합니다.
 */
export const UserSlice = createSlice({
    name: 'userInfo',
    initialState: initialState,
    reducers: {
        // 모든 사용자 정보를 상태에 저장합니다.
        setUser(state, action) {
            state.userSq = action.payload.userSq;       // 사용자 시퀀스
            state.userUuid = action.payload.userUuid;   // 사용자 userUuid
            state.userNm = action.payload.userNm;   // 사용자 userNm
            state.groups = action.payload.groups;       // 사용자 그룹
            },
        // 모든 사용자 정보를 상태에 저장합니다.
        setUserData(state, action) {
            state.userSq = action.payload.userSq;       // 사용자 시퀀스
            state.userUuid = action.payload.userUuid;   // 사용자 userUuid
            state.userNm = action.payload.userNm;   // 사용자 userNm
            state.loginId = action.payload.loginId;   // 사용자 userNm
        },

        // 로그아웃 초기화 작업
        setUserLogout(state, action) {
            state.userSq = action.payload.userSq;// 사용자 시퀀스
            state.userUuid = action.payload.userUuid; //사용자 userUuid
        },

        setUuid(state, action) {
            state.userUuid = action.payload;
        },

        setGroup(state, action) {
            state.groups = action.payload; //사용자 그룹
        },

    },
});

// Action creators are generated for each case reducer function
export const {
    setUser,
    setUserData,
    setGroup,
} = UserSlice.actions

export default UserSlice.reducer
