const import_map = 
{
    imports:
    {
        vue:"https://unpkg.com/vue@3.5.18/dist/vue.esm-browser.js",
        vuex:"https://cdnjs.cloudflare.com/ajax/libs/vuex/4.0.0/vuex.esm-browser.prod.js",
        glMatrix:"https://unpkg.com/gl-matrix@3.4.3/esm/index.js",
        color:"./color.js",
        app_header:"./app_header.js",
        color_pane:"./color_pane.js",
        color_viewer:"./color_viewer.js",
        color_detail:"./color_detail.js",
        swatch:"./swatch.js",
        accuracy_check:"./accuracy_check.js"
    }
}

const tag = document.createElement("script");
tag.type = "importmap";
tag.textContent = JSON.stringify(import_map);
document.currentScript.after(tag);