const import_map = 
{
    imports:
    {
        vue:"https://unpkg.com/vue@3.5.18/dist/vue.esm-browser.js",
        vuex:"https://cdnjs.cloudflare.com/ajax/libs/vuex/4.0.0/vuex.esm-browser.prod.js",
        vuetify:"https://cdn.jsdelivr.net/npm/vuetify@3.9.2/dist/vuetify.esm.js",
        colors:"https://cdn.jsdelivr.net/npm/vuetify@3.9.2/lib/util/colors.js",
        glMatrix:"https://unpkg.com/gl-matrix@3.4.3/esm/index.js",
        three:"https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js",
        "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.179.1/examples/jsm/",
        color:"./color.js",
        projections:"./projections.js",
        app_header:"./app_header.js",
        color_pane:"./color_pane.js",
        color_viewer:"./color_viewer.js",
        color_detail:"./color_detail.js",
        swatch:"./swatch.js",
        accuracy_check:"./accuracy_check.js",
        validity_check:"./validity_check.js",
        plot:"./plot.js",
        setpoints:"./setpoints.js",
        predictions:"./predictions.js",
        try_setpoints:"./try_setpoints.js"
    }
}

const tag = document.createElement("script");
tag.type = "importmap";
tag.textContent = JSON.stringify(import_map);
document.currentScript.after(tag);