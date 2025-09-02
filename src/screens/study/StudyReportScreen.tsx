import React, { useEffect, useState } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions} from 'react-native';
import Semicircle from '../../components/Semicircle';
import DementionUtils from '../../common/utils/DementionUtils';
import CircleProgress from '../../components/CircleProgress';
import LoadingModal from '../../components/modal/LoadingModal';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../modules/redux/RootReducer';
import AuthenticationManager from '../../modules/auth/AuthenticationManager';
import AttdService from '../../services/attd/AttdService';
import { ReportType } from '../../types/ReportType';
import { CommonText } from '../../components/text/Test';
import ChatBubble from '../../components/ChatBubble';

const { heightRelateSize, widthRelateSize, fontRelateSize } = DementionUtils;
import Svg, {Polygon, Rect, Text as SvgText, Line as SvgLine, Circle as SvgCircle} from 'react-native-svg';
import * as d3 from 'd3-hierarchy';
import { CartesianChart, Line, Bar} from "victory-native";
import {useFont, Circle, Skia, Text as SkiaText} from "@shopify/react-native-skia";
import {PointsArray} from "victory-native/dist/types";

const formatSecondsToMinSec = (seconds: number) => {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const formatHoursToHourMin = (seconds: number): string => {
	const hours = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	return `${hours}:${mins.toString().padStart(2, "0")}`;
};

const splitLineSegments = (points: PointsArray) => {
	const segments: PointsArray[] = [];
	let currentSegment: PointsArray = [];

	for (let point of points) {
		if (point.yValue && point.yValue !== 0) {
			currentSegment.push(point);
		} else {
			if (currentSegment.length >= 2) {
				segments.push(currentSegment);
			}
			currentSegment = [];
		}
	}

	if (currentSegment.length >= 2) {
		segments.push(currentSegment);
	}

	return segments;
};


const ReportWeekStdyGraph = ( {data, messageWeek, messageDay}: ReportType.ReportWeekStdyGraphProp) => {
	const font = useFont(require('../../../assets/fonts/NanumBarunGothic.ttf'), 12);
	return (
		<View style={{ width: 600, height: 460 }}>
			<Text style={{width: 640, color:"#F0F1F2", fontSize:24, marginBottom: 20, textAlign:"center"}}>
				최근 7일 동안 하루 평균 <Text style={{color:"#6491FF"}}> {messageWeek.stdyTx ?? '0분'}</Text> 중에 {'\n'}
				<Text style={{color:"#F19450"}}>{messageWeek.purestdtTx ?? '0분'} </Text>간 자리에서 공부했어요!
			</Text>
			<CartesianChart
				data={data}
				xKey="dayOfWeek"
				domainPadding={{ left: 50, right: 50, top: 30 }}
				yKeys={["stdySecs","purestdySecs"]}
				axisOptions={{
					font,
					labelColor:"#8B919E",
					formatYLabel: () => "",
				}}
			>
				{({ points, chartBounds }) => {
					const segments = splitLineSegments(points.purestdySecs);
					return (
						<>
							{
								points.stdySecs.map((point, index) => (
								<React.Fragment key={index}>
									<Bar
										barCount={points.stdySecs.length}
										points={[point]}
										chartBounds={chartBounds}
										color={ index === points.stdySecs.length - 1 ? "#6491FF" : "#8B919E"}
										barWidth={40}
										animate={{ type: "spring" }}
										roundedCorners={{ topLeft: 5, topRight: 5 }}
									/>
									<SkiaText
										x={point.x - 10}
										y={(point.y ?? 0) - 10}
										font={font}
										text={formatHoursToHourMin(point.yValue ?? 0)}
										color={ index === points.stdySecs.length - 1 ? "#6491FF" : "#8B919E"}
									/>
									{/*{ point.yValue !== 0 && (*/}
									{/*	<Circle*/}
									{/*		cx={point.x}*/}
									{/*		cy={point.y ?? 0}*/}
									{/*		r={5}*/}
									{/*		color="#F19450"*/}
									{/*	/>*/}
									{/*)}*/}

								</React.Fragment>
							))}
							{
								points.purestdySecs.map((point, index) => (
									<React.Fragment key={index}>
									{ point.yValue !== 0 && (
											<Circle
												cx={point.x}
												cy={point.y ?? 0}
												r={5}
												color="#F19450"
											/>
										)}
									</React.Fragment>
								))
							}

							{
								segments
								.filter(segment => segments.length >= 1)
								.map((segment, idx) => (
									<Line
										key={idx}
										points={segment}
										color="#F19450"
										strokeWidth={2}
										connectMissingData={false}
									/>
								))
							}
						</>
					);
				}}
			</CartesianChart>

			<Text style={{width: 640, color:"#AAB0Be", fontSize:20, marginTop: 20, marginBottom:20, textAlign:"center"}}>
				오늘 하루는 <Text style={{color:"#6491FF"}}> {messageDay.stdyTx ?? '0분'} </Text> 중에
				<Text style={{color:"#F19450"}}>  {messageDay.purestdtTx ?? '0분'}</Text>은 자리에 앉아 공부했어요!
			</Text>
		</View>
	);
}

const ReportAtntnStrssGraph = ({data, message} : ReportType.ReportAtntnStrssGraphProps) => {
	const font = useFont(require('../../../assets/fonts/NanumBarunGothic.ttf'), 12);
	return (
		<View style={{ width: 600, height: 460 }}>
			<Text style={{width: 640, color:"#F0F1F2", fontSize:24, textAlign:"center"}}>
				오늘의 하루 평균 에너지 사용량은<Text style={{color:"#6491FF"}}> {message?.strss ?? 0}점</Text>이고{'\n'}
				집중 점수는 <Text style={{color:"#F19450"}}>{message?.atntn ?? 0}점</Text>이에요!
			</Text>
			<CartesianChart
				data={data}
				xKey="time"
				yKeys={["atntn", "strss"]}
				domainPadding={{ left: 50, right: 50, top: 30 }}
				axisOptions={{
					font,
					labelColor:"#8B919E",
					tickValues: {
						x: data.map((_, index) => index),
						y: Array.from({ length: 10 }, (_, i) => i * 10),
					},
					lineWidth: {
						grid: {
							x: 0,     // x축 grid 숨김
							y: 1,     // y축 grid 선 두께
						},
						frame: 0,
					},
					lineColor: {
						grid: {
							x: '#FFF',
							y: "#444",  // grid 선 색상 (원하는 색상으로 바꿔도 돼)
						},
						frame: "#000",
					},
					// formatYLabel: () => "",
				}}
			>
				{({ points, chartBounds }) => {
					return (
						<>
							{/* 첫 번째 라인 (y) */}
							<Line
								points={points.atntn}
								color="#3B82F6"
								curveType={"natural"}
								connectMissingData={true}
								strokeWidth={1}
							/>

							{/* 두 번째 라인 (y2) */}
							<Line
								points={points.strss}
								color="#EF4444"
								curveType={"natural"}
								connectMissingData={true}
								strokeWidth={1}
							/>

							{/* 첫 번째 데이터 점 찍기 */}
							{points.atntn.map((point, index) => (
								<Circle
									key={`y-circle-${index}`}
									cx={point.x}
									cy={point.y ?? 0}
									r={3}
									color="#FFF"
								/>
							))}

							{/* 두 번째 데이터 점 찍기 */}
							{points.strss.map((point, index) => (
								<Circle
									key={`y2-circle-${index}`}
									cx={point.x}
									cy={point.y ?? 0}
									r={3}
									color="#FFF"
								/>
							))}
						</>
					);
				}}
			</CartesianChart>
			<View style={{marginBottom:20}}>

			</View>
		</View>
	);
}

const EmtnRadarChart = ({data}: ReportType.ReportEmtnRadarChartProps) => {

	const counts = data.map(item => item.exprCnt);
	const size = 400;
	const centerX = size / 2;
	const centerY = size / 2;
	const maxValue = counts.length ? Math.max(...counts) : 0;
	const levels = 5; // 몇 개의 격자선을 그릴지
	const radius = size / 2 - 40; // padding

	// 축 개수
	const N = data.length;

	// 격자 그리드 좌표 생성
	const gridPolygons = Array.from({ length: levels }, (_, levelIdx) => {
		const r = radius * ((levelIdx + 1) / levels);
		const points = data.map((item, i) => {
			const angle = (2 * Math.PI / N) * i;
			const x = centerX + r * Math.sin(angle);
			const y = centerY - r * Math.cos(angle);
			return `${x},${y}`;
		});
		return points.join(" ");
	});

	// Radar 데이터 좌표 생성
	const dataPoints = data.map((item, i) => {
		const angle = (2 * Math.PI / N) * i;
		const r = (item.exprCnt / maxValue) * radius;
		const x = centerX + r * Math.sin(angle);
		const y = centerY - r * Math.cos(angle);
		return `${x},${y}`;
	}).join(" ");

	// 축 라벨 좌표
	const labelPoints = data.map((item, i) => {
		const angle = (2 * Math.PI / N) * i;
		const r = radius + 20;
		const x = centerX + r * Math.sin(angle);
		const y = centerY - r * Math.cos(angle);
		return { x, y, label: item.exprNm };
	});

	return (
		<View style={{ alignItems: 'center', justifyContent: 'center' }}>
			<Text style={{ width: 640, color: '#F0F1F2', fontSize: 24, marginBottom: 20, textAlign: 'center' }}>
				오늘의 공부는 주로 <Text style={{ fontSize: 25, color: '#6491FF', fontWeight:"bold" }}> {data[0]?.exprNm} </Text>감정을 느꼈어요!
			</Text>
			<Svg width={size} height={size}>
				{/* Grid Polygons */}
				{gridPolygons.map((points, idx) => (
					<Polygon key={idx} points={points} fill='none' stroke='#444' strokeWidth={1} />
				))}

				{/* Axis Lines */}
				{data.map((item, i) => {
					const angle = ((2 * Math.PI) / N) * i;
					const x = centerX + radius * Math.sin(angle);
					const y = centerY - radius * Math.cos(angle);
					return <SvgLine key={i} x1={centerX} y1={centerY} x2={x} y2={y} stroke='#444' strokeWidth={1} />;
				})}

				{/* Radar Data Shape */}
				<Polygon points={dataPoints} fill='rgba(100, 145, 255, 0.5)' stroke='#6491FF' strokeWidth={2} />

				{/* Data Points */}
				{data.map((item, i) => {
					const angle = ((2 * Math.PI) / N) * i;
					const r = (item.exprCnt / maxValue) * radius;
					const x = centerX + r * Math.sin(angle);
					const y = centerY - r * Math.cos(angle);
					return <SvgCircle key={i} cx={x} cy={y} r={4} fill='#6491FF' />;
				})}

				{/* Labels */}
				{labelPoints.map((p, idx) => (
					<SvgText key={idx} x={p.x} y={p.y} fontSize='16' fill='#fff' textAnchor='middle'>
						{p.label}
					</SvgText>
				))}
			</Svg>
		</View>
	);
};

// 🎨 랜덤 색상 생성 함수
// const getRandomColor = () =>
// 	'#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');

// 사용할 색상 리스트 (최대 10개)
const COLORS = [
	"#EF4444", // 빨강
	"#F19450", // 주황
	"#84CC16", // 연두
	"#26A748", // 초록
	"#5BBFF0", // 하늘
	"#3BB2f6", // 파랑
	"#254BC9", // 남색
	"#843AEB", // 보라
	"#D040DD", // 분홍
	"#717988", // 회색
];

// 순차적으로 색상 선택 함수
const getSequentialColor = (index: number) => COLORS[index % COLORS.length];

const TreemapChart = (data: ReportType.TreemapChartProps) => {
	const [nodes, setNodes] = useState<any[]>([]);
	// const { width } = Dimensions.get('window');
	const width = 640;
	const height = 300;

	useEffect(() => {
		// d3가 요구하는 계층형 데이터로 변환
		const treemapData = {
			name: "root",
			children: data.data.map(item => ({
				name: item.doNm,
				value: item.stdySecsPercent
			}))
		};

		const root = d3
			.hierarchy(treemapData)
			.sum(d => d.value)
			.sort((a, b) => b.value! - a.value!);

		const treemapLayout = d3.treemap().size([width, height]).padding(5);
		treemapLayout(root);
		setNodes(root.leaves());
	}, [width]);

	return (
		<View style={{marginBottom: 20}}>
			<Text style={{width: 640, color:"#F0F1F2", fontSize:24, marginBottom: 20, textAlign:"center"}}>
				지난 일주일 동안 <Text style={{color:"#6491FF"}}>  {nodes.length > 0 ? nodes[0].data.name : "-"} </Text>공부를 열심히 했어요!
			</Text>
			<Svg width={width} height={height}>
				{nodes.map((node, index) => {
					const randomColor = getSequentialColor(index);
					const rectW = node.x1 - node.x0;
					const rectH = node.y1 - node.y0;

					// 내부 패딩과 폰트 크기 계산 (사각형 높이에 따라 가변)
					const padding = 8;
					// 최소 12, 최대 20, 사각형 높이의 35%를 목표로 폰트 크기 산정
					const dynamicFontSize = Math.max(12, Math.min(20, rectH * 0.35));

					// 대략적 문자 폭 추정치 (폰트마다 다르지만 평균 0.6em 가정)
					const approxCharWidth = dynamicFontSize * 0.6;
					// 좌우 패딩을 제외한 최대 수용 문자 수 계산
					let maxChars = Math.floor((rectW - padding * 2) / approxCharWidth);
					if (maxChars < 1) maxChars = 1;

					const rawName = node.data.name ?? '';
					const needsEllipsis = rawName.length > maxChars;
					// maxChars가 1일 때도 안전하게 처리
					const safeCut = Math.max(1, maxChars - 1);
					const displayName = needsEllipsis ? rawName.slice(0, safeCut) + '…' : rawName;

					// 너무 작은 블록에는 텍스트 미표시 (면적/높이 기준)
					const showText = rectW > 30 && rectH > 20 && rawName.length > 0;

					return (
						<React.Fragment key={index}>
							<Rect
								x={node.x0}
								y={node.y0}
								width={rectW}
								height={rectH}
								fill={randomColor}
								rx={10}
								ry={10}
							/>
							{showText && (
								<SvgText
									x={node.x0 + rectW / 2}
									y={node.y0 + rectH / 1.9}
									fontSize={dynamicFontSize}
									fill="white"
									textAnchor="middle"
									alignmentBaseline="middle"
								>
									{displayName}
								</SvgText>
							)}
						</React.Fragment>
					);
				})}
			</Svg>
		</View>
	);
};


const StudyReportScreen = ({ navigation }) => {
	const [isLoad, setIsLoad] = useState<boolean>(true);
	const [resultData, setResultData] = useState<ReportType.ReportTugboatAncTodayResDto>();
	const [countdown, setCountdown] = useState<number>(100);
	const dispatch = useDispatch();
	const authState = useSelector((state: RootState) => state.authInfo);
	const reduxUserInfo = useSelector((state: RootState) => state.userInfo);
	const { userSq, loginId } = reduxUserInfo;
	const authManager = AuthenticationManager.getInstance(navigation, dispatch);

	useEffect(() => {
		getReport();
	}, []);

	const getReport = async () => {
		try {
			await AttdService.selectTugboatAncReportData(authState, {
				userSq: userSq,
				loginId: loginId,
			}).then((res) => {
				if (res?.data?.result) {
					console.log('res?.data?.result', res?.data?.result);
					setResultData(res?.data?.result);
					setTimeout(() => {
						setIsLoad(false);
						startCountdown();
					}, 2000);
				} else {
					return;
				}
			});
		} catch (e) {
			console.log('error:::getReport:::', e);
		}
	};

	const startCountdown = () => {
		// Start a countdown from 30 seconds
		const timer = setInterval(() => {
			setCountdown((prevTime) => {
				if (prevTime <= 1) {
					clearInterval(timer);
					return 0;
				}
				return prevTime - 1;
			});
		}, 1000);

		// Clear interval when component unmounts
		return () => clearInterval(timer);
	};

	useEffect(() => {
		if (countdown === 0) {
			// Defer navigation to the next frame to avoid updating Navigation during render
			requestAnimationFrame(() => {
				navigation.reset({ routes: [{ name: 'LOGIN_SELECT' }] });
			});
		}
	}, [countdown, navigation]);


	return (
		<View style={styles.container}>
			{/* Title */}
			<Text style={styles.title}>오늘의 공부 보고</Text>
			<ScrollView
				contentContainerStyle={{
					flexGrow: 1,
					paddingBottom: 40,
				}}>
				<View style={styles.contentContainer}>
					{/* Robot Message */}
					<View style={styles.messageContainer}>
						<View style={styles.robotContainer}>
							<Image
								source={require('../../../assets/images/icons/ic_l_smilebot_62.png')}
								style={styles.robotImage}
								resizeMode='contain'
							/>
						</View>
						<ChatBubble
							message={
								resultData?.stdyReportText && resultData?.stdyReportText.trim() !== ''
									? resultData.stdyReportText
									: '10분 이상의 공부를 기록하고\n다시 시도하세요!'
							}
						/>
					</View>

					{/* 막대 그래프 Metrics Indicators */}
					<View style={[styles.metricsContainer, { marginTop: 20 }]}>
						{resultData?.ancReportWeekStdyText || resultData?.ancReportDayStdyText || resultData?.ancReportWeekStdyGraph ? (
							<ReportWeekStdyGraph
								data={resultData?.ancReportWeekStdyGraph}
								messageWeek={resultData?.ancReportWeekStdyText ?? ''}
								messageDay={resultData?.ancReportDayStdyText ?? ''}
							/>
						) : (
							<View
								style={{
									flex: 1,
									justifyContent: 'center',
									alignItems: 'center',
									padding: 16,
								}}>
								<Image
									source={require('../../../assets/images/icons/ic_d_error_14.png')}
									style={styles.errorImage}
									resizeMode='contain'
								/>
								<Text
									style={{
										marginTop: 10,
										fontSize: 22,
										lineHeight: 28,
										color: '#FFF',
										textAlign: 'center',
									}}>
									10분 이상의 공부를 기록하고{'\n'} 다시 시도하세요!
								</Text>
							</View>
						)}
					</View>

					{/* Metrics Indicators */}
                    <View style={[styles.metricsContainer, { marginTop: 20 }]}>
                        { resultData?.ancReportWeekStdyTreeMap && (
                            <TreemapChart data={resultData?.ancReportWeekStdyTreeMap}/>
                        )}
                    </View>

					{/* Metrics Indicators */}

                    <View style={[styles.metricsContainer, { marginTop: 20 }]}>
                        { resultData?.ancReportAtntnStrssText && resultData?.ancReportAtntnStrssGraph ?
                            (

                                <ReportAtntnStrssGraph
                            data={resultData?.ancReportAtntnStrssGraph}
                            message={resultData?.ancReportAtntnStrssText}
                        />
                            ) : (
                                <View style={{
                                    flex: 1,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    padding: 16,
                                }}>
                                    <Image
                                        source={require('../../../assets/images/icons/ic_d_error_14.png')}
                                        style={styles.errorImage}
                                        resizeMode='contain'
                                    />
                                    <Text style={{
                                        marginTop:10,
                                        fontSize:22,
                                        lineHeight:28,
                                        color: '#FFF',
                                        textAlign: 'center',
                                    }}>
                                        10분 이상의 공부를 기록하고{'\n'} 다시 시도하세요!
                                    </Text>
                                </View>
                            )}

                    </View>

					{/*  감정레이더 Metrics Indicators */}
					{/*{resultData?.ancReportEmtnRadarChart.length !== 0 ? (*/}
					{resultData?.ancReportEmtnRadarChart?.length > 0 ? (
                    <View style={[styles.metricsContainer, { marginTop: 20 }]}>

                        {/*{resultData?.ancReportWeekStdyTreeMap[0]?.totalStdySecs > 600 ? (*/}
						{resultData?.ancReportWeekStdyTreeMap?.[0]?.totalStdySecs > 600 ? (
                        <EmtnRadarChart data={resultData?.ancReportEmtnRadarChart ?? []} />
                            ) : (
                            <View style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 16,
                        }}>
                        <Image
                            source={require('../../../assets/images/icons/ic_d_error_14.png')}
                            style={styles.errorImage}
                            resizeMode='contain'
                        />
                        <Text style={{
                            marginTop:10,
                            fontSize:22,
                            lineHeight:28,
                            color: '#FFF',
                            textAlign: 'center',
                        }}>
                            10분 이상의 공부를 기록하고{'\n'} 다시 시도하세요!
                        </Text>
                    </View>
                    )}

                </View>) : <></>
					}

				</View>
			</ScrollView>
			<TouchableOpacity
				style={styles.buttonFixed}
				onPress={() => navigation.reset({ routes: [{ name: 'LOGIN_SELECT' }] })}>
				<Text style={styles.buttonText}>{countdown}초 뒤 화면 종료</Text>
			</TouchableOpacity>
			{isLoad && <LoadingModal onPress={() => {}} />}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#17191C',
		paddingHorizontal: widthRelateSize(20),
		paddingTop: heightRelateSize(20),
		alignItems: 'center',
	},
	contentContainer: {
		width: '100%',
		alignItems: 'center',
		// maxWidth: 700,
	},
	title: {
		fontSize: fontRelateSize(18),
		fontWeight: '700',
		color: 'white',
		marginBottom: 24,
		alignSelf: 'center',
	},
	timeStatsContainer: {
		marginBottom: 20,
		backgroundColor: 'rgba(46, 49, 56, 0.3)',
		borderRadius: 25,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		width: 700,
	},
	blueCircleContainer: {
		width: '100%',
		alignItems: 'center',
		flexDirection: 'row',
	},
	blueSemiCircle: {
		position: 'relative',
		height: heightRelateSize(140),
		alignItems: 'flex-end',
		justifyContent: 'center',
		marginBottom: 10,
	},
	percentageText: {
		color: '#3e85e3',
		fontSize: fontRelateSize(24),
		fontWeight: 'bold',
		position: 'absolute',
		top: heightRelateSize(50),
	},
	timeTextContainer: {
		height: 150,
		justifyContent: 'center',
	},
	time: {
		marginVertical: heightRelateSize(4),
		marginLeft: 48,
		flexDirection: 'row',
		alignItems: 'center',
	},
	timeLabel: {
		color: '#8a92a3',
		fontSize: 32,
		marginRight: 16,
	},
	timeValue: {
		color: 'white',
		fontSize: 40,
		fontWeight: '600',
	},
	metricsContainer: {
		width: '100%',
		minHeight: 280,
		paddingTop: 32,
		paddingLeft: 40,
		paddingRight: 40,
		backgroundColor: 'rgba(46, 49, 56, 0.3)',
		borderRadius: 25,
	},
	metricItem: {},
	messageContainer: {
		backgroundColor: '#17191C',
		borderRadius: 15,
		padding: 16,
		flexDirection: 'row',
		marginBottom: 0,
		width: '100%',
	},
	robotContainer: {
		marginTop: 32,
	},
	robotImage: {
		height: 124,
		width: 153,
	},
	errorImage: {
		height: 24,
		width: 24,
	},
	messageTextContainer: {},
	messageText: {
		color: '#6491FF',
		width: 528,
		fontSize: 26,
		lineHeight: 40,
		backgroundColor: '#2D384B',
		borderRadius: 25,
		padding: 30,
	},
	button: {
		backgroundColor: '#6491FF',
		borderRadius: 16,
		height: 64,
		width: 360,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 40,
	},
	buttonText: {
		color: 'white',
		fontSize: 24,
		fontWeight: 'bold',
	},
	countdownCircleContainer: {
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 16,
		position: 'relative',
		width: 50,
		height: 50,
	},
	countdownText: {
		position: 'absolute',
		color: 'white',
		fontSize: 18,
		fontWeight: 'bold',
	},
	buttonFixed: {
		backgroundColor: '#6491FF',
		borderRadius: 16,
		height: 64,
		width: 360,
		alignSelf: 'center',
		marginVertical: 20,
		alignItems:"center",
		justifyContent:"center"
	},
});

export default StudyReportScreen;
