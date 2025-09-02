import {UserType} from "./UserType";

export declare module LoginType {

    import UserInfo = UserType.UserInfo;
    export type WebViewState = {
        url: string;
        [key: string]: any;
    }

    export interface TokenInfo {
        access_token: string,
        expires_in: number,
        refresh_expires_in: number,
        refresh_token: string,
        token_type: string,
        id_token: string,
        "not-before-policy": number,
        session_state: string,
        scope: string,
    }

    export interface TokenDatas {
        tokens: TokenInfo,
        jwt: Record<string, any>
    }

    export interface KeycloakConfig {
        keycloakBaseUrl: string;
        realmName: string;
        clientId: string;
        clientSecret: string;
        loginRedirectTo: string,
        logoutRedirectTo: string,
        scopes: string;
    }

    export interface SNSLoginAuth extends KeycloakConfig {
        code: string;
    }

    export interface AppLoginAuth extends KeycloakConfig {
        username: string;
        password: string;
    }

    export interface KcRefreshAuth extends KeycloakConfig {
        accessToken: string;
        refreshToken: string;
    }

    export interface AuthInfo {
        accessToken: string,
        refreshToken: string,
        idToken: string,
        exp: string,
        clientTokens: TokenDatas,
    }

    export interface AdminCliAuthInfo {
        adminCliAccessToken: string,
        adminExp: string,
        adminCliTokens: TokenDatas,
    }

    export interface AuthSlice {
        accessToken: string,
        refreshToken: string,
        idToken: string,
        exp: string,
        adminCliAccessToken: string,
        clientTokens: TokenDatas,
        adminCliTokens: TokenDatas,
        keycloakConfig: KeycloakConfig,
    }

    /**
     * 로그인 이력을 관리하는 DTO
     */
    export type LoginHistDto = {
        loginHisSq?: number,
        loginId: string,
        loginTs?: string,
        userIp?: string,
        failYn: boolean,
        errMsg: string
    }


    export interface UserLogin extends UserInfo {
        userSq : number,
        loginId: string,
        orgSq: number,
        loginPswrd: string,
    }

    /**
     * 로그인 이력을 관리하는 DTO
     */
    export type AttendanceDto = {
        userSq? : number,
        userNm?: string,
        loginId: string,
        userIp?: string,
    }

}