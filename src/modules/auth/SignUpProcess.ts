import CommonUtil from "../../common/utils/CommonUtil";
import { BaseProcess } from "./BaseProcess";
import { CommonType } from "../../types/common/CommonType";
import { AxiosResponse } from "axios";
import userService from "../../services/user/UserService";
import keycloakService from "../../services/keycloak/KeycloakService";
import { AdminCliLogin } from "./AdminCliLogin";
import { UserType } from "../../types/UserType";
import { LoginType } from "../../types/LoginType";
import { SUCCESS_CODE } from "../../common/utils/codes/CommonCode";

/**
 * 회원가입 프로세스를 처리하는 클래스
 */
export class SignUpProcess extends BaseProcess {


    constructor(
        navigation: any,
        dispatch: any,
    ) {
        super(navigation, dispatch);
    }

    /**
     * 회원정보 암호화 시크릿 키 생성
     * @param userUuid
     */
    makeToSecretKey = (userUuid: string) => {
        // console.log("makeToSecretKey : ", userUuid);
        return userUuid !== "" ? userUuid.replace(/\-/g, "") : userUuid;
    }

    /**
     * 키클락 회원 추가
     * 회원 추가 후, 회원읜 Uuid를 Headers의 locaion에서 추출
     *
     * location: https://login.tugboats.kr/admin/realms/tugboat/users/4e440320-db32-40f8-896e-ce2927048e5d
     * @param accessToken
     */
    createKcUser = async (authState: LoginType.AuthSlice, userInfo): Promise<string> => {
        const keycloakConfig = AdminCliLogin.getInstance().keycloakConfig;
        let userUuid: string = "";
        // ID/PW 로그인 인증 정보
        console.log(userInfo);
        try {
            const authResponse = await keycloakService.createKcUser(authState, userInfo, keycloakConfig);
            // 성공하는 경우,
            if (authResponse && authResponse['status'] === 201 && authResponse['headers']) {
                console.log('[-] 키클락 회원 생성하였습니다.');
                // 헤더 추출
                const headers = authResponse['headers'];
                // location 값 추출
                // @ts-ignore
                userUuid = headers.get('location').split('users/')[1];
            }
        } catch (error) {
            console.error('[-] 키클락 회원 생성 중에 오류가 발생하였습니다.', error);

            // @ts-ignore
            if (error.response && error.response.status === 409) {
                console.error('[-] 이미 존재하는 키클락 회원 입니다.');
                userUuid = "duplicatedUser";
            } else {
                console.error('[-] 키클락 회원 생성 중에 오류가 발생하였습니다.');
                userUuid = ""; // 혹은 다른 기본값 설정
            }
        }
        return userUuid;
    }

    /**
     * 키클락 회원 삭제
     *
     * @param accessToken
     */
    deleteKcUser = async (authState: LoginType.AuthSlice, userUuid): Promise<boolean> => {
        const keycloakConfig = AdminCliLogin.getInstance().keycloakConfig;
        let success: boolean = false;

        // ID/PW 로그인 인증 정보
        try {
            const
                authResponse = await keycloakService.deleteKcUser(authState, userUuid, keycloakConfig).catch((error) => {
                    console.error(error);
                });

            // 성공하는 경우,
            if (authResponse && authResponse['status'] === 204) {
                console.log('[-] 키클락 회원 삭제하였습니다.');
                success = true;
            } else {
                console.error('[-] 키클락 회원 삭제 중에 오류가 발생하였습니다.');
            }
        } catch
        (error) {
            console.log('[-] [-] 키클락 회원 삭제 중에 오류가 발생하였습니다.', error)
        }
        return success;
    }


    /**
     * 계정 정보 추가
     * @param userInfo
     */
    createUser = async (authState, userInfo): Promise<number> => {

        try {
            console.log(`회원가입 사용자 정보 :: `, userInfo)
            const res: AxiosResponse<Boolean & CommonType.apiResponseType, any> = await userService.createUser(authState, userInfo);
            const { result, resultCode } = res.data;
            console.log("createUser", result);
            if (resultCode === SUCCESS_CODE.INSERT) {
                console.log("[-] 사용자 정보 추가하였습니다.");
                return result;
            } else {
                console.log("[-] 사용자 정보 추가 중 에러가 발생하였습니다.");
                return 0;
            }
        } catch (error) {
            console.error('[-] 사용자 정보 추가 중 에러가 발생하였습니다.', error);
            return 0;
        }
    }


