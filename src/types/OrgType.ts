export declare module OrgType {

    export interface OrgInfo {
        orgSq?: number;           // 기관 시퀀스

        orgNm?: string;           // 기관 이름

        orgTel?: string;          // 기관 전화

        orgFax?: string;          // 기관 팩스

        bkcd?: string;            // 은행코드(외부)

        bankNm?: string;          // 은행 이름

        acntNo?: string;          // 계좌 번호

        siteLogoFile?: string;    // 사이트 로고 파일

        grpSq?: number;              // 그룹 시퀀스

        regTs?: string;        // 등록 타임스탬프

        regUser?: string;         // 등록 사용자

        modTs?: string;        // 변경 타임스탬프

        modUser?: string;         // 변경 사용자
    }


}
