import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LoginType } from "../../../types/LoginType";

// Auth에서 관리해야하는 Slice
const initialState = {
    accessToken: '',//사용자 액세스 코드
    refreshToken: '',//사용자 리프레쉬 코드
    idToken: '',//사용자의 아이디 토큰
    exp: '',// 세션 만료 시간,
    clientTokens: {} as LoginType.TokenDatas, //클라이언트 토큰정보
    adminCliAccessToken: '', //서비스 계정의 사용자 액세스 코드,
    adminExp: '',//서비스계정 세션 만료 시간,
    adminCliTokens: {} as LoginType.TokenDatas,// 어드민 토큰정보
    keycloakConfig: {} as LoginType.KeycloakConfig,// 키클락 ClientAttrs
};

/**
 * TemplateSlice에서 관리할 상태를 지정합니다.
 */
export const AuthSlice = createSlice({
    name: 'authInfo',
    initialState,
    reducers: {
        setToken(state, action) {
            state.accessToken = action.payload.accessToken; //사용자 액세스 코드
            state.refreshToken = action.payload.refreshToken; //사용자 리프레쉬 코드
            state.idToken = action.payload.idToken; //사용자 아이디 토큰
            state.exp = action.payload.exp; // 세션 만료 시간
            state.clientTokens = action.payload.clientTokens; // 세션 만료 시간
        },

        setAdminToken(state, action) {
            state.adminCliAccessToken = action.payload.adminCliAccessToken; //서비스 계정의 사용자 액세스 코드
            state.adminExp = action.payload.adminExp; //서비스 계정의 세션 만료 시간
            state.adminCliTokens = action.payload.adminCliTokens; //어드민 토큰 정보
        },

        setKeycloakConfig(state, action) {
            state.keycloakConfig = action.payload; // 키클락 접속 클라이언트 정보
        },

        setExp(state, action) {
            state.exp = action.payload.exp; // 세션 만료 시간
        },

        setClientTokens(state, action) {
            state.clientTokens = action.payload; //클라이언트 토큰 정보
        },

        setTokenDatas(state, action) {
            state.accessToken = action.payload.accessToken; //사용자 액세스 코드
            state.refreshToken = action.payload.refreshToken; //사용자 리프레쉬 코드
            state.idToken = action.payload.idToken; //사용자 아이디 토큰
            state.exp = action.payload.exp; // 세션 만료 시간
            state.adminCliAccessToken = action.payload.adminCliAccessToken; //서비스 계정의 사용자 액세스 코드
            state.adminExp = action.payload.adminExp; //서비스 계정의 세션 만료 시간
            state.clientTokens = action.payload.clientTokens; //클라이언트 토큰 정보
            state.adminCliTokens = action.payload.adminCliTokens; //어드민 토큰 정보
            state.keycloakConfig = action.payload.keycloakConfig; //어드민 토큰 정보
        },

    },
});

export const {
    setToken,
    setAdminToken,
    setTokenDatas,
    setExp,
    setKeycloakConfig,
} = AuthSlice.actions

export default AuthSlice.reducer
