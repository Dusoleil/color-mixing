import {vec3} from "glMatrix"

export class Color
{
    constructor(name,Lab)
    {
        this.name = name;
        let c = vec3.clone(Lab)
        c[0] = this.#clamp(0,c[0],100);
        c[1] = this.#clamp(-127,c[1],128);
        c[2] = this.#clamp(-127,c[2],128);
        this.Lab = c;
        this.L = this.Lab[0];
        this.a = this.Lab[1];
        this.b = this.Lab[2];
        this.XYZ = this.#lab_to_xyz(this.Lab);
        this.X = this.XYZ[0];
        this.Y = this.XYZ[1];
        this.Z = this.XYZ[2];
        this.RGB = this.#xyz_to_rgb(this.XYZ);
        this.R = this.RGB[0];
        this.G = this.RGB[1];
        this.B = this.RGB[2];
        this.hex = this.#rgb_to_hex(this.RGB);
    }

    //https://rgbatohex.com/tools/lab-to-xyz
    #lab_to_xyz(color)
    {
        const [L,a,b] = color;

        // Calculate intermediate values
        const fy = (L + 16) / 116;
        const fx = a / 500 + fy;
        const fz = fy - b / 200;

        // Apply inverse nonlinear transformation
        const fInv = (t) => {
            const t3 = Math.pow(t, 3);
            return t3 > 0.008856 ? t3 : (t - 16/116) / 7.787;
        };

        const xNorm = fInv(fx);
        const yNorm = fInv(fy);
        const zNorm = fInv(fz);

        // D65 illuminant white point
        const xn = 95.047, yn = 100.000, zn = 108.883;

        // Apply illuminant scaling
        const X = xNorm * xn;
        const Y = yNorm * yn;
        const Z = zNorm * zn;

        return vec3.fromValues(X,Y,Z);
    }

    //https://rgbatohex.com/tools/xyz-to-rgb
    #xyz_to_rgb(color)
    {
        const [x,y,z] = color;

        // XYZ to sRGB transformation matrix
        const xyzToRgbMatrix = [
            [3.2406, -1.5372, -0.4986],
            [-0.9689,  1.8758,  0.0415],
            [0.0557, -0.2040,  1.0570]
        ];

        // Current XYZ values (normalized to 0-1 range)
        const xyz = [x/100.0, y/100.0, z/100.0];

        // Matrix multiplication
        const rgbLinear = [
            xyz[0] * xyzToRgbMatrix[0][0] + xyz[1] * xyzToRgbMatrix[0][1] + xyz[2] * xyzToRgbMatrix[0][2],
            xyz[0] * xyzToRgbMatrix[1][0] + xyz[1] * xyzToRgbMatrix[1][1] + xyz[2] * xyzToRgbMatrix[1][2],
            xyz[0] * xyzToRgbMatrix[2][0] + xyz[1] * xyzToRgbMatrix[2][1] + xyz[2] * xyzToRgbMatrix[2][2]
        ];

        // Gamma correction
        const linearToSrgb = (c) => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1/2.4) - 0.055;
        const rgbGamma = rgbLinear.map(linearToSrgb);

        // Clamp and convert to 8-bit
        const rgbFinal = rgbGamma.map(c => Math.max(0, Math.min(255, Math.round(c * 255))));

        return vec3.clone(rgbFinal);
    }

    #rgb_to_hex(color)
    {
        const [r,g,b] = color;
        function to_hex(val)
        {
            return ("0"+val.toString(16)).slice(-2);
        }
        return "#"+to_hex(r)+to_hex(g)+to_hex(b);
    }

    #clamp(min,val,max)
    {
        return Math.max(min,Math.min(val,max));
    }
}