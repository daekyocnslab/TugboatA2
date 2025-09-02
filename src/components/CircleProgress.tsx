import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import DementionUtils from '../common/utils/DementionUtils';

const { heightRelateSize, widthRelateSize, fontRelateSize } = DementionUtils;

const CircleProgress = ({ label, dataPer, stroke, opacity, size, showDataPer }) => {
	// 원 둘레 계산 (2 * PI * r)
	const radius = 40;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference - (dataPer / 100) * circumference;

	// 헥스 색상을 rgba로 변환하는 함수
	const hexToRgba = (hex, alpha) => {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	};

	const strokeTransparent = hexToRgba(stroke, opacity); // 투명도 20% 적용

	return (
		<View
			style={[
				styles.container,
				{
					width: widthRelateSize(size),
					height: widthRelateSize(size),
				},
			]}>
			<Svg width='100%' height='100%' viewBox='0 0 100 100'>
				{/* 배경 원 */}
				<Circle cx='50' cy='50' r={radius} stroke={strokeTransparent} strokeWidth='10' fill='none' />
				{/* 진행률 표시 원 */}
				<Circle
					cx='50'
					cy='50'
					r={radius}
					stroke={stroke}
					strokeWidth='10'
					fill='none'
					strokeLinecap='round'
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					transform='rotate(-90, 50, 50)' // 시작점을 상단 중앙으로 설정
				/>
			</Svg>
			{showDataPer && <Text style={{ ...styles.percentage, color: stroke }}>{dataPer}%</Text>}
			<Text style={styles.label}>{label}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'center',
		transform: [{ rotate: '8deg' }],
		// width: widthRelateSize(size),
		// height: heightRelateSize(size),
	},
	percentage: {
		position: 'absolute',
		fontSize: fontRelateSize(20),
		fontWeight: 'bold',
		transform: [{ rotate: '-8deg' }],
	},
	label: {
		position: 'absolute',
		bottom: 0,
		textAlign: 'center',
		width: '100%',
		color: '#616d82',
		fontSize: fontRelateSize(12),
	},
});

export default CircleProgress;