    // 회원가입 프로세스 실행
    // 키클락에 회원정보가 없음 -> 키클락 회원가입 후, 회원정보 DB 저장
    // 키클락에 회원정보가 있음 -> 회원정보 DB 저장

    async execute(authState: LoginType.AuthSlice, userInfo: UserType.UserInfo, credential: UserType.Account): Promise<UserType.UserInfo> {
        let userUuid = "";

        try {
            if (authState.adminCliAccessToken != undefined || authState.adminCliAccessToken !== "") {
                const kcUserInfo = {
                    username: credential.id,
                    firstName: userInfo.userNm,
                    lastName: userInfo.ncnm,
                    email: userInfo.email,
                    credentials: [{
                        type: "password",
                        value: credential.password,
                        temporary: false
                    }],
                    enabled: true,
                };

                userUuid = await this.createKcUser(authState, kcUserInfo);
                userInfo.userUuid = userUuid;
                if (userUuid === "" || userUuid === "duplicatedUser") return userInfo;

                let saltKey = this.makeToSecretKey(userUuid);

                let encryptedUserInfo: UserType.UserInfo = {
                    userUuid: userUuid,
                    userNm: userInfo.userNm,
                    ncnm: userInfo.ncnm,
                    email: CommonUtil.toBase64(CommonUtil.aes256Encode(userInfo.email, saltKey)),
                    userStsCd: userInfo.userStsCd,
                    userRole: userInfo.userRole,
                    salt: saltKey,
                    undr14Yn: userInfo.undr14Yn,
                    gndrCd: userInfo.gndrCd,
                    brthYear: userInfo.brthYear
                };

                if (userInfo.undr14Yn) {
                    const encryptedParentMobileNumber = CommonUtil.toBase64(userInfo.parentMobile!);
                    const encryptedParentEmail = CommonUtil.toBase64(CommonUtil.aes256Encode(userInfo.parentEmail, saltKey));

                    encryptedUserInfo = {
                        ...encryptedUserInfo,
                        parentNm: userInfo.parentNm,
                        parentEmail: encryptedParentEmail,
                        parentMobile: encryptedParentMobileNumber,
                        parentCi: userInfo.parentCi,
                        parentOkTs: userInfo.parentOkTs
                    };
                } else {
                    encryptedUserInfo = {
                        ...encryptedUserInfo,
                        userNm: userInfo.userNm,
                        mobile: CommonUtil.toBase64(userInfo.mobile!)
                    }
                }


                const { atptOfcdcScCode, sdSchulCode, schulNm, schulCrseScNm, grdSq, grdNm, clsSq, clsNm } = userInfo;
                // 추가로 학교 정보가 존재하는 경우 INSERT 수행합니다.
                if (atptOfcdcScCode && sdSchulCode && schulNm && schulCrseScNm && grdSq && grdNm && clsSq && clsNm) {
                    encryptedUserInfo.atptOfcdcScCode = atptOfcdcScCode;
                    encryptedUserInfo.sdSchulCode = sdSchulCode;
                    encryptedUserInfo.schulNm = schulNm;
                    encryptedUserInfo.schulCrseScNm = schulCrseScNm;
                    encryptedUserInfo.grdSq = grdSq;
                    encryptedUserInfo.grdNm = grdNm;
                    encryptedUserInfo.clsSq = clsSq;
                    encryptedUserInfo.clsNm = clsNm;
                }

                const result = await this.createUser(authState, encryptedUserInfo);

                if (result === 0) {
                    await this.deleteKcUser(authState, userUuid);
                    userUuid = "";
                } else {
                    console.log("[+] 성공하면 사용자 시퀀스를 함께 넣어서 보낸다.")
                    userInfo.userSq = result;
                }
            } else {
                console.error('키클락 서비스 토큰 발급 받지 못하였습니다.');
            }
        } catch (error) {
            console.error("회원가입 프로세스 중 오류가 발생하였습니다.", error);
            if (userUuid !== "") {
                await this.deleteKcUser(authState, userUuid);
            }
        }


        return { ...userInfo, userUuid };
    }

}