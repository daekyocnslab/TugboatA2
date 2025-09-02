import axios, { Axios, AxiosResponse } from 'axios';
import { LoginType } from "../../types/LoginType";
import { CommonType } from "../../types/common/CommonType";
import { HTTP_METHOD } from "../../common/utils/codes/CommonCode";


/**
 * API 통신을 위한 Axios를 이용한 템플릿 입니다. : 기본적으로 비동기 통신을 통해서 데이터 통신을 수행합니다.
 */
class KeycloakService {

    /**
     * HTTP Method GET 방식
     * 서비스 계정에서 액세스 토큰 가져오기
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    getAdminCliToken = (aminCliLoginAuth: LoginType.KeycloakConfig): Promise<AxiosResponse<any, any>> => {
        let { keycloakBaseUrl, realmName, clientId, clientSecret } = aminCliLoginAuth;

        console.log("result :: ", keycloakBaseUrl, realmName, clientId, clientSecret)
        return axios({
            method: HTTP_METHOD.POST,
            url: `${keycloakBaseUrl}/realms/${realmName}/protocol/openid-connect/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: {
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: 'client_credentials'
            }
        });
    }


    /**
     * HTTP Method POST 방식
     * SNS 로그인 토큰 발급(AuthorizationCode 방식)
     * <LoginType.TokenInfo
     * @param code
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    getSNSAcessToken = (keycloakAuth: LoginType.SNSLoginAuth): Promise<AxiosResponse<LoginType.TokenInfo & CommonType.apiResponseType, any>> | any => {
        let { keycloakBaseUrl, realmName, clientId, clientSecret, loginRedirectTo, code } = keycloakAuth;
        console.log(keycloakAuth);
        return axios({
            method: HTTP_METHOD.POST, // POST 방식 요청으로 변경
            url: `${keycloakBaseUrl}/realms/${realmName}/protocol/openid-connect/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: {
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: loginRedirectTo,
                code: code,
            },
        });
    };

    /**
     * HTTP Method POST 방식
     * 토큰 재발급
     *
     * @param code
     * @param refreshToken
     * @returns {Promise<AxiosResponse<any, any>>}
     */

