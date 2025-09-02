/**
 * 해당 페이지에서는 공통 코드를 enum형태로 관리하는 페이지 입니다.
 */

import { PERMISSIONS } from "react-native-permissions"

/**
 * 요일 텍스트
 */
export const TEXT_DAYS = ["월", "화", "수", "목", "금", "토", "일"];

/**
 * HTTP Method를 코드로 관리합니다.
 */
export const enum HTTP_METHOD {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    PATCH = "PATCH",
    DELETE = "DELETE"
}

/**
 * HTTP Request 성공 코드들을 관리합니다.
 */
export const enum SUCCESS_CODE {
    SELECT = 200,
    INSERT = 201,
    DELETE = 200,
    UPDATE = 204
}

/**
 * HTTP Request 에러 코드를 관리합니다,
 */
export const enum ERROR_CODE {
    COMMON = "9999"
}


/**
 * APP의 개발 환경에 대해 코드로 관리합니다.
 */
export const enum APP_MODE {
    local = "local",
    prd = "prd"
}

/**
 * 코드 테이블의 그룹코드를 관리
*/
export const enum CODE_GRP_CD {
    StudyInstrength = "STDY_INTSTY",    // 공부 강도
    StudyLevel = "STDY_LVL",            // 공부 레벨
    StudyType = "STDY_TYPE",            // 공부 타입
    StartEmotion = "STRT_EMTN",         // 시작 정서
    EmotionalCode = "EMTN_CD",          // 정서적 코드
    ExpressionCode = "EXPR_CD",         // 표정 코드
    EvalEmotion = "EVAL_EMTN",          // 평가 정서
    EMAILCD = "EMAIL_CD",               // 이메일
    SubjectCd = "SBJT_CD",              // 과목 이름
    IncompDvcCd = "INCOMP_DVC_CD"       // 열공 모드 제외 디바이스
}


/**
 * [정의] 인덱스에 따른 감정의 상태를 반환해주는 타입
 */
export const EMOTION_CODE = {
    0: 'AGR',     // 화남
    1: 'CTM',     // 경멸
    2: 'DSG',     // 싫음
    3: 'FEA',     // 무서움
    4: 'HAP',     // 행복
    5: 'NEU',     // 무표정
    6: 'SAD',     // 슬픔
    7: 'SUP'      // 놀람
}


/**
 * [정의] 표정 코드 리스트를 관리합니다.(고정)
 */
export const EMOTION_CODE_ARR = [
    'AGR',      // Anger: 화남
    'CTM',      // Contempt: 경멸
    'DSG',      // Disgust: 싫음
    'FEA',      // Fear: 무서움
    'HAP',      // Happiness: 행복
    'NEU',      // Neutral: 무표정
    'SAD',      // Sadness: 슬픔
    'SUP',      // Surprise: 놀람
];

/**
 * [정의] 사용자가 앱에서 어떤 상태 인지에 대한 코드 관리
 * - active: 앱 안에서 사용중인 경우
 * - inactive: [IOS] 앱 안에서 벗어난 경우
 * - background: 앱 안에서 다른곳으로 벗어난 경우
 */
export const enum APP_STATUS {
    active = "active",          // 앱 안에서 사용중인 경우
    inactive = "inactive",      // [IOS] 앱 안에서 벗어난 경우
    background = "background",  // 앱 안에서 다른곳으로 벗어난 경우
}

/**
 * Andriod, IOS 앱 권한 코드
 * - calendar : 캘린더 접근 권한
 * - camera : 카메라 접근 권한
 * - microphone: 마이크 접근 권한
 * - mediaLibaray : 외부 저장소 접근 권한
 */
export const APP_PERMISSION_CODE = {
    "calendar": [PERMISSIONS.ANDROID.READ_CALENDAR, PERMISSIONS.ANDROID.WRITE_CALENDAR, PERMISSIONS.IOS.CALENDARS],
    "camera": [PERMISSIONS.ANDROID.CAMERA, PERMISSIONS.IOS.CAMERA],
    // "alarm": [PERMISSIONS.ANDROID.POST_NOTIFICATIONS],
    "microphone": [PERMISSIONS.ANDROID.RECORD_AUDIO, PERMISSIONS.IOS.MICROPHONE],
    "mediaLibaray": [PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE, PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE, PERMISSIONS.IOS.MEDIA_LIBRARY],
}


/**
 * AppState 상태를 코드로 관리합니다.
 *
 * active: 앱 안에서 사용중인 경우
 * inactive: [IOS] 앱 안에서 벗어난 경우
 * background: 앱 안에서 다른곳으로 벗어난 경우
*/
export type UserAppState = "active" | "inactive" | "background";



/**
 * react-native-permission 상태를 코드로 관리합니다.
 */
export type PermissionStatus = 'unavailable' | 'denied' | 'limited' | 'granted' | 'blocked';


/**
 * Bottom Tap의 메뉴별 인덱스 별로 화면의 정보를 가져옴
 */
export const BOTTOM_TAB_MENU_CODE = {
    0: 'score',                 // 하단의 탭 첫번째 페이지 이름     : 스코어
    1: 'studyPlan',             // 하단의 탭 두번째 페이지 이름     : 계획
    2: 'home',                  // 하단의 탭 세번째 페이지 이름     : 홈
    3: 'report',                // 하단의 탭 네번째 페이지 이름     : ONNX
    4: 'studyMore',             // 하단의 탭 다섯번째 페이지 이름    : MORE
}

/**
 * 사용자의 로그인 정보를 가져옴
 */
export const enum LoginMethod {
    SNS = 'sns',
    ID_PW = 'id_pw',
    GUEST = 'guest',
    SERVICE = 'service'
}

export const enum SNSMethod {
    KAKAO = 'kakao',
    GOOGLE = 'google'
}
