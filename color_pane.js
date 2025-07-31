import {color_viewer} from "color_viewer"
import {DETAIL_LEVEL} from "color_detail"

export var color_pane =
{
    data()
    {return{
        color_page:0
    }},
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
    watch:
    {
        target()
        {
            this.color_page = 0;
        }
    },
    components:
    {
        "color-viewer":color_viewer
    },
    template:/*html*/`
        <div class="my-16">
            <div class="mx-8 d-none d-sm-flex flex-wrap justify-center ga-16">
                <color-viewer :detail="DETAIL_LEVEL.PARTIAL" v-if="current" :color="current"></color-viewer>
                <color-viewer :detail="DETAIL_LEVEL.BASIC" v-if="target" :color="target"></color-viewer>
                <color-viewer :detail="DETAIL_LEVEL.FULL" v-for="color in comp_colors" :color="color"></color-viewer>
            </div>
            <v-window class="d-sm-none d-block overflow-visible" v-model="color_page" touch continuous>
                <v-window-item class="mx-auto" v-if="current" :value="0">
                    <color-viewer :detail="DETAIL_LEVEL.PARTIAL" :color="current"></color-viewer>
                </v-window-item>
                <v-window-item class="mx-auto" v-if="target" :value="1">
                    <color-viewer :detail="DETAIL_LEVEL.BASIC" :color="target"></color-viewer>
                </v-window-item>
                <v-window-item class="mx-auto" v-for="(color,idx) in comp_colors" :value="idx+2">
                    <color-viewer :detail="DETAIL_LEVEL.FULL" :color="color"></color-viewer>
                </v-window-item>
            </v-window>
        </div>`
};
