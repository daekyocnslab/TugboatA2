import {BaseProcess} from "./BaseProcess";
import {LoginType} from "../../types/LoginType";
import KeycloakService from "../../services/keycloak/KeycloakService";
import jwtDecode from "jwt-decode";
import {UserType} from "../../types/UserType";
import {SUCCESS_CODE} from "../../common/utils/codes/CommonCode";

/**
 * 세션 관리 프로세스를 처리하는 클래스
 */
export class SessionManageProcess extends BaseProcess {
    constructor(navigation: any, dispatch: any) {
        super(navigation, dispatch);
    }

    // 세션 관리 초기화
    async init(authState: LoginType.AuthSlice): Promise<UserType.UserInfo> {
        // 토큰 재발급
        const authResponse: LoginType.TokenDatas = await this.refresh(authState);
        //사용자 및 토큰 정보 반환
        return await this.searchUserInfo(authResponse);
    }

    // 토큰 갱신
    async refresh(authState: LoginType.AuthSlice): Promise<LoginType.TokenDatas> {
        try {
            // 토큰 만료 확인
            const authResponse: LoginType.TokenDatas = await this.checkSessionExpiration(authState);
            if (authResponse != null) {
                // 갱신된 토큰 정보 저장
                const newAuthInfo: LoginType.AuthInfo = this.buildAuthInfo(authResponse);
                this.storeTokenInfo({...authState, ...newAuthInfo});
                //새로운 토큰 반환
                return authResponse;
            } else {
                //기존의 토큰 반환
                return authState.clientTokens;
            }
        } catch (error) {
            console.error(`토큰 갱신 중 에러가 발생하였습니다.: ${error}`);
            // 로그인 화면으로 이동
            this.navigation.navigate('attendance');
            throw error;
        }
    }

    /**
     * 토큰 재발급
     */
    getRefreshToken = async (KcRefreshAuth: LoginType.KcRefreshAuth): Promise<LoginType.TokenDatas> => {
        try {
            // 토큰 재발급하기
            const authResponse = await KeycloakService.getRefreshToken(KcRefreshAuth);

            if (authResponse['status'] === SUCCESS_CODE.SELECT) {
                // @ts-ignore
                const {data} = authResponse;

                // authResponse 데이터 내에 id_token이 존재하는 경우,
                if (data?.id_token) {
                    // 토큰 정보 디코딩
                    const jwtInfo = jwtDecode(data?.id_token) as Record<string, any>;
                    // 사용자 정보 출력
                    console.log('------------------------------------------------------------------');
                    console.log('사용자 정보 출력 [userInfo]', jwtInfo);
                    console.log('------------------------------------------------------------------');

                    return {tokens: data, jwt: jwtInfo};
                } else {
                    throw new Error("토큰 갱신 토큰이 없습니다.");
                }
            } else {
                throw new Error(`토큰 재발급 중 에러가 발생하였습니다.`);
            }
        } catch (err) {
            console.error('토큰을 재발급 받는 중에 오류가 발생하였습니다.', err);
            throw err;
        }
    }

    // 세션 만료 확인 후 토큰 재발급
    private async checkSessionExpiration(authState: LoginType.AuthSlice): Promise<LoginType.TokenDatas> {
        let {exp, accessToken, refreshToken, clientTokens, keycloakConfig} = authState;

        let expiredTime: number = parseInt(exp, 10);

        if (!isNaN(expiredTime)) {
            const localExpireTime = new Date(expiredTime * 1000);
            console.log("localExpireTime", localExpireTime.toLocaleString());
            // 세션 유효기간이 지난 경우
            if (Date.now() >= localExpireTime.getTime()) {
                console.log("토큰을 새로 발급받습니다.");
                return this.getRefreshToken({
                    ...keycloakConfig,
                    accessToken,
                    refreshToken
                });
            } else {
                console.log("토큰이 유효합니다.");
                return clientTokens;
            }
        }else{
            throw new Error(`토큰 만료 시간 데이터가 없습니다.`);
        }
    }


}
