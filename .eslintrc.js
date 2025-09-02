module.exports = {
	root: true,
	extends: [
		'plugin:react/recommended',
		'eslint:recommended',
		'prettier',
		'plugin:react-hooks/recommended',
		'@react-native',
	],
	plugins: ['react', 'prettier', '@typescript-eslint'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
		ecmaVersion: 'latest',
		sourceType: 'module',
	},

	rules: {
		/**
		 * @description: React-Hook Rules
		 */
		'react-hooks/rules-of-hooks': 'off',

		// useEffect return 관련 체크
		'react-hooks/exhaustive-deps': 'off',

		// prop의 타입과 관련된 체크
		'react/prop-types': 'off',

		/**
		 * @description: React Rules
		 */
		indent: 'off',

		// 불필요한 이스케이프 문자를 허용하지 않음
		// 'no-useless-escape': 'warn',

		// 빈 블록문은 허용하지 않음
		'no-empty': 'warn',

		// `return`, `throw`, `continue` 및 `break` 문 뒤에 도달할 수 없는 코드를 허용하지 않습니다.
		'no-unreachable': 'warn',

		// case 절내에서 변수 선언 허용여부
		'no-case-declarations': 'warn',

		'react/no-unescaped-entities': 'off',

		/**
		 * @description: AirBnb Style
		 */
		'react/prefer-stateless-function': 'off',
		'react/jsx-filename-extension': 'off',
		'react/jsx-one-expression-per-line': 'off',

		/**
		 *@description typescript option
		 */
		'@typescript-eslint/no-unused-expressions': 'off',

		'no-unused-vars': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
		'array-callback-return': 'off',
		'no-useless-escape': 'off',
		'no-constant-condition': 'off',
		'no-undef': 'off',
	},
};
