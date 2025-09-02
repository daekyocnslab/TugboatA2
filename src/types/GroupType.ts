export declare module GroupType {

    export interface GroupInfo {
        grpSq?: number;                  // 그룹 시퀀스

        grpNm?: string;               // 그룹 이름

        grpId?: string;                 //그룹 아이디

        grpVrfcCd?: string;           // 그룹 확인 코드

        orgSq?: number;                  // 기관 시퀀스

        pinYn?:boolean;

        delYn?: boolean;                  // 삭제 여부 (파라미터가 들어오고 안들어오고의 구분을 위해 지정함)

        regTs?: string;            // 등록 타임스탬프

        regUser?: string;             // 등록 사용자

        modTs?: string;            // 변경 타임스탬프

        modUser?: string;             // 변경 사용자
    }

    export interface GroupUserMapInfo {
        userSq?: number;               // 사용자 시퀀스
        orgSq?: number;                // 기관 시퀀스
        grdSq?: number;                // 학년 시퀀스 
        clsSq?: number;                // 반 시퀀스 
        grpSq?: number;                 // 그룹 시퀀스 
    }

    export interface Group {
        grpSq?: number;                  // 그룹 시퀀스
        grpNm?: string;                  // 그룹 이름
    }


    /**
     * 소속 그룹 및 상위/하위 그룹 조회합니다
     */
    export interface GroupVrfcCdInfo {
        userSq?: number;

        grpVrfcCd?: string;

        clsSq?: number;

        clsNm?: string;

        grdSq?: number;

        grdNm?: string;

        orgSq?: number;

        orgNm?: string;

        atptOfcdcScCode?: string;

        schulKndScNm?: string;

        sdSchulCode?: string;

    }


}

