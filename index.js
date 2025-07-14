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

}
