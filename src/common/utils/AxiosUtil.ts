/**
 * Axios 통신 이전에 추가적인 데이터를 싣어서 보내는 유틸입니다.
 */
class AxiosUtil {

    /**
     * 숫자 값을 받아서 자릿수(paramLen) 만큼에 부족한 부분에 '0'을 채워주는 이벤트입니다.
     * - 예시1 : datePad(5, 2) -> "05"
     * - 예시2 : datePad(12, 2) -> "12"
     * - 예시3 : datePad(1, 3) -> "001"
     * @param {number} paramNum : 입력받은 숫자 
     * @param {number} paramLen : 구성하려는 숫자의 길이
     * @returns {string}
     */
    datePad(paramNum: number, paramLen: number): string {
        let str = '' + paramNum;
        while (str.length < paramLen) {
            str = '0' + str;
        }
        return str;
    }

    /**
     * Axios 통신 과정에서 추가 데이터를 싣어서 보냅니다.
     * @param userState     : 사용자 정보 데이터 
     * @param requestData   : 요청 데이터 
     * @returns {any}       : 요청 값에 추가적인 데이터를 넣고 재구성합니다.
     */
    axiosCall = (userState: any, requestData: any): any => {

        const nowDate = new Date();
        const nowYm = nowDate.getFullYear() + this.datePad(nowDate.getMonth() + 1, 2);

        const rtnData: any = {
            ...requestData,
            billYm: nowYm,
            userUuid: requestData.userUuid,
        }

        return rtnData;
    }


}
export default new AxiosUtil();
