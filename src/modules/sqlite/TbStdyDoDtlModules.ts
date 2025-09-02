import SqliteConfig from './SqliteConfig';
import { StudyType } from '@/types/StudyType';

/**
 * TB_STDY_DO_DTL 테이블의 트랜잭션을 관리합니다.
 */
class TbStdyDoDtlModules {
	private TABLE_NM = 'TB_STDY_DO_DTL';

	/**
	 * ====================================================================================================================================================
	 * ======================================================================== [TABLE DDL] ===============================================================
	 * ====================================================================================================================================================
	 */
	/**
	 * TB_STDY_DO_DTL 테이블을 생성합니다.
	 * @returns {Promise<any>}
	 */
	createTable = async (): Promise<any> => {
		const query = `
               CREATE TABLE IF NOT EXISTS ${this.TABLE_NM}
                (
                    do_dtl_sq    INTEGER     PRIMARY KEY AUTOINCREMENT,
                    do_sq        INTEGER     NOT NULL,
                    strt_ts      TEXT        NOT NULL,
                    end_ts       TEXT        NOT NULL,
                    msrd_secs    INTEGER     NOT NULL DEFAULT 0,
                    msrd_cnt     INTEGER     NOT NULL DEFAULT 0,
                    face_dtct_yn INTEGER     NOT NULL DEFAULT 0,
                    expr_cd      VARCHAR(16) NOT NULL,
                    valence      REAL        NOT NULL DEFAULT 0,
                    arousal      REAL        NOT NULL DEFAULT 0,
                    emtn_cd      VARCHAR(16) NOT NULL,
                    atntn        REAL        NOT NULL DEFAULT 0,
                    strss        INTEGER     NOT NULL DEFAULT 0,
                    reg_ts       TEXT        NOT NULL 
                );
            `;
		const execute = await SqliteConfig.executeQuery(query);
		console.log(`[+] ${this.TABLE_NM} 테이블이 생성되었습니다.`, execute);
		await this.showTableStructure(); // 생성된 테이블 구조를 조회합니다.
		return execute;
	};

	/**
	 * 데이터베이스 내의 모든 테이블에 대해서 조회합니다.
	 * @returns {Promise<any>}
	 */
	showAllTables = async (): Promise<any> => {
		const query = "SELECT name FROM sqlite_master WHERE type='table';";
		const execute = await SqliteConfig.executeQuery(query);
		try {
			console.log(`[+] 데이터베이스 내에 모든 테이블을 조회합니다.`, execute);
			return execute;
		} catch (error) {
			console.error(`데이터베이스 작업 실패: ${error}`);
		}
	};
	/**
	 * TB_STDY_DO_DTL의 구조를 확인합니다.
	 * @returns {Promise<any>}
	 */
	showTableStructure = async (): Promise<any> => {
		const query = `PRAGMA table_info(${this.TABLE_NM});`;
		try {
			const execute = await SqliteConfig.executeQuery(query);
			// console.log(`[+] TB_STDY_DO_DTL 테이블 내의 구조를 조회합니다.`, execute);
			return execute;
		} catch (error) {
			console.error(`테이블 구조 조회 실패: ${error}`);
		}
	};
	/**
	 * TB_STDY_DO_DTL 테이블을 데이터를 초기화 & 시퀀스 초기화 작업을 수행합니다.
	 * @returns {Promise<any>}
	 */
	truncateTable = async (doSq: number): Promise<any> => {
		const deleteQuery = `
            DELETE FROM ${this.TABLE_NM} 
            WHERE do_sq = ?;
            `;
		// const resetSequenceQuery = `
		//     DELETE FROM sqlite_sequence
		//     WHERE name='${this.TABLE_NM}'
		//     seq = (SELECT MAX(id) FROM ${this.TABLE_NM} WHERE do_sq = ?)
		//     ;`
		const execute = await SqliteConfig.executeQuery(deleteQuery, [doSq]);
		// const execute2 = await SqliteConfig.executeQuery(resetSequenceQuery, [doSq]);
		console.log(`[+] 데이터베이스 내에 모든 데이터를 초기화합니다.`, execute);
		return execute;
	};

