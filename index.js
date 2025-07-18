window.onload = e =>{

var pick_colors = document.getElementById("pick-colors");
var target_select = document.getElementById("target-select");
var input_deltas = document.getElementById("input-deltas");
var current_input = document.getElementById("current-input");
var current_swatch = document.getElementById("current-swatch");
var target_swatch = document.getElementById("target-swatch");
var comp_swatches = document.getElementById("comp-swatches");

var colors = {};
var components = {};

pick_colors.onchange = e =>
{
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.readAsText(file,'UTF-8');
    reader.onload = readerEvent =>
    {
        colors = {};
        components = {};
        target_select.innerHTML = "";
        //contents.innerHTML = readerEvent.target.result;
        let obj = JSON.parse(readerEvent.target.result);
        for(let color of obj.colors)
        {
            colors[color.id] = new Color(color.name,color.L,color.a,color.b);
        }
        for(let target of obj.targets)
        {
            components[target.id] = target.components;
            let color = colors[target.id];
            let opt = document.createElement("option");
            opt.value = target.id;
            opt.innerHTML = color.name;
            target_select.appendChild(opt);
        }
        target_select.selectedIndex = "0";
        target_select.dispatchEvent(new Event('change'))
    }
}

target_select.onchange = e =>
{
    var target = target_select.value;

    target_swatch.innerHTML = "";
    comp_swatches.innerHTML = "";

    add_swatch_info(target_swatch, colors[target]);
    add_swatch(target_swatch, colors[target]);
    for(let component of components[target])
    {
        add_swatch_info(comp_swatches,colors[component],colors[target]);
        add_swatch(comp_swatches,colors[component]);
    }
    current_input.dispatchEvent(new Event('change'))
}

input_deltas.onchange = e =>
{
    var deltas = document.querySelectorAll(".delta");
    for(let delta of deltas)
    {
        delta.style.visibility = e.target.checked ? "visible" : "hidden";
    }
    var cura = document.getElementById("current-a");
    var curb = document.getElementById("current-b");
    cura.min = e.target.checked ? -255 : -127;
    curb.min = e.target.checked ? -255 : -127;
    cura.max = e.target.checked ? 255 : 128;
    curb.max = e.target.checked ? 255 : 128;
}

current_input.onchange = e =>
{
    current_swatch.innerHTML = "";
    var target = new Color("0",0,0,0);
    if(input_deltas.checked)
    {
        if(target_select.value === '') return;
        target = colors[target_select.value];
    }
    var dL = Number(current_input.querySelector("#current-L").value);
    var da = Number(current_input.querySelector("#current-a").value);
    var db = Number(current_input.querySelector("#current-b").value);
    var current = new Color("Current Color", Math.max(0,Math.min(target.L+dL,100)), Math.max(-127,Math.min(target.a+da,128)), Math.max(-127,Math.min(target.b+db,128)));
    add_swatch_info(current_swatch, current, target_select.value === '' ? null : colors[target_select.value]);
    add_swatch(current_swatch, current);
}

}

function add_swatch_info(parent, color, target=null)
{
    var div = document.createElement("div");
    parent.appendChild(div);
    div.innerHTML = `Name: ${color.name}<br \>Lab: ${color.L.toFixed(2)}, ${color.a.toFixed(2)}, ${color.b.toFixed(2)}`;
    if(target != null)
    {
        div.innerHTML += `<br \>&Delta;: ${(color.L-target.L).toFixed(2)}, ${(color.a-target.a).toFixed(2)}, ${(color.b-target.b).toFixed(2)}`;
    }
}

function add_swatch(parent, color)
{
    var div = document.createElement("div");
    parent.appendChild(div);
    var swatch = document.createElement("canvas");
    div.appendChild(swatch);

    div.classList.add("swatch");
    swatch.width = div.clientWidth;
    swatch.height = div.clientHeight;

    const ctx = swatch.getContext("2d");
    ctx.fillStyle = color.hex;
    ctx.fillRect(0,0,swatch.width,swatch.height);
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
    const x = color.X, y = color.Y, z = color.Z;

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
    const r = color.R, g = color.G, b = color.B;
    function to_hex(val)
    {
        return ("0"+val.toString(16)).slice(-2);
    }
    return "#"+to_hex(r)+to_hex(g)+to_hex(b);
}

class Color
{
    constructor(name,L,a,b)
    {
        this.name = name;
        this.L = L;
        this.a = a;
        this.b = b;
        var xyz = lab_to_xyz(this);
        this.X = xyz.x;
        this.Y = xyz.y;
        this.Z = xyz.z;
        var rgb = xyz_to_rgb(this);
        this.R = rgb.r;
        this.G = rgb.g;
        this.B = rgb.b;
        this.hex = rgb_to_hex(this);
    }
}
