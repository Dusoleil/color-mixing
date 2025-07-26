import {color_detail} from "color_detail"
import {swatch} from "swatch"

export var color_viewer =
{
    props:
    [
        "detail",
        "color"
    ],
    components:
    {
        "color-detail":color_detail,
        "swatch":swatch
    },
    template:/*html*/`
        <div class="color-viewer">
            <color-detail :detail="detail" :color="color"></color-detail>
            <swatch :color="color"></swatch>
        </div>`
};