	/**
	 * TB_STDY_DO_DTL 테이블을 삭제합니다.
	 * @returns {Promise<any>}
	 */
	dropTable = async (): Promise<any> => {
		const query = `DROP TABLE IF EXISTS ${this.TABLE_NM}`;
		const execute = await SqliteConfig.executeQuery(query);
		console.log(`[+] ${this.TABLE_NM} 테이블이 삭제되었습니다.`);
		return execute;
	};

	/**
	 * ====================================================================================================================================================
	 * ======================================================================== [TABLE DML] ===============================================================
	 * ====================================================================================================================================================
	 */

	/**
	 * TB_STDY_DO_DTL 테이블을 row를 등록합니다.
	 * @param studyDoDtlDto
	 * @returns {Promise<any>}
	 */
	insertRowData = async (studyDoDtlDto: StudyType.StudyDoDtlSQliteDto): Promise<any> => {
		try {
			const query: string = `INSERT INTO ${this.TABLE_NM} (
                    do_sq
                    , strt_ts
                    , end_ts
                    , msrd_secs
                    , msrd_cnt
                    , face_dtct_yn
                    , expr_cd
                    , emtn_cd
                    , valence
                    , arousal
                    , atntn
                    , strss
                    , reg_ts
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`;
			// console.log('[+] query :: ', query);

			const execute = await SqliteConfig.executeQuery(query, [
				studyDoDtlDto.doSq,
				studyDoDtlDto.strtTs,
				studyDoDtlDto.endTs,
				studyDoDtlDto.msrdSecs,
				studyDoDtlDto.msrdCnt,
				studyDoDtlDto.faceDtctYn,
				studyDoDtlDto.exprCd,
				studyDoDtlDto.emtnCd,
				studyDoDtlDto.valence,
				studyDoDtlDto.arousal,
				studyDoDtlDto.atntn,
				studyDoDtlDto.strss,
				studyDoDtlDto.regTs,
			]);
			console.log('[+] 데이터를 등록하였습니다 ', execute);

			this.selectStdyDoDtlList(studyDoDtlDto.doSq);

			return execute;
		} catch (error) {
			console.error('[-] 예외 발생:', error);
			throw error;
		}
	};

	/**
	 * 학습 데이터 개수를 조회합니다.
	 * @param doSq
	 * @returns
	 */
	selectStdyDtlCnt = async (doSq: number): Promise<number> => {
		const query: string = `
            SELECT COUNT(*) AS dtlCnt 
            FROM ${this.TABLE_NM} 
            WHERE do_sq = ?
        `;
		const execute = await SqliteConfig.executeQuery(query, [doSq]);
		console.log(`[+] TB_STDY_DO_DTL 테이블 데이터 개수를 조회합니다.`, execute[0]['dtlCnt']);
		return execute[0]['dtlCnt'];
	};

	/**
	 * TB_STDY_DO_DTL 테이블의 모든 데이터를 조회합니다.
	 * @returns
	 */
	selectStdyDoDtlList = async (doSq: number): Promise<StudyType.StudyDoDtlSQliteDto> => {
		const query: string = `
            SELECT * 
            FROM ${this.TABLE_NM}
            WHERE do_sq = ?`;
		const execute = await SqliteConfig.executeQuery(query, [doSq]);
		// console.log(`[+] TB_STDY_DO_DTL 테이블 데이터를 조회합니다.`, execute);
		return execute;
	};

