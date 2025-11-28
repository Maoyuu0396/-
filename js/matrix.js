class Matrix4 {
    static create() {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    static perspective(out, fovy, aspect, near, far) {
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);
        
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        
        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) * nf;
        out[11] = -1;
        
        out[12] = 0;
        out[13] = 0;
        out[14] = (2 * far * near) * nf;
        out[15] = 0;
        return out;
    }

    static translate(out, a, v) {
        const x = v[0], y = v[1], z = v[2];
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        
        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;
        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
        return out;
    }

    static rotateY(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        
        out[0] = a00 * c - a20 * s;
        out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s;
        out[3] = a03 * c - a23 * s;
        out[4] = a10;
        out[5] = a11;
        out[6] = a12;
        out[7] = a13;
        out[8] = a00 * s + a20 * c;
        out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c;
        out[11] = a03 * s + a23 * c;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    }

    static rotateX(out, a, rad) {
        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        
        out[0] = a[0]; out[1] = a[1]; out[2] = a[2]; out[3] = a[3];
        out[4] = a10 * c + a20 * s;
        out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s;
        out[7] = a13 * c + a23 * s;
        out[8] = a20 * c - a10 * s;
        out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s;
        out[11] = a23 * c - a13 * s;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return out;
    }

    static multiply(out, a, b) {
        const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
        const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
        const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
        const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

        const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
        const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
        const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
        const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];
        
        out[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
        out[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
        out[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
        out[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
        out[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
        out[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
        out[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
        out[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
        out[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
        out[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
        out[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
        out[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
        out[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
        out[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
        out[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
        out[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
        return out;
    }

    static lookAt(out, eye, center, up) {
        const x0 = 0, x1 = 1, x2 = 2;
        const y0 = 3, y1 = 4, y2 = 5;
        const z0 = 6, z1 = 7, z2 = 8;
        
        let len = 1;
        let zx = eye[x0] - center[x0];
        let zy = eye[x1] - center[x1];
        let zz = eye[x2] - center[x2];
        
        len = 1 / Math.sqrt(zx * zx + zy * zy + zz * zz);
        zx *= len;
        zy *= len;
        zz *= len;
        
        let xx = up[y1] * zz - up[y2] * zy;
        let xy = up[y2] * zx - up[y0] * zz;
        let xz = up[y0] * zy - up[y1] * zx;
        
        len = Math.sqrt(xx * xx + xy * xy + xz * xz);
        if (!len) {
            xx = 0; xy = 0; xz = 0;
        } else {
            len = 1 / len;
            xx *= len; xy *= len; xz *= len;
        }
        
        let yx = zy * xz - zz * xy;
        let yy = zz * xx - zx * xz;
        let yz = zx * xy - zy * xx;
        
        len = Math.sqrt(yx * yx + yy * yy + yz * yz);
        if (!len) {
            yx = 0; yy = 0; yz = 0;
        } else {
            len = 1 / len;
            yx *= len; yy *= len; yz *= len;
        }
        
        out[0] = xx; out[1] = yx; out[2] = zx; out[3] = 0;
        out[4] = xy; out[5] = yy; out[6] = zy; out[7] = 0;
        out[8] = xz; out[9] = yz; out[10] = zz; out[11] = 0;
        out[12] = -(xx * eye[x0] + xy * eye[x1] + xz * eye[x2]);
        out[13] = -(yx * eye[x0] + yy * eye[x1] + yz * eye[x2]);
        out[14] = -(zx * eye[x0] + zy * eye[x1] + zz * eye[x2]);
        out[15] = 1;
        
        return out;
    }
}
