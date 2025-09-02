import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import DementionUtils from '../common/utils/DementionUtils';

const { heightRelateSize, widthRelateSize, fontRelateSize, marginRelateSize } = DementionUtils;

const Semicircle = ({ label, dataPer, stroke }) => {
	const pathLength = 147.708;
	const strokeDashoffset = pathLength - (dataPer / 100) * pathLength;

	// 헥스 색상을 rgba로 변환하는 함수
	const hexToRgba = (hex, alpha) => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	};

	const strokeTransparent = hexToRgba(stroke, 0.2); // 투명도 20% 적용

	return (
		<View style={styles.container}>
			<Svg width='100%' height='100%' viewBox='-5 -5 110 63'>
				<Path
					d='M 50,50 m -47,0 a 47,47 0 1 1 94,0'
					stroke={strokeTransparent}
					strokeWidth='15'
					strokeLinecap='round'
					fillOpacity='0'
				/>
				<Path
					d='M 50,50 m -47,0 a 47,47 0 1 1 94,0'
					stroke={stroke}
					strokeWidth='15'
					fillOpacity='0'
					strokeLinecap='round'
					strokeDasharray={`${pathLength} ${pathLength}`}
					strokeDashoffset={strokeDashoffset}
				/>
			</Svg>
			<Text style={{ ...styles.percentage, color: stroke }}>{dataPer}</Text>
			<Text style={styles.label}>{label}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		width: widthRelateSize(90),
		height: heightRelateSize(76),
	},
	percentage: {
		position: 'absolute',
		fontSize: fontRelateSize(16),
	},
	label: {
		textAlign: 'center',
		width: widthRelateSize(200),
		color: '#616d82',
		fontSize: fontRelateSize(12),
	},
});

export default Semicircle;
