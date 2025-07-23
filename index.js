import {Color} from "color"
import {vec3} from "glMatrix"

window.onload = e =>{

var pick_colors = document.getElementById("pick-colors");
var target_form = document.getElementById("target-form");
var target_select = document.getElementById("target-select");
var input_deltas = document.getElementById("input-deltas");
var current_input = document.getElementById("current-input");
var current_swatch = document.getElementById("current-swatch");
var target_swatch = document.getElementById("target-swatch");
var comp_swatches = document.getElementById("comp-swatches");
var check_accuracy = document.getElementById("check-accuracy");
var display_accuracy = document.getElementById("display-accuracy");

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
            colors[color.id] = new Color(color.name,vec3.fromValues(color.L,color.a,color.b));
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
    var acc_select = check_accuracy.getElementsByTagName("select")[0];
    acc_select.innerHTML = "";

    var target = target_select.value;
    if(target === '') return;

    for(let component of components[target])
    {
        let color = colors[component];
        let opt = document.createElement("option");
        opt.value = component;
        opt.innerHTML = color.name;
        acc_select.appendChild(opt);
    }
    acc_select.selectedIndex = "0";
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
    var target = new Color("0",vec3.create());
    if(input_deltas.checked)
    {
        if(target_select.value === '') return;
        target = colors[target_select.value];
    }
    var dL = Number(current_input.querySelector("#current-L").value);
    var da = Number(current_input.querySelector("#current-a").value);
    var db = Number(current_input.querySelector("#current-b").value);
    var current = new Color("Current Color", vec3.fromValues(Math.max(0,Math.min(target.L+dL,100)), Math.max(-127,Math.min(target.a+da,128)), Math.max(-127,Math.min(target.b+db,128))));
    current_color = current;
    add_swatch_info(current_swatch, current, target_select.value === '' ? null : colors[target_select.value]);
    add_swatch(current_swatch, current);

    update_component_swatches(current);
}

check_accuracy.onchange = e =>
{
    display_accuracy.innerHTML = "";
    var acc_select = check_accuracy.getElementsByTagName("select")[0];
    var acc_direction = check_accuracy.querySelector("#acc-direction");

    let target = new Color("0",vec3.create());
    if(input_deltas.checked)
    {
        if(target_select.value === '') return;
        target = colors[target_select.value];
    }
    let dL = Number(check_accuracy.querySelector("#acc-L").value);
    let da = Number(check_accuracy.querySelector("#acc-a").value);
    let db = Number(check_accuracy.querySelector("#acc-b").value);
    let acc_color = new Color("Accuracy Color", vec3.fromValues(
        Math.max(0,Math.min(target.L+dL,100)),
        Math.max(-127,Math.min(target.a+da,128)),
        Math.max(-127,Math.min(target.b+db,128))));

    let expected = vec3.create();
    vec3.sub(expected,colors[acc_select.value].XYZ,current_color.XYZ);
    vec3.scale(expected,expected,acc_direction.checked ? 1 : -1);
    vec3.normalize(expected,expected);
    let actual = vec3.create();
    vec3.sub(actual,acc_color.XYZ,current_color.XYZ);
    vec3.normalize(actual,actual);
    let accuracy = vec3.angle(expected,actual);

    let table = document.createElement("table");
    display_accuracy.appendChild(table);
    let row = table.insertRow();
    row.insertCell().innerHTML = "Before:";
    row.insertCell().innerHTML = current_color.X.toFixed(2);
    row.insertCell().innerHTML = current_color.Y.toFixed(2);
    row.insertCell().innerHTML = current_color.Z.toFixed(2);
    row = table.insertRow();
    row.insertCell().innerHTML = "After:";
    row.insertCell().innerHTML = acc_color.X.toFixed(2);
    row.insertCell().innerHTML = acc_color.Y.toFixed(2);
    row.insertCell().innerHTML = acc_color.Z.toFixed(2);
    row = table.insertRow();
    row.insertCell().innerHTML = "Expected Move:";
    row.insertCell().innerHTML = expected[0].toFixed(2);
    row.insertCell().innerHTML = expected[1].toFixed(2);
    row.insertCell().innerHTML = expected[2].toFixed(2);
    row = table.insertRow();
    row.insertCell().innerHTML = "Actual Move:";
    row.insertCell().innerHTML = actual[0].toFixed(2);
    row.insertCell().innerHTML = actual[1].toFixed(2);
    row.insertCell().innerHTML = actual[2].toFixed(2);
    row = table.insertRow();
    row.insertCell().innerHTML = "Angle Difference:";
    let cell = row.insertCell();
    cell.setAttribute("colspan", 3);
    cell.innerHTML = accuracy.toFixed(4);
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
    from = vec3.clone(linear ? from.XYZ : from.Lab);
    to = vec3.clone(linear ? to.XYZ : to.Lab);
    let delta = vec3.create();
    vec3.sub(delta,to,from);

    var diffrow = table.insertRow();
    diffrow.insertCell().innerHTML = `${title} &Delta;:`;
    diffrow.insertCell().innerHTML = delta[0].toFixed(2);
    diffrow.insertCell().innerHTML = delta[1].toFixed(2);
    diffrow.insertCell().innerHTML = delta[2].toFixed(2);

    vec3.normalize(delta,delta);
    var unitrow = table.insertRow();
    unitrow.insertCell().innerHTML = `Unit ${title} &Delta;:`;
    unitrow.insertCell().innerHTML = delta[0].toFixed(2);
    unitrow.insertCell().innerHTML = delta[1].toFixed(2);
    unitrow.insertCell().innerHTML = delta[2].toFixed(2);
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
    color = vec3.clone(linear ? color.XYZ : color.Lab);
    target = vec3.clone(linear ? target.XYZ : target.Lab);
    current = vec3.clone(linear ? current.XYZ : current.Lab);
    vec3.sub(color,color,target);
    vec3.sub(current,current,target);
    let theta = vec3.angle(color,current);
    theta /= Math.PI;
    theta = (theta*2)-1;
    return theta;
}
