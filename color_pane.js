import {color_viewer} from "color_viewer"
import {DETAIL_LEVEL} from "color_detail"

export var color_pane =
{
    created()
    {
        this.DETAIL_LEVEL = DETAIL_LEVEL;
    },
    computed:
    {
        target()
        {
            return this.$store.state.target_color;
        },
        current()
        {
            return this.$store.state.current_color;
        },
        comp_colors()
        {
            return this.$store.state.comp_colors;
        }
    },
    components:
    {
        "color-viewer":color_viewer
    },
    template:/*html*/`
        <div class="d-flex flex-wrap justify-center mx-8 mt-16 ga-16">
            <color-viewer :detail="DETAIL_LEVEL.BASIC" v-if="target" :color="target"></color-viewer>
            <color-viewer :detail="DETAIL_LEVEL.PARTIAL" v-if="current" :color="current"></color-viewer>
            <color-viewer :detail="DETAIL_LEVEL.FULL" v-for="color in comp_colors" :color="color"></color-viewer>
        </div>`
};
