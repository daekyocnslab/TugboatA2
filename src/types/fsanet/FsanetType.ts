/**
 * Fsa-net 데이터 타입
 */
export type SSRLayerType = {
    s1: number;
    s2: number;
    s3: number;
    lambdaD: any | undefined;
    name: string;
}

export type FeatSliceLayerType = {
    startIndex: number;
    endIndex: number;
}

export type CapsuleLayerType = {
    numCapsule: number;
    dimCapsule: number;
    dtype: string;
    name: string;
    customObjects: Object | Object[];
    routings: number;
    trainable: boolean;

};