    getRefreshToken = async (
        kcRefreshAuth: LoginType.KcRefreshAuth
    ): Promise<AxiosResponse<LoginType.TokenInfo & CommonType.apiResponseType, any>> => {
        let { keycloakBaseUrl, realmName, clientId, clientSecret, accessToken, refreshToken } = kcRefreshAuth;

        const data = `grant_type=refresh_token&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&refresh_token=${encodeURIComponent(refreshToken)}`;

        return axios({
            method: HTTP_METHOD.POST,
            url: `${keycloakBaseUrl}/realms/${realmName}/protocol/openid-connect/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${accessToken}`
            },
            data: data,
        });


    };

    /**
     * HTTP Method POST 방식
     * ID/PW 로그인
     *
     * @param code
     * @param refreshToken
     * @returns {Promise<AxiosResponse<any, any>>}
     */

    getAcessToken = (appLoginAuth: LoginType.AppLoginAuth): Promise<AxiosResponse<LoginType.TokenInfo & CommonType.apiResponseType, any>> => {
        let { keycloakBaseUrl, realmName, clientId, clientSecret, scopes, username, password } = appLoginAuth;
        console.log(`${keycloakBaseUrl}/realms/${realmName}/protocol/openid-connect/token`);
        return axios({
            method: HTTP_METHOD.POST, // POST 방식 요청으로 변경
            url: `${keycloakBaseUrl}/realms/${realmName}/protocol/openid-connect/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: {
                grant_type: 'password',
                client_id: clientId,
                client_secret: clientSecret,
                scope: scopes,
                username: username,
                password: password
            },
        });
    };

    /**
     * HTTP Method POST 방식
     * 로그아웃
     *
     * @param code
     * @param refreshToken
     * @returns {Promise<AxiosResponse<any, any>>}
     */

    logoutKcUser = (kcRefreshAuth: LoginType.KcRefreshAuth): Promise<AxiosResponse<LoginType.TokenInfo & CommonType.apiResponseType, any>> => {
        let { keycloakBaseUrl, realmName, clientId, clientSecret, refreshToken } = kcRefreshAuth;
        console.log(`${keycloakBaseUrl}/realms/${realmName}/protocol/openid-connect/logout`);
        return axios({
            method: HTTP_METHOD.POST, // POST 방식 요청으로 변경
            url: `${keycloakBaseUrl}/realms/${realmName}/protocol/openid-connect/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: {
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
            },
        });
    };

    sentVerifyEmail = (appLoginAuth: LoginType.AppLoginAuth): Promise<AxiosResponse<LoginType.TokenInfo & CommonType.apiResponseType, any>> => {
        let { keycloakBaseUrl, realmName, clientId, clientSecret, loginRedirectTo, username } = appLoginAuth;
        return axios({
            method: HTTP_METHOD.PUT, // POST 방식 요청으로 변경
            url: `${keycloakBaseUrl}/realms/${realmName}/users/${username}/send-verify-email`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: {
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: loginRedirectTo
            },
        });
    };

    executeActionEmail = (appLoginAuth: LoginType.AppLoginAuth): Promise<AxiosResponse<LoginType.TokenInfo & CommonType.apiResponseType, any>> => {
        let { keycloakBaseUrl, realmName, clientId, clientSecret, loginRedirectTo, username } = appLoginAuth;
        return axios({
            method: HTTP_METHOD.PUT, // POST 방식 요청으로 변경
            url: `${keycloakBaseUrl}/realms/${realmName}/users/${username}/execute-actions-email`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: {
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: loginRedirectTo
            },
        });
    };

    /**
     * HTTP Method POST 방식
     * 사용자의 정보 추가
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    createKcUser = (authState: LoginType.AuthSlice, userInfo, aminCliLoginAuth: LoginType.KeycloakConfig): Promise<AxiosResponse<any, any>> => {
        let { keycloakBaseUrl, realmName } = aminCliLoginAuth;

        return axios({
            method: HTTP_METHOD.POST,
            url: `${keycloakBaseUrl}/admin/realms/${realmName}/users`,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
            data: userInfo
        });
    }

    /**
     * HTTP Method GET 방식
     * 사용자의 정보 조회
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    getKcUser = (authState: LoginType.AuthSlice, userUuid, aminCliLoginAuth: LoginType.KeycloakConfig): Promise<AxiosResponse<any, any>> => {
        let { keycloakBaseUrl, realmName } = aminCliLoginAuth;
        return axios({
            method: HTTP_METHOD.GET,
            url: `${keycloakBaseUrl}/admin/realms/${realmName}/users/${userUuid}`,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }


    /**
     * HTTP Method GET 방식
     * 사용자의 정보 조회
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    getKcUserEmailCnt = (email, authState: LoginType.AuthSlice, aminCliLoginAuth: LoginType.KeycloakConfig): Promise<AxiosResponse<any, any>> => {
        let { keycloakBaseUrl, realmName } = aminCliLoginAuth;
        return axios({
            method: HTTP_METHOD.GET,
            url: `${keycloakBaseUrl}/admin/realms/${realmName}/users/count`,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
            params: {
                email: email
            }
        });
    }

    /**
     * 사용자 아이디를 중복 체크를 수행합니다.
     * @param authState 
     * @param userId 
     * @param aminCliLoginAuth 
     * @returns 
     */
    getKcUserIdCheck = (
        authState: LoginType.AuthSlice,
        userId: string,
        aminCliLoginAuth: LoginType.KeycloakConfig): Promise<AxiosResponse<any, any>> => {
        const { keycloakBaseUrl, realmName } = aminCliLoginAuth;
        return axios({
            method: HTTP_METHOD.GET,
            url: `${keycloakBaseUrl}/admin/realms/${realmName}/users`,
            params: {
                "username": userId,
                "exact": true
            },
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }


    /**
    * HTTP Method GET 방식
    * ID로 사용자의 정보 조회
    * @returns {Promise<AxiosResponse<any, any>>}
    */
    getKcUserById = (
        authState: LoginType.AuthSlice,
        userId: string,
        aminCliLoginAuth: LoginType.KeycloakConfig): Promise<AxiosResponse<any, any>> => {
        let { keycloakBaseUrl, realmName } = aminCliLoginAuth;
        return axios({
            method: HTTP_METHOD.GET,
            url: `${keycloakBaseUrl}/admin/realms/${realmName}/users/${userId}&exact=true`,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }
    /**
     * HTTP Method GET 방식
     * Email로 사용자의 정보 조회
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    getKcUserByEmail = (
        authState: LoginType.AuthSlice,
        userEmail,
        aminCliLoginAuth: LoginType.KeycloakConfig,
    ): Promise<AxiosResponse<any, any>> => {
        let { keycloakBaseUrl, realmName } = aminCliLoginAuth;
        return axios({
            method: HTTP_METHOD.GET,
            url: `${keycloakBaseUrl}/admin/realms/${realmName}/users/?email=${userEmail}&exact=true`,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`,
            },
        });
    };

    /**
     * HTTP Method PUT 방식
     * 사용자의 정보 업데이트
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    updateKcUser = (authState: LoginType.AuthSlice, userInfo, aminCliLoginAuth: LoginType.KeycloakConfig): Promise<AxiosResponse<any, any>> => {
        let { keycloakBaseUrl, realmName } = aminCliLoginAuth;
        return axios({
            method: HTTP_METHOD.PUT,
            url: `${keycloakBaseUrl}/admin/realms/${realmName}/users`,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
            data: userInfo
        });
    }
    /**
     * HTTP Method DELETE 방식
     * 사용자의 정보 삭제
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    deleteKcUser = (authState: LoginType.AuthSlice, userUuid, aminCliLoginAuth: LoginType.KeycloakConfig): Promise<AxiosResponse<any, any>> => {
        let { keycloakBaseUrl, realmName } = aminCliLoginAuth;
        return axios({
            method: HTTP_METHOD.DELETE,
            url: `${keycloakBaseUrl}/admin/realms/${realmName}/users/${userUuid}`,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
        });
    }

    resetPassword = (authState: LoginType.AuthSlice, userUuid: string, aminCliLoginAuth: LoginType.KeycloakConfig, password: string): Promise<AxiosResponse<any, any>> => {
        let { keycloakBaseUrl, realmName } = aminCliLoginAuth;

        return axios({
            method: HTTP_METHOD.PUT,
            url: `${keycloakBaseUrl}/admin/realms/${realmName}/users/${userUuid}/reset-password`,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
            data: {
                type: "password",
                value: password,
                temporary: false
            }
        });
    }






    /**
     * HTTP Method GET 방식
     * 그룹 리스트 조회
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    getGroupsList = (authState: LoginType.AuthSlice, groupId: string): Promise<AxiosResponse<any, any>> => {
        return axios({
            method: HTTP_METHOD.GET,
            url: `${process.env.TUGBOAT_API_KEYCLOAK_SERVER}/group`,
            headers: {
                Authorization: `Bearer ${authState.accessToken}`
            },
            params: {
                groupId: groupId
            }
        });
    }

    /**
     * HTTP Method GET 방식
     * 사용자의 그룹 등록
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    regUserGroup = (authState: LoginType.AuthSlice, userId, groupId): Promise<AxiosResponse<any, any>> => {
        return axios({
            url: `${process.env.TUGBOAT_API_KEYCLOAK_SERVER}/regUserGroup`,
            headers: {
                Authorization: `Bearer ${authState.accessToken}`
            },
            params: {
                userId: userId,
                groupId: groupId
            }
        });
    }

    /**
     * HTTP Method PUT 방식
     * 사용자의 정보 수정
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    updateUserProfile = (authState: LoginType.AuthSlice, userInfo, aminCliLoginAuth: LoginType.KeycloakConfig): Promise<AxiosResponse<any, any>> => {
        let { keycloakBaseUrl, realmName } = aminCliLoginAuth;
        return axios({
            method: HTTP_METHOD.PUT,
            url: `${keycloakBaseUrl}/admin/realms/${realmName}/users/${userInfo.id}`,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.adminCliAccessToken}`
            },
            data: userInfo
        });
    }


    // @DeleteMapping("/leaveUserGroup")
    /**
     * HTTP Method PUT 방식
     * 사용자의 정보 삭제
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    deleteGroup = (authState: LoginType.AuthSlice, userUuid, groupId): Promise<AxiosResponse<boolean>> => {
        return axios({
            method: HTTP_METHOD.DELETE,
            url: `${process.env.TUGBOAT_API_KEYCLOAK_SERVER}/removeGroup`,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.accessToken}`
            },
            params: {
                userId: userUuid
            }
        });
    }


    /**
     * HTTP Method PUT 방식
     * 사용자의 정보 삭제
     * @returns {Promise<AxiosResponse<any, any>>}
     */
    deleteUser = (authState: LoginType.AuthSlice, userUuid): Promise<AxiosResponse<boolean>> => {
        return axios({
            method: HTTP_METHOD.DELETE,
            url: `${process.env.TUGBOAT_API_KEYCLOAK_SERVER}/removeUser`,
            headers: {
                'content-Type': 'application/json',
                Authorization: `Bearer ${authState.accessToken}`
            },
            params: {
                userId: userUuid
            }
        });
    }


}

export default new KeycloakService();
