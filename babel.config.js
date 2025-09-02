module.exports = {
	presets: ['babel-preset-expo'],
	plugins: [
		[
			'module-resolver',
			{
				root: ['./src'],
				alias: {
					'@': './src',
				},
				extensions: ['.ios.ts', '.android.ts', '.ios.tsx', '.android.tsx', '.ts', '.tsx', '.jsx', '.js', '.json'],
			},
		],
		[
			'module:react-native-dotenv',
			{
				envName: 'APP_ENV',
				moduleName: '@env',
				path: '.env.prd',
				allowUndefined: true,
			},
		],
		['react-native-worklets-core/plugin'], // ✅ 먼저 위치
		['react-native-reanimated/plugin', { processNestedWorklets: true }], // ✅ 무조건 마지막!
	],
};
