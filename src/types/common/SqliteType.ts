/**
 * 내부 데이터베이스(SQLite) 타입을 관리합니다.
 */
export declare module SqliteType {

    interface tbUserDto {
        userId: string,
        userNm: string
    }
    interface tbStdyDoDtlDto {

    }


}
export const enum DATABASE {
    main = 'myDatabase.db'
}

export const enum TABLE_NAME {
    TB_STDY_DO_DTL = 'TB_STDY_DO_DTL',
    TB_USER = 'tb_user'
}
