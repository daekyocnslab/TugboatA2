import { string } from "@tensorflow/tfjs-core";
import { GroupType } from "./GroupType";

export declare module UserType {

    export interface UserInfo {
        userSq?: number;//사용자 시퀀스
        userUuid?: string;//사용자 userUuid
        loginUserId?: string;// 사용자의 로그인 ID
        userNm?: string;//사용자 이름
        groups?: GroupType.GroupUserMapInfo[],//사용자 그룹
    }

    export interface UserSimple {
        userSq?: number;//사용자 시퀀스
        userUuid?: string;//사용자 userUuid
        loginUserId?: string;// 사용자의 로그인 ID
        userNm?: string;//사용자 이름
    }

    export interface Account {
        id: string;//아이디
        password: Uint8Array | number[];//비밀번호
    }

    /**
     * 출생년도 Object
     */
    interface BrthSelectBoxItems {
        label: string;
        value: number;
    }
    /**
     * 시/도 교육청 Object
     */
    interface AtptSchuldSelectBoxItems {
        label: string;
        value: string;
    }
    /**
     * 회원가입 등록 에러 타입
     */
    interface UserRegistErrorType {
        name: { hasErrors: boolean; errorText: string };
        id: { hasErrors: boolean; errorText: string };
        password: { hasErrors: boolean; errorText: string };
        confirmPassword: { hasErrors: boolean; errorText: string };
        email: { hasErrors: boolean; errorText: string };
        emailCode: { hasErrors: boolean; errorText: string };
    }

}
