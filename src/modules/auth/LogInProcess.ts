import { LoginMethod, SUCCESS_CODE } from "../../common/utils/codes/CommonCode";
import { UserType } from "../../types/UserType";
import { LoginType } from "../../types/LoginType";
import { BaseProcess } from "./BaseProcess";
import keycloakService from "../../services/keycloak/KeycloakService";
import {jwtDecode} from "jwt-decode";


/**
 * 로그인 프로세스를 처리하는 클래스
 */
export class LoginProcess extends BaseProcess {
    constructor(
        navigation: any,
        dispatch: any,
        private _loginMethod: LoginMethod,
        // private _credentials: UserType.Account | string,
        private _keycloakConfig: LoginType.KeycloakConfig,
    ) {
        super(navigation, dispatch); // 부모 클래스의 생성자 호출
        this._loginMethod = _loginMethod;
        // this._credentials = _credentials;
        this._keycloakConfig = _keycloakConfig;
    }


    get loginMethod(): LoginMethod {
        return this._loginMethod;
    }

    set loginMethod(value: LoginMethod) {
        this._loginMethod = value;
    }

    get keycloakConfig(): LoginType.KeycloakConfig {
        return this._keycloakConfig;
    }

    set keycloakConfig(value: LoginType.KeycloakConfig) {
        this._keycloakConfig = value;
    }

    /**
     * ADMIN CLI 로그인 인증
     * @param appLoginAuth
     */
    getAdminCliToken = async (adminCliLoginAuth: LoginType.KeycloakConfig): Promise<LoginType.TokenDatas> => {
        // 서비스 로그인 인증 정보
        const authResponse = await keycloakService.getAdminCliToken(adminCliLoginAuth).catch((error) => {
            console.error('어드민 로그인 중에 오류가 발생하였습니다.: ', error);
        });
        // 성공하는 경우,
        if (authResponse && authResponse['status'] === SUCCESS_CODE.SELECT) {

            // @ts-ignore
            const { data } = authResponse;

            console.log(data);

            //authResponse 데이터 내에 access_token 존재하는 경우,
            if (data?.access_token) {
                //토큰 정보 디코딩
                const jwtInfo = jwtDecode(data?.access_token) as Record<string, any>;
                //사용자 정보 출력
                console.log('------------------------------------------------------------------');
                console.log('Admin CLi 정보 출력 [userInfo]', jwtInfo);
                console.log('------------------------------------------------------------------');

                return { tokens: data, jwt: jwtInfo };
            } else {
                throw new Error("키클락 서비스 로그인 토큰이 없습니다.");
            }
        } else {
            throw new Error("키클락 서비스 로그인 중에 오류가 발생하였습니다.");
        }
    }

    /**
     *ID/PW 로그인 인증
     * @param appLoginAuth
     */
    getAcessToken = async (appLoginAuth: LoginType.AppLoginAuth): Promise<LoginType.TokenDatas> => {

        // ID/PW 로그인 인증 정보
        const authResponse = await keycloakService.getAcessToken(appLoginAuth).catch((error) => {
            console.error('키클락 로그인 중에 오류가 발생하였습니다.: ', error);
        });

        // 성공하는 경우,
        if (authResponse && authResponse['status'] === SUCCESS_CODE.SELECT) {

            // @ts-ignore
            const { data } = authResponse;

            //authResponse 데이터 내에 id_token이 존재하는 경우,
            if (data?.id_token) {
                //토큰 정보 디코딩
                const jwtInfo = jwtDecode(data?.id_token) as Record<string, any>;
                //사용자 정보 출력
                console.log('------------------------------------------------------------------');
                console.log('사용자 정보 출력 [userInfo]', jwtInfo);
                console.log('------------------------------------------------------------------');

                return { tokens: data, jwt: jwtInfo };
            } else {
                throw new Error(`키클락 ID/PW 로그인 토큰이 없습니다.`);
            }
        } else {
            throw new Error(`키클락 ID/PW 로그인 중 에러가 발생하였습니다.`);
        }
    }

