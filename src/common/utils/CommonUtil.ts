/**
 * 공통으로 사용이 되는 기능에 대해서 함수화를 시킨 유틸입니다.
 */

import CodeSerivce from '../../services/common/CodeSerivce';
import { CodeType } from '../../types/CodeType';
import { CODE_GRP_CD } from './codes/CommonCode';
import { encode, decode } from 'base-64';
import CryptoJS from 'react-native-crypto-js';
import 'react-native-get-random-values';

import NickNameJson from '../../../assets/json/nickname.json';

/**
 * 공통적으로 처리하는 Utils을 관리합니다.
 */
class CommonUtil {
	/**
	 * 코드 리스트를 조회합니다.
	 * @param {CODE_GRP_CD} grpCd 코드 키 값
	 * @return {Promse<CodeType.CodeDto>} 결과값을 반환합니다.
	 */
	selectCodeList = async (userState: any, grpCd: CODE_GRP_CD, isLogin: boolean): Promise<CodeType.CodeDto[]> => {
		let resultCodeList: CodeType.CodeDto[] = [];

		const codeDto: CodeType.CodeDto = {
			grpCd: grpCd,
			cd: '',
			grpCdNm: '',
			cdNm: '',
			dpOrd: 0,
			emoticon: 0,
		};

		// 코드 리스트 조회
		await CodeSerivce.selectCodeList(userState, codeDto, isLogin)
			.then((res) => {
				const { result } = res.data;
				// [STEP1] 리스트 조회를 성공하는 경우
				resultCodeList = result;
			})
			.catch((err) => {
				console.error('[-] selectCodeList에서 에러가 발생하였습니다.', err);
			});
		return resultCodeList;
	};
	// /**
	//  * Math.Random() 함수를 대신하여 Crypto를 이용하여 구성합니다.
	//  * @returns
	//  */
	// makeCrpytoRandomNum = (): number => {
	//     const randomBuffer = new Uint32Array(1);
	//     Crypto.getRandomValues(randomBuffer);
	//     return randomBuffer[0] / (0xffffffff + 1);
	// }

	/**
	 * Math.Random() 함수를 대신하여 Crypto를 이용하여 구성합니다.
	 * @returns
	 */
	makeCrpytoRandomNum = (): number => {
		const randomBuffer = new Uint32Array(1);
		crypto.getRandomValues(randomBuffer);
		return randomBuffer[0] / (0xffffffff + 1);
	};

	// /**
	//  * 최소값 최대값을 기반으로 랜덤한 숫자를 반환해줍니다.
	//  * @param {number} min
	//  * @param {number} max
	//  * @returns {number} 랜덤한 숫자
	//  */
	// generateRandomNum = (min: number, max: number): number => {
	//     const randomNum = this.makeCrpytoRandomNum()
	//     min = Math.ceil(min);
	//     max = Math.floor(max);
	//     return Math.floor(randomNum * (max - min + 1)) + min;
	// }

	/**
	 * base64 문자열을 이미지로 변환합니다.
	 * @param base64Str
	 */
	imageStrToImage = (base64Str: string) => {
		const bytes = decode(base64Str);
		const image = new Uint8Array(bytes).buffer;

		// 이미지 파일로 변환합니다.
		const source = { uri: `data:image/png;base64,${image}` };
	};

	/**
	 * 닉네임 JSON을 이용해 랜덤한 닉네임을 생성한다
	 */
	genrateRandomNickName = () => {
		const adjective: string =
			NickNameJson.adjective[Math.floor(this.makeCrpytoRandomNum() * NickNameJson.adjective.length)];
		const color: string = NickNameJson.color[Math.floor(this.makeCrpytoRandomNum() * NickNameJson.color.length)];
		const noun: string = NickNameJson.noun[Math.floor(this.makeCrpytoRandomNum() * NickNameJson.noun.length)];

		const nickNm: string = adjective + ' ' + color + ' ' + noun;

		return nickNm;
	};

