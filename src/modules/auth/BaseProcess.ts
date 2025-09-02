/**
 * 세션과 로그인 프로세스에서 공통으로 사용되는 로직을 가진 부모 클래스
 */
import { setAdminToken, setToken } from "../redux/slice/AuthSlice";
import { LoginType, } from "../../types/LoginType";
import { setUser } from "../redux/slice/UserSlice";
import { AxiosResponse } from "axios";
import { UserType } from "../../types/UserType";
import { CommonType } from "../../types/common/CommonType";
import userService from "../../services/user/UserService";
import { SUCCESS_CODE } from "../../common/utils/codes/CommonCode";
import groupService from "../../services/common/GroupService";
import { GroupType } from "../../types/GroupType";

/**
 * 프로세스의 기본이 되는 클래스
 */
export class BaseProcess {

    constructor(
        protected navigation: any,
        protected dispatch: any,
    ) {

        this.navigation = navigation;
        this.dispatch = dispatch;
    }

    public init(authState: any): void {
        // authState를 사용한 로직 수행
    }

    // 사용자 정보 저장
    protected storeUserInfo(newUserInfo) {
        this.dispatch(setUser(newUserInfo));
    }

    // 토큰 정보 저장
    protected storeTokenInfo(newTokenInfo) {
        this.dispatch(setToken(newTokenInfo));
    }

    // 서비스 계정 토큰 정보 저장
    protected storeAdminTokenInfo(newTokenInfo) {
        this.dispatch(setAdminToken(newTokenInfo));
    }

    /**
     * 계정 정보 조회
     * @param userJWTData
     */
    getUser = async (authState: LoginType.AuthInfo, userInfo: UserType.UserInfo): Promise<UserType.UserInfo[]> => {
        try {
            //@ts-ignore
            const userServiceResponse: AxiosResponse<UserType.UserInfo & CommonType.apiResponseType, any> = await userService.getUser(authState, userInfo);
            if (userServiceResponse.data && userServiceResponse.status === SUCCESS_CODE.SELECT) {
                const { result: userData }: UserType.UserInfo & CommonType.apiResponseType = userServiceResponse.data;
                return userData;
            } else {
                throw new Error("사용자 조회 중 에러가 발생하였습니다.");
            }
        } catch (error) {
            throw new Error(`사용자 조회 중 에러가 발생하였습니다.: ${error}`);
        }
    }

    /**
     * 사용자 그룹 조회
     * @param userInfo
     */
    getUserGroup = async (authState: LoginType.AuthInfo, userInfo: GroupType.GroupUserMapInfo) => {
        try {
            //@ts-ignore
            const groupServiceResponse: AxiosResponse<GroupType.GroupUserMapInfo & CommonType.apiResponseType, any> = await groupService.selectGrpUserMap(authState, userInfo);

            if (groupServiceResponse.data && groupServiceResponse.status === SUCCESS_CODE.SELECT) {
                const { result: groupData }: GroupType.GroupUserMapInfo & CommonType.apiResponseType = groupServiceResponse.data;
                return groupData;
            } else {
                throw new Error("그룹 조회 중 에러가 발생하였습니다.");
            }
        } catch (error) {
            throw new Error(`그룹 조회 중 에러가 발생하였습니다.: ${error}`);
        }

        return null;
    }

    /**
     * 사용자 정보 조회
     * @param authParams - 토큰 데이터 및 인증 관련 파라미터
     * @returns 조회 성공 여부
     */
    async searchUserInfo(authParams: LoginType.TokenDatas): Promise<UserType.UserInfo> {
        let newUserInfo: UserType.UserInfo;

        try {
            // 토큰 정보 및 사용자 UUID 추출
            const { jwt: userJWTData } = authParams;
            const userUuid: string = userJWTData['sub'];
            const userId: string = userJWTData['preferred_username'];

            // 새로운 인증 정보 구성 및 토큰 정보 저장
            const newAuthInfo: LoginType.AuthInfo = this.buildAuthInfo(authParams);
            this.storeTokenInfo(newAuthInfo);


            // 사용자 정보 조회
            let usersInfo: UserType.UserInfo[] = await this.getUser(newAuthInfo, { userUuid: userUuid });
            let userInfo: UserType.UserInfo = {};
            if (usersInfo && usersInfo[0]) userInfo = usersInfo[0];


            if (Object.keys(usersInfo).length !== 0) {
                // 그룹 정보 조회
                const groupResult: GroupType.GroupUserMapInfo[] = await this.getUserGroup(newAuthInfo, userInfo);

                if (groupResult !== null) {
                    newUserInfo = { ...userInfo, loginUserId: userId, groups: groupResult };
                } else {
                    console.error("[-] 그룹 정보 조회 중 에러가 발생하였습니다.");
                    newUserInfo = { ...userInfo, loginUserId: userId, groups: [] };
                }
                console.log("newUserInfo :: ", newUserInfo)

                // // 사용자 정보 저장
                // this.storeUserInfo(newUserInfo);
            } else {
                throw new Error(`사용자 정보가 없습니다.`);
            }
        } catch (error) {
            throw new Error(`사용자 정보 조회 중 에러가 발생하였습니다.: ${error}`);
        }
        return newUserInfo;
    }


    /**
     * 인증 정보 구성
     * @param clientTokens
     * @protected
     */
    protected buildAuthInfo(clientTokens: LoginType.TokenDatas): LoginType.AuthInfo {
        let { tokens, jwt: userJWTData } = clientTokens;
        const newAuthState = {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token,
            exp: userJWTData.exp,
            clientTokens,
        };
        return newAuthState;
    }

    /**
     * 인증 정보 구성
     * @param clientTokens
     * @protected
     */
    protected buildAdminAuthInfo(adminCliTokens: LoginType.TokenDatas): LoginType.AdminCliAuthInfo {
        let { tokens, jwt: userJWTData } = adminCliTokens;
        const newAuthState = {
            adminCliAccessToken: tokens.access_token,
            adminExp: userJWTData.exp,
            adminCliTokens,
        };
        return newAuthState;
    }

}