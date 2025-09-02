import * as tf from '@tensorflow/tfjs';
import { Rank, Tensor } from "@tensorflow/tfjs";
import { SSRLayerType, FeatSliceLayerType } from '../../types/fsanet/FsanetType'

export class SSRLayer extends tf.layers.Layer {

    private s1: number;
    private s2: number;
    private s3: number;
    private lambda_d: any | undefined;

    constructor(params: SSRLayerType) {
        super();
        this.s1 = params.s1;
        this.s2 = params.s2;
        this.s3 = params.s3;
        this.lambda_d = params.lambdaD;
        this.trainable = false;
        this.name = params.name;
    }

    call(inputs: Tensor | Tensor[]) {

        const result: Tensor = tf.tidy(() => {

            const x: Tensor | Tensor[] = inputs;

            let N: number = 0;

            // @ts-ignore
            let a: Tensor = tf.mul(0, tf.slice(x[0], [0, 0, N], [x[0].shape[0], x[0].shape[1], 1]).reshape([-1, x[0].shape[1]]));

            // @ts-ignore
            let b: Tensor = tf.mul(0, tf.slice(x[0], [0, 0, N], [x[0].shape[0], x[0].shape[1], 1]).reshape([-1, x[0].shape[1]]));

            // @ts-ignore
            let c: Tensor = tf.mul(0, tf.slice(x[0], [0, 0, N], [x[0].shape[0], x[0].shape[1], 1]).reshape([-1, x[0].shape[1]]));

            const s1: number = this.s1;
            const s2: number = this.s2;
            const s3: number = this.s3;

            const lambda_d: any | undefined = this.lambda_d;

            const di: number = parseInt(String(s1 / 2));
            const dj: number = parseInt(String(s2 / 2));
            const dk: number = parseInt(String(s3 / 2));

            const V: number = 99;

            for (let i = 0; i < s1; i++) {
                // @ts-ignore
                a = tf.add(a, tf.mul(tf.add((i - di), x[6]), tf.slice(x[0], [0, 0, i], [x[0].shape[0], x[0].shape[1], 1]).reshape([-1, x[0].shape[1]])));
            }
            // @ts-ignore
            a = tf.div(a, tf.mul(s1, tf.add(1, tf.mul((lambda_d), x[3]))));

            for (let j = 0; j < s2; j++) {
                // @ts-ignore
                b = tf.add(b, tf.mul(tf.add((j - dj), x[7]), tf.slice(x[1], [0, 0, j], [x[0].shape[0], x[0].shape[1], 1]).reshape([-1, x[0].shape[1]])));
            }

            // @ts-ignore
            b = tf.div(tf.div(b, tf.mul(s1, tf.add(1, tf.mul((lambda_d), x[3])))), tf.mul(s2, tf.add(1, tf.mul((lambda_d), x[4]))));

            for (let k = 0; k < s3; k++) {
                // @ts-ignore
                c = tf.add(c, tf.mul(tf.add((k - dk), x[8]), tf.slice(x[2], [0, 0, k], [x[0].shape[0], x[0].shape[1], 1]).reshape([-1, x[0].shape[1]])));
            }
            // @ts-ignore
            c = tf.div(
                // @ts-ignore
                tf.div(tf.div(c, tf.mul(s1, tf.add(1, tf.mul((lambda_d), x[3])))), tf.mul(s2, tf.add(1, tf.mul((lambda_d), x[4])))), tf.mul(s3, tf.add(1, tf.mul((lambda_d), x[5])))
            );

            return tf.mul(tf.add(tf.add(a, b), c), V);
        });


        return result;
    }

    computeOutputShape(input_shape: Object) {
        // @ts-ignore
        const rtn = [input_shape[0][0], 3];
        return rtn;
    }

    static get className() {
        return 'SSRLayer';
    }

}

export class FeatSliceLayer extends tf.layers.Layer {

    private start_index: number;
    private end_index: number;

    constructor(params: FeatSliceLayerType) {
        super();
        this.start_index = params.startIndex;
        this.end_index = params.endIndex;
        this.trainable = false;
    }

