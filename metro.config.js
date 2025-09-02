const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const {
	resolver: { sourceExts, assetExts },
} = defaultConfig;

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

const config = {
	resolver: {
		// 애플리케이션에서 사용되는 정적 파일의 확장자를 정의합니다.
		assetExts: [...assetExts, 'svg', 'png', 'bin', 'db', 'onnx', 'ort', 'gif', 'tflite',  'ttf'],
		// 애플리케이션의 소스 코드 파일의 확장자를 정의합니다.
		sourceExts: [...sourceExts, 'json', 'jsx', 'tsx', 'ts'],
	},
	watchFolders: [path.resolve(__dirname, '../')],
	transformer: {
		getTransformOptions: async () => ({
			transform: {
				experimentalImportSupport: false,
				//  인라인 require를 사용할지 여부를 결정
				inlineRequires: false,
			},
		}),
	},
};

module.exports = mergeConfig(defaultConfig, config);
