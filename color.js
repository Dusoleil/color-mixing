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
        this.XYZ = Color.#lab_to_xyz(this.Lab);
        this.RGB = Color.#xyz_to_rgb(this.XYZ);
        this.hex = Color.#rgb_to_hex(this.RGB);
    }

    static from_xyz(name,xyz)
    {
        let lab = Color.#xyz_to_lab(vec3.clone(xyz));
        return new Color(name,lab);
    }

    get L(){return this.Lab[0];}
    get a(){return this.Lab[1];}
    get b(){return this.Lab[2];}
    get X(){return this.XYZ[0];}
    get Y(){return this.XYZ[1];}
    get Z(){return this.XYZ[2];}
    get R(){return this.RGB[0];}
    get G(){return this.RGB[1];}
    get B(){return this.RGB[2];}

    //https://rgbatohex.com/tools/lab-to-xyz
    static #lab_to_xyz(color)
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
    static #xyz_to_rgb(color)
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

    static #rgb_to_hex(color)
    {
        const [r,g,b] = color;
        function to_hex(val)
        {
            return ("0"+val.toString(16)).slice(-2);
        }
        return "#"+to_hex(r)+to_hex(g)+to_hex(b);
    }

    //https://rgbatohex.com/tools/xyz-to-lab
    static #xyz_to_lab(color)
    {
        const [x,y,z] = color;

        // D65 illuminant white point
        const xn = 95.047, yn = 100.000, zn = 108.883;

        // Current XYZ values
        const xNorm = x / xn;
        const yNorm = y / yn;
        const zNorm = z / zn;

        // Apply nonlinear transformation
        const f = (t) => t > 0.008856 ? Math.pow(t, 1/3) : (7.787 * t + 16/116);

        const fx = f(xNorm);
        const fy = f(yNorm);
        const fz = f(zNorm);

        // Calculate LAB values
        const L = 116 * fy - 16;
        const a = 500 * (fx - fy);
        const b = 200 * (fy - fz);

        return vec3.fromValues(L,a,b);
    }

    #clamp(min,val,max)
    {
        return Math.max(min,Math.min(val,max));
    }
}