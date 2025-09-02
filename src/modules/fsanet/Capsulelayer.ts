import * as tf from '@tensorflow/tfjs';
import { Tensor } from "@tensorflow/tfjs";
import { CapsuleLayerType } from "../../types/fsanet/FsanetType";

const batch_dot = (x: Tensor, y: Tensor, axes: Object) => {

    const result: Tensor = tf.tidy(() => {

        if (Number.isInteger(axes)) {
            axes = [axes, axes];
        }
        const x_ndim: number = x.shape.length;
        const y_ndim: number = y.shape.length;

        if (axes === null) {
            axes = [x_ndim - 1, y_ndim - 2];
        }

        let diff: number;
        if (x_ndim > y_ndim) {
            diff = x_ndim - y_ndim;

            // @ts-ignore
            y = tf.reshape(y, tf.concat([y.shape, tf.ones([diff])], 0).arraySync());

        } else if (y_ndim > x_ndim) {
            diff = y_ndim - x_ndim;

            // @ts-ignore
            x = tf.reshape(x, tf.concat([x.shape, tf.ones([diff])], 0).arraySync());

        } else {
            diff = 0;
        }

        let out: Tensor, adj_x: boolean, adj_y: boolean;


        if (x.shape.length === 2 && y.shape.length === 2) {
            // @ts-ignore
            if (axes[0] === axes[1]) {
                // @ts-ignore
                out = tf.sum(tf.mul(x, y), axes[0]);
            } else {
                // @ts-ignore
                out = tf.sum(tf.mul(tf.transpose(x, [1, 0]), y), axes[1]);
            }
        } else {
            if (x !== null) {
                // @ts-ignore
                if (axes[0] === (x.shape.length - 1)) {
                    adj_x = false;
                } else {
                    adj_x = true;
                }

                // @ts-ignore
                if (axes[1] === (y.shape.length - 1)) {
                    adj_y = true;
                } else {
                    adj_y = false;
                }
            } else {
                adj_x = false;
                adj_y = false;
            }
            out = tf.matMul(x, y, adj_x, adj_y);
        }

        // if (diff !== false && diff !== null) {
        if (diff !== null) {

            let idx: number;
            if (x_ndim > y_ndim) {
                idx = x_ndim + y_ndim - 3;
            } else {
                idx = x_ndim - 1;
            }

            // eslint-disable-next-line no-array-constructor
            let squeezeRange = new Array();
            for (let i = idx; i < idx + diff; i++) {
                squeezeRange.push(i);
            }
            out = tf.squeeze(out, squeezeRange);
        }

        if (out.shape.length === 1) {
            out = tf.expandDims(out, 1);
        }
        return out;
    });

    return result;
};

const squash = (vectors: Tensor) => {

    const result: Tensor = tf.tidy(() => {

        const s_squared_norm: Tensor = tf.sum(tf.square(vectors), -1, true);

        const scale: Tensor = tf.div(tf.div(s_squared_norm, tf.add(s_squared_norm, 1)), tf.sqrt(tf.add(s_squared_norm, 0.0000001)));
        return tf.mul(scale, vectors);
    });

    return result;
};

let W: tf.LayerVariable;

// @ts-ignore
export class CapsuleLayer extends tf.layers.Layer {

    private num_capsule: any;
    private dim_capsule: any;
    private routings: number;
    private kernel_initializer: any;
    private name: any;
    private input_num_capsule: any;
    private input_dim_capsule: any;

    // @ts-ignore
    constructor(params: CapsuleLayerType, kernel_initializer: Object = tf.initializers.glorotUniform()) {
        super();
        this.num_capsule = params.numCapsule;
        this.dim_capsule = params.dimCapsule;

        let pRouting = 3;
        if (params.routings !== null) {
            pRouting = params.routings;
        }
        this.routings = pRouting;

        this.kernel_initializer = kernel_initializer;
        this.name = params.name;
    }

    async build(input_shape: any) {

        if (input_shape.length >= 3) {
            this.input_num_capsule = input_shape[1];
            this.input_dim_capsule = input_shape[2];

            W = this.addWeight('W',
                [this.num_capsule, this.input_num_capsule, this.dim_capsule, this.input_dim_capsule],
                'float32', this.kernel_initializer);

            this.built = true;
        } else {
            console.log('The input Tensor should have shape=[None, input_num_capsule, input_dim_capsule]');
        }
    }

    call(inputs: Object) {

        const result: Tensor = tf.tidy(() => {

            // @ts-ignore
            const inputs_expand: Tensor = tf.expandDims(inputs[0], 1);
            const inputs_tiled: Tensor = tf.tile(inputs_expand, [1, this.num_capsule, 1, 1]);

            const x: Tensor = tf.reshape(inputs_tiled, [3, 21, 64]);
            // @ts-ignore
            const inputs_hat: Tensor = tf.reshape(batch_dot(x, W.val, [2, 3]), [1, 3, 21, 16]);

            let b: Tensor = tf.zeros([inputs_hat.shape[0], this.num_capsule, this.input_num_capsule]);

            let c: Tensor;
            let outputs: Tensor;

            if (this.routings > 0) {
                for (let i = 0; i < this.routings; i++) {
                    c = tf.softmax(b);

                    outputs = squash(batch_dot(c, inputs_hat, [2, 2]));

                    if (i < this.routings - 1) {
                        b = tf.add(b, batch_dot(outputs, inputs_hat, [2, 3]));
                    }
                }
            } else {
                console.log('The routings should be > 0.');
            }
            // @ts-ignore
            return outputs;
        });
        return result;
    }

    computeOutputShape(input_shape: any) {
        return [this.num_capsule, this.dim_capsule];
    }

    static get className() {
        return 'CapsuleLayer';
    }
}