import { UserType } from './UserType';

export declare namespace ReportType {
	export type ReportDto = {};

	export type ReportTodayReqDto = {
		userSq: string | number;
		loginId: string;
	};

	export type ChartPoint = {
		x: number;
		y: number | null;
		yValue: number | null;
	};

	export type ReportTodayResDto = {
		result: {
			userNm: null;
			stdySecs: number;
			stdyText: string;
			purestdySecs: number;
			purestdyText: string;
			stdyPer: number;
			avgAtntn: number;
			avgStrss: number;
			stdyStatus: string;
			stdyRtnText: string;
		};
		resultCode: number;
		resultMsg: string;
	};

	export type TreemapChartProps = {
		data: {
			doNm: string;
			stdySecs: number;
			stdySecsPercent: number;
			totalStdySecs: number;
		}[];
	};

	export type ReportAtntnStrssGraphProps = {
		data: {
			time: string;
			atntn: number;
			strss: number;
		}[];
		message: {
			atntn: number;
			strss: number;
		};
	};

	export type ReportEmtnRadarChartProps = {
		data : {
			exprNm: string | null;
			exprCnt: number;
			exprPer: number;
		}[];
	}

	export type ReportWeekStdyGraphProp = {
		data : {
			strtDt: string;
			dayOfWeek: string;
			stdySecs: number;
			stdyTx: string;
			purestdySecs: number;
			purestdyTx: string;
			bststdySecs: number;
			bststdyTx: string;
		}[];
		messageWeek : {
			stdyTx: string;
			purestdtTx: string;
			bststdtTx: string;
		}
		messageDay : {
			stdyTx: string;
			purestdtTx: string;
			bststdtTx: string;
		}
	};

	export type ReportTugboatAncTodayResDto = {
		stdyReportText: string;
		ancReportWeekStdyText: {
			stdyTx: string;
			purestdtTx: string;
			bststdtTx: string;
		};
		ancReportWeekStdyGraph: ReportWeekStdyGraphProp;
		ancReportDayStdyText: {
			stdyTx: string;
			purestdtTx: string;
			bststdtTx: string;
		};
		ancReportWeekStdyTreeMap: TreemapChartProps;
		ancReportAtntnStrssText: {
			atntn: number;
			strss: number;
		};
		ancReportAtntnStrssGraph: ReportAtntnStrssGraphProps;
		ancReportEmtnRadarChart: ReportEmtnRadarChartProps;
	};
}
