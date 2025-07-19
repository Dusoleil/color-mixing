window.onload = e =>{

var pick_colors = document.getElementById("pick-colors");
var target_form = document.getElementById("target-form");
var target_select = document.getElementById("target-select");
var input_deltas = document.getElementById("input-deltas");
var current_input = document.getElementById("current-input");
var current_swatch = document.getElementById("current-swatch");
var target_swatch = document.getElementById("target-swatch");
var comp_swatches = document.getElementById("comp-swatches");
var custom_input = document.getElementById("custom-input");
var custom_swatch = document.getElementById("custom-swatch");

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
        target_form.dispatchEvent(new Event('change'))
    }
}

function update_component_swatches(current)
{
    comp_swatches.innerHTML = "";

    var target = target_select.value;
    if(target === '') return;

    for(let component of components[target])
    {
        add_swatch_info(comp_swatches,colors[component],colors[target],current);
        add_swatch(comp_swatches,colors[component]);
    }

    custom_input.dispatchEvent(new Event('change'))
}

target_form.onchange = e =>
{
    target_swatch.innerHTML = "";

    var target = target_select.value;
    if(target !== '')
    {
        add_swatch_info(target_swatch, colors[target]);
        add_swatch(target_swatch, colors[target]);
    }

    current_input.dispatchEvent(new Event('change'))
}

target_select.onchange = e =>
{
    custom_input.innerHTML = "";

    var target = target_select.value;
    if(target === '') return;

    var table = document.createElement("table");
    custom_input.appendChild(table);
    var titlerow = table.insertRow();
    var titlecell = titlerow.insertCell();
    titlecell.setAttribute("colspan",2);
    titlecell.innerHTML = "Custom Color Ratio";

    for(let component of components[target])
    {
        let color = colors[component];
        let comprow = table.insertRow();
        let compnumcell = comprow.insertCell();
        let compratio = document.createElement("input");
        compnumcell.appendChild(compratio);
        compratio.dataset.component = component;
        compratio.setAttribute("type","number");
        compratio.value = 0;
        compratio.classList.add("comp-ratio");
        comprow.insertCell().innerHTML = color.name;
    }
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

var current_color = null;

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
    current_color = current;
    add_swatch_info(current_swatch, current, target_select.value === '' ? null : colors[target_select.value]);
    add_swatch(current_swatch, current);

    update_component_swatches(current);
}

custom_input.onchange = e =>
{
    custom_swatch.innerHTML = "";
    var use_linear = document.getElementById("use-linear");

    var n = 0;
    var L = 0;
    var a = 0;
    var b = 0;

    var compratios = custom_input.querySelectorAll("input");
    for(let compratio of compratios)
    {
        let component = compratio.dataset.component;
        let ratio = compratio.value;
        let color = colors[component];

        n += Math.abs(ratio);
        L += (ratio * (use_linear.checked ? color.X : color.L));
        a += (ratio * (use_linear.checked ? color.Y : color.a));
        b += (ratio * (use_linear.checked ? color.Z : color.b));
    }

    if(n == 0) return;

    L /= n;
    a /= n;
    b /= n;

    if(use_linear.checked)
    {
        let lab = xyz_to_lab(L,a,b);
        L = lab.L;
        a = lab.a;
        b = lab.b;
    }

    let color = new Color("Custom Color",L,a,b);
    add_swatch_info(custom_swatch, color, colors[target_select.value], current_color);
    add_swatch(custom_swatch, color);
}

}

function add_swatch_info(parent, color, target=null, current=null)
{
    var use_linear = document.getElementById("use-linear");
    var div = document.createElement("div");
    parent.appendChild(div);
    var table = document.createElement("table");
    table.classList.add("swatch-info");
    div.appendChild(table);
    var namerow = table.insertRow();
    namerow.insertCell().innerHTML = "Name:";
    var namecell = namerow.insertCell();
    namecell.setAttribute("colspan", 3);
    namecell.innerHTML = color.name;
    var x = use_linear.checked ? color.X : color.L;
    var y = use_linear.checked ? color.Y : color.a;
    var z = use_linear.checked ? color.Z : color.b
    var labrow = table.insertRow();
    labrow.insertCell().innerHTML = use_linear.checked ? "XYZ:" : "Lab:";
    labrow.insertCell().innerHTML = x.toFixed(2);
    labrow.insertCell().innerHTML = y.toFixed(2);
    labrow.insertCell().innerHTML = z.toFixed(2);
    if(target != null)
    {
        add_deltas(table, target, color, use_linear.checked, "Target");
        if(current != null)
        {
            add_deltas(table, current, color, use_linear.checked, "Current");
            var thetarow = table.insertRow();
            thetarow.insertCell().innerHTML = "&Theta;:";
            var thetacell = thetarow.insertCell();
            thetacell.setAttribute("colspan", 3);
            thetacell.innerHTML = calc_theta(color,target,current,use_linear.checked).toFixed(4);
        }
    }
}

function add_deltas(table, from, to, linear, title)
{
    let fx = linear ? from.X : from.L;
    let fy = linear ? from.Y : from.a;
    let fz = linear ? from.Z : from.b;
    let tx = linear ? to.X : to.L;
    let ty = linear ? to.Y : to.a;
    let tz = linear ? to.Z : to.b;
    let x = tx - fx;
    let y = ty = fy;
    let z = tz - fz;

    var diffrow = table.insertRow();
    diffrow.insertCell().innerHTML = `${title} &Delta;:`;
    diffrow.insertCell().innerHTML = x.toFixed(2);
    diffrow.insertCell().innerHTML = y.toFixed(2);
    diffrow.insertCell().innerHTML = z.toFixed(2);

    var unit = unit_vector(x,y,z);
    var unitrow = table.insertRow();
    unitrow.insertCell().innerHTML = `Unit ${title} &Delta;:`;
    unitrow.insertCell().innerHTML = unit.x.toFixed(2);
    unitrow.insertCell().innerHTML = unit.y.toFixed(2);
    unitrow.insertCell().innerHTML = unit.z.toFixed(2);
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

function calc_theta(color, target, current, linear)
{
    let x = linear ? color.X : color.L;
    let y = linear ? color.Y : color.a;
    let z = linear ? color.Z : color.b;
    let tx = linear ? target.X : target.L;
    let ty = linear ? target.Y : target.a;
    let tz = linear ? target.Z : target.b;
    let cx = linear ? current.X : current.L;
    let cy = linear ? current.Y : current.a;
    let cz = linear ? current.Z : current.b;
    x -= tx;
    y -= ty;
    z -= tz;
    cx -= tx;
    cy -= ty;
    cz -= tz;
    let unit = unit_vector(x,y,z);
    let curunit = unit_vector(cx,cy,cz);
    let theta = unit_angle(unit.x,unit.y,unit.z,curunit.x,curunit.y,curunit.z);
    theta /= Math.PI;
    theta = (theta*2)-1;
    return theta;
}

//https://rgbatohex.com/tools/xyz-to-lab
function xyz_to_lab(x,y,z) {
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

    return {L,a,b};
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

function vector_length(x,y,z)
{
    return Math.sqrt(Math.pow(x,2)+Math.pow(y,2)+Math.pow(z,2));
}

function unit_vector(x,y,z)
{
    var len = vector_length(x,y,z);
    if(len == 0) return {x:0,y:0,z:0};
    return {x:x/len,y:y/len,z:z/len};
}

function unit_angle(ux,uy,uz,vx,vy,vz)
{
    return Math.acos(ux*vx+uy*vy+uz*vz);
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
