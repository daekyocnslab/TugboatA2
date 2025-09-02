import DementionUtils from '../../common/utils/DementionUtils';
import { CSSProperties } from 'react';
import { StyleSheet, Text } from 'react-native';

const { heightRelateSize, widthRelateSize, marginRelateSize, fontRelateSize, iOSOnlyRelateSize } = DementionUtils;

export const CommonText = ({
	text,
	bold,
	color,
	size,
	lineHeight,
	style,
	textAlign,
	ellipsizeMode,
	numberOfLines,
}: {
	text: string | number;
	bold?: boolean;
	color?: string;
	size?: number;
	lineHeight?: number;
	textAlign?: 'center' | 'left' | 'right';
	style?: CSSProperties;
	ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
	numberOfLines?: number;
}) => {
	let styled: Array<object> = [styles.textNormal];
	if (bold) styled = [styles.textBold];
	if (color) styled.push({ color });
	if (size) styled.push({ fontSize: size });
	if (textAlign) styled.push({ textAlign });
	if (lineHeight) styled.push({ lineHeight });
	return (
		<Text style={[...styled, style]} ellipsizeMode={ellipsizeMode} numberOfLines={numberOfLines}>
			{text}
		</Text>
	);
};

const styles = StyleSheet.create({
	textBold: {
		letterSpacing: 0,
	},
	textNormal: {
		letterSpacing: 0,
	},
});