    /**
     * SNS 로그인 인증
     */
    getSNSAcessToken = async (SNSLoginAuth: LoginType.SNSLoginAuth): Promise<LoginType.TokenDatas> => {

        // 액세스 토큰 가져오기
        let authResponse = await keycloakService.getSNSAcessToken(SNSLoginAuth).catch((error) => {
            console.error('토큰을 발급 받는 중에 오류가 발생하였습니다.: ', error);
        });

        // 성공하는 경우,
        if (authResponse['status'] === SUCCESS_CODE.SELECT) {

            // @ts-ignore
            const { data } = authResponse;

            //authResponse 데이터 내에 id_token이 존재하는 경우,
            if (data?.id_token) {
                //토큰 정보 디코딩
                const jwtInfo = jwtDecode(data?.id_token) as Record<string, any>;
                //사용자 정보 출력
                console.log('------------------------------------------------------------------');
                console.log('사용자 정보 출력 [userInfo]', jwtInfo);
                console.log('------------------------------------------------------------------');

                return { tokens: data, jwt: jwtInfo };
            } else {
                throw new Error(`SNS 로그인 토큰이 없습니다.`);
            }
        } else {
            throw new Error(`키클락 SNS 로그인 중 오류가 발생하였습니다.`);
        }

    }

    /**
     * 비밀번호 초기화
     */
    resetPassword = async (authState: LoginType.AuthSlice, userUuid: string, password: string): Promise<any> => {
        // 액세스 토큰 가져오기
        return await keycloakService.resetPassword(authState, userUuid, this.keycloakConfig, password).catch((error) => {
            console.error('비밀번호 초기화 중에 오류가 발생하였습니다.: ', error);
        });
    }


    // 로그인 실행
    async execute(param: any): Promise<any> {

        // 각 로그인 방법에 따른 로직 구현
        if (this._loginMethod === LoginMethod.SNS) {
            // SNS 로그인 실행
            return this.executeSNSLogin(param);
        } else if (this._loginMethod === LoginMethod.ID_PW) {
            // ID/PW 로그인 실행
            return this.executeIDPWLogin(param);
        } else if (this._loginMethod === LoginMethod.GUEST) {
            // Guest 로그인 처리
            // ...
        } else if (this._loginMethod === LoginMethod.SERVICE) {
            // 서비스계정의 로그인 실행
            return this.excuteAdminCLiLogin();
        } else {
            throw new Error('Unsupported login method');
        }

        //로그인 이력 저장
    }


    // SNS 로그인 실행
    private async executeSNSLogin(code: string): Promise<UserType.UserInfo> {
        try {
            //토큰 발급
            const authResponse = await this.getSNSAcessToken({
                ...this.keycloakConfig,
                code
            });

            //사용자 정보 조회
            return await this.searchUserInfo(authResponse);
        } catch (error) {
            throw new Error(`SNS 로그인 실행 중 에러가 발생하였습니다.`);
        }

    }

    // ID/PW 로그인 실행
    private async executeIDPWLogin(credentials: UserType.Account): Promise<UserType.UserInfo> {
        try {
            // 토큰 발급
            const authResponse = await this.getAcessToken({
                ...this.keycloakConfig,
                username: credentials.id,
                password: credentials.password
            });

            // 사용자 정보 조회
            return await this.searchUserInfo(authResponse);

        } catch (error) {
            throw new Error(`ID/PW 로그인 실행 중 에러가 발생하였습니다.`);
        }
    }

    // Admin Cli 로그인 실행
    private async excuteAdminCLiLogin() {

        try {
            // 토큰 발급
            const authResponse = await this.getAdminCliToken(this.keycloakConfig);

            //사용자 정보 저장
            const newAuthInfo = this.buildAdminAuthInfo(authResponse);
            this.storeAdminTokenInfo(newAuthInfo);

        } catch (error) {
            throw new Error(`서비스 로그인 실행 중 에러가 발생하였습니다.`);
        }
    }

}