	/**
	 * 날짜 자릿수 '0'으로 맞춰주는 함수
	 */
	datePad(number: number, length: number) {
		var str = '' + number;
		while (str.length < length) {
			str = '0' + str;
		}
		return str;
	}

	/**
	 * 날짜 형식 변경 (YYYYMMDD)
	 */
	formatDateToYYYYMMDD = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}${month}${day}`;
	};

	/**
	 * 날짜 형식 변경 (YYYYMM)
	 */
	formatDateToYYYYMM = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		return `${year}${month}`;
	};

	/**
	 * 날짜 형식 변경 (YYYY-MM-DD)
	 */
	cvtParamDate = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	/**
	 * 날짜 형식 변경 (YY년 MM월 DD일)
	 */
	formatDateKor = (date: Date): string => {
		const year = String(date.getFullYear()).slice(-2);
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}년 ${month}월 ${day}일`;
	};

	/**
	 * 사용자 입력에 따른 유효성 검사
	 * @param value
	 * @param rules
	 */
	validation = (value, rules): string => {
		let error = '';

		if (rules.isRequired) {
			if (value.trim() === '') {
				error = '내용을 입력하세요.';
				return error;
			}
		}

		if (!rules.isKorean) {
			if (/[ㄱ-ㅎㅏ-ㅣ가-힣]+$/.test(value)) {
				error = '한글은 입력할 수 없습니다.';
				return error;
			}
		}

		if (rules.minLength) {
			if (value.length < rules.minLength) {
				error = `최소 ${rules.minLength}자 이상 입력하세요.`;
				return error;
			}
		}

		if (rules.isEmail) {
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
				error = '올바른 이메일 주소 형식으로 입력하세요.';
				return error;
			}
		}

		if (rules.isSpecialCharacter) {
			if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
				error = '특수문자를 포함하여 작성하세요.';
				return error;
			}
		} else if (!rules.isEmail && /[!@#$%^&*(),.?":{}|<>]/.test(value)) {
			error = '특수문자는 입력할 수 없습니다.';
			return error;
		}

		return error;
	};

	/**
	 * Base64 인코딩
	 * @param input
	 */
	toBase64 = (input: string): string => {
		if (input == undefined) return '';
		return encode(input);
	};

	/**
	 * Base64 디코딩
	 * @param encoded
	 */
	fromBase64 = (encoded: string): string => {
		if (encoded == undefined) return '';
		return decode(encoded);
	};

	/**
	 * Crypto AES256 키 암호화 함수
	 */
	aes256Encode = (data, secretKey) => {
		let aes256EncodeData = '';
		let iv = secretKey.substring(0, 16);

		// [aes 인코딩 수행 실시 : cbc 모드]
		const cipher = CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(secretKey), { iv: CryptoJS.enc.Utf8.parse(iv) });

		// [인코딩 된 데이터 확인 실시]
		aes256EncodeData = cipher.toString();

		return aes256EncodeData;
	};

	/**
	 * Crypto AES256 키 복호화 함수
	 */
	aes256Decode = (data, secretKey) => {
		let aes256DecodeData = '';

		let iv = secretKey.substring(0, 16);

		// [aes 디코딩 수행 실시 : cbc 모드]
		const cipher = CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(secretKey), { iv: CryptoJS.enc.Utf8.parse(iv) });

		// [인코딩 된 데이터 확인 실시]
		aes256DecodeData = cipher.toString(CryptoJS.enc.Utf8);

		return aes256DecodeData;
	};

	// 현재 날짜에서 특정 월을 더하거나 빼고, "YYYY-MM" 형식으로 반환
	getCurrentMonth = (nowDate: Date, selMonth: number, forSearchMon: boolean = false) => {
		let nowMonth = nowDate.getMonth();
		nowDate.setMonth(nowMonth + selMonth);
		let year = nowDate.getFullYear();
		let month = ('0' + (nowDate.getMonth() + 1)).slice(-2);
		return forSearchMon ? year + month : `${year}년 ${month}월`;
	};
}

export default new CommonUtil();
