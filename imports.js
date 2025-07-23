const import_map = 
{
    imports:
    {
        vue:"https://unpkg.com/vue@3/dist/vue.esm-browser.js",
        glMatrix:"https://unpkg.com/gl-matrix@3.4.3/esm/index.js",
        color:"./color.js"
    }
}

const tag = document.createElement("script");
tag.type = "importmap";
tag.textContent = JSON.stringify(import_map);
document.currentScript.after(tag);