    call(params: Tensor | Tensor[]) {

        const result: Tensor = tf.tidy(() => {
            // @ts-ignore
            const inputs: Tensor = params[0];
            return tf.slice(inputs, [0, this.start_index], [inputs.shape[0], (this.end_index - this.start_index)]);
        });

        return result;
    }

    computeOutputShape(input_shape: Object) {
        // @ts-ignore
        return [input_shape[0], (this.end_index - this.start_index)];
    }

    static get className() {
        return 'FeatSliceLayer';
    }
}



export class MatrixMultiplyLayer extends tf.layers.Layer {

    constructor() {
        super();
        this.trainable = false;
    }

    call(inputs: Object) {

        const result: Tensor = tf.tidy(() => {

            // @ts-ignore
            const x1: Tensor = inputs[0];
            // @ts-ignore
            const x2: Tensor = inputs[1];

            return tf.matMul(x1, x2);
        });

        return result;
    }

    computeOutputShape(input_shape: Object) {
        // @ts-ignore
        return [input_shape[0][0], input_shape[0][1], input_shape[1][2]];
    }

    static get className() {
        return 'MatrixMultiplyLayer';
    }
}

export class MatrixNormLayer extends tf.layers.Layer {

    private tile_count: any;
    constructor(params: any) {
        super({});
        this.trainable = false;
        this.tile_count = params.tileCount;
    }

    call(input: Object) {

        const result: Tensor = tf.tidy(() => {
            // @ts-ignore
            const sum: Tensor = tf.sum(input[0], -1, true);
            return tf.tile(sum, [1, 1, this.tile_count]);
        });
        return result;
    }

    computeOutputShape(inputShape: Object) {
        // @ts-ignore
        return [inputShape[0], inputShape[1], this.tile_count];
    }

    static get className() {
        return 'MatrixNormLayer';
    }
}

export class PrimCapsLayer extends tf.layers.Layer {

    constructor() {
        super();
        this.trainable = false;
    }

    call(inputs: Object) {
        const result: Tensor = tf.tidy(() => {
            // @ts-ignore
            const x1: Tensor = inputs[0];
            // @ts-ignore
            const x2: Tensor = inputs[1];
            // @ts-ignore
            const norm: Tensor = inputs[2];

            return tf.matMul(x1, x2).div(norm);
        });
        return result;
    }

    computeOutputShape(input_shapes: Object) {
        // @ts-ignore
        return input_shapes[0];
    }

    static get className() {
        return 'PrimCapsLayer';
    }
}

export class AggregatedFeatureExtractionLayer extends tf.layers.Layer {
    private num_capsule: number;

    constructor(params: any) {
        super();
        this.trainable = false;
        this.num_capsule = params.numCapsule;
        this.name = params.name;
    }

    call(params: Object) {

        const result = tf.tidy(() => {
            // @ts-ignore
            const input: Tensor = params[0];

            const s1_a: number = 0;
            const s1_b: number = parseInt(String(this.num_capsule / 3));

            const feat_s1_div: Tensor<Rank> = tf.slice(input, [0, s1_a, 0], [input.shape[0], (s1_b - s1_a), Number(input.shape[2])]);

            const s2_a: number = parseInt(String(this.num_capsule / 3));
            const s2_b: number = parseInt(String(2 * this.num_capsule / 3));

            const feat_s2_div: Tensor = tf.slice(input, [0, s2_a, 0], [input.shape[0], (s2_b - s2_a), Number(input.shape[2])]);

            const s3_a: number = parseInt(String(2 * this.num_capsule / 3));
            const s3_b: number = this.num_capsule;

            const feat_s3_div: Tensor = tf.slice(input, [0, s3_a, 0], [input.shape[0], (s3_b - s3_a), Number(input.shape[2])]);
            return [feat_s1_div, feat_s2_div, feat_s3_div];
        });

        return result;
    }

    computeOutputShape(input_shape: Object) {
        // @ts-ignore
        const last_dim: number = input_shape[2];
        // @ts-ignore
        const partition: number = parseInt(String(this.num_capsule / 3));
        // @ts-ignore
        return [[input_shape[0], partition, last_dim], [input_shape[0], partition, last_dim], [input_shape[0], partition, last_dim]];
    }

    static get className() {
        return 'AggregatedFeatureExtractionLayer';
    }
}
// @ts-ignore
export default class modeling {
}
