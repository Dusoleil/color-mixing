window.onload = e =>{

var pick_colors = document.getElementById("pick-colors");
var contents = document.getElementById("file-contents");
var swatches = document.getElementById("swatches");

pick_colors.onchange = e =>
{
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.readAsText(file,'UTF-8');
    reader.onload = readerEvent =>
    {
        //contents.innerHTML = readerEvent.target.result;
        var obj = JSON.parse(readerEvent.target.result);
        var targets = obj.targets;
        for(color in targets)
        {
            color = targets[color];
            add_swatch(swatches, new Color(color.L,color.a,color.b));
        }
    }
}

}

function add_swatch(parent, color)
{
    var swatch = document.createElement("canvas");
    swatch.classList.add("swatch");
    const ctx = swatch.getContext("2d");

    ctx.fillStyle = color.hex;
    ctx.fillRect(0,0,swatch.width,swatch.height);

    parent.appendChild(swatch);
}

//https://rgbatohex.com/tools/lab-to-xyz
function lab_to_xyz(color)
{
    const L = color.L, a = color.a, b = color.b;

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

    return { x: X, y: Y, z: Z };
}

//https://rgbatohex.com/tools/xyz-to-rgb
function xyz_to_rgb(color)
{
    const x = color.x, y = color.y, z = color.z;

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

    return {r:rgbFinal[0],g:rgbFinal[1],b:rgbFinal[2]};
}

function rgb_to_hex(color)
{
    const r=color.r,g=color.g,b=color.b;
    function to_hex(val)
    {
        return ("0"+val.toString(16)).slice(-2);
    }
    return "#"+to_hex(r)+to_hex(g)+to_hex(b);
}

class Color
{
    constructor(L,a,b)
    {
        this.L = L;
        this.a = a;
        this.b = b;
        var xyz = lab_to_xyz(this);
        this.x = xyz.x;
        this.y = xyz.y;
        this.z = xyz.z;
        var rgb = xyz_to_rgb(this);
        this.r = rgb.r;
        this.g = rgb.g;
        this.b = rgb.b;
        this.hex = rgb_to_hex(this);
    }
}
