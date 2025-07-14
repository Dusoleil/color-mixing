window.onload = e =>{

var pick_targets = document.getElementById("pick-targets");
var pick_components = document.getElementById("pick-components");
var contents = document.getElementById("file-contents");

pick_targets.onchange = e =>
{
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.readAsText(file,'UTF-8');
    reader.onload = readerEvent =>
    {
        contents.innerHTML = readerEvent.target.result;
    }
}

var swatches = document.getElementById("swatches");
add_swatch(swatches, "#FF0000");
add_swatch(swatches, "#00FF00");
add_swatch(swatches, "#0000FF");

}

function add_swatch(parent, color)
{
    var swatch = document.createElement("canvas");
    swatch.classList.add("swatch");
    const ctx = swatch.getContext("2d");

    ctx.fillStyle = color;
    ctx.fillRect(0,0,swatch.width,swatch.height);

    parent.appendChild(swatch);
}