	/**
	 * TB_STDY_DO_DTL 테이블의 모든 데이터를 조회합니다.
	 * @returns
	 */
	selectStdyDoDtlListAll = async (doSq: number): Promise<StudyType.StudyDoDtlSQliteDto[]> => {
		const query: string = `
            SELECT * 
            FROM ${this.TABLE_NM}
            WHERE do_sq = ?`;
		const execute = await SqliteConfig.executeQuery(query, [doSq]);
		// console.log(`[+] TB_STDY_DO_DTL 테이블 데이터를 조회합니다.`, execute);
		return execute;
	};
	/**
	 * TB_STDY_DO_DTL 테이블의 최종 데이터의 합계를 구합니다.
	 * @param doSq
	 * @returns
	 */
	selectStdyDoDtlAvg = async (doSq: number): Promise<StudyType.StudyDoDtlSQliteDto> => {
		const query: string = `
                SELECT
                    do_sq AS doSq,
                    SUM(stdy_secs) AS stdySecs,
                    SUM(purestdy_secs) AS purestdySecs,
                    SUM(bststdy_secs) AS bststdySecs,
                    MAX(atntn) AS maxAtntn,
                    AVG(atntn) AS avgAtntn,
                    AVG(strss) AS avgStrss,
                    AVG(valence) AS avgValence,
                    AVG(arousal) AS avgArousal,
                    SUM(msrd_cnt) AS msrdCnt
                FROM (
                    SELECT 
                        do_sq,
                        a.msrd_secs AS stdy_secs,
                        CASE WHEN a.face_dtct_yn = 1 THEN msrd_secs ELSE 0 END AS purestdy_secs,
                        CASE WHEN a.face_dtct_yn = 1 AND a.atntn >= 60 THEN msrd_secs ELSE 0 END AS bststdy_secs,
                        a.atntn,
                        a.strss,
                        a.valence,
                        a.arousal,
                        a.msrd_cnt
                    FROM TB_STDY_DO_DTL a
                    WHERE do_sq = ?
                ) b
                GROUP BY do_sq
            `;
		const execute = await SqliteConfig.executeQuery(query, [doSq]);

		console.log(`[+] TB_STDY_DO_DTL 테이블 합계 데이터를 조회합니다.`, execute[0]);
		return execute[0];
	};

	/**
	 * 공부 실행 정서 데이터 조회
	 * @param doSq
	 */
	selectStudyDoEmtn = async (doSq: number): Promise<StudyType.StudyDoEmtnDto[]> => {
		const query: string = `
            SELECT DO_SQ AS doSq
                ,   EMTN_CD  AS msrdEmtn
                ,   COUNT(*) AS emtnCnt
            FROM TB_STDY_DO_DTL 
            WHERE DO_SQ = ?
            GROUP BY DO_SQ, EMTN_CD
        `;

		const execute = await SqliteConfig.executeQuery(query, [doSq]);
		console.log(`[+] TB_STDY_DO_EMTM 저장을 위한 테이블 조회를 합니다.`, execute);
		return execute;
	};

	/**
	 * 공부 실행 감정 데이터 조회
	 * @param doSq
	 * @returns
	 */
	selectStudyDoExpr = async (doSq: number): Promise<StudyType.StudyDoExprDto[]> => {
		const query: string = `
            SELECT DO_SQ AS doSq
                ,   EXPR_CD  AS exprCd
                ,   COUNT(*) AS exprCnt
            FROM TB_STDY_DO_DTL
            WHERE DO_SQ = ?
            GROUP BY DO_SQ, EXPR_CD
        `;
		const execute = await SqliteConfig.executeQuery(query, [doSq]);
		console.log(`[+] TB_STDY_DO_EXPR 저장을 위한 테이블 조회를 합니다.`, execute);
		return execute;
	};

	/**
	 * 학습별 이어하기 총 시간을 조회해옵니다.
	 * @param doSq
	 */
	selectCountingSecond = async (doSq: number): Promise<number> => {
		const query: string = `
            SELECT  SUM(msrd_secs) as totalStdyTs 
            FROM    ${this.TABLE_NM}
            WHERE   do_sq = ?
        `;
		const execute = await SqliteConfig.executeQuery(query, [doSq]);
		console.log(`[+] 이어서 공부하기 시간을 조회합니다.`, execute[0]['totalStdyTs']);
		return execute[0]['totalStdyTs'];
	};

	/**
	 * TB_STDY_DO_DTL 테이블을 데이터를 모두 삭제합니다.
	 * @returns {Promise<any>}
	 */
	deleteStudyDoDtl = async (doSq: number): Promise<any> => {
		const deleteQuery = `
            DELETE FROM ${this.TABLE_NM} 
            WHERE do_sq = ?;
            `;
		const execute = await SqliteConfig.executeQuery(deleteQuery, [doSq]);
		console.log(`[+] 데이터베이스 내에 모든 데이터를 모두 삭제합니다..`, execute);
		return execute;
	};
}
export default new TbStdyDoDtlModules();
