import { ImageSourcePropType } from "react-native"

/**
 * '코드'에서 사용하는 정적 데이터 타입들을 관리합니다.
*/
export declare module CodeType {

    /**
     * '코드' DTO
     */
    export type CodeDto = {
        grpCd: string,                               // 그룹코드
        cd?: string,                                // [Optional] 코드
        grpCdNm?: string,                           // [Optional] 그룹코드 이름
        cdNm?: string,                              // [Optional] 코드 명
        dpOrd?: number,                             // [Optional] 표시 순서
        delyn?: boolean,                             // [Optional] 삭제 여부(0: 미삭제, 1:삭제)
        modTs?: string                              // [Optional] 변경 타임스탬프ㄴ
        emoticon?: ImageSourcePropType                           // [addtion] 이모티콘
    }


    /**
     * '기관 코드' DTO
     */
    export type OrgInfoDto = {
        orgUuid: string,            // 기관 코드
        aplStsCd?: string,           // 기관 신청 상태코드
        atptOfcdcScCode?: string,    // 시도 교육청 SC 외부코드
        sdSchulCode?: string         // 표준 학교 외부코드
    }

}
