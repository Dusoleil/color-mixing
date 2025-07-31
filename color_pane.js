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
    methods:
    {
        prev_color()
        {
            if(!this.target)
                return;
            if(this.color_page != 0)
            {
                this.color_page--;
            }
            else
            {
                this.color_page = this.comp_colors.length + 1;
            }
        },
        next_color()
        {
            if(!this.target)
                return;
            if(this.color_page == (this.comp_colors.length + 1))
            {
                this.color_page = 0;
            }
            else
            {
                this.color_page++;
            }
        }
    },
    components:
    {
        "color-viewer":color_viewer
    },
    template:/*html*/`
        <div class="mt-16 mb-4">
            <div class="mx-8 d-none d-sm-flex flex-wrap justify-center ga-16">
                <color-viewer :detail="DETAIL_LEVEL.PARTIAL" v-if="current" :color="current"></color-viewer>
                <color-viewer :detail="DETAIL_LEVEL.BASIC" v-if="target" :color="target"></color-viewer>
                <color-viewer :detail="DETAIL_LEVEL.FULL" v-for="color in comp_colors" :color="color"></color-viewer>
            </div>
            <div class="ml-10 w-66 d-sm-none" v-touch="{left:()=>next_color(),right:()=>prev_color()}">
                <color-viewer :detail="DETAIL_LEVEL.PARTIAL" v-if="color_page==0" :color="current"></color-viewer>
                <color-viewer :detail="DETAIL_LEVEL.BASIC" v-if="color_page==1" :color="target"></color-viewer>
                <template v-for="(color,idx) in comp_colors"><color-viewer :detail="DETAIL_LEVEL.FULL" v-if="color_page==(idx+2)" :color="color"></color-viewer></template>
            </div>
            <div class="d-sm-none position-absolute top-0 right-0 h-100 pt-4 pb-16 pr-3">
                <v-slide-group class="h-100" v-model="color_page" selected-class="border border-lg border-opacity-75" direction="vertical" prev-icon="mdi-chevron-up" next-icon="mdi-chevron-down" mandatory show-arrows>
                    <v-slide-group-item v-if="current" :key="0" v-slot="{toggle, selectedClass}">
                        <v-card class="my-2" :class="selectedClass" :color="current.hex" height="50" width="50" @click="toggle"></v-card>
                    </v-slide-group-item>
                    <v-slide-group-item v-if="target" :key="1" v-slot="{toggle, selectedClass}">
                        <v-card class="my-2" :class="selectedClass" :color="target.hex" height="50" width="50" @click="toggle"></v-card>
                    </v-slide-group-item>
                    <v-slide-group-item v-for="(color,idx) in comp_colors" :key="2+idx" v-slot="{toggle, selectedClass}">
                        <v-card class="my-2" :class="selectedClass" :color="color.hex" height="50" width="50" @click="toggle"></v-card>
                    </v-slide-group-item>
                </v-slide-group>
            </div>
        </div>`
};
