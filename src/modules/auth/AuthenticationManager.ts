import {LoginMethod} from "../../common/utils/codes/CommonCode";
import {LoginProcess} from "./LogInProcess";
import {SignUpProcess} from "./SignUpProcess";
import {UserType} from "../../types/UserType";
import {LoginType} from "../../types/LoginType";
import {SessionManageProcess} from "./SessionManageProcess";
import React from "react";
import {BaseProcess} from "./BaseProcess";

/**
 * 인증 관련 기능을 제공하는 매니저 클래스
 * 회원가입, 로그인, 비밀번호 복구 등
 */
class AuthenticationManager {
    private static instance: AuthenticationManager;
    private navigation: any;
    private dispatch: any;
    private baseProcess: BaseProcess | undefined;
    private signUpProcess: SignUpProcess | undefined;
    private loginProcess: LoginProcess | undefined;
    private sessionManageProcess: SessionManageProcess | undefined;


    constructor(
        navigation: any,
        dispatch: React.Dispatch<any>,) {
        console.log('AuthenticationManager constructor called');
        this.navigation = navigation;
        this.dispatch = dispatch;
    }

    public static getInstance(navigation, dispatch): AuthenticationManager {
        if (!AuthenticationManager.instance) {
            AuthenticationManager.instance = new AuthenticationManager(navigation, dispatch);
        }
        return AuthenticationManager.instance;
    }

    /**
     * 초기 세팅
     * 세션 정보 초기화 / 저장
     */
    init = async (authState) => {
        if (this.sessionManageProcess == null) {
            this.sessionManageProcess = new SessionManageProcess(this.navigation, this.dispatch);
        }
        return this.sessionManageProcess.init(authState);
    }

    /**
     * 회원가입
     * @param userInfo
     * @param credential
     */
    signUp = async (authState: LoginType.AuthSlice, userInfo: UserType.UserInfo, credential: UserType.Account): Promise<UserType.UserInfo> => {
        if (this.signUpProcess == null) {
            this.signUpProcess = new SignUpProcess(this.navigation, this.dispatch);
        }
        return this.signUpProcess.execute(authState, userInfo, credential);
    }

    /**
     * ID/PW 로그인
     * @param loginMethod
     * @param clientAttr
     * @param credentials
     */
    login = async (loginMethod: LoginMethod, config: LoginType.KeycloakConfig, credentials: UserType.Account) => {
        if (this.loginProcess == null || this.loginProcess.loginMethod != loginMethod || this.loginProcess.keycloakConfig != config) {
            this.loginProcess = new LoginProcess(this.navigation, this.dispatch, loginMethod, config);
        }
        console.log("credentials :: ", credentials)

        return this.loginProcess.execute(credentials);
    };

    /**
     * SNS 로그인
     * @param loginMethod
     * @param clientAttr
     * @param code
     */
    snsLogin = async (loginMethod: LoginMethod, config: LoginType.KeycloakConfig, code: string) => {
        if (this.loginProcess == null || this.loginProcess.loginMethod != loginMethod || this.loginProcess.keycloakConfig != config) {
            this.loginProcess = new LoginProcess(this.navigation, this.dispatch, loginMethod, config);
        }

        return await this.loginProcess.execute(code);
    };

    /**
     * 서비스 로그인
     * @param loginMethod
     * @param clientAttr
     * @param code
     */
    adminCLiLogin = async (loginMethod: LoginMethod, config: LoginType.KeycloakConfig) => {
        if (this.loginProcess == null || this.loginProcess.loginMethod != loginMethod || this.loginProcess.keycloakConfig != config) {
            this.loginProcess = new LoginProcess(this.navigation, this.dispatch, loginMethod, config);
        }
        return this.loginProcess.execute("");
    };

    /**
     * 토큰 재발급
     */
    refresh = async (authState: LoginType.AuthSlice): Promise<LoginType.TokenDatas> => {
        if (this.sessionManageProcess == null) {
            this.sessionManageProcess = new SessionManageProcess(this.navigation, this.dispatch);
        }
        return this.sessionManageProcess.refresh(authState);
    };

    /**
     * 비밀번호 변경
     */
    resetPassword = async (authState: LoginType.AuthSlice, userUuid: string, loginMethod: LoginMethod, config: LoginType.KeycloakConfig, password: string) => {
        if (this.loginProcess == null || this.loginProcess.loginMethod != loginMethod || this.loginProcess.keycloakConfig != config) {
            this.loginProcess = new LoginProcess(this.navigation, this.dispatch, loginMethod, config);
        }
        return this.loginProcess.resetPassword(authState, userUuid, password);
    };

    getUser = async (authState: LoginType.AuthSlice, userDto: UserType.UserInfo) : Promise<UserType.UserInfo[]> => {
        if (this.baseProcess == null) this.baseProcess = new BaseProcess(this.navigation, this.dispatch);
        return this.baseProcess.getUser(authState, userDto);
    };

    // /**
    //  * ID를 통해 계정 정보 조회
    //  * @param userJWTData
    //  */
    // getUserById = async (userId) => {
    //     try {
    //         const userServiceResponse: AxiosResponse<UserType.UserInfo & CommonType.apiResponseType, any> = await keycloakService.getUserById(this.authState, userId);
    //         if (userServiceResponse.data && userServiceResponse.status === SUCCESS_CODE.SELECT) {
    //             const {result: userData}: UserType.UserInfo & CommonType.apiResponseType = userServiceResponse.data;
    //             console.log(userData);
    //             return userData;
    //         } else {
    //             console.error("[-] ID를 통해 사용자 조회 중 에러가 발생하였습니다.");
    //         }
    //     } catch (error) {
    //         console.error('ID를 통해 사용자 조회 중 에러가 발생하였습니다.', error);
    //     }
    // }


    // 계정 정보 수정

    // 로그인 이력 관리


}


export default AuthenticationManager;

